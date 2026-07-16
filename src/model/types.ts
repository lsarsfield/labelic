/**
 * Labelic document model.
 *
 * A LabelDoc is the single source of truth: a rectangular woven label
 * (width × height, loom + ground weave + thread palette) plus an ordered
 * stack of cartesian design layers. Array order is paint order (later layers
 * draw on top) and, in the weave, claim priority (topmost layer wins a cell).
 *
 * All lengths are millimetres. (0,0) is the label centre, y-down on screen.
 * Every design layer is woven in exactly ONE weft thread from the doc
 * palette (`weftIndex`), or in the ground itself (`GROUND_WEFT_INDEX`) —
 * ground-woven geometry reads as a knockout: warp shows through, which over
 * a solid weft block gives the classic reversed-out vintage label.
 */

import type { EdgeFinish, GroundWeave, LoomType, ThreadColor } from './loom'
import { LOOM_TABLE, thread } from './loom'

export type {
  EdgeFinish,
  GroundWeave,
  LoomProfile,
  LoomType,
  ThreadColor,
} from './loom'
export {
  CELL_BUDGET,
  edgeOptionsFor,
  LOOM_TABLE,
  loomProfile,
  maxWeftsFor,
  THREAD_CANON,
  thread,
} from './loom'

export type AssetId = string
export type LayerId = string
export type FontId = string

export const DOC_VERSION = 1

/** SVG-valid stroke end styles. */
export type SvgStrokeCap = 'butt' | 'round' | 'square'
export type StrokeCap = SvgStrokeCap
export type StrokeJoin = 'miter' | 'round' | 'bevel'

/** Local-font ids are namespaced by PostScript name: `local:HelveticaNeue-Bold`. */
export const LOCAL_FONT_PREFIX = 'local:'
export const isLocalFontId = (fontId: string): boolean => fontId.startsWith(LOCAL_FONT_PREFIX)

/**
 * A machine-local font referenced by identity, not embedded — designs using
 * one render only where that font is installed (exports always bake outlines,
 * so exported SVG/PNG stay portable regardless).
 */
export interface LocalFontRef {
  postscriptName: string
  family: string
  fullName: string
}

export type AssetKind = 'svg' | 'font'

export interface Asset {
  kind: AssetKind
  name: string
  /** Raw file bytes, base64 — kept in the doc so project JSON is portable. */
  dataBase64: string
}

/** How a finished label is cut/folded for sewing. */
export type FoldType = 'straight' | 'endFold' | 'loopFold' | 'centreFold' | 'mitreFold'

export const FOLD_TYPE_LABELS: Record<FoldType, string> = {
  straight: 'Straight cut',
  endFold: 'End fold',
  loopFold: 'Loop fold',
  centreFold: 'Centre fold',
  mitreFold: 'Mitre fold',
}

/** The loom setup: grid density, ground weave, and the thread palette. */
export interface WeaveSpec {
  loom: LoomType
  ground: GroundWeave
  /** Ground (warp) thread — the label's background color. */
  warp: ThreadColor
  /** Ordered weft palette. Capped by the loom (3 shuttle / 8 needle). */
  wefts: ThreadColor[]
  /** Design cells per mm. Defaulted from LOOM_TABLE, user-overridable. */
  endsPerMM: number
  picksPerMM: number
  edge: EdgeFinish
}

export interface LabelDoc {
  version: number
  name: string
  widthMM: number
  heightMM: number
  fold: FoldType
  weave: WeaveSpec
  layers: Layer[]
  assets: Record<AssetId, Asset>
  /** Machine-local fonts used by layers, keyed by their `local:` font id. */
  localFonts: Record<FontId, LocalFontRef>
}

/** `weftIndex` sentinel: weave this layer in the ground (warp) — a knockout. */
export const GROUND_WEFT_INDEX = -1

/** Fields shared by every layer type. */
export interface LayerBase {
  id: LayerId
  name: string
  visible: boolean
  /**
   * Index into weave.wefts — the one thread this layer is woven in.
   * GROUND_WEFT_INDEX (-1) weaves it in the ground: warp shows through
   * (reversed-out text over a solid block, stitch-through borders…).
   */
  weftIndex: number
}

export type MotifSource =
  | { kind: 'builtin'; motifId: string }
  | { kind: 'asset'; assetId: AssetId }

/** A line of text on a straight or gently arched baseline. */
export interface TextLineLayer extends LayerBase {
  type: 'textLine'
  text: string
  fontId: FontId
  /** Em size. */
  sizeMM: number
  /** Baseline anchor point; (0,0) = label centre. */
  xMM: number
  yMM: number
  anchorAlign: 'left' | 'center' | 'right'
  letterSpacingMM: number
  useKerning: boolean
  /**
   * Arch sagitta: 0 = straight; positive bows upward (rainbow — the classic
   * vintage brand line), negative bows downward (valley).
   */
  archMM: number
  /** arc = upright glyphs rotated along the arc (default); warp = outlines genuinely bent. */
  archMode: 'arc' | 'warp'
}

/** A single motif or imported SVG placed on the label. */
export interface MotifLayer extends LayerBase {
  type: 'motif'
  source: MotifSource
  xMM: number
  yMM: number
  /** Motif height in mm; width follows the motif's aspect ratio. */
  sizeMM: number
  rotationDeg: number
  mirrorX: boolean
  /** Stroke width for stroke-type motifs. */
  strokeMM: number
}

