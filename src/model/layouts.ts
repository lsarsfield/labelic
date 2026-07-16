import type { LabelDoc } from './types'
import { DOC_VERSION, thread } from './types'

/**
 * Layout templates: parametric vintage-label composition skeletons.
 *
 * Where the era presets in `presets.ts` are finished, snapshot-frozen labels,
 * these are STARTING ARRANGEMENTS — the same field-complete LabelDoc shape,
 * but carrying placeholder copy the user overwrites. Each `make()` returns a
 * fully valid doc: every schema field present, fixed layer ids (prefixed per
 * layout), and every `weftIndex` inside its palette so the doc round-trips
 * through serialize unchanged (validate CLAMPS out-of-range indices).
 *
 * Kept structural-only on purpose: `layouts.test.ts` asserts serialize
 * round-trip + id uniqueness — it does NOT compile geometry, so no fonts are
 * needed and there are no golden snapshots to freeze.
 */

/** Brand arched across the top over a central motif, straight sub-line below. */
export function layoutArchedBanner(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Arched banner',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Navy'),
      wefts: [thread('Ivory'), thread('Gold')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'arch-frame', type: 'border', name: 'Keyline', visible: true, weftIndex: 1,
        pattern: 'keyline', insetMM: 1.4, strokeMM: 0.4, unitMM: 1.6, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'arch-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'BRAND NAME', fontId: 'playfair', sizeMM: 5, xMM: 0, yMM: -5,
        anchorAlign: 'center', letterSpacingMM: 0.3, useKerning: true,
        archMM: 3, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'arch-motif', type: 'motif', name: 'Emblem', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'rosette' }, xMM: 0, yMM: 1.5, sizeMM: 5.5,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'arch-sub', type: 'textLine', name: 'Sub-line', visible: true, weftIndex: 0,
        text: 'FINE GARMENTS', fontId: 'garamond', sizeMM: 2.3, xMM: 0, yMM: 8.4,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Three-to-four centred lines (BRAND / model / SANFORIZED / UNION MADE) in a keyline. */
export function layoutStackedUtility(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Stacked utility',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Black'),
      wefts: [thread('Ivory'), thread('Gold')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'stack-frame', type: 'border', name: 'Keyline', visible: true, weftIndex: 1,
        pattern: 'keyline', insetMM: 1.6, strokeMM: 0.4, unitMM: 1.6, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'stack-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'BRAND', fontId: 'oswald', sizeMM: 4.5, xMM: 0, yMM: -6.5,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'stack-model', type: 'textLine', name: 'Model', visible: true, weftIndex: 1,
        text: 'No. 101', fontId: 'robotoslab', sizeMM: 3, xMM: 0, yMM: -1.4,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'stack-sanforized', type: 'textLine', name: 'Sanforized', visible: true, weftIndex: 0,
        text: 'SANFORIZED', fontId: 'robotoslab', sizeMM: 2.4, xMM: 0, yMM: 3.2,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'stack-union', type: 'textLine', name: 'Union made', visible: true, weftIndex: 0,
        text: 'UNION MADE', fontId: 'robotoslab', sizeMM: 2.4, xMM: 0, yMM: 7.6,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Central wordmark with a mirrored motif (laurel) flanking each side. */
export function layoutEmblemFlanked(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Emblem flanked',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Ivory'),
      wefts: [thread('Navy'), thread('Crimson')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'emblem-laurel-l', type: 'motif', name: 'Laurel left', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'laurel' }, xMM: -18, yMM: 0.5, sizeMM: 8,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'emblem-laurel-r', type: 'motif', name: 'Laurel right', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'laurel' }, xMM: 18, yMM: 0.5, sizeMM: 8,
        rotationDeg: 0, mirrorX: true, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'emblem-wordmark', type: 'textLine', name: 'Wordmark', visible: true, weftIndex: 0,
        text: 'BRAND NAME', fontId: 'cinzel', sizeMM: 5, xMM: 0, yMM: 0.5,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'emblem-sub', type: 'textLine', name: 'Sub-line', visible: true, weftIndex: 0,
        text: 'SINCE 1952', fontId: 'garamond', sizeMM: 2.2, xMM: 0, yMM: 8,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Two short corner lines top-left & top-right, a central motif, wordmark across the bottom. */
