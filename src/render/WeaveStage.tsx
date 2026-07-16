import { useEffect, useRef } from 'react'
import { useLabel } from '../state/store'
import { useViewport } from '../state/viewport'
import { paintFoldedWeave, paintWeave } from '../weave/paint'
import { sampleDoc } from '../weave/sample'

/**
 * The woven preview: a canvas sitting UNDER the SvgStage. The svg stays
 * mounted on top for interaction (hit rects, guides, handles) with its
 * vector artwork faded out; this canvas repaints on-change (rAF-coalesced,
 * no frame loop) — sample the grid, stamp the threads.
 */

export const lastWeaveTimings = { sampleMs: 0, paintMs: 0, cells: 0 }

export function WeaveStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const doc = useLabel((s) => s.doc)
  const assetsRevision = useLabel((s) => s.assetsRevision)
  const fontsRevision = useLabel((s) => s.fontsRevision)
  const lightDeg = useLabel((s) => s.view.lightDeg)
  const folded = useLabel((s) => s.view.folded)
  const { scale, tx, ty, size } = useViewport()

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas || size.w === 0 || size.h === 0) return
      const dpr = window.devicePixelRatio || 1
      const W = Math.round(size.w * dpr)
      const H = Math.round(size.h * dpr)
      if (canvas.width !== W) canvas.width = W
      if (canvas.height !== H) canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const { grid, sampleMs } = sampleDoc(doc, { assetsRevision, fontsRevision })
      const t0 = performance.now()
      const paintOpts = {
        pxPerMM: scale * dpr,
        originX: tx * dpr,
        originY: ty * dpr,
        lightDeg,
      }
      if (folded) paintFoldedWeave(ctx, grid, doc, paintOpts)
      else paintWeave(ctx, grid, doc, paintOpts)
      lastWeaveTimings.sampleMs = sampleMs
      lastWeaveTimings.paintMs = performance.now() - t0
      lastWeaveTimings.cells = grid.cols * grid.rows
    })
    return () => cancelAnimationFrame(raf.current)
  }, [doc, assetsRevision, fontsRevision, lightDeg, folded, scale, tx, ty, size])

  return <canvas ref={canvasRef} className="weave-stage" style={{ width: size.w || '100%', height: size.h || '100%' }} />
}
