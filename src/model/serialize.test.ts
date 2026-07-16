import { describe, expect, it } from 'vitest'
import { coerceDoc, parseDoc, stringifyDoc } from './serialize'
import {
  DOC_VERSION,
  GROUND_WEFT_INDEX,
  makeBlankDoc,
  makeBorderLayer,
  makeMotifLayer,
  makeRepeatRowLayer,
  makeTextLineLayer,
  type LabelDoc,
} from './types'

function docWithEverything(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Kitchen sink',
    widthMM: 60,
    heightMM: 30,
    fold: 'endFold',
    weave: {
      loom: 'needle',
      ground: 'satin',
      warp: { name: 'Ivory', hex: '#E9E1CD' },
      wefts: [
        { name: 'Navy', hex: '#23304F' },
        { name: 'Crimson', hex: '#8E2B2B' },
        { name: 'Gold', hex: '#C9A24B' },
      ],
      endsPerMM: 4.8,
      picksPerMM: 6.0,
      edge: 'ultrasonic',
    },
    layers: [
      makeTextLineLayer({ archMM: 4, archMode: 'warp', weftIndex: 1 }),
      makeMotifLayer({ source: { kind: 'asset', assetId: 'a1' }, weftIndex: 2 }),
      makeBorderLayer({ pattern: 'greekKey', sides: 'topBottom' }),
      makeRepeatRowLayer({ alternateFlip: true, weftIndex: GROUND_WEFT_INDEX }),
    ],
    assets: {
      a1: { kind: 'svg', name: 'laurel.svg', dataBase64: 'PHN2Zz48L3N2Zz4=' },
    },
    localFonts: {
      'local:TestFont-Bold': { postscriptName: 'TestFont-Bold', family: 'Test Font', fullName: 'Test Font Bold' },
    },
  }
}

describe('serialize round-trip', () => {
  it('parse(stringify(doc)) deep-equals a doc exercising all four layer types', () => {
    const doc = docWithEverything()
    const result = parseDoc(stringifyDoc(doc))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.doc).toEqual(doc)
  })

  it('round-trips the blank doc', () => {
    const doc = makeBlankDoc()
    const result = parseDoc(stringifyDoc(doc))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.doc).toEqual(doc)
  })
})

describe('weftIndex clamping', () => {
  it('clamps a weftIndex beyond the palette instead of rejecting the doc', () => {
    const doc = { ...makeBlankDoc(), layers: [makeTextLineLayer({ weftIndex: 7 })] }
    const r = parseDoc(stringifyDoc(doc))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.doc.layers[0]!.weftIndex).toBe(doc.weave.wefts.length - 1)
  })

  it('preserves the ground sentinel (-1)', () => {
    const doc = { ...makeBlankDoc(), layers: [makeTextLineLayer({ weftIndex: GROUND_WEFT_INDEX })] }
    const r = parseDoc(stringifyDoc(doc))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.doc.layers[0]!.weftIndex).toBe(GROUND_WEFT_INDEX)
  })

  it('clamps below the ground sentinel up to it', () => {
    const doc = { ...makeBlankDoc(), layers: [makeTextLineLayer({ weftIndex: -4 })] }
    const r = parseDoc(stringifyDoc(doc))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.doc.layers[0]!.weftIndex).toBe(GROUND_WEFT_INDEX)
  })
})

describe('coerceDoc (plain values, no JSON text)', () => {
  it('accepts a valid structured-clone object', () => {
    const doc = docWithEverything()
    const clone = structuredClone(doc)
    const r = coerceDoc(clone)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.doc).toEqual(doc)
  })

  it('rejects versionless and non-object values with readable errors', () => {
    const noVersion = coerceDoc({ name: 'x' })
    expect(noVersion.ok).toBe(false)
    if (!noVersion.ok) expect(noVersion.error).toMatch(/version/)
    expect(coerceDoc(null).ok).toBe(false)
    expect(coerceDoc(42).ok).toBe(false)
  })

  it('rejects docs from a newer app version', () => {
    const r = coerceDoc({ ...makeBlankDoc(), version: DOC_VERSION + 3 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/newer/)
  })
})

describe('parseDoc failure modes', () => {
  it('rejects non-JSON with a readable error', () => {
    const r = parseDoc('not json {')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/JSON/)
  })

  it('rejects unknown layer types by name', () => {
    const doc = { ...makeBlankDoc(), layers: [{ id: 'x', type: 'hologram', name: 'H', visible: true, weftIndex: 0 }] }
    const r = parseDoc(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/hologram/)
  })

  it('rejects a layer missing a required numeric field', () => {
    const bad = makeTextLineLayer() as unknown as Record<string, unknown>
    delete bad.sizeMM
    const doc = { ...makeBlankDoc(), layers: [bad] }
    const r = parseDoc(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/sizeMM/)
  })

  it('rejects duplicate layer ids', () => {
    const a = makeMotifLayer({ id: 'dup' })
    const b = makeMotifLayer({ id: 'dup' })
    const doc = { ...makeBlankDoc(), layers: [a, b] }
    const r = parseDoc(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/dup/)
  })

  it('rejects a malformed weave palette', () => {
    const doc = makeBlankDoc() as unknown as { weave: { wefts: unknown } }
    doc.weave.wefts = []
    const r = parseDoc(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/palette/)
  })

  it('rejects an unknown fold type', () => {
    const doc = { ...makeBlankDoc(), fold: 'origami' }
    const r = parseDoc(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/fold/)
  })
})
