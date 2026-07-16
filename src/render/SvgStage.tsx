import { useEffect, useRef, useState } from 'react'
import { useLabel } from '../state/store'
import { screenToMM, useViewport } from '../state/viewport'
import { DocRenderer } from './DocRenderer'
import { Guides } from './overlays/Guides'
import { Handles } from './overlays/Handles'

/**
 * The mm-true stage: one <svg> filling the pane, a zoom/pan group in screen
 * px, and inside it the document in millimetre coordinates centred on the
 * label. `<g id="doc">` stays pristine — the export subtree — while guides
 * and handles live in a sibling overlay group.
 *
 * Flat mode shows the vector artwork on the warp-colored blank (artwork
 * proofing); woven mode will mount the WeaveStage canvas UNDER this svg and
 * hide the blank + doc groups (overlays stay interactive on top).
 */
export function SvgStage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const pan = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null)

  const { scale, tx, ty } = useViewport()
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const warpHex = useLabel((s) => s.doc.weave.warp.hex)
  const artboardLight = useLabel((s) => s.view.artboardLight)
  const woven = useLabel((s) => s.view.mode === 'woven')
  const select = useLabel((s) => s.select)

  // Track pane size; fit the label on first layout.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const vp = useViewport.getState()
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      vp.setSize(width, height)
      if (!useViewport.getState().fitted) {
        const doc = useLabel.getState().doc
        vp.zoomFit(doc.widthMM, doc.heightMM)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Wheel: plain = pan, ctrl/cmd (and trackpad pinch) = zoom to cursor.
  // Attached natively because wheel listeners must be non-passive to preventDefault.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const vp = useViewport.getState()
      if (e.ctrlKey || e.metaKey) {
        vp.zoomAt(px, py, Math.exp(-e.deltaY * 0.0022))
      } else {
        vp.panBy(-e.deltaX, -e.deltaY)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Space-drag panning.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) {
        e.preventDefault()
        setSpaceDown(true)
        useViewport.getState().setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(false)
        useViewport.getState().setSpaceDown(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const panButton = e.button === 1 || (e.button === 0 && spaceDown)
    if (panButton) {
      e.preventDefault()
      svgRef.current?.setPointerCapture(e.pointerId)
      pan.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY }
    } else if (e.button === 0 && e.target === e.currentTarget) {
      select(null)
    }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pan.current && e.pointerId === pan.current.pointerId) {
      useViewport.getState().panBy(e.clientX - pan.current.lastX, e.clientY - pan.current.lastY)
      pan.current.lastX = e.clientX
      pan.current.lastY = e.clientY
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const { x, y } = screenToMM(e.clientX - rect.left, e.clientY - rect.top)
    useViewport.getState().setCursor({ xMM: x, yMM: y })
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pan.current && e.pointerId === pan.current.pointerId) {
      svgRef.current?.releasePointerCapture(e.pointerId)
      pan.current = null
    }
  }

  return (
    <svg
      ref={svgRef}
      className="stage"
      style={{ cursor: spaceDown || pan.current ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => useViewport.getState().setCursor(null)}
    >
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {/* Backdrop: the woven blank. Not part of the export subtree.
            Hidden in woven mode — the WeaveStage canvas below paints the cloth. */}
        {!woven && (
          <g id="backdrop">
            <rect
              x={-widthMM / 2}
              y={-heightMM / 2}
              width={widthMM}
              height={heightMM}
              fill={artboardLight ? '#e9e7e2' : warpHex}
              stroke="var(--face-edge)"
              strokeWidth={1.5 / scale}
              onPointerDown={(e) => {
                if (e.button === 0 && !spaceDown) select(null)
              }}
            />
          </g>
        )}
        {/* In woven mode the vector artwork fades out but stays mounted:
            hit rects keep selection working over the canvas, and the font/
            asset load kicks keep running. */}
        <g id="doc" opacity={woven ? 0 : 1}>
          <DocRenderer />
        </g>
        <g id="overlays">
          <Guides />
          <Handles />
        </g>
      </g>
    </svg>
  )
}
