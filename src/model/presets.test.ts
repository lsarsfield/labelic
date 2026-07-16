import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as opentype from 'opentype.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { compileLayer, EXPORT_TOLERANCE_MM, type CompileCtx } from '../geometry/compile'
import type { LabelDoc } from './types'
import { parseDoc, stringifyDoc } from './serialize'
import { TEMPLATES } from './presets'

/**
 * Golden acceptance: every template compiles to stable geometry. Any kernel
 * change that alters existing labels' output shows up as a snapshot diff —
 * a golden diff means your change altered documents in the wild. NEVER
 * `vitest -u`; new schema fields must default to the old behaviour.
 *
 * Legibility warnings ("~2 threads at this density") are informational by
 * design — small copy on a coarse shuttle grid is SUPPOSED to be chunky —
 * so they are the one warning class presets may carry.
 */

const fonts = new Map<string, opentype.Font>()

function loadFont(id: string, rel: string) {
  const path = fileURLToPath(new URL(rel, import.meta.url))
  const buf = readFileSync(path)
  fonts.set(id, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
}

beforeAll(() => {
  loadFont('oswald', '../../public/fonts/oswald.ttf')
  loadFont('robotoslab', '../../public/fonts/roboto-slab.ttf')
  loadFont('stencil', '../../public/fonts/allerta-stencil.ttf')
  loadFont('pinyon', '../../public/fonts/pinyon-script.ttf')
  loadFont('garamond', '../../public/fonts/ebgaramond.ttf')
  loadFont('rye', '../../public/fonts/rye.ttf')
  loadFont('bebas', '../../public/fonts/bebas-neue.ttf')
})

function compileDoc(doc: LabelDoc) {
  const ctx: CompileCtx = {
    widthMM: doc.widthMM,
    heightMM: doc.heightMM,
    endsPerMM: doc.weave.endsPerMM,
    picksPerMM: doc.weave.picksPerMM,
    toleranceMM: EXPORT_TOLERANCE_MM,
    assetsRevision: 0,
    fontsRevision: 0,
    getFont: (id) => fonts.get(id) ?? null,
    getSvgAsset: () => null,
  }
  return doc.layers.map((layer) => {
    const compiled = compileLayer(layer, ctx)
    return { layer: layer.id, warnings: compiled.warnings, shapes: compiled.shapes }
  })
}

const isLegibility = (w: string) => /threads at this density/.test(w)

describe('templates', () => {
  it('every template round-trips through serialize unchanged', () => {
    for (const template of TEMPLATES) {
      const doc = template.make()
      const round = parseDoc(stringifyDoc(doc))
      expect(round.ok).toBe(true)
      if (round.ok) expect(round.doc).toEqual(doc)
    }
  })

  it('template ids are unique', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template compiles with no warnings beyond legibility, no empty layers', () => {
    for (const template of TEMPLATES) {
      const out = compileDoc(template.make())
      const hard = out.flatMap((l) => l.warnings).filter((w) => !isLegibility(w))
      expect(hard, template.id).toEqual([])
      for (const layer of out) {
        expect(layer.shapes.length, `${template.id}/${layer.layer}`).toBeGreaterThan(0)
      }
    }
  })

  it('golden: 1940s workwear geometry snapshot', () => {
    expect(JSON.stringify(compileDoc(TEMPLATES[1]!.make()), null, 1)).toMatchSnapshot()
  })

  it('golden: 1950s dressmaker geometry snapshot', () => {
    expect(JSON.stringify(compileDoc(TEMPLATES[2]!.make()), null, 1)).toMatchSnapshot()
  })

  it('golden: 1960s union geometry snapshot', () => {
    expect(JSON.stringify(compileDoc(TEMPLATES[3]!.make()), null, 1)).toMatchSnapshot()
  })

  it('golden: 1970s denim geometry snapshot', () => {
    expect(JSON.stringify(compileDoc(TEMPLATES[4]!.make()), null, 1)).toMatchSnapshot()
  })

  it('golden: modern streetwear geometry snapshot', () => {
    expect(JSON.stringify(compileDoc(TEMPLATES[5]!.make()), null, 1)).toMatchSnapshot()
  })
})
