import type { LabelDoc } from './types'
import {
  DOC_VERSION,
  makeBorderLayer,
  makeMotifLayer,
  makeRepeatRowLayer,
  makeTextLineLayer,
  thread,
} from './types'

/**
 * Reference recreations — faithful *interpretations* (not exact traced
 * reproductions) of real vintage/heritage labels, built entirely from the
 * tool's own primitives to show the range. Emblems are library motifs
 * standing in for each brand's bespoke artwork; wordmarks use bundled fonts.
 * Exact reproduction awaits rich artwork import + exact-font upload (see
 * VINTAGE-RESEARCH-ROADMAP.md). Built with the layer factories, so every
 * field is defaulted correctly; fixed layer ids for stability.
 */

/** Brut (Paris) — the minimal French bleu-de-travail tag: indigo, keyline, Bebas. */
export function exampleBrut(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Brut — Archives Paris',
    widthMM: 44,
    heightMM: 20,
    fold: 'straight',
    weave: {
      loom: 'needle',
      ground: 'taffeta',
      warp: thread('Indigo'),
      wefts: [thread('White'), thread('Rose')],
      endsPerMM: 4.4,
      picksPerMM: 5,
      edge: 'hotCut',
    },
    layers: [
      makeBorderLayer({ id: 'brut-frame', name: 'Keyline', pattern: 'keyline', insetMM: 1.4, strokeMM: 0.3, unitMM: 1.6, sides: 'all', weftIndex: 0 }),
      makeTextLineLayer({ id: 'brut-brand', name: 'BRUT', text: 'BRUT', fontId: 'bebas', sizeMM: 7.5, xMM: 0, yMM: 0.3, weftIndex: 0, letterSpacingMM: 1.4 }),
      makeTextLineLayer({ id: 'brut-city', name: 'Archives Paris', text: 'ARCHIVES — PARIS', fontId: 'oswald', sizeMM: 2, xMM: 0, yMM: 5.6, weftIndex: 0, letterSpacingMM: 1 }),
      makeTextLineLayer({ id: 'brut-fr', name: 'Bleu de travail', text: 'BLEU DE TRAVAIL', fontId: 'oswald', sizeMM: 1.7, xMM: 0, yMM: -6.4, weftIndex: 1, letterSpacingMM: 0.7 }),
    ],
    assets: {},
    localFonts: {},
  }
}

/** Stevenson Overall Co. — a turn-of-century athletic roundel using ring text. */
export function exampleStevenson(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Stevenson Overall Co.',
    widthMM: 54,
    heightMM: 32,
    fold: 'straight',
    weave: {
      loom: 'needle',
      ground: 'damask',
      warp: thread('Black'),
      wefts: [thread('Ivory'), thread('Gold')],
      endsPerMM: 5.6,
      picksPerMM: 8,
      edge: 'hotCut',
    },
    layers: [
      makeBorderLayer({ id: 'stv-frame', name: 'Double rule', pattern: 'doubleRule', insetMM: 1.4, strokeMM: 0.35, unitMM: 1, sides: 'all', weftIndex: 0 }),
      makeMotifLayer({ id: 'stv-figure', name: 'Runner', source: { kind: 'builtin', motifId: 'runningman' }, xMM: 0, yMM: -2, sizeMM: 8, weftIndex: 1 }),
      makeTextLineLayer({ id: 'stv-top', name: 'Maker (ring)', text: 'STEVENSON OVERALL CO.', fontId: 'oswald', sizeMM: 2.7, xMM: 0, yMM: -2, weftIndex: 0, letterSpacingMM: 0.3, ringMM: 13, ringAnchorDeg: 0, ringInside: false }),
      makeTextLineLayer({ id: 'stv-bottom', name: 'Origin (ring)', text: 'BERKELEY · CALIFORNIA', fontId: 'oswald', sizeMM: 2.4, xMM: 0, yMM: -2, weftIndex: 1, letterSpacingMM: 0.4, ringMM: 13, ringAnchorDeg: 180, ringInside: true }),
      makeTextLineLayer({ id: 'stv-lot', name: 'Lot', text: 'LOT 767', fontId: 'garamond', sizeMM: 1.9, xMM: 0, yMM: 3.3, weftIndex: 0, letterSpacingMM: 0.4 }),
    ],
    assets: {},
    localFonts: {},
  }
}

/** Double RL & Co. — the western mercantile tag: eagle, Rye slab, stars. */
export function exampleDoubleRL(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Double RL & Co.',
    widthMM: 56,
    heightMM: 32,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'damask',
      warp: thread('Sun-faded'),
      wefts: [thread('Indigo'), thread('Rust')],
      endsPerMM: 3.4,
      picksPerMM: 5.2,
      edge: 'selvedge',
    },
    layers: [
      makeBorderLayer({ id: 'rrl-frame', name: 'Double rule', pattern: 'doubleRule', insetMM: 1.6, strokeMM: 0.4, unitMM: 1.1, sides: 'all', weftIndex: 0 }),
      makeMotifLayer({ id: 'rrl-eagle', name: 'Eagle', source: { kind: 'builtin', motifId: 'eaglespread' }, xMM: 0, yMM: -9, sizeMM: 8, weftIndex: 0 }),
      makeTextLineLayer({ id: 'rrl-brand', name: 'Double RL', text: 'DOUBLE RL', fontId: 'rye', sizeMM: 6.5, xMM: 0, yMM: 0, weftIndex: 0, letterSpacingMM: 0.2 }),
      makeTextLineLayer({ id: 'rrl-co', name: '& Company', text: '— & COMPANY —', fontId: 'rye', sizeMM: 2.6, xMM: 0, yMM: 5.4, weftIndex: 1, letterSpacingMM: 0.3 }),
      makeRepeatRowLayer({ id: 'rrl-stars', name: 'Stars', source: { kind: 'builtin', motifId: 'star' }, count: 3, xMM: 0, yMM: 9.6, widthMM: 18, sizeMM: 1.7, weftIndex: 1 }),
      makeTextLineLayer({ id: 'rrl-lot', name: 'Lot', text: 'LOT No. 471  ·  TRADE MARK', fontId: 'robotoslab', sizeMM: 1.7, xMM: 0, yMM: 12.6, weftIndex: 0, letterSpacingMM: 0.4 }),
    ],
    assets: {},
    localFonts: {},
  }
}

export interface ExampleInfo {
  id: string
  name: string
  blurb: string
  make: () => LabelDoc
}

export const EXAMPLES: ExampleInfo[] = [
  { id: 'brut', name: 'Brut — Paris', blurb: 'Minimal French bleu-de-travail tag: indigo ground, keyline, Bebas wordmark.', make: exampleBrut },
  { id: 'stevenson', name: 'Stevenson Overall Co.', blurb: 'Turn-of-century athletic roundel — ring text wrapping a figure, gold on black.', make: exampleStevenson },
  { id: 'doubleRL', name: 'Double RL & Co.', blurb: 'Western mercantile tag: spread eagle, Rye slab wordmark, stars, on sun-faded ecru.', make: exampleDoubleRL },
]