export function layoutCornerSlogan(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Corner slogan',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Black'),
      wefts: [thread('Ivory'), thread('Gold')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'corner-tl', type: 'textLine', name: 'Corner left', visible: true, weftIndex: 0,
        text: 'SINCE', fontId: 'oswald', sizeMM: 2.4, xMM: -22, yMM: -7,
        anchorAlign: 'left', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'corner-tr', type: 'textLine', name: 'Corner right', visible: true, weftIndex: 0,
        text: '1889', fontId: 'oswald', sizeMM: 2.4, xMM: 22, yMM: -7,
        anchorAlign: 'right', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'corner-motif', type: 'motif', name: 'Emblem', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'shield' }, xMM: 0, yMM: -1, sizeMM: 7,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'corner-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'BRAND NAME', fontId: 'bebas', sizeMM: 5, xMM: 0, yMM: 8,
        anchorAlign: 'center', letterSpacingMM: 0.8, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Rectangular double-rule frame with a central emblem and arched text above/below (crest badge). */
export function layoutCrestFrame(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Crest frame',
    widthMM: 45,
    heightMM: 20,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Navy'),
      wefts: [thread('Gold'), thread('Ivory')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'crest-frame', type: 'border', name: 'Double rule', visible: true, weftIndex: 0,
        pattern: 'doubleRule', insetMM: 1.6, strokeMM: 0.4, unitMM: 1.2, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'crest-top', type: 'textLine', name: 'Ring top', visible: true, weftIndex: 0,
        text: 'CREST & CO', fontId: 'cinzel', sizeMM: 2.8, xMM: 0, yMM: -6,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 2, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'crest-emblem', type: 'motif', name: 'Emblem', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'shield' }, xMM: 0, yMM: 0.2, sizeMM: 7.5,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'crest-bottom', type: 'textLine', name: 'Ring bottom', visible: true, weftIndex: 1,
        text: 'LONDON', fontId: 'cinzel', sizeMM: 2.8, xMM: 0, yMM: 6.6,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: -2, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Left-aligned stacked military spec lines, slab type, black on white. */
export function layoutMilitarySpec(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Military spec',
    widthMM: 60,
    heightMM: 30,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('White'),
      wefts: [thread('Black')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'mil-nomen', type: 'textLine', name: 'Nomenclature', visible: true, weftIndex: 0,
        text: 'COAT, COLD WEATHER', fontId: 'robotoslab', sizeMM: 2.6, xMM: -25, yMM: -11,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-size', type: 'textLine', name: 'Size', visible: true, weftIndex: 0,
        text: 'SIZE  MEDIUM', fontId: 'robotoslab', sizeMM: 2.6, xMM: -25, yMM: -7.4,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-contract', type: 'textLine', name: 'Contract no', visible: true, weftIndex: 0,
        text: 'CONTRACT NO. DLA100-78-C-0720', fontId: 'robotoslab', sizeMM: 2, xMM: -25, yMM: -3.8,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-stock', type: 'textLine', name: 'Stock no', visible: true, weftIndex: 0,
        text: 'STOCK NO. 8415-00-000-0000', fontId: 'robotoslab', sizeMM: 2, xMM: -25, yMM: -0.2,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-date', type: 'textLine', name: 'Date', visible: true, weftIndex: 0,
        text: 'DATE  1978', fontId: 'robotoslab', sizeMM: 2.6, xMM: -25, yMM: 3.4,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-fiber', type: 'textLine', name: 'Fiber', visible: true, weftIndex: 0,
        text: '50% NYLON 50% COTTON', fontId: 'robotoslab', sizeMM: 2.4, xMM: -25, yMM: 7,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mil-care', type: 'textLine', name: 'Care', visible: true, weftIndex: 0,
        text: 'MACHINE WASH COLD', fontId: 'robotoslab', sizeMM: 2.4, xMM: -25, yMM: 10.6,
        anchorAlign: 'left', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Tiny size tab: brand over a big size number. */
export function layoutSizeTab(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Size tab',
    widthMM: 32,
    heightMM: 16,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Navy'),
      wefts: [thread('Ivory')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'size-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'BRAND', fontId: 'oswald', sizeMM: 2.6, xMM: 0, yMM: -4,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'size-number', type: 'textLine', name: 'Size', visible: true, weftIndex: 0,
        text: '32', fontId: 'bebas', sizeMM: 7, xMM: 0, yMM: 3.5,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Patriotic flag tag: a row of stars, wordmark, MADE IN U.S.A. — red/white/blue. */
export function layoutFlagTag(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Flag tag',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('White'),
      wefts: [thread('Navy'), thread('Crimson')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'flag-stars', type: 'repeatRow', name: 'Stars', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'star' }, count: 5, xMM: 0, yMM: -7,
        widthMM: 30, sizeMM: 2.2, alternateFlip: false, strokeMM: 0.4,
        rows: 1, rowGapMM: 2, staggerRow2: true, flipRow2: false,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'flag-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 1,
        text: 'BRAND NAME', fontId: 'bebas', sizeMM: 5, xMM: 0, yMM: 0.5,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'flag-usa', type: 'textLine', name: 'Made in USA', visible: true, weftIndex: 0,
        text: 'MADE IN U.S.A.', fontId: 'oswald', sizeMM: 2.6, xMM: 0, yMM: 7.6,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Centred script wordmark in a rule frame: small-caps line above, mill/TM line below — gold on navy. */
export function layoutBoxedWarranty(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Boxed warranty',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Navy'),
      wefts: [thread('Gold'), thread('Ivory')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'warr-frame', type: 'border', name: 'Double rule', visible: true, weftIndex: 0,
        pattern: 'doubleRule', insetMM: 1.6, strokeMM: 0.4, unitMM: 1.2, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'warr-above', type: 'textLine', name: 'Warranted', visible: true, weftIndex: 1,
        text: 'WARRANTED TO BE A', fontId: 'garamond', sizeMM: 2.2, xMM: 0, yMM: -6,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'warr-brand', type: 'textLine', name: 'Wordmark', visible: true, weftIndex: 0,
        text: 'Genuine', fontId: 'pinyon', sizeMM: 6, xMM: 0, yMM: 1,
        anchorAlign: 'center', letterSpacingMM: 0.1, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'warr-below', type: 'textLine', name: 'Mill line', visible: true, weftIndex: 1,
        text: 'VIRGIN WOOL — REG. NO. 000', fontId: 'garamond', sizeMM: 2, xMM: 0, yMM: 8,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

export interface LayoutInfo {
  id: string
  name: string
  blurb: string
  make: () => LabelDoc
}

export const LAYOUTS: LayoutInfo[] = [
  {
    id: 'archedBanner',
    name: 'Arched banner',
    blurb: 'Brand arched across the top over a central emblem, straight sub-line below.',
    make: layoutArchedBanner,
  },
  {
    id: 'stackedUtility',
    name: 'Stacked utility',
    blurb: 'Four centred lines — brand, model, SANFORIZED, UNION MADE — inside a keyline.',
    make: layoutStackedUtility,
  },
  {
    id: 'emblemFlanked',
    name: 'Emblem flanked',
    blurb: 'Central wordmark with a mirrored laurel flanking each side.',
    make: layoutEmblemFlanked,
  },
  {
    id: 'cornerSlogan',
    name: 'Corner slogan',
    blurb: 'Two corner lines top-left and top-right, a central emblem, wordmark across the bottom.',
    make: layoutCornerSlogan,
  },
  {
    id: 'crestFrame',
    name: 'Crest frame',
    blurb: 'Double-rule badge frame with a central emblem and arched text above and below.',
    make: layoutCrestFrame,
  },
  {
    id: 'militarySpec',
    name: 'Military spec',
    blurb: 'Left-aligned slab spec block — nomenclature, contract and stock numbers, care — black on white.',
    make: layoutMilitarySpec,
  },
  {
    id: 'sizeTab',
    name: 'Size tab',
    blurb: 'Tiny two-line tab: brand over a big size number.',
    make: layoutSizeTab,
  },
  {
    id: 'flagTag',
    name: 'Flag tag',
    blurb: 'Patriotic tag: a row of stars, wordmark, MADE IN U.S.A. — red, white and blue.',
    make: layoutFlagTag,
  },
  {
    id: 'boxedWarranty',
    name: 'Boxed warranty',
    blurb: 'Script wordmark in a rule frame — small-caps line above, mill line below — gold on navy.',
    make: layoutBoxedWarranty,
  },
]
