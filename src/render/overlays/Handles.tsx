import { useRef } from 'react'
import type { Layer } from '../../model/types'
import { beginGesture, endGesture, useLabel } from '../../state/store'
import { screenToMM, useViewport } from '../../state/viewport'
import { snapMM } from '../../ui/snap'

/**
 * Canvas manipulation for the selected layer: a square position grip at the
 * layer's anchor drags xMM/yMM (textLine, motif, repeatRow); borders get an
 * inset grip on their top edge. Every drag is one undo step and honours
 * snapping.
 */
export function Handles() {
  const layer = useLabel((s) => s.doc.layers.find((l) => l.id === s.selection) ?? null)
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const scale = useViewport((s) => s.scale)

  if (!layer || !layer.visible) return null
  const px = (n: number) => n / scale

  if (layer.type === 'border') {
    return <InsetGrip layer={layer} widthMM={widthMM} heightMM={heightMM} px={px} />
  }
  return <PositionGrip layer={layer} px={px} />
}

/** Pointer-capture drag reporting positions in document mm. */
function useMMDrag(onDragMM: (x: number, y: number, e: PointerEvent | React.PointerEvent) => void) {
  const active = useRef(false)
  return {
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      active.current = true
      beginGesture()
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (!active.current) return
      const svg = (e.currentTarget as SVGGraphicsElement).ownerSVGElement
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const mm = screenToMM(e.clientX - rect.left, e.clientY - rect.top)
      onDragMM(mm.x, mm.y, e)
    },
    onPointerUp: (e: React.PointerEvent<SVGElement>) => {
      if (!active.current) return
      active.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
      endGesture()
    },
  }
}

function PositionGrip({
  layer,
  px,
}: {
  layer: Extract<Layer, { type: 'textLine' | 'motif' | 'repeatRow' }>
  px: (n: number) => number
}) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const snapping = useLabel((s) => s.view.snapping)
  const drag = useMMDrag((x, y, e) => {
    updateLayer(layer.id, {
      xMM: Number(snapMM(x, e, snapping).toFixed(3)),
      yMM: Number(snapMM(y, e, snapping).toFixed(3)),
    } as Partial<Layer>)
  })
  const size = px(9)
  return (
    <rect
      x={layer.xMM - size / 2}
      y={layer.yMM - size / 2}
      width={size}
      height={size}
      fill="var(--accent)"
      stroke="var(--bg0)"
      strokeWidth={px(1.5)}
      style={{ cursor: 'move' }}
      {...drag}
    />
  )
}

function InsetGrip({
  layer,
  widthMM,
  heightMM,
  px,
}: {
  layer: Extract<Layer, { type: 'border' }>
  widthMM: number
  heightMM: number
  px: (n: number) => number
}) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const snapping = useLabel((s) => s.view.snapping)
  const maxInset = Math.min(widthMM, heightMM) / 2 - 0.5
  const drag = useMMDrag((_x, y, e) => {
    const inset = y - -heightMM / 2 // distance from the top edge
    const snapped = snapMM(inset, e, snapping)
    updateLayer(layer.id, { insetMM: Number(Math.max(0.2, Math.min(maxInset, snapped)).toFixed(3)) })
  })
  const size = px(9)
  return (
    <rect
      x={-size / 2}
      y={-heightMM / 2 + layer.insetMM - size / 2}
      width={size}
      height={size}
      fill="var(--accent)"
      stroke="var(--bg0)"
      strokeWidth={px(1.5)}
      style={{ cursor: 'ns-resize' }}
      {...drag}
    />
  )
}
