import type { Font } from 'opentype.js'
import type { Layer } from '../model/types'
import { compileBorder } from './border'
import { compileHatch } from './hatch'
import { compileMotif } from './motifLayer'
import { compileRepeatRow } from './repeatRow'
import { compileTextLine } from './textLine'
import type { ParsedSvgAsset } from './svgAsset'
import type { CompiledLayer } from './shapes'

export interface CompileCtx {
  widthMM: number
  heightMM: number
  /** Weave grid density — legibility warnings depend on it. */
  endsPerMM: number
  picksPerMM: number
  /** Chord tolerance for warped content. Interactive 0.01, export 0.0025. */
  toleranceMM: number
  assetsRevision: number
  fontsRevision: number
  /** Parsed font lookup — null while a font is still loading. */
  getFont: (fontId: string) => Font | null
  /** Parsed SVG asset lookup — null while parsing (or unknown id). */
  getSvgAsset: (assetId: string) => ParsedSvgAsset | null
}

export const INTERACTIVE_TOLERANCE_MM = 0.01
export const EXPORT_TOLERANCE_MM = 0.0025

/** Memo key covering everything that changes a layer's compiled geometry. */
export const compileCtxKey = (ctx: CompileCtx): string =>
  `${ctx.widthMM}|${ctx.heightMM}|${ctx.endsPerMM}|${ctx.picksPerMM}|${ctx.toleranceMM}|${ctx.assetsRevision}|${ctx.fontsRevision}`

/**
 * Memoized per-layer compile. Immer keeps unchanged layers referentially
 * identical across store updates, so the WeakMap only recompiles the edited
 * layer; the ctx key catches size/density/tolerance/asset/font changes.
 */
const cache = new WeakMap<Layer, { key: string; result: CompiledLayer }>()

export function compileLayer(layer: Layer, ctx: CompileCtx): CompiledLayer {
  const key = compileCtxKey(ctx)
  const hit = cache.get(layer)
  if (hit && hit.key === key) return hit.result
  const result = compileByType(layer, ctx)
  cache.set(layer, { key, result })
  return result
}

function compileByType(layer: Layer, ctx: CompileCtx): CompiledLayer {
  switch (layer.type) {
    case 'textLine':
      return compileTextLine(
        layer,
        ctx.getFont(layer.fontId),
        ctx.toleranceMM,
        { endsPerMM: ctx.endsPerMM, picksPerMM: ctx.picksPerMM },
        ctx.widthMM,
      )
    case 'motif':
      return compileMotif(layer, ctx.getSvgAsset)
    case 'hatch':
      return compileHatch(layer, ctx.widthMM, ctx.heightMM)
    case 'border':
      return compileBorder(layer, ctx.widthMM, ctx.heightMM)
    case 'repeatRow':
      return compileRepeatRow(layer, ctx.getSvgAsset)
  }
}
