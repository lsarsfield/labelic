import type { WeaveSpec } from '../model/types'

/**
 * The weave grid — the label as a bitmap of threads. One byte per cell:
 * 0 = ground (warp shows), 1..N = weft palette index + 1. The vector design
 * is rasterized per layer, box-averaged into cells, and cells are claimed in
 * paint order (topmost layer wins). Ground-sentinel layers claim 0 — the
 * weave-native knockout.
 *
 * Pure data + math, no DOM: everything here is node-testable, and the weave
 * draft export is just this array written out 1 px per cell.
 */

export interface WeaveGrid {
  cols: number
  rows: number
  /** Physical cell size — cells are NOT square (ends/mm ≠ picks/mm). */
  cellWMM: number
  cellHMM: number
  /** Row-major; 0 = ground, k = weft index k−1. */
  data: Uint8Array
}

export function gridDims(
  weave: Pick<WeaveSpec, 'endsPerMM' | 'picksPerMM'>,
  widthMM: number,
  heightMM: number,
): { cols: number; rows: number; cellWMM: number; cellHMM: number } {
  const cols = Math.max(1, Math.round(widthMM * weave.endsPerMM))
  const rows = Math.max(1, Math.round(heightMM * weave.picksPerMM))
  return { cols, rows, cellWMM: widthMM / cols, cellHMM: heightMM / rows }
}

export function makeGrid(
  weave: Pick<WeaveSpec, 'endsPerMM' | 'picksPerMM'>,
  widthMM: number,
  heightMM: number,
): WeaveGrid {
  const { cols, rows, cellWMM, cellHMM } = gridDims(weave, widthMM, heightMM)
  return { cols, rows, cellWMM, cellHMM, data: new Uint8Array(cols * rows) }
}

/**
 * Average a uniform-scale alpha raster into the (non-square) cell partition.
 * One O(raster) pass: each raster pixel belongs to exactly one cell
 * (floor partition), so coverage is the exact mean of its pixels. The raster
 * is supersampled (≥ 2 px per cell each axis), which is what makes the 0.5
 * threshold stable.
 */
export function boxAverageAlpha(
  alpha: Uint8ClampedArray,
  rasterW: number,
  rasterH: number,
  cols: number,
  rows: number,
): Float32Array {
  const sums = new Float64Array(cols * rows)
  const counts = new Float64Array(cols * rows)
  // precompute pixel → cell index maps
  const colOf = new Int32Array(rasterW)
  for (let x = 0; x < rasterW; x++) colOf[x] = Math.min(cols - 1, Math.floor((x * cols) / rasterW))
  const rowOf = new Int32Array(rasterH)
  for (let y = 0; y < rasterH; y++) rowOf[y] = Math.min(rows - 1, Math.floor((y * rows) / rasterH))

  for (let y = 0; y < rasterH; y++) {
    const rowBase = rowOf[y]! * cols
    const rasterBase = y * rasterW
    for (let x = 0; x < rasterW; x++) {
      const cell = rowBase + colOf[x]!
      sums[cell]! += alpha[rasterBase + x]!
      counts[cell]! += 1
    }
  }
  const coverage = new Float32Array(cols * rows)
  for (let i = 0; i < coverage.length; i++) {
    coverage[i] = counts[i]! > 0 ? sums[i]! / (counts[i]! * 255) : 0
  }
  return coverage
}

export const CLAIM_THRESHOLD = 0.5

/**
 * Claim cells whose coverage clears the threshold. Later layers overwrite —
 * including claims of 0 (ground knockouts).
 */
export function claimFromCoverage(
  grid: WeaveGrid,
  coverage: Float32Array,
  paletteValue: number,
  threshold = CLAIM_THRESHOLD,
): void {
  const { data } = grid
  for (let i = 0; i < data.length; i++) {
    if (coverage[i]! >= threshold) data[i] = paletteValue
  }
}

/**
 * Deterministic per-cell hash → uint32. Stable across renders (no
 * Math.random anywhere in the painter) so scrubbing a slider never makes
 * threads shimmer. Standard integer mix (Wang-ish).
 */
export function hash2(col: number, row: number, seed: number): number {
  let h = (col * 0x9e3779b1) ^ (row * 0x85ebca6b) ^ (seed * 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  h = (h ^ (h >>> 16)) >>> 0
  return h
}

/** FNV-1a over the grid — the scripted-verification fingerprint. */
export function gridChecksum(grid: WeaveGrid): string {
  let h = 0x811c9dc5
  const { data } = grid
  for (let i = 0; i < data.length; i++) {
    h ^= data[i]!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `${grid.cols}x${grid.rows}:${h.toString(16)}`
}
