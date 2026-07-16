import { useLabel } from '../state/store'
import { useViewport } from '../state/viewport'

export function StatusBar() {
  const layerCount = useLabel((s) => s.doc.layers.length)
  const weave = useLabel((s) => s.doc.weave)
  const widthMM = useLabel((s) => s.doc.widthMM)
  const heightMM = useLabel((s) => s.doc.heightMM)
  const cursor = useViewport((s) => s.cursor)
  const scale = useViewport((s) => s.scale)

  const cols = Math.round(widthMM * weave.endsPerMM)
  const rows = Math.round(heightMM * weave.picksPerMM)

  return (
    <div className="statusbar">
      <span>
        {layerCount} layer{layerCount === 1 ? '' : 's'}
      </span>
      <span className="statusbar-grid">
        {cols} × {rows} threads
      </span>
      <span className="statusbar-spacer" />
      <span className="statusbar-readout">
        {cursor ? `x ${cursor.xMM.toFixed(2)} · y ${cursor.yMM.toFixed(2)} mm` : '—'}
      </span>
      <span className="statusbar-zoom">{scale.toFixed(1)} px/mm</span>
    </div>
  )
}
