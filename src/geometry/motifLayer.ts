import type { MotifLayer } from '../model/types'
import { mul, rotateThenTranslate, scaling, translation } from './mat2d'
import { getBuiltinMotif } from './motifs/builtins'
import { parsePathData, segsToD, transformSegs } from './pathData'
import type { ParsedSvgAsset } from './svgAsset'
import type { CompiledLayer, Shape } from './shapes'
import { fillPaint, strokePaint } from './shapes'

/**
 * A single motif or imported SVG placed on the label: centred on (xMM, yMM),
 * scaled to sizeMM (motif height), rotated, optionally mirrored.
 */
export function compileMotif(
  layer: MotifLayer,
  getSvgAsset: (assetId: string) => ParsedSvgAsset | null = () => null,
): CompiledLayer {
  const sx = layer.mirrorX ? -layer.sizeMM : layer.sizeMM

  if (layer.source.kind === 'builtin') {
    const motif = getBuiltinMotif(layer.source.motifId)
    if (!motif) {
      return { shapes: [], warnings: [`Unknown motif "${layer.source.motifId}".`] }
    }
    // Motifs live in a unit box centred on the origin (height 1 = sizeMM), so
    // a bare scale-rotate-translate places one.
    const m = mul(
      rotateThenTranslate(layer.rotationDeg, layer.xMM, layer.yMM),
      scaling(sx, layer.sizeMM),
    )
    return {
      shapes: [
        {
          kind: 'path',
          d: segsToD(transformSegs(parsePathData(motif.d), m)),
          paint: motif.paintType === 'stroke' ? strokePaint(layer.strokeMM, 'round') : fillPaint(),
        },
      ],
      warnings: [],
    }
  }

  const asset = getSvgAsset(layer.source.assetId)
  if (!asset) return { shapes: [], warnings: ['Parsing SVG…'] }
  if (asset.paths.length === 0 || asset.box.w <= 0 || asset.box.h <= 0) {
    return { shapes: [], warnings: ['The SVG contains no drawable geometry.'] }
  }
  // fit the LONGER bbox side to sizeMM, centred on (xMM, yMM)
  const s = layer.sizeMM / Math.max(asset.box.w, asset.box.h)
  const cx = asset.box.x + asset.box.w / 2
  const cy = asset.box.y + asset.box.h / 2
  const m = mul(
    rotateThenTranslate(layer.rotationDeg, layer.xMM, layer.yMM),
    mul(scaling(layer.mirrorX ? -s : s, s), translation(-cx, -cy)),
  )
  const shapes: Shape[] = asset.paths.map((p) => ({
    kind: 'path',
    d: segsToD(transformSegs(p.segs, m)),
    fillRule: p.fillRule,
    paint: p.stroke && !p.fill ? strokePaint(layer.strokeMM, 'round') : fillPaint(),
  }))
  return { shapes, warnings: [] }
}
