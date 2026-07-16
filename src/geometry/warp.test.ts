import { describe, expect, it } from 'vitest'
import { flattenSegs, type Pt } from './flatten'
import { parsePathData } from './pathData'
import { subPathsToD, warpPolyline, warpSubPaths, type WarpFn } from './warp'

const TOL = 0.01

describe('flatten', () => {
  it('a straight line stays exactly 2 points', () => {
    const subs = flattenSegs(parsePathData('M 0 0 L 100 0'), 0.001)
    expect(subs).toHaveLength(1)
    expect(subs[0]!.pts).toHaveLength(2)
  })

  it('pathological cubics stay within the chord tolerance', () => {
    // cusp-ish and loop-ish curves
    const cases = [
      'M 0 0 C 100 0 0 100 100 100',
      'M 0 0 C 150 50 -50 50 100 0',
      'M 0 0 C 0 0 100 100 100 100', // degenerate colinear controls
    ]
    for (const d of cases) {
      const tol = 0.05
      const subs = flattenSegs(parsePathData(d), tol)
      const pts = subs[0]!.pts
      // sample the true curve densely and check distance to the polyline
      const seg = parsePathData(d)[1]!
      if (seg.type !== 'C') throw new Error('expected cubic')
      for (let i = 0; i <= 200; i++) {
        const t = i / 200
        const mt = 1 - t
        const x =
          mt * mt * mt * 0 + 3 * mt * mt * t * seg.x1 + 3 * mt * t * t * seg.x2 + t * t * t * seg.x
        const y =
          mt * mt * mt * 0 + 3 * mt * mt * t * seg.y1 + 3 * mt * t * t * seg.y2 + t * t * t * seg.y
        let best = Infinity
        for (let j = 1; j < pts.length; j++) {
          best = Math.min(best, distToSeg({ x, y }, pts[j - 1]!, pts[j]!))
        }
        // chord tolerance plus a small numerical allowance
        expect(best).toBeLessThan(tol * 1.5)
      }
    }
  })
})

function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * A representative non-affine bend: y offset by a parabola in x (the same
 * family as textLine's arch warp). Straight horizontal source segments must
 * densify; the warp keeps vertical segments straight so they never do.
 */
const bend =
  (sag: number, span: number): WarpFn =>
  (p) => ({ x: p.x, y: p.y - sag * (1 - ((2 * p.x) / span - 1) ** 2) })

describe('adaptive warp subdivision', () => {
  it('horizontal source line densifies to within the chord tolerance', () => {
    const warp = bend(6, 100)
    const pts = warpPolyline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      warp,
      TOL,
    )
    expect(pts.length).toBeGreaterThan(8)
    // every warped source midpoint must sit within tol of the polyline
    for (let i = 0; i <= 200; i++) {
      const src = { x: (i / 200) * 100, y: 0 }
      const dst = warp(src)
      let best = Infinity
      for (let j = 1; j < pts.length; j++) {
        best = Math.min(best, distToSeg(dst, pts[j - 1]!, pts[j]!))
      }
      expect(best).toBeLessThan(TOL * 1.5)
    }
  })

  it('vertical source line stays exactly 2 points (the warp keeps it straight)', () => {
    const warp = bend(6, 100)
    const pts = warpPolyline(
      [
        { x: 25, y: 0 },
        { x: 25, y: 20 },
      ],
      warp,
      TOL,
    )
    expect(pts).toHaveLength(2)
  })

  it('closed subpaths stay closed and weld the seam vertex', () => {
    const warp = bend(3, 100)
    const subs = warpSubPaths(
      flattenSegs(parsePathData('M 0 0 L 100 0 L 100 20 L 0 20 Z'), 0.01),
      warp,
      TOL,
    )
    expect(subs).toHaveLength(1)
    expect(subs[0]!.closed).toBe(true)
    const pts = subs[0]!.pts
    const first = pts[0]!
    const last = pts[pts.length - 1]!
    // no duplicate seam vertex: first and last differ (Z closes the gap)
    expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeGreaterThan(1e-6)
    const d = subPathsToD(subs)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('identity warp is a no-op', () => {
    const pts = warpPolyline(
      [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
      ],
      (p) => p,
      TOL,
    )
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ])
  })
})
