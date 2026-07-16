import type { FoldType } from '../model/types'

/**
 * Fold geometry shared by guides, the folded weave presentation, and export
 * warnings. The doc's width × height is the WOVEN BLANK; folds consume
 * allowance from it, and the region between fold lines is the finished
 * visible panel.
 */

/** Fold-under allowance at each folded end. */
export const END_FOLD_ALLOWANCE_MM = 3
/** Mitre folds run at 45° across the corner, this far in from the end. */
export const MITRE_ALLOWANCE_MM = 3

export interface FoldLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Fold lines in label mm (origin centred). */
export function foldLinesMM(fold: FoldType, widthMM: number, heightMM: number): FoldLine[] {
  const w2 = widthMM / 2
  const h2 = heightMM / 2
  const a = Math.min(END_FOLD_ALLOWANCE_MM, widthMM / 4)
  const m = Math.min(MITRE_ALLOWANCE_MM, widthMM / 4, heightMM)
  switch (fold) {
    case 'straight':
      return []
    case 'endFold':
      // ends tuck under
      return [
        { x1: -w2 + a, y1: -h2, x2: -w2 + a, y2: h2 },
        { x1: w2 - a, y1: -h2, x2: w2 - a, y2: h2 },
      ]
    case 'loopFold':
      // folded in half around the horizontal middle; both cut ends sew into the seam
      return [{ x1: -w2, y1: 0, x2: w2, y2: 0 }]
    case 'centreFold':
      // book fold around the vertical middle
      return [{ x1: 0, y1: -h2, x2: 0, y2: h2 }]
    case 'mitreFold':
      // ends fold up and back at 45°, leaving angled tabs
      return [
        { x1: -w2 + m, y1: h2, x2: -w2, y2: h2 - m },
        { x1: w2 - m, y1: h2, x2: w2, y2: h2 - m },
      ]
  }
}

/**
 * The finished visible panel once folded (woven "folded" presentation crops
 * to this rect). Straight cut shows everything.
 */
export function visiblePanelMM(
  fold: FoldType,
  widthMM: number,
  heightMM: number,
): { x: number; y: number; w: number; h: number } {
  const w2 = widthMM / 2
  const h2 = heightMM / 2
  const a = Math.min(END_FOLD_ALLOWANCE_MM, widthMM / 4)
  switch (fold) {
    case 'straight':
    case 'mitreFold': // tabs fold behind; the face stays full-size
      return { x: -w2, y: -h2, w: widthMM, h: heightMM }
    case 'endFold':
      return { x: -w2 + a, y: -h2, w: widthMM - 2 * a, h: heightMM }
    case 'loopFold':
      // front of the loop = the top half
      return { x: -w2, y: -h2, w: widthMM, h: h2 }
    case 'centreFold':
      // front cover = the right half (opens like a book)
      return { x: 0, y: -h2, w: w2, h: heightMM }
  }
}
