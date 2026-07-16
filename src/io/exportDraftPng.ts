import type { LabelDoc } from '../model/types'
import { hexToRgb } from '../weave/color'
import { sampleDoc } from '../weave/sample'

/**
 * Weave draft PNG: the grid itself, one pixel per thread crossing — the
 * punchcard. Ground cells in the warp color, claimed cells in their weft.
 * `scale` yields a chunky readable version (each cell scale×scale px).
 */
export async function exportDraftPng(doc: LabelDoc, scale = 4): Promise<Blob> {
  const { grid } = sampleDoc(doc, { assetsRevision: -3, fontsRevision: -3 })
  const img = new ImageData(grid.cols, grid.rows)
  const warp = hexToRgb(doc.weave.warp.hex)
  const wefts = doc.weave.wefts.map((w) => hexToRgb(w.hex))
  for (let i = 0; i < grid.data.length; i++) {
    const v = grid.data[i]!
    const rgb = v === 0 ? warp : (wefts[v - 1] ?? warp)
    img.data[i * 4] = rgb.r
    img.data[i * 4 + 1] = rgb.g
    img.data[i * 4 + 2] = rgb.b
    img.data[i * 4 + 3] = 255
  }

  const base = document.createElement('canvas')
  base.width = grid.cols
  base.height = grid.rows
  base.getContext('2d')!.putImageData(img, 0, 0)

  const out = document.createElement('canvas')
  out.width = grid.cols * scale
  out.height = grid.rows * scale
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = false // hard pixels — it is a draft, not a photo
  ctx.drawImage(base, 0, 0, out.width, out.height)

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG encoding failed'))
    }, 'image/png')
  })
}
