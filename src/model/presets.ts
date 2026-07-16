import type { LabelDoc } from './types'
import { DOC_VERSION, thread } from './types'

/**
 * Starter templates. The five era presets (1940s workwear → modern
 * streetwear) land with the content milestone and become the golden-snapshot
 * acceptance contract; until then only the blank exists. Fixed layer ids
 * keep snapshots and tutorials stable — never regenerate them.
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
        archMM: 0, archMode: 'arc',
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
]