export type BorderPattern =
  | 'keyline'
  | 'doubleRule'
  | 'dashes'
  | 'dots'
  | 'zigzag'
  | 'scallop'
  | 'greekKey'
  | 'chain'

export const BORDER_PATTERN_LABELS: Record<BorderPattern, string> = {
  keyline: 'Keyline',
  doubleRule: 'Double rule',
  dashes: 'Running stitch',
  dots: 'Dots',
  zigzag: 'Zigzag',
  scallop: 'Scallop',
  greekKey: 'Greek key',
  chain: 'Chain',
}

/** A rectangular frame pattern inset from the label edge. */
export interface BorderLayer extends LayerBase {
  type: 'border'
  pattern: BorderPattern
  /** Inset from the label edge to the pattern centreline. */
  insetMM: number
  strokeMM: number
  /** Pattern repeat pitch along each side (patterned borders only). */
  unitMM: number
  sides: 'all' | 'topBottom' | 'leftRight'
}

/** A horizontal row of a repeated small motif — divider stars, dots, diamonds. */
export interface RepeatRowLayer extends LayerBase {
  type: 'repeatRow'
  source: MotifSource
  count: number
  /** Row centre; (0,0) = label centre. */
  xMM: number
  yMM: number
  /** Row span: instances spread across this width (count 1 sits at the centre). */
  widthMM: number
  /** Motif height in mm. */
  sizeMM: number
  /** Mirror every second instance. */
  alternateFlip: boolean
  /** Stroke width for stroke-type motifs. */
  strokeMM: number
}

export type Layer = TextLineLayer | MotifLayer | BorderLayer | RepeatRowLayer

export type LayerType = Layer['type']

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  textLine: 'Text line',
  motif: 'Motif',
  border: 'Border',
  repeatRow: 'Repeat row',
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2, 12)
}

export function makeTextLineLayer(patch: Partial<TextLineLayer> = {}): TextLineLayer {
  return {
    id: newId(),
    type: 'textLine',
    name: 'Text line',
    visible: true,
    weftIndex: 0,
    text: 'GARMENT CO.',
    fontId: 'oswald',
    sizeMM: 4,
    xMM: 0,
    yMM: 0,
    anchorAlign: 'center',
    letterSpacingMM: 0.3,
    useKerning: true,
    archMM: 0,
    archMode: 'arc',
    ...patch,
  }
}

export function makeMotifLayer(patch: Partial<MotifLayer> = {}): MotifLayer {
  return {
    id: newId(),
    type: 'motif',
    name: 'Motif',
    visible: true,
    weftIndex: 0,
    source: { kind: 'builtin', motifId: 'star' },
    xMM: 0,
    yMM: 0,
    sizeMM: 5,
    rotationDeg: 0,
    mirrorX: false,
    strokeMM: 0.4,
    ...patch,
  }
}

export function makeBorderLayer(patch: Partial<BorderLayer> = {}): BorderLayer {
  return {
    id: newId(),
    type: 'border',
    name: 'Border',
    visible: true,
    weftIndex: 0,
    pattern: 'keyline',
    insetMM: 1.5,
    strokeMM: 0.4,
    unitMM: 1.6,
    sides: 'all',
    ...patch,
  }
}

export function makeRepeatRowLayer(patch: Partial<RepeatRowLayer> = {}): RepeatRowLayer {
  return {
    id: newId(),
    type: 'repeatRow',
    name: 'Repeat row',
    visible: true,
    weftIndex: 0,
    source: { kind: 'builtin', motifId: 'star' },
    count: 5,
    xMM: 0,
    yMM: 6,
    widthMM: 30,
    sizeMM: 2,
    alternateFlip: false,
    strokeMM: 0.4,
    ...patch,
  }
}

export const LAYER_FACTORIES: Record<LayerType, (patch?: never) => Layer> = {
  textLine: makeTextLineLayer,
  motif: makeMotifLayer,
  border: makeBorderLayer,
  repeatRow: makeRepeatRowLayer,
}

export function makeWeaveSpec(loom: LoomType = 'shuttle', ground: GroundWeave = 'taffeta'): WeaveSpec {
  const profile = LOOM_TABLE[loom][ground]
  return {
    loom,
    ground,
    warp: thread('Black'),
    wefts: [thread('Ivory'), thread('Gold')],
    endsPerMM: profile.endsPerMM,
    picksPerMM: profile.picksPerMM,
    edge: profile.defaultEdge,
  }
}

export function makeBlankDoc(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Untitled label',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: makeWeaveSpec(),
    layers: [makeTextLineLayer({ name: 'Brand' })],
    assets: {},
    localFonts: {},
  }
}

/** Standard finished-label sizes (width × height, mm). */
export const SIZE_PRESETS: readonly { label: string; widthMM: number; heightMM: number }[] = [
  { label: '32 × 15 — size tab', widthMM: 32, heightMM: 15 },
  { label: '38 × 20 — small brand', widthMM: 38, heightMM: 20 },
  { label: '50 × 22 — classic brand', widthMM: 50, heightMM: 22 },
  { label: '60 × 30 — back patch', widthMM: 60, heightMM: 30 },
  { label: '72 × 40 — large patch', widthMM: 72, heightMM: 40 },
]
