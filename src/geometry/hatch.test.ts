import { describe, expect, it } from 'vitest'
import { makeHatchLayer } from '../model/types'
import { compileHatch } from './hatch'

const W = 50
const H = 22

function stripes(layer = makeHatchLayer()) {
  const out = compileHatch(layer, W, H)
  const shape = out.shapes[0]
  if (!shape || shape.kind !== 'path') return { out, segs: [] as [number, number, number, number][] }
  const segs = [...shape.d.matchAll(/M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+)/g)].map(
    (m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] as [number, number, number, number],
  )
  return { out, segs }
}

describe('compileHatch', () => {
  it('vertical stripes (0°) fit the inset region at the pitch', () => {
    const { out, segs } = stripes(makeHatchLayer({ angleDeg: 0, pitchMM: 2, insetMM: 1 }))
    expect(out.warnings).toEqual([])
    // region is 48 wide; stripes at 2mm pitch centred on 0 → ~23 fit inside
    expect(segs.length).toBeGreaterThan(20)
    expect(segs.length).toBeLessThan(25)
    for (const [x1, y1, x2, y2] of segs) {
      expect(x1).toBeCloseTo(x2, 9) // vertical
      expect(Math.min(y1, y2)).toBeCloseTo(-10, 9) // spans the region height
      expect(Math.max(y1, y2)).toBeCloseTo(10, 9)
    }
    // consecutive stripes sit one pitch apart
    const xs = segs.map(([x]) => x).sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeCloseTo(2, 9)
  })

  it('horizontal stripes (90°) span the region width', () => {
    const { segs } = stripes(makeHatchLayer({ angleDeg: 90, pitchMM: 2, insetMM: 1 }))
    for (const [x1, y1, , y2] of segs) {
      expect(y1).toBeCloseTo(y2, 9)
      expect(Math.abs(x1)).toBeCloseTo(24, 9)
    }
  })

  it('45° stripe endpoints land on the region boundary', () => {
    const { segs } = stripes(makeHatchLayer({ angleDeg: 45, pitchMM: 2, insetMM: 1 }))
    expect(segs.length).toBeGreaterThan(10)
    const onBoundary = (x: number, y: number) =>
      Math.abs(Math.abs(x) - 24) < 1e-6 || Math.abs(Math.abs(y) - 10) < 1e-6
    for (const [x1, y1, x2, y2] of segs) {
      expect(onBoundary(x1, y1)).toBe(true)
      expect(onBoundary(x2, y2)).toBe(true)
      // direction is 45°
      expect(Math.abs(Math.abs(x2 - x1) - Math.abs(y2 - y1))).toBeLessThan(1e-6)
    }
  })

  it('rect area hatches the band, not the label', () => {
    const { segs } = stripes(
      makeHatchLayer({ area: 'rect', xMM: 5, yMM: 3, widthMM: 10, heightMM: 4, angleDeg: 0, pitchMM: 1 }),
    )
    for (const [x1, y1, , y2] of segs) {
      expect(x1).toBeGreaterThanOrEqual(0 - 1e-9)
      expect(x1).toBeLessThanOrEqual(10 + 1e-9)
      expect(Math.min(y1, y2)).toBeCloseTo(1, 9)
      expect(Math.max(y1, y2)).toBeCloseTo(5, 9)
    }
  })

  it('border mode leaves the inner rect clear (a hatched frame)', () => {
    // 0° vertical stripes over a frame: insetMM 1, band 3 → inner hole is the
    // rect [-24,24]×[-10,10] shrunk by 3 = [-21,21]×[-7,7]. A stripe passing
    // through the hole splits into a top piece and a bottom piece.
    const { segs } = stripes(
      makeHatchLayer({ area: 'border', angleDeg: 0, pitchMM: 2, insetMM: 1, bandMM: 3 }),
    )
    // find a stripe near x=0 (well inside the hole horizontally)
    const central = segs.filter(([x]) => Math.abs(x) < 20)
    expect(central.length).toBeGreaterThan(0)
    // each such stripe must be split: no segment crosses the hole interior
    for (const [, y1, , y2] of central) {
      const lo = Math.min(y1, y2)
      const hi = Math.max(y1, y2)
      // a piece is either entirely above the hole (hi ≤ -7) or below (lo ≥ 7)
      expect(hi <= -7 + 1e-6 || lo >= 7 - 1e-6).toBe(true)
    }
    // and both a top piece and a bottom piece exist for a central stripe
    const oneX = central[0]![0]
    const atX = central.filter(([x]) => Math.abs(x - oneX) < 1e-6)
    expect(atX.length).toBe(2)
  })

  it('a frame band wide enough to fill the middle degrades to a solid fill', () => {
    const { segs } = stripes(
      makeHatchLayer({ area: 'border', angleDeg: 0, pitchMM: 2, insetMM: 1, bandMM: 20 }),
    )
    // no hole: a central stripe is one unbroken piece spanning the height
    const central = segs.filter(([x]) => Math.abs(x) < 5)
    for (const [, y1, , y2] of central) {
      expect(Math.min(y1, y2)).toBeCloseTo(-10, 6)
      expect(Math.max(y1, y2)).toBeCloseTo(10, 6)
    }
  })

  it('carries the layer cap into the paint', () => {
    const out = compileHatch(makeHatchLayer({ cap: 'square' }), W, H)
    const shape = out.shapes[0]!
    if (shape.kind !== 'path') throw new Error('expected path')
    expect(shape.paint.stroke?.cap).toBe('square')
  })

  it('an empty region warns instead of crashing', () => {
    const out = compileHatch(makeHatchLayer({ insetMM: 30 }), W, H)
    expect(out.shapes).toEqual([])
    expect(out.warnings.join(' ')).toMatch(/no area/)
  })
})
