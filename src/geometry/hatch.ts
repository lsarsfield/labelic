import type { HatchLayer } from '../model/types'
import { DEG2RAD } from './angle'
import { fmt } from './format'
import type { CompiledLayer } from './shapes'
import { strokePaint } from './shapes'

/**
 * Parallel stripes at any angle filling a region — the cartesian descendant of
 * Buttonic's radial hatch. Woven, this is pinstriping, twill shading, accent
 * bands, and (in `border` mode) a hatched frame around the label. Pure
 * line-rect intersection math (slab clipping); no boolean libraries.
 *
 * `angleDeg` is the stripe direction, clockwise from vertical: 0 = warp-wise
 * stripes, 90 = horizontal picks-wise stripes.
 */

const MIN_PITCH_MM = 0.3
const MAX_STRIPES = 4000

interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Clip the infinite line through (px,py) along (ux,uy) to a rect. */
function slabClip(
  px: number,
  py: number,
  ux: number,
  uy: number,
  r: Rect,
): [number, number] | null {
  let tMin = -Infinity
  let tMax = Infinity
  if (Math.abs(ux) > 1e-12) {
    const ta = (r.x0 - px) / ux
    const tb = (r.x1 - px) / ux
    tMin = Math.max(tMin, Math.min(ta, tb))
    tMax = Math.min(tMax, Math.max(ta, tb))
  } else if (px < r.x0 || px > r.x1) {
    return null
  }
  if (Math.abs(uy) > 1e-12) {
    const ta = (r.y0 - py) / uy
    const tb = (r.y1 - py) / uy
    tMin = Math.max(tMin, Math.min(ta, tb))
    tMax = Math.min(tMax, Math.max(ta, tb))
  } else if (py < r.y0 || py > r.y1) {
    return null
  }
  return tMax > tMin ? [tMin, tMax] : null
}

const rectHasArea = (r: Rect): boolean => r.x1 - r.x0 > 0 && r.y1 - r.y0 > 0

export function compileHatch(
  layer: HatchLayer,
  labelWidthMM: number,
  labelHeightMM: number,
): CompiledLayer {
  // The outer region the stripes span, and (border mode only) the inner hole
  // they leave clear.
  let outer: Rect
  let hole: Rect | null = null
  if (layer.area === 'rect') {
    outer = {
      x0: layer.xMM - layer.widthMM / 2,
      y0: layer.yMM - layer.heightMM / 2,
      x1: layer.xMM + layer.widthMM / 2,
      y1: layer.yMM + layer.heightMM / 2,
    }
  } else {
    outer = {
      x0: -labelWidthMM / 2 + layer.insetMM,
      y0: -labelHeightMM / 2 + layer.insetMM,
      x1: labelWidthMM / 2 - layer.insetMM,
      y1: labelHeightMM / 2 - layer.insetMM,
    }
    if (layer.area === 'border') {
      const band = Math.max(0.2, layer.bandMM)
      const inner: Rect = {
        x0: outer.x0 + band,
        y0: outer.y0 + band,
        x1: outer.x1 - band,
        y1: outer.y1 - band,
      }
      // if the band is thick enough to swallow the middle, it's just a fill
      if (rectHasArea(inner)) hole = inner
    }
  }
  if (!rectHasArea(outer)) {
    return { shapes: [], warnings: ['Hatch region has no area.'] }
  }

  const pitch = Math.max(MIN_PITCH_MM, layer.pitchMM)
  const rad = layer.angleDeg * DEG2RAD
  // stripe direction (clockwise from vertical, y-down screen)
  const ux = Math.sin(rad)
  const uy = Math.cos(rad)
  // normal, along which stripes repeat
  const nx = uy
  const ny = -ux

  // project the outer corners onto the normal to find the offset range
  const cx = (outer.x0 + outer.x1) / 2
  const cy = (outer.y0 + outer.y1) / 2
  let oMin = Infinity
  let oMax = -Infinity
  for (const [px, py] of [
    [outer.x0, outer.y0],
    [outer.x1, outer.y0],
    [outer.x1, outer.y1],
    [outer.x0, outer.y1],
  ] as const) {
    const o = (px - cx) * nx + (py - cy) * ny
    oMin = Math.min(oMin, o)
    oMax = Math.max(oMax, o)
  }

  const first = Math.ceil((oMin + layer.strokeMM / 2) / pitch)
  const last = Math.floor((oMax - layer.strokeMM / 2) / pitch)
  if (last - first + 1 > MAX_STRIPES) {
    return {
      shapes: [],
      warnings: [`Hatch would need ${last - first + 1} stripes — raise the pitch.`],
    }
  }

  const seg = (px: number, py: number, a: number, b: number) =>
    `M ${fmt(px + ux * a)} ${fmt(py + uy * a)} L ${fmt(px + ux * b)} ${fmt(py + uy * b)}`

  const parts: string[] = []
  for (let k = first; k <= last; k++) {
    const o = k * pitch
    const px = cx + nx * o
    const py = cy + ny * o
    const out = slabClip(px, py, ux, uy, outer)
    if (!out) continue
    const [tMin, tMax] = out

    if (!hole) {
      parts.push(seg(px, py, tMin, tMax))
      continue
    }
    // frame mode: subtract the inner hole span, leaving up to two pieces
    const inner = slabClip(px, py, ux, uy, hole)
    if (!inner) {
      parts.push(seg(px, py, tMin, tMax))
      continue
    }
    if (inner[0] - tMin > 1e-9) parts.push(seg(px, py, tMin, inner[0]))
    if (tMax - inner[1] > 1e-9) parts.push(seg(px, py, inner[1], tMax))
  }

  if (parts.length === 0) {
    return { shapes: [], warnings: ['Hatch region is too small for its pitch.'] }
  }
  return {
    shapes: [{ kind: 'path', d: parts.join(' '), paint: strokePaint(layer.strokeMM, layer.cap) }],
    warnings: [],
  }
}
