import { describe, expect, it } from 'vitest'
import { foldLinesMM, visiblePanelMM } from './folds'

const W = 50
const H = 22

describe('foldLinesMM', () => {
  it('straight cut has no folds', () => {
    expect(foldLinesMM('straight', W, H)).toEqual([])
  })

  it('end fold: two vertical lines, allowance in from each end', () => {
    const lines = foldLinesMM('endFold', W, H)
    expect(lines).toHaveLength(2)
    expect(lines[0]!.x1).toBe(-22)
    expect(lines[1]!.x1).toBe(22)
    expect(lines[0]!.x1).toBe(lines[0]!.x2) // vertical
  })

  it('loop fold: one horizontal line through the middle', () => {
    const lines = foldLinesMM('loopFold', W, H)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ y1: 0, y2: 0 })
  })

  it('centre fold: one vertical line through the middle', () => {
    const lines = foldLinesMM('centreFold', W, H)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ x1: 0, x2: 0 })
  })

  it('mitre fold: two 45° lines at the bottom corners', () => {
    const lines = foldLinesMM('mitreFold', W, H)
    expect(lines).toHaveLength(2)
    for (const l of lines) {
      expect(Math.abs(l.x2 - l.x1)).toBeCloseTo(Math.abs(l.y2 - l.y1), 9) // 45°
    }
  })
})

describe('visiblePanelMM', () => {
  it('straight and mitre show the full face', () => {
    expect(visiblePanelMM('straight', W, H)).toEqual({ x: -25, y: -11, w: 50, h: 22 })
    expect(visiblePanelMM('mitreFold', W, H)).toEqual({ x: -25, y: -11, w: 50, h: 22 })
  })

  it('end fold trims the allowance from both ends', () => {
    expect(visiblePanelMM('endFold', W, H)).toEqual({ x: -22, y: -11, w: 44, h: 22 })
  })

  it('loop fold shows the top half', () => {
    expect(visiblePanelMM('loopFold', W, H)).toEqual({ x: -25, y: -11, w: 50, h: 11 })
  })

  it('centre fold shows the right half', () => {
    expect(visiblePanelMM('centreFold', W, H)).toEqual({ x: 0, y: -11, w: 25, h: 22 })
  })
})
