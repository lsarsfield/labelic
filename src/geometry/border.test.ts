import { describe, expect, it } from 'vitest'
import { makeBorderLayer } from '../model/types'
import { borderSides, compileBorder } from './border'

const W = 50
const H = 22

describe('borderSides', () => {
  it('walks clockwise with +y facing into the label on every side', () => {
    const sides = borderSides(W, H, 1.5, 'all')
    expect(sides).toHaveLength(4)
    expect(sides.map((s) => s.rotateDeg)).toEqual([0, 90, 180, 270])
    // top runs left → right along y = −H/2 + inset
    expect(sides[0]).toMatchObject({ x1: -23.5, y1: -9.5, x2: 23.5, y2: -9.5, lengthMM: 47 })
    // right runs top → bottom
    expect(sides[1]).toMatchObject({ x1: 23.5, y1: -9.5, x2: 23.5, y2: 9.5, lengthMM: 19 })
  })

  it('filters to the requested sides', () => {
    expect(borderSides(W, H, 1.5, 'topBottom').map((s) => s.rotateDeg)).toEqual([0, 180])
    expect(borderSides(W, H, 1.5, 'leftRight').map((s) => s.rotateDeg)).toEqual([270, 90])
  })

  it('returns nothing when the inset swallows the label', () => {
    expect(borderSides(W, H, 12, 'all')).toEqual([])
  })
})

describe('compileBorder', () => {
  it('keyline compiles to one closed rect path', () => {
    const out = compileBorder(makeBorderLayer({ pattern: 'keyline' }), W, H)
    expect(out.warnings).toEqual([])
    expect(out.shapes).toHaveLength(1)
    const shape = out.shapes[0]!
    if (shape.kind !== 'path') throw new Error('expected path')
    expect(shape.d.endsWith('Z')).toBe(true)
    expect(shape.paint.stroke).not.toBeNull()
  })

  it('doubleRule nests the second rect one unit inside', () => {
    const out = compileBorder(makeBorderLayer({ pattern: 'doubleRule', insetMM: 1.5, unitMM: 1 }), W, H)
    expect(out.shapes).toHaveLength(2)
    const d0 = (out.shapes[0] as { d: string }).d
    const d1 = (out.shapes[1] as { d: string }).d
    expect(d0).toContain('M -23.5 -9.5')
    expect(d1).toContain('M -22.5 -8.5')
  })

  it('patterned sides fit an integer repeat count with symmetric margins', () => {
    const layer = makeBorderLayer({ pattern: 'dashes', insetMM: 1.5, unitMM: 1.6 })
    const out = compileBorder(layer, W, H)
    expect(out.warnings).toEqual([])
    expect(out.shapes).toHaveLength(4) // one instanced shape per side
    const top = out.shapes[0]!
    if (top.kind !== 'instanced') throw new Error('expected instanced')
    const len = 47
    const n = Math.round(len / 1.6)
    expect(top.transforms).toHaveLength(n)
    const pitch = len / n
    // first instance centred half a pitch in from the corner
    expect(top.transforms[0]!.dx).toBeCloseTo(-23.5 + pitch / 2, 9)
    // last instance mirrors it
    expect(top.transforms[n - 1]!.dx).toBeCloseTo(23.5 - pitch / 2, 9)
    // def carries the pitch as its scale (constant-width strokes divide by it)
    expect(top.def.scale).toBeCloseTo(pitch, 9)
  })

  it('side rotations orient the pattern into the label', () => {
    const out = compileBorder(makeBorderLayer({ pattern: 'zigzag' }), W, H)
    const rotations = out.shapes.map((s) => (s.kind === 'instanced' ? s.transforms[0]!.rotateDeg : -1))
    expect(rotations).toEqual([0, 90, 180, 270])
  })

  it('an all-swallowing inset warns instead of crashing', () => {
    const out = compileBorder(makeBorderLayer({ insetMM: 40 }), W, H)
    expect(out.shapes).toEqual([])
    expect(out.warnings.join(' ')).toMatch(/swallows/)
  })
})
