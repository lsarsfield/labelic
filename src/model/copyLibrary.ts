/**
 * Insertable boilerplate copy drawn from genuine vintage labels
 * (see VINTAGE-RESEARCH-ROADMAP.md). Grouped for an "insert standard copy"
 * menu on a text line. Codes carry placeholder numbers to overtype.
 */

export interface CopyGroup {
  label: string
  items: readonly string[]
}

export const COPY_LIBRARY: readonly CopyGroup[] = [
  {
    label: 'Workwear claims',
    items: [
      'UNION MADE',
      'UNION MADE IN U.S.A.',
      'SANFORIZED',
      'EVERY GARMENT GUARANTEED',
      'MASTER CLOTH',
      '100% COTTON',
      'VAT DYED',
      'SHRINK TO FIT',
      '8 HOUR WORK DAY',
    ],
  },
  {
    label: 'Origin & trust',
    items: [
      'MADE IN U.S.A.',
      'MADE IN ENGLAND',
      'LONDON ENGLAND',
      'THE GENUINE ARTICLE',
      "WORLD'S TOUGHEST QUALITY WORK CLOTHING",
      'WARRANTED TO BE A',
      'THE HEIGHT OF PERFECTION',
      'PLENTY TOUGH',
    ],
  },
  {
    label: 'Codes & sizes',
    items: ['LOT No. 471', 'STYLE 101', 'RN 14916', 'SIZE 32 x 34', 'SIZE 16½', 'REG. No. 8112'],
  },
  {
    label: 'French workwear',
    items: ['BLEU DE TRAVAIL', 'GARANTI BON TEINT', 'TAILLE 4', 'FABRIQUÉ EN FRANCE'],
  },
  {
    label: 'Military spec',
    items: [
      'NOMENCLATURE',
      'CONTRACT No. DLA100-78-C-0720',
      'STOCK No. 8405-000-0000',
      'SPEC MIL-J-00000',
    ],
  },
]
