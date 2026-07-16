/**
 * Loom & thread parameter tables — the single source of truth shared by
 * schema defaults, the weave sampler, the thread painter, and warnings.
 *
 * A woven label is a bitmap made of threads: the design is rasterized onto
 * the loom's grid (warp ends across, weft picks down) and each claimed cell
 * is woven in exactly one weft color. Loom type drives grid density, edge
 * treatment, palette cap, and thread character (jitter/fuzz vs uniformity).
 *
 * This file is a leaf: no imports, safe for model/ and geometry/ and weave/.
 */

export type LoomType = 'shuttle' | 'needle'
export type GroundWeave = 'taffeta' | 'satin' | 'damask'
export type EdgeFinish = 'selvedge' | 'hotCut' | 'ultrasonic'

export interface ThreadColor {
  name: string
  hex: string
}

/** The classic label-thread canon offered by the palette picker. */
export const THREAD_CANON: readonly ThreadColor[] = [
  { name: 'Black', hex: '#1A1817' },
  { name: 'Ivory', hex: '#E9E1CD' },
  { name: 'White', hex: '#F4F1E8' },
  { name: 'Navy', hex: '#23304F' },
  { name: 'Crimson', hex: '#8E2B2B' },
  { name: 'Gold', hex: '#C9A24B' },
  { name: 'Forest', hex: '#2F4A38' },
  { name: 'Brown', hex: '#6B4A32' },
  { name: 'Sky', hex: '#7FA3B8' },
  { name: 'Silver', hex: '#B9B7AF' },
  { name: 'Rose', hex: '#C77E8E' },
  { name: 'Rust', hex: '#A2573B' },
]

/** Canon lookup by name — presets and defaults reference threads this way. */
export function thread(name: string): ThreadColor {
  const t = THREAD_CANON.find((c) => c.name === name)
  if (!t) throw new Error(`unknown canon thread "${name}"`)
  return { ...t }
}

export interface LoomProfile {
  /** Design cells per mm, horizontal (warp ends) and vertical (weft picks). */
  endsPerMM: number
  picksPerMM: number
  /** How many weft colors the loom can carry. */
  maxWefts: number
  /** 0..1 per-thread offset/thickness variance (shuttle wobble vs needle uniformity). */
  jitter: number
  /** Halation radius in cell units — cotton/rayon fuzz vs crisp polyester. */
  fuzz: number
  /** Specular strength of weft floats (satin/polyester shine). */
  sheen: number
  defaultEdge: EdgeFinish
}

/**
 * Densities are calibrated for look, grounded in real labels: shuttle-loom
 * taffeta runs ~24×28 threads/cm (the chunky vintage grid), needle-loom
 * damask up to ~56×100/cm (high definition).
 */
export const LOOM_TABLE: Record<LoomType, Record<GroundWeave, LoomProfile>> = {
  shuttle: {
    taffeta: { endsPerMM: 2.4, picksPerMM: 2.8, maxWefts: 3, jitter: 0.35, fuzz: 0.6, sheen: 0.15, defaultEdge: 'selvedge' },
    satin:   { endsPerMM: 2.8, picksPerMM: 3.6, maxWefts: 3, jitter: 0.3,  fuzz: 0.5, sheen: 0.45, defaultEdge: 'selvedge' },
    damask:  { endsPerMM: 3.2, picksPerMM: 5.0, maxWefts: 3, jitter: 0.25, fuzz: 0.4, sheen: 0.25, defaultEdge: 'selvedge' },
  },
  needle: {
    taffeta: { endsPerMM: 4.0, picksPerMM: 4.4,  maxWefts: 8, jitter: 0.08, fuzz: 0.1,  sheen: 0.3,  defaultEdge: 'hotCut' },
    satin:   { endsPerMM: 4.8, picksPerMM: 6.0,  maxWefts: 8, jitter: 0.06, fuzz: 0.08, sheen: 0.65, defaultEdge: 'hotCut' },
    damask:  { endsPerMM: 5.6, picksPerMM: 10.0, maxWefts: 8, jitter: 0.05, fuzz: 0.05, sheen: 0.4,  defaultEdge: 'hotCut' },
  },
}

export const loomProfile = (loom: LoomType, ground: GroundWeave): LoomProfile =>
  LOOM_TABLE[loom][ground]

export const maxWeftsFor = (loom: LoomType): number => (loom === 'shuttle' ? 3 : 8)

/** Edge finishes a loom can actually produce (shuttle = woven selvedge only). */
export const edgeOptionsFor = (loom: LoomType): readonly EdgeFinish[] =>
  loom === 'shuttle' ? ['selvedge'] : ['hotCut', 'ultrasonic']

/** Warn (soft) above this many grid cells — density × size outruns the painter. */
export const CELL_BUDGET = 350_000
