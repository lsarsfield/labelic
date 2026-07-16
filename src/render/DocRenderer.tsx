import { memo, useEffect } from 'react'
import type { LabelDoc, Layer } from '../model/types'
import { GROUND_WEFT_INDEX, isLocalFontId } from '../model/types'
import { compileLayer, INTERACTIVE_TOLERANCE_MM, type CompileCtx } from '../geometry/compile'
import { textLineWidthMM } from '../geometry/textLine'
import { ensureFontLoaded, getLoadedFont } from '../io/fonts'
import { ensureLocalFontsResolved } from '../io/localFonts'
import { ensureSvgParsed, getSvgAsset } from '../io/svgAssets'
import { useLabel } from '../state/store'
import { useViewport } from '../state/viewport'
import { PlaceholderRenderer } from './layers/PlaceholderRenderer'
import { ShapesRenderer } from './layers/ShapesRenderer'

/** The weft (or ground) thread hex a layer is woven in. */
export function layerHex(doc: LabelDoc, layer: Layer): string {
  if (layer.weftIndex === GROUND_WEFT_INDEX) return doc.weave.warp.hex
  const weft = doc.weave.wefts[layer.weftIndex] ?? doc.weave.wefts[0]
  return weft ? weft.hex : doc.weave.warp.hex
}

export function DocRenderer() {
  const doc = useLabel((s) => s.doc)
  const assetsRevision = useLabel((s) => s.assetsRevision)
  const fontsRevision = useLabel((s) => s.fontsRevision)

  // Kick lazy font loads / SVG parses for any layer that needs one; the
  // revision bump on completion recompiles the affected layers. Local-font
  // references get one silent resolution attempt (works without a prompt
  // once permission was granted in a past session).
  useEffect(() => {
    for (const layer of doc.layers) {
      if (layer.type === 'textLine') {
        if (isLocalFontId(layer.fontId)) ensureLocalFontsResolved(doc)
        else ensureFontLoaded(layer.fontId, doc)
      }
      if ((layer.type === 'motif' || layer.type === 'repeatRow') && layer.source.kind === 'asset') {
        ensureSvgParsed(layer.source.assetId, doc)
      }
    }
  }, [doc, fontsRevision, assetsRevision])

  const ctx: CompileCtx = {
    widthMM: doc.widthMM,
    heightMM: doc.heightMM,
    endsPerMM: doc.weave.endsPerMM,
    picksPerMM: doc.weave.picksPerMM,
    toleranceMM: INTERACTIVE_TOLERANCE_MM,
    assetsRevision,
    fontsRevision,
    getFont: getLoadedFont,
    getSvgAsset,
  }
  return (
    <>
      {doc.layers.map((layer) => (
        <LayerGroup key={layer.id} layer={layer} ctx={ctx} hex={layerHex(doc, layer)} />
      ))}
    </>
  )
}

/**
 * One <g> per layer: a generous transparent hit rect for selection plus the
 * compiled geometry (pointer-events off — the hit rect is the only click
 * target), colored by the layer's thread.
 */
const LayerGroup = memo(
  function LayerGroup({ layer, ctx, hex }: { layer: Layer; ctx: CompileCtx; hex: string }) {
    if (!layer.visible) return null
    const compiled = compileLayer(layer, ctx)
    const hasShapes = compiled.shapes.length > 0
    return (
      <g data-layer-id={layer.id} style={{ color: hex }}>
        <HitRect layer={layer} />
        <g pointerEvents="none">
          {hasShapes ? (
            <ShapesRenderer layerId={layer.id} compiled={compiled} />
          ) : (
            <PlaceholderRenderer layer={layer} />
          )}
        </g>
      </g>
    )
  },
  (prev, next) =>
    prev.layer === next.layer &&
    prev.hex === next.hex &&
    prev.ctx.widthMM === next.ctx.widthMM &&
    prev.ctx.heightMM === next.ctx.heightMM &&
    prev.ctx.endsPerMM === next.ctx.endsPerMM &&
    prev.ctx.picksPerMM === next.ctx.picksPerMM &&
    prev.ctx.assetsRevision === next.ctx.assetsRevision &&
    prev.ctx.fontsRevision === next.ctx.fontsRevision,
)

