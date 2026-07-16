import type { LabelDoc } from '../model/types'
import { paintFoldedWeave, paintWeave } from '../weave/paint'
import { sampleDoc } from '../weave/sample'

/**
 * Woven mockup PNG: the thread painter run offscreen at export resolution.
 * No SVG-filter rasterization step anywhere — this is the same code path as
 * the on-screen preview, so what you see is exactly what exports.
 */

export interface WovenPngOptions {
  /** Output width in px (height follows the label aspect + margin). */
  px: number
  lightDeg: number
  /** Present folded (per doc.fold) instead of the flat blank. */
  folded: boolean
  /** Transparent margin around the fabric, as a fraction of width. */
  marginFrac?: number
}

export async function exportWovenPng(doc: LabelDoc, options: WovenPngOptions): Promise<Blob> {
  const margin = Math.round(options.px * (options.marginFrac ?? 0.05))
  const innerW = options.px - margin * 2
  const pxPerMM = innerW / doc.widthMM
  const height = Math.ceil(doc.heightMM * pxPerMM) + margin * 2

  const canvas = document.createElement('canvas')
  canvas.width = options.px
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const { grid } = sampleDoc(doc, { assetsRevision: -2, fontsRevision: -2 })
  const paintOpts = {
    pxPerMM,
    originX: canvas.width / 2,
    originY: height / 2,
    lightDeg: options.lightDeg,
  }
  if (options.folded) paintFoldedWeave(ctx, grid, doc, paintOpts)
  else paintWeave(ctx, grid, doc, paintOpts)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG encoding failed'))
    }, 'image/png')
  })
}
