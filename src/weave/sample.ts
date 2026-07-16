import type { LabelDoc, Layer } from '../model/types'
import { GROUND_WEFT_INDEX } from '../model/types'
import { compileLayer, compileCtxKey, INTERACTIVE_TOLERANCE_MM, type CompileCtx } from '../geometry/compile'
import { defMatrix } from '../geometry/expand'
import type { CompiledLayer } from '../geometry/shapes'
import { getLoadedFont } from '../io/fonts'
import { getSvgAsset } from '../io/svgAssets'
import { boxAverageAlpha, claimFromCoverage, makeGrid, type WeaveGrid } from './grid'

/**
 * Vector → grid sampling. Each layer's compiled Shape IR is rasterized alone
 * onto an offscreen canvas at a UNIFORM supersample scale (a non-uniform
 * cell-resolution transform would distort stroke widths — the canvas pen
 * transforms with the CTM), box-averaged into the non-square cell partition,
 * and the cells it covers ≥ 50% are claimed with the layer's thread.
 * Topmost layer wins; ground-sentinel layers claim 0 (knockout).
 *
 * Per-layer coverage is cached on layer identity (immer keeps untouched
 * layers referentially stable), mirroring the compile memo.
 */

/** ≥ 2 px per cell on the denser axis, capped to keep rasters small. */
export function samplePxPerMM(endsPerMM: number, picksPerMM: number): number {
  return Math.min(20, 2 * Math.max(endsPerMM, picksPerMM))
}

export function rasterizeLayerAlpha(
  compiled: CompiledLayer,
  widthMM: number,
  heightMM: number,
  pxPerMM: number,
): { alpha: Uint8ClampedArray; w: number; h: number } {
  const w = Math.max(1, Math.ceil(widthMM * pxPerMM))
  const h = Math.max(1, Math.ceil(heightMM * pxPerMM))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.setTransform(pxPerMM, 0, 0, pxPerMM, w / 2, h / 2)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'

  for (const shape of compiled.shapes) {
    switch (shape.kind) {
      case 'circle': {
        ctx.beginPath()
        ctx.arc(0, 0, shape.rMM, 0, Math.PI * 2)
        paintShape(ctx, shape.paint)
        break
      }
      case 'line': {
        ctx.beginPath()
        ctx.moveTo(shape.x1, shape.y1)
        ctx.lineTo(shape.x2, shape.y2)
        paintShape(ctx, shape.paint, true)
        break
      }
      case 'path': {
        const path = new Path2D(shape.d)
        if (shape.paint.fill) ctx.fill(path, shape.fillRule ?? 'nonzero')
        if (shape.paint.stroke) {
          applyStroke(ctx, shape.paint)
          ctx.stroke(path)
        }
        break
      }
      case 'instanced': {
        const def = new Path2D(shape.def.d)
        const dm = defMatrix(shape.def)
        const strokeScale = Math.abs(shape.def.scale)
        for (const tr of shape.transforms) {
          ctx.save()
          ctx.translate(tr.dx, tr.dy)
          if (tr.rotateDeg !== 0) ctx.rotate((tr.rotateDeg * Math.PI) / 180)
          if (tr.mirrorX) ctx.scale(-1, 1)
          ctx.transform(dm.a, dm.b, dm.c, dm.d, dm.e, dm.f)
          if (shape.paint.fill) ctx.fill(def, 'nonzero')
          if (shape.paint.stroke) {
            applyStroke(ctx, shape.paint, strokeScale)
            ctx.stroke(def)
          }
          ctx.restore()
        }
        break
      }
    }
  }

  const img = ctx.getImageData(0, 0, w, h)
  const alpha = new Uint8ClampedArray(w * h)
  for (let i = 0; i < alpha.length; i++) alpha[i] = img.data[i * 4 + 3]!
  return { alpha, w, h }
}

function applyStroke(
  ctx: CanvasRenderingContext2D,
  paint: { stroke: { widthMM: number; cap: CanvasLineCap; join?: CanvasLineJoin } | null },
  strokeScale = 1,
): void {
  if (!paint.stroke) return
  ctx.lineWidth = paint.stroke.widthMM / strokeScale
  ctx.lineCap = paint.stroke.cap
  ctx.lineJoin = paint.stroke.join ?? 'miter'
}

function paintShape(
  ctx: CanvasRenderingContext2D,
  paint: { fill: boolean; stroke: { widthMM: number; cap: CanvasLineCap; join?: CanvasLineJoin } | null },
  strokeOnly = false,
): void {
  if (paint.fill && !strokeOnly) ctx.fill()
  if (paint.stroke) {
    applyStroke(ctx, paint)
    ctx.stroke()
  }
}

interface CoverageCacheEntry {
  key: string
  coverage: Float32Array
}

const coverageCache = new WeakMap<Layer, CoverageCacheEntry>()

export interface SampleRevisions {
  assetsRevision: number
  fontsRevision: number
}

export interface SampleResult {
  grid: WeaveGrid
  sampleMs: number
}

export function sampleDoc(doc: LabelDoc, revs: SampleRevisions): SampleResult {
  const t0 = performance.now()
  const ctx: CompileCtx = {
    widthMM: doc.widthMM,
    heightMM: doc.heightMM,
    endsPerMM: doc.weave.endsPerMM,
    picksPerMM: doc.weave.picksPerMM,
    toleranceMM: INTERACTIVE_TOLERANCE_MM,
    assetsRevision: revs.assetsRevision,
    fontsRevision: revs.fontsRevision,
    getFont: getLoadedFont,
    getSvgAsset,
  }
  const grid = makeGrid(doc.weave, doc.widthMM, doc.heightMM)
  const pxPerMM = samplePxPerMM(doc.weave.endsPerMM, doc.weave.picksPerMM)
  const cacheKey = `${compileCtxKey(ctx)}|${grid.cols}x${grid.rows}`

  for (const layer of doc.layers) {
    if (!layer.visible) continue
    const compiled = compileLayer(layer, ctx)
    if (compiled.shapes.length === 0) continue

    let entry = coverageCache.get(layer)
    if (!entry || entry.key !== cacheKey) {
      const { alpha, w, h } = rasterizeLayerAlpha(compiled, doc.widthMM, doc.heightMM, pxPerMM)
      entry = { key: cacheKey, coverage: boxAverageAlpha(alpha, w, h, grid.cols, grid.rows) }
      coverageCache.set(layer, entry)
    }

    const paletteValue =
      layer.weftIndex === GROUND_WEFT_INDEX
        ? 0
        : Math.min(Math.max(0, layer.weftIndex), doc.weave.wefts.length - 1) + 1
    claimFromCoverage(grid, entry.coverage, paletteValue)
  }

  return { grid, sampleMs: performance.now() - t0 }
}
