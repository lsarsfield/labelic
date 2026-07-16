import type { Asset, LabelDoc, Layer, LayerType, LocalFontRef, ThreadColor, WeaveSpec } from './types'
import { GROUND_WEFT_INDEX, LAYER_TYPE_LABELS } from './types'

export type ValidationResult =
  | { ok: true; doc: LabelDoc }
  | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'

const LAYER_TYPES = Object.keys(LAYER_TYPE_LABELS) as LayerType[]

const LOOMS = ['shuttle', 'needle']
const GROUNDS = ['taffeta', 'satin', 'damask']
const EDGES = ['selvedge', 'hotCut', 'ultrasonic']
const FOLDS = ['straight', 'endFold', 'loopFold', 'centreFold', 'mitreFold']
const BORDER_PATTERNS = ['keyline', 'doubleRule', 'dashes', 'dots', 'zigzag', 'scallop', 'greekKey', 'chain']

/**
 * Per-type required fields beyond the common base. Values are checked by kind:
 * n = finite number, s = string, b = boolean. Enum and union fields are
 * spot-checked separately where getting them wrong would crash a compiler.
 */
const REQUIRED: Record<LayerType, Record<string, 'n' | 's' | 'b'>> = {
  textLine: {
    text: 's', fontId: 's', sizeMM: 'n', xMM: 'n', yMM: 'n', anchorAlign: 's',
    letterSpacingMM: 'n', useKerning: 'b', archMM: 'n', archMode: 's', haloMM: 'n',
  },
  motif: {
    xMM: 'n', yMM: 'n', sizeMM: 'n', rotationDeg: 'n', mirrorX: 'b', strokeMM: 'n',
    cap: 's', join: 's', haloMM: 'n',
  },
  hatch: {
    angleDeg: 'n', pitchMM: 'n', strokeMM: 'n', cap: 's', area: 's', insetMM: 'n',
    bandMM: 'n', xMM: 'n', yMM: 'n', widthMM: 'n', heightMM: 'n',
  },
  border: {
    pattern: 's', insetMM: 'n', strokeMM: 'n', unitMM: 'n', sides: 's',
    cap: 's', join: 's',
  },
  repeatRow: {
    count: 'n', xMM: 'n', yMM: 'n', widthMM: 'n', sizeMM: 'n',
    alternateFlip: 'b', strokeMM: 'n', rows: 'n', rowGapMM: 'n',
    staggerRow2: 'b', flipRow2: 'b', cap: 's', join: 's', haloMM: 'n',
  },
}

function checkMotifSource(src: unknown): boolean {
  return isObj(src) && (src.kind === 'builtin' || src.kind === 'asset')
}

function checkLayer(value: unknown, index: number): string | null {
  if (!isObj(value)) return `layer ${index} is not an object`
  const type = value.type
  if (!isStr(type) || !(LAYER_TYPES as string[]).includes(type)) {
    return `layer ${index} has unknown type "${String(type)}"`
  }
  if (!isStr(value.id) || value.id.length === 0) return `layer ${index} is missing an id`
  if (!isStr(value.name)) return `layer ${index} is missing a name`
  if (!isBool(value.visible)) return `layer ${index} ("${value.name}") is missing "visible"`
  if (!isNum(value.weftIndex)) return `layer ${index} ("${value.name}") is missing "weftIndex"`

  const required = REQUIRED[type as LayerType]
  for (const [field, kind] of Object.entries(required)) {
    const v = value[field]
    const ok = kind === 'n' ? isNum(v) : kind === 's' ? isStr(v) : isBool(v)
    if (!ok) return `layer ${index} ("${value.name}", ${type}) has a missing or invalid "${field}"`
  }

  if (type === 'border' && !BORDER_PATTERNS.includes(value.pattern as string)) {
    return `layer ${index} ("${value.name}") has an unknown border pattern`
  }
  if (type === 'hatch' && value.area !== 'label' && value.area !== 'border' && value.area !== 'rect') {
    return `layer ${index} ("${value.name}") has an unknown hatch area`
  }
  if ((type === 'motif' || type === 'repeatRow') && !checkMotifSource(value.source)) {
    return `layer ${index} ("${value.name}") has an invalid motif source`
  }
  return null
}

function checkThread(value: unknown): value is ThreadColor {
  return isObj(value) && isStr(value.name) && isStr(value.hex)
}

