import { distToSegment, type Pt, type SubPath } from './flatten'
import { fmt } from './format'

/**
 * Non-affine warps. The pipeline is flatten-then-warp — never warp bezier
 * control points (a bend map is not affine; a bezier's image is not a
 * bezier). After mapping each source vertex, segments are adaptively
 * subdivided IN WARPED SPACE: a straight horizontal source segment must
 * densify into an arc, while a segment the warp keeps straight stays exactly
 * two points.
 *
 * Labelic's concrete warp (`arcWarp`, in textLine.ts) bends a straight
 * baseline onto a gentle circular arch; the machinery here is warp-agnostic.
 */

export type WarpFn = (p: Pt) => Pt

const MAX_DEPTH = 20
const WELD_EPS = 1e-6

function refine(
  srcA: Pt,
  srcB: Pt,
  dstA: Pt,
  dstB: Pt,
  warp: WarpFn,
  tol: number,
  depth: number,
  out: Pt[],
): void {
  const srcM = { x: (srcA.x + srcB.x) / 2, y: (srcA.y + srcB.y) / 2 }
  const dstM = warp(srcM)
  if (depth >= MAX_DEPTH || distToSegment(dstM, dstA, dstB) <= tol) {
    out.push(dstB)
    return
  }
  refine(srcA, srcM, dstA, dstM, warp, tol, depth + 1, out)
  refine(srcM, srcB, dstM, dstB, warp, tol, depth + 1, out)
}

export function warpPolyline(pts: Pt[], warp: WarpFn, tolMM: number): Pt[] {
  if (pts.length === 0) return []
  const first = warp(pts[0]!)
  const out: Pt[] = [first]
  for (let i = 1; i < pts.length; i++) {
    const srcA = pts[i - 1]!
    const srcB = pts[i]!
    const dstA = out[out.length - 1]!
    const dstB = warp(srcB)
    refine(srcA, srcB, dstA, dstB, warp, tolMM, 0, out)
  }
  return weld(out)
}

/** Drop consecutive duplicates (e.g. a closed path's seam) within numeric noise. */
function weld(pts: Pt[]): Pt[] {
  const out: Pt[] = []
  for (const p of pts) {
    const prev = out[out.length - 1]
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > WELD_EPS) out.push(p)
  }
  return out
}

export function warpSubPaths(subs: SubPath[], warp: WarpFn, tolMM: number): SubPath[] {
  return subs
    .map((sub) => {
      let pts = warpPolyline(sub.pts, warp, tolMM)
      if (sub.closed && pts.length > 2) {
        const first = pts[0]!
        const last = pts[pts.length - 1]!
        // seam closure: snap the final vertex onto the start before Z
        if (Math.hypot(first.x - last.x, first.y - last.y) <= WELD_EPS) pts = pts.slice(0, -1)
      }
      return { pts, closed: sub.closed }
    })
    .filter((sub) => sub.pts.length > 1)
}

/** Polyline subpaths → L-only path data (the only place polylines become paths). */
export function subPathsToD(subs: SubPath[]): string {
  const parts: string[] = []
  for (const sub of subs) {
    const [first, ...rest] = sub.pts
    if (!first) continue
    parts.push(`M ${fmt(first.x)} ${fmt(first.y)}`)
    for (const p of rest) parts.push(`L ${fmt(p.x)} ${fmt(p.y)}`)
    if (sub.closed) parts.push('Z')
  }
  return parts.join(' ')
}
