import type { LabelDoc } from './types'
import { DOC_VERSION, thread } from './types'

/**
 * Starter templates: five era presets spanning the app's range — they double
 * as the golden-snapshot acceptance contract (preset literals carry EVERY
 * schema field; fixed layer ids; compiled IR snapshotted in presets.test.ts
 * and frozen — never `vitest -u`).
 */

export function presetBlank(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Untitled label',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Black'),
      wefts: [thread('Ivory'), thread('Gold')],
      endsPerMM: 2.4,
      picksPerMM: 2.8,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'blank-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'GARMENT CO.', fontId: 'oswald', sizeMM: 4.5, xMM: 0, yMM: 1.5,
        anchorAlign: 'center', letterSpacingMM: 0.3, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** 1940s workwear — black taffeta, gold + ivory, stencil brand, running stitch. */
export function preset1940sWorkwear(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: '1940s workwear',
    widthMM: 50,
    heightMM: 22,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Black'),
      wefts: [thread('Gold'), thread('Ivory')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'ww40-border', type: 'border', name: 'Running stitch', visible: true, weftIndex: 0,
        pattern: 'dashes', insetMM: 1.3, strokeMM: 0.45, unitMM: 1.8, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'ww40-sanforized', type: 'textLine', name: 'Sanforized', visible: true, weftIndex: 1,
        text: 'SANFORIZED', fontId: 'robotoslab', sizeMM: 2.6, xMM: 0, yMM: -5.6,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'ww40-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'IRONCLAD', fontId: 'stencil', sizeMM: 5.5, xMM: 0, yMM: 2.6,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 2.5, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'ww40-union', type: 'textLine', name: 'Union made', visible: true, weftIndex: 1,
        text: 'UNION MADE', fontId: 'robotoslab', sizeMM: 2.6, xMM: 0, yMM: 8.6,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'ww40-stars', type: 'repeatRow', name: 'Stars', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'star' }, count: 2, xMM: 0, yMM: 7.8,
        widthMM: 34, sizeMM: 2.2, alternateFlip: false, strokeMM: 0.4,
        rows: 1, rowGapMM: 2, staggerRow2: true, flipRow2: false,
        cap: 'round', join: 'miter', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** 1950s dressmaker — ivory satin, navy script, rose laurels. */
export function preset1950sDressmaker(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: '1950s dressmaker',
    widthMM: 38,
    heightMM: 20,
    fold: 'endFold',
    weave: {
      loom: 'shuttle',
      ground: 'satin',
      warp: thread('Ivory'),
      wefts: [thread('Navy'), thread('Rose')],
      endsPerMM: 4.2,
      picksPerMM: 5.6,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'dm50-keyline', type: 'border', name: 'Keyline', visible: true, weftIndex: 0,
        pattern: 'keyline', insetMM: 1.2, strokeMM: 0.35, unitMM: 1.6, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'dm50-laurel-l', type: 'motif', name: 'Laurel left', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'laurel' }, xMM: -13.5, yMM: 0.6, sizeMM: 4.5,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'dm50-laurel-r', type: 'motif', name: 'Laurel right', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'laurel' }, xMM: 13.5, yMM: 0.6, sizeMM: 4.5,
        rotationDeg: 0, mirrorX: true, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'dm50-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'Marguerite', fontId: 'pinyon', sizeMM: 6.5, xMM: 0, yMM: 2.2,
        anchorAlign: 'center', letterSpacingMM: 0.1, useKerning: true,
        archMM: 1.5, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'dm50-reg', type: 'textLine', name: 'Reg no', visible: true, weftIndex: 0,
        text: 'REG. NO. 8112', fontId: 'garamond', sizeMM: 2.2, xMM: 0, yMM: 7.6,
        anchorAlign: 'center', letterSpacingMM: 0.35, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** 1960s union — white taffeta, the full three-weft cap, union bug. */
export function preset1960sUnion(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: '1960s union',
    widthMM: 45,
    heightMM: 20,
    fold: 'straight',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('White'),
      wefts: [thread('Navy'), thread('Crimson'), thread('Gold')],
      endsPerMM: 3.2,
      picksPerMM: 4,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'un60-border', type: 'border', name: 'Zigzag', visible: true, weftIndex: 0,
        pattern: 'zigzag', insetMM: 1.2, strokeMM: 0.35, unitMM: 1.5, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'un60-bug', type: 'motif', name: 'Union bug', visible: true, weftIndex: 2,
        source: { kind: 'builtin', motifId: 'unionbug' }, xMM: -13.5, yMM: 0.2, sizeMM: 9,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'un60-union', type: 'textLine', name: 'Union made', visible: true, weftIndex: 0,
        text: 'UNION MADE', fontId: 'oswald', sizeMM: 3.4, xMM: 4, yMM: -0.6,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'un60-usa', type: 'textLine', name: 'In USA', visible: true, weftIndex: 1,
        text: 'IN U.S.A.', fontId: 'oswald', sizeMM: 3.4, xMM: 4, yMM: 3.6,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'un60-lot', type: 'textLine', name: 'Lot', visible: true, weftIndex: 0,
        text: 'LOT 4071', fontId: 'robotoslab', sizeMM: 2.4, xMM: 0, yMM: 7.4,
        anchorAlign: 'center', letterSpacingMM: 0.5, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** 1970s denim — gold ground back patch, western brand, wheat sprigs. */
export function preset1970sDenim(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: '1970s denim',
    widthMM: 60,
    heightMM: 30,
    fold: 'endFold',
    weave: {
      loom: 'shuttle',
      ground: 'taffeta',
      warp: thread('Gold'),
      wefts: [thread('Brown'), thread('Rust')],
      endsPerMM: 3,
      picksPerMM: 3.6,
      edge: 'selvedge',
    },
    layers: [
      {
        id: 'dn70-rule', type: 'border', name: 'Double rule', visible: true, weftIndex: 0,
        pattern: 'doubleRule', insetMM: 4.2, strokeMM: 0.5, unitMM: 1.2, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'dn70-wheat-l', type: 'motif', name: 'Wheat left', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'wheat' }, xMM: -20, yMM: -2.4, sizeMM: 7,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'dn70-wheat-r', type: 'motif', name: 'Wheat right', visible: true, weftIndex: 1,
        source: { kind: 'builtin', motifId: 'wheat' }, xMM: 20, yMM: -2.4, sizeMM: 7,
        rotationDeg: 0, mirrorX: true, strokeMM: 0.4,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'dn70-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'DUSTY TRAILS', fontId: 'rye', sizeMM: 6.5, xMM: 0, yMM: -0.6,
        anchorAlign: 'center', letterSpacingMM: 0.4, useKerning: true,
        archMM: 3.5, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'dn70-size', type: 'textLine', name: 'Size', visible: true, weftIndex: 1,
        text: 'SIZE 16', fontId: 'robotoslab', sizeMM: 2.6, xMM: 0, yMM: 10.2,
        anchorAlign: 'center', letterSpacingMM: 0.6, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

/** Modern streetwear — needle-loom damask, single black weft, care row. */
export function presetModernStreetwear(): LabelDoc {
  return {
    version: DOC_VERSION,
    name: 'Modern streetwear',
    widthMM: 45,
    heightMM: 15,
    fold: 'straight',
    weave: {
      loom: 'needle',
      ground: 'damask',
      warp: thread('White'),
      wefts: [thread('Black')],
      endsPerMM: 5.6,
      picksPerMM: 10,
      edge: 'hotCut',
    },
    layers: [
      {
        id: 'mod-keyline', type: 'border', name: 'Keyline', visible: true, weftIndex: 0,
        pattern: 'keyline', insetMM: 1, strokeMM: 0.25, unitMM: 1.6, sides: 'all',
        cap: 'round', join: 'miter',
      },
      {
        id: 'mod-brand', type: 'textLine', name: 'Brand', visible: true, weftIndex: 0,
        text: 'AXIOM', fontId: 'bebas', sizeMM: 6, xMM: -10, yMM: 2.2,
        anchorAlign: 'center', letterSpacingMM: 1.2, useKerning: true,
        archMM: 0, archMode: 'arc', haloMM: 0,
      },
      {
        id: 'mod-care-wash', type: 'motif', name: 'Wash', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'washtub' }, xMM: 5.5, yMM: 0.2, sizeMM: 3.2,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.3,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'mod-care-bleach', type: 'motif', name: 'Bleach', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'bleach' }, xMM: 10, yMM: 0.2, sizeMM: 3.2,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.3,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'mod-care-iron', type: 'motif', name: 'Iron', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'iron' }, xMM: 14.5, yMM: 0.2, sizeMM: 3.2,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.3,
        cap: 'round', join: 'miter', haloMM: 0,
      },
      {
        id: 'mod-care-dry', type: 'motif', name: 'Dry clean', visible: true, weftIndex: 0,
        source: { kind: 'builtin', motifId: 'dryclean' }, xMM: 19, yMM: 0.2, sizeMM: 3.2,
        rotationDeg: 0, mirrorX: false, strokeMM: 0.3,
        cap: 'round', join: 'miter', haloMM: 0,
      },
    ],
    assets: {},
    localFonts: {},
  }
}

export interface TemplateInfo {
  id: string
  name: string
  blurb: string
  make: () => LabelDoc
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'blank',
    name: 'Blank label',
    blurb: 'A 50 × 22 mm shuttle-loom taffeta blank — start from nothing.',
    make: presetBlank,
  },
  {
    id: 'workwear40s',
    name: '1940s workwear',
    blurb: 'Black taffeta, arched stencil brand in gold, SANFORIZED and UNION MADE lines.',
    make: preset1940sWorkwear,
  },
  {
    id: 'dressmaker50s',
    name: '1950s dressmaker',
    blurb: 'Ivory satin, navy copperplate script, rose laurels, end fold.',
    make: preset1950sDressmaker,
  },
  {
    id: 'union60s',
    name: '1960s union',
    blurb: 'White taffeta at the full three-weft cap: union bug, red-and-navy lines.',
    make: preset1960sUnion,
  },
  {
    id: 'denim70s',
    name: '1970s denim',
    blurb: 'Gold-ground back patch: western wordmark, wheat sprigs, double rule.',
    make: preset1970sDenim,
  },
  {
    id: 'streetwear',
    name: 'Modern streetwear',
    blurb: 'Needle-loom damask, hot-cut, one black weft, post-1971 care symbols.',
    make: presetModernStreetwear,
  },
]