function checkWeave(value: unknown): string | null {
  if (!isObj(value)) return 'document has no weave spec'
  if (!LOOMS.includes(value.loom as string)) return 'weave has an unknown loom type'
  if (!GROUNDS.includes(value.ground as string)) return 'weave has an unknown ground weave'
  if (!EDGES.includes(value.edge as string)) return 'weave has an unknown edge finish'
  if (!checkThread(value.warp)) return 'weave warp thread is malformed'
  if (!Array.isArray(value.wefts) || value.wefts.length === 0 || !value.wefts.every(checkThread)) {
    return 'weave weft palette is malformed or empty'
  }
  if (!isNum(value.endsPerMM) || value.endsPerMM <= 0) return 'weave has an invalid ends density'
  if (!isNum(value.picksPerMM) || value.picksPerMM <= 0) return 'weave has an invalid picks density'
  return null
}

function checkAsset(id: string, value: unknown): string | null {
  if (!isObj(value)) return `asset "${id}" is not an object`
  if (value.kind !== 'svg' && value.kind !== 'font') return `asset "${id}" has an unknown kind`
  if (!isStr(value.name) || !isStr(value.dataBase64)) return `asset "${id}" is malformed`
  return null
}

/**
 * Structural validation of an untrusted parsed JSON value. Deliberately
 * hand-rolled (no schema library): checks everything a compiler or renderer
 * would crash on, tolerates unknown extra fields so newer docs degrade softly.
 *
 * `weftIndex` is CLAMPED to the palette (not rejected) so palette edits made
 * elsewhere never brick a saved file.
 */
export function validateDoc(value: unknown): ValidationResult {
  if (!isObj(value)) return { ok: false, error: 'document is not an object' }
  if (!isNum(value.version)) return { ok: false, error: 'document has no version number' }
  if (!isStr(value.name)) return { ok: false, error: 'document has no name' }
  if (!isNum(value.widthMM) || value.widthMM <= 0) {
    return { ok: false, error: 'document has an invalid width' }
  }
  if (!isNum(value.heightMM) || value.heightMM <= 0) {
    return { ok: false, error: 'document has an invalid height' }
  }
  if (!isStr(value.fold) || !FOLDS.includes(value.fold)) {
    return { ok: false, error: 'document has an unknown fold type' }
  }
  const weaveErr = checkWeave(value.weave)
  if (weaveErr) return { ok: false, error: weaveErr }
  if (!Array.isArray(value.layers)) return { ok: false, error: 'document has no layer list' }

  const seen = new Set<string>()
  for (let i = 0; i < value.layers.length; i++) {
    const err = checkLayer(value.layers[i], i)
    if (err) return { ok: false, error: err }
    const id = (value.layers[i] as Layer).id
    if (seen.has(id)) return { ok: false, error: `duplicate layer id "${id}"` }
    seen.add(id)
  }

  const assets = value.assets ?? {}
  if (!isObj(assets)) return { ok: false, error: 'document assets are malformed' }
  for (const [id, asset] of Object.entries(assets)) {
    const err = checkAsset(id, asset)
    if (err) return { ok: false, error: err }
  }

  const localFonts = value.localFonts ?? {}
  if (!isObj(localFonts)) return { ok: false, error: 'document localFonts are malformed' }
  for (const [id, ref] of Object.entries(localFonts)) {
    if (!isObj(ref) || !isStr(ref.postscriptName) || !isStr(ref.family) || !isStr(ref.fullName)) {
      return { ok: false, error: `local font reference "${id}" is malformed` }
    }
  }

  const weave = value.weave as unknown as WeaveSpec
  const maxIndex = weave.wefts.length - 1
  const layers = (value.layers as Layer[]).map((layer) => {
    const clamped = Math.max(GROUND_WEFT_INDEX, Math.min(maxIndex, Math.round(layer.weftIndex)))
    return clamped === layer.weftIndex ? layer : { ...layer, weftIndex: clamped }
  })

  return {
    ok: true,
    doc: {
      version: value.version,
      name: value.name,
      widthMM: value.widthMM,
      heightMM: value.heightMM,
      fold: value.fold as LabelDoc['fold'],
      weave,
      layers,
      assets: assets as Record<string, Asset>,
      localFonts: localFonts as Record<string, LocalFontRef>,
    },
  }
}
