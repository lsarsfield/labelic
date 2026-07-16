import { foldLinesMM } from '../../geometry/folds'
import { useLabel } from '../../state/store'
import { useViewport } from '../../state/viewport'
import { layerBoundsMM } from '../DocRenderer'

/** Safe area inset — keep content this far from edges and folds. */
const SAFE_INSET_MM = 1.5

/**
 * Cartesian guides: label outline, centre crosshair, safe-area rect, fold
 * lines, plus a highlight rect around the selected layer. All strokes are
 * divided by zoom so they stay 1px on screen.
 */
export function Guides() {
  const showGuides = useLabel((s) => s.view.showGuides)
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const fold = useLabel((s) => s.doc.fold)
  const scale = useViewport((s) => s.scale)
  const selected = useLabel((s) => s.doc.layers.find((l) => l.id === s.selection) ?? null)

  const px = (n: number) => n / scale
  const w2 = widthMM / 2
  const h2 = heightMM / 2
  const folds = foldLinesMM(fold, widthMM, heightMM)
  const selBounds = selected ? layerBoundsMM(selected, widthMM, heightMM) : null

  return (
    <g pointerEvents="none">
      {showGuides && (
        <g stroke="var(--guide)" fill="none">
          {/* label edge */}
          <rect x={-w2} y={-h2} width={widthMM} height={heightMM} strokeWidth={px(1)} strokeOpacity={0.55} />
          {/* safe area */}
          <rect
            x={-w2 + SAFE_INSET_MM}
            y={-h2 + SAFE_INSET_MM}
            width={widthMM - 2 * SAFE_INSET_MM}
            height={heightMM - 2 * SAFE_INSET_MM}
            strokeWidth={px(1)}
            strokeOpacity={0.18}
            strokeDasharray={`${px(5)} ${px(4)}`}
          />
          {/* fold lines */}
          {folds.map((f, i) => (
            <line
              key={i}
              x1={f.x1}
              y1={f.y1}
              x2={f.x2}
              y2={f.y2}
              strokeWidth={px(1.2)}
              strokeOpacity={0.5}
              strokeDasharray={`${px(7)} ${px(3)} ${px(1.5)} ${px(3)}`}
            />
          ))}
          {/* centre crosshair */}
          <line x1={-1.2} y1={0} x2={1.2} y2={0} strokeWidth={px(1)} strokeOpacity={0.5} />
          <line x1={0} y1={-1.2} x2={0} y2={1.2} strokeWidth={px(1)} strokeOpacity={0.5} />
        </g>
      )}
      {selBounds && (
        <rect
          x={selBounds.x}
          y={selBounds.y}
          width={selBounds.w}
          height={selBounds.h}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={px(1.5)}
          strokeOpacity={0.85}
          strokeDasharray={`${px(4)} ${px(4)}`}
        />
      )}
    </g>
  )
}
