import type { Layer } from '../../model/types'
import { useLabel } from '../../state/store'
import { useViewport } from '../../state/viewport'
import { layerBoundsMM } from '../DocRenderer'

/**
 * Stand-in for a layer with nothing to draw yet (font still loading, SVG
 * still parsing, empty text): a dashed rect at the layer's bounds so it stays
 * visible and selectable.
 */
export function PlaceholderRenderer({ layer }: { layer: Layer }) {
  const scale = useViewport((s) => s.scale)
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const b = layerBoundsMM(layer, widthMM, heightMM)

  return (
    <rect
      x={b.x}
      y={b.y}
      width={Math.max(b.w, 1)}
      height={Math.max(b.h, 1)}
      fill="none"
      stroke="currentColor"
      strokeOpacity={0.35}
      strokeWidth={2 / scale}
      strokeDasharray={`${6 / scale} ${5 / scale}`}
    />
  )
}
