import { describe, expect, it } from 'vitest'
import { makeRepeatRowLayer } from '../model/types'
import { compileRepeatRow } from './repeatRow'

describe('compileRepeatRow', () => {
  it('count 1 sits at the row centre', () => {
    const out = compileRepeatRow(makeRepeatRowLayer({ count: 1, xMM: 3, yMM: 7 }))
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    expect(shape.transforms).toHaveLength(1)
    expect(shape.transforms[0]).toMatchObject({ dx: 3, dy: 7, rotateDeg: 0, mirrorX: false })
  })

  it('count N spreads across the span with ends on the extremes', () => {
    const out = compileRepeatRow(makeRepeatRowLayer({ count: 5, xMM: 0, yMM: 6, widthMM: 40 }))
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    const xs = shape.transforms.map((t) => t.dx)
    expect(xs).toEqual([-20, -10, 0, 10, 20])
    expect(shape.transforms.every((t) => t.dy === 6)).toBe(true)
  })

  it('alternateFlip mirrors every second instance', () => {
    const out = compileRepeatRow(makeRepeatRowLayer({ count: 4, alternateFlip: true }))
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    expect(shape.transforms.map((t) => t.mirrorX)).toEqual([false, true, false, true])
  })

  it('def scale carries the motif size', () => {
    const out = compileRepeatRow(makeRepeatRowLayer({ sizeMM: 2.5 }))
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    expect(shape.def.scale).toBe(2.5)
  })

  it('two rows split around the row centre with stagger and flip', () => {
    const out = compileRepeatRow(
      makeRepeatRowLayer({
        count: 3, xMM: 0, yMM: 5, widthMM: 20, rows: 2, rowGapMM: 4,
        staggerRow2: true, flipRow2: true,
      }),
    )
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    expect(shape.transforms).toHaveLength(6)
    const row1 = shape.transforms.slice(0, 3)
    const row2 = shape.transforms.slice(3)
    expect(row1.map((t) => t.dy)).toEqual([3, 3, 3])
    expect(row2.map((t) => t.dy)).toEqual([7, 7, 7])
    // stagger: row 2 shifted by half the 10mm pitch
    expect(row1.map((t) => t.dx)).toEqual([-10, 0, 10])
    expect(row2.map((t) => t.dx)).toEqual([-5, 5, 15])
    // flip: every row-2 instance mirrored
    expect(row1.every((t) => !t.mirrorX)).toBe(true)
    expect(row2.every((t) => t.mirrorX)).toBe(true)
  })

  it('flipRow2 composes with alternateFlip as XOR', () => {
    const out = compileRepeatRow(
      makeRepeatRowLayer({ count: 2, widthMM: 10, rows: 2, alternateFlip: true, flipRow2: true, staggerRow2: false }),
    )
    const shape = out.shapes[0]!
    if (shape.kind !== 'instanced') throw new Error('expected instanced')
    expect(shape.transforms.map((t) => t.mirrorX)).toEqual([false, true, true, false])
  })

  it('unknown motif warns instead of crashing', () => {
    const out = compileRepeatRow(
      makeRepeatRowLayer({ source: { kind: 'builtin', motifId: 'no-such-motif' } }),
    )
    expect(out.shapes).toEqual([])
    expect(out.warnings.join(' ')).toMatch(/no-such-motif/)
  })
})
