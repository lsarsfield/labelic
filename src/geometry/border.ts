import type { BorderLayer } from '../model/types'
import { fmt } from './format'
import type { CompiledLayer, InstanceTransform, Shape } from './shapes'
import { fillPaint, strokePaint } from './shapes'

/**
 * Rectangular frame patterns inset from the label edge.
 *
 * Rules (`keyline`, `doubleRule`) are plain rect paths. Patterned borders
 * walk each side clockwise and instance a unit motif at an integer number of
 * repeats: n = round(len / unitMM), actual pitch len/n — margins symmetric by
 * construction, corners butt at the insets.
 *
 * Unit frame: 1 pattern pitch wide (x −0.5…0.5), centred on the origin,
 * +y pointing INTO the label (the clockwise walk keeps that invariant on all
 * four sides), so a unit authored "bulging −y" bulges outward everywhere.
 */

interface Side {
  /** Start/end of the side's centreline (clockwise walk). */
  x1: number
  y1: number
  x2: number
  y2: number
  lengthMM: number
  rotateDeg: number
}

export function borderSides(
  widthMM: number,
  heightMM: number,
  insetMM: number,
  sides: BorderLayer['sides'],
): Side[] {
  const L = -widthMM / 2 + insetMM
  const R = widthMM / 2 - insetMM
  const T = -heightMM / 2 + insetMM
  const B = heightMM / 2 - insetMM
  if (R <= L || B <= T) return []
  const all: Record<'top' | 'right' | 'bottom' | 'left', Side> = {
    top: { x1: L, y1: T, x2: R, y2: T, lengthMM: R - L, rotateDeg: 0 },
    right: { x1: R, y1: T, x2: R, y2: B, lengthMM: B - T, rotateDeg: 90 },
    bottom: { x1: R, y1: B, x2: L, y2: B, lengthMM: R - L, rotateDeg: 180 },
    left: { x1: L, y1: B, x2: L, y2: T, lengthMM: B - T, rotateDeg: 270 },
  }
  if (sides === 'topBottom') return [all.top, all.bottom]
  if (sides === 'leftRight') return [all.left, all.right]
  return [all.top, all.right, all.bottom, all.left]
}

const rectD = (l: number, t: number, r: number, b: number): string =>
  `M ${fmt(l)} ${fmt(t)} L ${fmt(r)} ${fmt(t)} L ${fmt(r)} ${fmt(b)} L ${fmt(l)} ${fmt(b)} Z`

/** Bezier circle constant. */
const K = 0.5523

interface BorderUnit {
  d: string
  paintType: 'fill' | 'stroke'
}

/**
 * One pattern pitch per unit, authored in the unit frame. Stroke units are
 * drawn with the layer's strokeMM (constant width via the instancing rule);
 * fill units are solid.
 */
export const BORDER_UNITS: Record<
  Exclude<BorderLayer['pattern'], 'keyline' | 'doubleRule'>,
  BorderUnit
> = {
  // running stitch: a dash with symmetric gaps
  dashes: { d: 'M -0.32 0 L 0.32 0', paintType: 'stroke' },
  // bead row: a filled dot (bezier circle, r 0.17)
  dots: {
    d: `M 0 -0.17 C ${fmt(0.17 * K)} -0.17 0.17 ${fmt(-0.17 * K)} 0.17 0 C 0.17 ${fmt(0.17 * K)} ${fmt(0.17 * K)} 0.17 0 0.17 C ${fmt(-0.17 * K)} 0.17 -0.17 ${fmt(0.17 * K)} -0.17 0 C -0.17 ${fmt(-0.17 * K)} ${fmt(-0.17 * K)} -0.17 0 -0.17 Z`,
    paintType: 'fill',
  },
  // one period, apex bulging outward (−y), continuous across units
  zigzag: { d: 'M -0.5 0.14 L 0 -0.14 L 0.5 0.14', paintType: 'stroke' },
  // one shell arc bulging outward, continuous at the baseline
  scallop: { d: 'M -0.5 0 C -0.5 -0.3 0.5 -0.3 0.5 0', paintType: 'stroke' },
  // simplified squared meander hook (discrete per pitch — reads as a key at weave scale)
  greekKey: {
    d: 'M -0.38 0.18 L -0.38 -0.18 L 0.38 -0.18 L 0.38 0.18 L 0.05 0.18 L 0.05 -0.02 L -0.2 -0.02',
    paintType: 'stroke',
  },
  // one oval link (bezier oval 0.72 × 0.3); alternating overlap reads as chain
  chain: {
    d: `M -0.36 0 C -0.36 ${fmt(-0.15 * K * 2)} ${fmt(-0.36 * K)} -0.15 0 -0.15 C ${fmt(0.36 * K)} -0.15 0.36 ${fmt(-0.15 * K * 2)} 0.36 0 C 0.36 ${fmt(0.15 * K * 2)} ${fmt(0.36 * K)} 0.15 0 0.15 C ${fmt(-0.36 * K)} 0.15 -0.36 ${fmt(0.15 * K * 2)} -0.36 0 Z`,
    paintType: 'stroke',
  },
}

