import type { RepeatRowLayer } from '../model/types'
import { getBuiltinMotif } from './motifs/builtins'
import type { ParsedSvgAsset, UnitMotifPath } from './svgAsset'
import { assetToUnitMotif } from './svgAsset'
import type { CompiledLayer, InstanceTransform, Shape } from './shapes'
import { fillPaint, strokePaint } from './shapes'

/**
 * A row — or a staggered pair of rows — of a repeated small motif: `count`
 * instances spread across `widthMM`, centred on (xMM, yMM). Count 1 sits at
 * the centre; otherwise the end instances sit on the row's extremes
 * (pitch = width / (count − 1)). Two rows with stagger + flip give the
 * classic herringbone band, straight from Buttonic's repeat vocabulary.
 */
export function compileRepeatRow(
  layer: RepeatRowLayer,
  getSvgAsset: (assetId: string) => ParsedSvgAsset | null = () => null,
): CompiledLayer {
  const warnings: string[] = []
  const count = Math.max(1, Math.round(layer.count))

  let motifPaths: UnitMotifPath[]
  if (layer.source.kind === 'asset') {
    if (!layer.source.assetId) {
      return { shapes: [], warnings: ['Choose or upload an SVG.'] }
    }
    const asset = getSvgAsset(layer.source.assetId)
    if (!asset) return { shapes: [], warnings: ['Parsing SVG…'] }
    motifPaths = assetToUnitMotif(asset)
    if (motifPaths.length === 0) {
      return { shapes: [], warnings: ['The SVG contains no drawable geometry.'] }
    }
  } else {
    const motif = getBuiltinMotif(layer.source.motifId)
    if (!motif) {
      return { shapes: [], warnings: [`Unknown motif "${layer.source.motifId}".`] }
    }
    motifPaths = [{ d: motif.d, paintType: motif.paintType }]
  }

  const pitch = count === 1 ? 0 : layer.widthMM / (count - 1)
  const x0 = count === 1 ? layer.xMM : layer.xMM - layer.widthMM / 2
  const rowYs =
    layer.rows === 2
      ? [layer.yMM - layer.rowGapMM / 2, layer.yMM + layer.rowGapMM / 2]
      : [layer.yMM]

  const transforms: InstanceTransform[] = rowYs.flatMap((y, rowIdx) => {
    const isRow2 = rowIdx === 1
    const xShift = isRow2 && layer.staggerRow2 && count > 1 ? pitch / 2 : 0
    return Array.from({ length: count }, (_, k) => ({
      rotateDeg: 0,
      dx: x0 + k * pitch + xShift,
      dy: y,
      mirrorX: (layer.alternateFlip && k % 2 === 1) !== (isRow2 && layer.flipRow2),
    }))
  })

  const shapes: Shape[] = motifPaths.map((mp) => ({
    kind: 'instanced',
    def: { d: mp.d, dx: 0, dy: 0, rotateDeg: 0, scale: Math.max(0.01, layer.sizeMM), flipY: 1 },
    paint: mp.paintType === 'fill' ? fillPaint() : strokePaint(layer.strokeMM, layer.cap, layer.join),
    transforms,
  }))
  return { shapes, warnings }
}
