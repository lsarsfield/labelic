import type { LabelDoc } from '../model/types'
import { exportArtworkSvg } from './exportSvg'

/**
 * Switcher thumbnails: the compact <use>-based export (no project metadata,
 * no guides) with the real ground + thread colors — a tiny artwork proof.
 * Rendered via `data:image/svg+xml,${encodeURIComponent(...)}`.
 */

export const THUMB_MAX_BYTES = 300_000

export function renderThumbSvg(doc: LabelDoc, maxBytes = THUMB_MAX_BYTES): string | null {
  let svg: string
  try {
    svg = exportArtworkSvg(doc, {
      expandInstances: false,
      includeGround: true,
      includeGuides: false,
      embedProject: false,
    }).svg
  } catch {
    return null
  }
  return svg.length > maxBytes ? null : svg
}
