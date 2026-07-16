import type { HatchLayer } from '../model/types'
import { DEG2RAD } from './angle'
import { fmt } from './format'
import type { CompiledLayer } from './shapes'
import { strokePaint } from './shapes'

/**
 * Parallel stripes at any angle filling a rectangular region — the cartesian
 * descendant of Buttonic's radial hatch. Woven, this is pinstriping, twill
 * shading, accent bands. Pure line-rect intersection math (slab clipping);
 * no boolean libraries.
 *
 * `angleDeg` is the stripe direction, clockwise from vertical: 0 = warp-wise
 * stripes, 90 = horizontal picks-wise stripes.
 */

const MIN_PITCH_MM = 0.3
const MAX_STRIPES = 4000

export function compileHatch(
  layer: HatchLayer,
  labelWidthMM: number,
  labelHeightMM: number,
): CompiledLayer {
  const warnings: string[] = []

  let x0: number
  let y0: number
  let x1: number
  let y1: number
  if (layer.area === 'label') {
    x0 = -labelWidthMM / 2 + layer.insetMM
    y0 = -labelHeightMM / 2 + layer.insetMM
    x1 = labelWidthMM / 2 - layer.insetMM
    y1 = labelHeightMM / 2 - layer.insetMM
  } else {
    x0 = layer.xMM - layer.widthMM / 2
    y0 = layer.yMM - layer.heightMM / 2
    x1 = layer.xMM + layer.widthMM / 2
    y1 = layer.yMM + layer.heightMM / 2
  }
  if (x1 - x0 <= 0 || y1 - y0 <= 0) {
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

  // project the region's corners onto the normal to find the offset range
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const corners: [number, number][] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ]
  let oMin = Infinity
  let oMax = -Infinity
  for (const [px, py] of corners) {
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

  const parts: string[] = []
  for (let k = first; k <= last; k++) {
    const o = k * pitch
    // a point on this stripe's centreline
    const px = cx + nx * o
    const py = cy + ny * o
    // slab-clip the infinite line p + t·u against the region
    let tMin = -Infinity
    let tMax = Infinity
    if (Math.abs(ux) > 1e-12) {
      const ta = (x0 - px) / ux
      const tb = (x1 - px) / ux
      tMin = Math.max(tMin, Math.min(ta, tb))
      tMax = Math.min(tMax, Math.max(ta, tb))
    } else if (px < x0 || px > x1) {
      continue
    }
    if (Math.abs(uy) > 1e-12) {
      const ta = (y0 - py) / uy
      const tb = (y1 - py) / uy
      tMin = Math.max(tMin, Math.min(ta, tb))
      tMax = Math.min(tMax, Math.max(ta, tb))
    } else if (py < y0 || py > y1) {
      continue
    }
    if (tMax <= tMin) continue
    parts.push(
      `M ${fmt(px + ux * tMin)} ${fmt(py + uy * tMin)} L ${fmt(px + ux * tMax)} ${fmt(py + uy * tMax)}`,
    )
  }

  if (parts.length === 0) {
    return { shapes: [], warnings: ['Hatch region is too small for its pitch.'] }
  }
  return {
    shapes: [{ kind: 'path', d: parts.join(' '), paint: strokePaint(layer.strokeMM, layer.cap) }],
    warnings,
  }
}
