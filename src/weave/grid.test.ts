import { describe, expect, it } from 'vitest'
import {
  boxAverageAlpha,
  claimFromCoverage,
  gridChecksum,
  gridDims,
  hash2,
  makeGrid,
} from './grid'

const WEAVE = { endsPerMM: 2.4, picksPerMM: 2.8 }

describe('gridDims', () => {
  it('rounds to whole threads and keeps cells covering the label exactly', () => {
    const d = gridDims(WEAVE, 50, 22)
    expect(d.cols).toBe(120)
    expect(d.rows).toBe(62)
    expect(d.cols * d.cellWMM).toBeCloseTo(50, 9)
    expect(d.rows * d.cellHMM).toBeCloseTo(22, 9)
  })

  it('never collapses to zero threads', () => {
    const d = gridDims({ endsPerMM: 0.01, picksPerMM: 0.01 }, 1, 1)
    expect(d.cols).toBe(1)
    expect(d.rows).toBe(1)
  })
})

describe('boxAverageAlpha', () => {
  it('averages exact pixel blocks when the raster divides evenly', () => {
    // 4×2 raster → 2×1 cells: each cell = 2×2 px
    const alpha = new Uint8ClampedArray([255, 255, 0, 0, 255, 255, 0, 0])
    const cov = boxAverageAlpha(alpha, 4, 2, 2, 1)
    expect(cov[0]).toBeCloseTo(1, 6)
    expect(cov[1]).toBeCloseTo(0, 6)
  })

  it('handles fractional partitions: full coverage stays full', () => {
    // 9×5 raster into 4×3 cells — indivisible both ways
    const alpha = new Uint8ClampedArray(45).fill(255)
    const cov = boxAverageAlpha(alpha, 9, 5, 4, 3)
    for (const c of cov) expect(c).toBeCloseTo(1, 6)
  })

  it('half-covered cells land at 0.5', () => {
    // 4×2 raster → 2×1 cells; left cell has its top row filled only
    const alpha = new Uint8ClampedArray([255, 255, 0, 0, 0, 0, 0, 0])
    const cov = boxAverageAlpha(alpha, 4, 2, 2, 1)
    expect(cov[0]).toBeCloseTo(0.5, 6)
    expect(cov[1]).toBeCloseTo(0, 6)
  })
})

describe('claimFromCoverage', () => {
  it('claims at the threshold, skips below, later layers overwrite', () => {
    const grid = makeGrid({ endsPerMM: 1, picksPerMM: 1 }, 3, 1)
    claimFromCoverage(grid, new Float32Array([0.4, 0.5, 1]), 2)
    expect([...grid.data]).toEqual([0, 2, 2])
    claimFromCoverage(grid, new Float32Array([1, 0, 0.6]), 1)
    expect([...grid.data]).toEqual([1, 2, 1])
  })

  it('a ground claim (0) knocks out earlier claims — the reversed-out label', () => {
    const grid = makeGrid({ endsPerMM: 1, picksPerMM: 1 }, 3, 1)
    claimFromCoverage(grid, new Float32Array([1, 1, 1]), 3) // solid weft block
    claimFromCoverage(grid, new Float32Array([0, 1, 0]), 0) // ground text over it
    expect([...grid.data]).toEqual([3, 0, 3])
  })
})

describe('hash2', () => {
  it('is deterministic', () => {
    expect(hash2(17, 4, 2)).toBe(hash2(17, 4, 2))
  })

  it('spreads across cells and seeds', () => {
    const seen = new Set<number>()
    for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) seen.add(hash2(c, r, 1) % 4)
    expect(seen.size).toBe(4) // all four variants show up in an 8×8 patch
    expect(hash2(3, 3, 1)).not.toBe(hash2(3, 3, 2))
  })
})

describe('gridChecksum', () => {
  it('is stable for equal grids and differs when a cell changes', () => {
    const a = makeGrid(WEAVE, 50, 22)
    const b = makeGrid(WEAVE, 50, 22)
    a.data[100] = 2
    b.data[100] = 2
    expect(gridChecksum(a)).toBe(gridChecksum(b))
    b.data[101] = 1
    expect(gridChecksum(a)).not.toBe(gridChecksum(b))
  })
})
