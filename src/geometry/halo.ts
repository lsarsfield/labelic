import type { Paint, Shape } from './shapes'

/**
 * Halos — the mask system. A layer with `haloMM > 0` claims a ground-woven
 * clearance moat around its silhouette, so hatch/pattern layers below clear
 * away and the content stays readable (Buttonic's keepout semantics, weave-
 * native).
 *
 * Dilation is done by RE-PAINT, not geometry booleans: the same shapes are
 * drawn again with every stroke fattened by 2·halo and every fill given a
 * fat round stroke. The weave sampler rasterizes that dilated pass and
 * claims ground from it; the flat stage and the artwork SVG under-paint it
 * in the warp hex. All three renderers agree by construction.
 */
export function dilatedShapes(shapes: Shape[], haloMM: number): Shape[] {
  return shapes.map((s) => ({ ...s, paint: dilatePaint(s.paint, haloMM) }))
}

function dilatePaint(paint: Paint, haloMM: number): Paint {
  return {
    fill: paint.fill,
    stroke: {
      widthMM: (paint.stroke?.widthMM ?? 0) + 2 * haloMM,
      cap: 'round',
      join: 'round',
    },
  }
}

/** The halo width of a layer, or 0 for types that have none. */
export function haloOf(layer: object): number {
  const halo = (layer as { haloMM?: unknown }).haloMM
  return typeof halo === 'number' && halo > 0 ? halo : 0
}