export interface BoundsMM {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Approximate axis-aligned bounds of a layer, for hit-testing, selection
 * highlights, and handles. Fast and font-aware when the font has loaded
 * (falls back to a per-glyph width estimate while it hasn't).
 */
export function layerBoundsMM(layer: Layer, labelWidthMM: number, labelHeightMM: number): BoundsMM {
  switch (layer.type) {
    case 'textLine': {
      const font = getLoadedFont(layer.fontId)
      const w = font ? textLineWidthMM(layer, font) : layer.text.length * layer.sizeMM * 0.6
      const x0 =
        layer.anchorAlign === 'left'
          ? layer.xMM
          : layer.anchorAlign === 'right'
            ? layer.xMM - w
            : layer.xMM - w / 2
      const up = Math.max(0, layer.archMM)
      const down = Math.max(0, -layer.archMM)
      return {
        x: x0,
        y: layer.yMM - 1.05 * layer.sizeMM - up,
        w,
        h: 1.45 * layer.sizeMM + up + down,
      }
    }
    case 'motif': {
      const half = (layer.sizeMM / 2) * 1.25 // motifs are unit-height; pad for wide/rotated ones
      return { x: layer.xMM - half, y: layer.yMM - half, w: half * 2, h: half * 2 }
    }
    case 'border': {
      const l = -labelWidthMM / 2 + layer.insetMM
      const t = -labelHeightMM / 2 + layer.insetMM
      const pad = Math.max(layer.unitMM * 0.4, layer.strokeMM) + 0.3
      return { x: l - pad, y: t - pad, w: labelWidthMM - 2 * layer.insetMM + 2 * pad, h: labelHeightMM - 2 * layer.insetMM + 2 * pad }
    }
    case 'repeatRow': {
      const w = (layer.count > 1 ? layer.widthMM : 0) + layer.sizeMM * 1.25
      const h = layer.sizeMM * 1.25
      return { x: layer.xMM - w / 2, y: layer.yMM - h / 2, w, h }
    }
  }
}

/** Band thickness of a border's hit ring (clicks in the middle fall through). */
function borderRingInner(layer: Extract<Layer, { type: 'border' }>, b: BoundsMM): BoundsMM | null {
  const t = 2 * (Math.max(layer.unitMM * 0.4, layer.strokeMM) + 0.9)
  const inner = { x: b.x + t, y: b.y + t, w: b.w - 2 * t, h: b.h - 2 * t }
  return inner.w > 2 && inner.h > 2 ? inner : null
}

const HIT_PAD_MM = 0.35

function HitRect({ layer }: { layer: Layer }) {
  const select = useLabel((s) => s.select)
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const b = layerBoundsMM(layer, widthMM, heightMM)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || useViewport.getState().spaceDown) return
    e.stopPropagation()
    select(layer.id)
  }

  if (layer.type === 'border') {
    const inner = borderRingInner(layer, b)
    if (inner) {
      const d =
        `M ${b.x - HIT_PAD_MM} ${b.y - HIT_PAD_MM} h ${b.w + 2 * HIT_PAD_MM} v ${b.h + 2 * HIT_PAD_MM} h ${-(b.w + 2 * HIT_PAD_MM)} Z ` +
        `M ${inner.x} ${inner.y} h ${inner.w} v ${inner.h} h ${-inner.w} Z`
      return <path d={d} fillRule="evenodd" fill="transparent" stroke="none" onPointerDown={onPointerDown} />
    }
  }
  return (
    <rect
      x={b.x - HIT_PAD_MM}
      y={b.y - HIT_PAD_MM}
      width={b.w + 2 * HIT_PAD_MM}
      height={b.h + 2 * HIT_PAD_MM}
      fill="transparent"
      stroke="none"
      onPointerDown={onPointerDown}
    />
  )
}
