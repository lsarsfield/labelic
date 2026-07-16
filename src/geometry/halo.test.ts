import { describe, expect, it } from 'vitest'
import type { Shape } from './shapes'
import { fillPaint, strokePaint } from './shapes'
import { dilatedShapes, haloOf } from './halo'

describe('dilatedShapes', () => {
  it('fattens stroked shapes by 2·halo with round ends', () => {
    const line: Shape = { kind: 'line', x1: 0, y1: 0, x2: 5, y2: 0, paint: strokePaint(0.4, 'butt') }
    const [d] = dilatedShapes([line], 0.8)
    expect(d!.paint.stroke).toEqual({ widthMM: 2, cap: 'round', join: 'round' })
    expect(d!.paint.fill).toBe(false)
  })

  it('gives filled shapes a fat stroke so the silhouette grows outward', () => {
    const path: Shape = { kind: 'path', d: 'M 0 0 L 1 0 L 1 1 Z', paint: fillPaint() }
    const [d] = dilatedShapes([path], 0.5)
    expect(d!.paint.fill).toBe(true)
    expect(d!.paint.stroke).toEqual({ widthMM: 1, cap: 'round', join: 'round' })
  })

  it('leaves geometry untouched — only paint changes', () => {
    const line: Shape = { kind: 'line', x1: 0, y1: 0, x2: 5, y2: 0, paint: strokePaint(0.4) }
    const [d] = dilatedShapes([line], 0.8)
    if (d!.kind !== 'line') throw new Error('expected line')
    expect(d!.x2).toBe(5)
  })
})

describe('haloOf', () => {
  it('reads haloMM when positive, 0 otherwise', () => {
    expect(haloOf({ haloMM: 1.5 })).toBe(1.5)
    expect(haloOf({ haloMM: 0 })).toBe(0)
    expect(haloOf({})).toBe(0)
  })
})