export function compileBorder(
  layer: BorderLayer,
  labelWidthMM: number,
  labelHeightMM: number,
): CompiledLayer {
  const warnings: string[] = []
  const sides = borderSides(labelWidthMM, labelHeightMM, layer.insetMM, layer.sides)
  if (sides.length === 0) {
    return { shapes: [], warnings: ['Border inset swallows the whole label.'] }
  }

  const L = -labelWidthMM / 2 + layer.insetMM
  const R = labelWidthMM / 2 - layer.insetMM
  const T = -labelHeightMM / 2 + layer.insetMM
  const B = labelHeightMM / 2 - layer.insetMM

  if (layer.pattern === 'keyline' || layer.pattern === 'doubleRule') {
    // rules ignore `sides` when partial — a rect only makes sense closed; draw
    // side lines instead when the user asked for top/bottom or left/right
    const shapes: Shape[] = []
    const rules = layer.pattern === 'doubleRule' ? [0, layer.unitMM] : [0]
    for (const extra of rules) {
      const l = L + extra
      const t = T + extra
      const r = R - extra
      const b = B - extra
      if (r <= l || b <= t) {
        warnings.push('The inner rule of the double rule swallows the label.')
        continue
      }
      if (layer.sides === 'all') {
        shapes.push({ kind: 'path', d: rectD(l, t, r, b), paint: strokePaint(layer.strokeMM, 'butt') })
      } else if (layer.sides === 'topBottom') {
        shapes.push({ kind: 'line', x1: l, y1: t, x2: r, y2: t, paint: strokePaint(layer.strokeMM, 'butt') })
        shapes.push({ kind: 'line', x1: l, y1: b, x2: r, y2: b, paint: strokePaint(layer.strokeMM, 'butt') })
      } else {
        shapes.push({ kind: 'line', x1: l, y1: t, x2: l, y2: b, paint: strokePaint(layer.strokeMM, 'butt') })
        shapes.push({ kind: 'line', x1: r, y1: t, x2: r, y2: b, paint: strokePaint(layer.strokeMM, 'butt') })
      }
    }
    return { shapes, warnings }
  }

  const unit = BORDER_UNITS[layer.pattern]
  const unitMM = Math.max(0.2, layer.unitMM)
  const shapes: Shape[] = []
  for (const side of sides) {
    const n = Math.max(1, Math.round(side.lengthMM / unitMM))
    const pitch = side.lengthMM / n
    const ux = (side.x2 - side.x1) / side.lengthMM
    const uy = (side.y2 - side.y1) / side.lengthMM
    const transforms: InstanceTransform[] = Array.from({ length: n }, (_, k) => {
      const along = (k + 0.5) * pitch
      return {
        rotateDeg: side.rotateDeg,
        dx: side.x1 + ux * along,
        dy: side.y1 + uy * along,
        mirrorX: false,
      }
    })
    shapes.push({
      kind: 'instanced',
      def: { d: unit.d, dx: 0, dy: 0, rotateDeg: 0, scale: pitch, flipY: 1 },
      paint: unit.paintType === 'fill' ? fillPaint() : strokePaint(layer.strokeMM, layer.cap, layer.join),
      transforms,
    })
  }
  return { shapes, warnings }
}
