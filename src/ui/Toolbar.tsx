import { redo, undo, useCanRedo, useCanUndo, useLabel } from '../state/store'
import { useViewport } from '../state/viewport'
import { LabelSwitcher } from './LabelSwitcher'
import { SegmentedControl } from './controls/SegmentedControl'

export function Toolbar({
  onExport,
  onNew,
  onOpen,
}: {
  onExport: () => void
  onNew: () => void
  onOpen: () => void
}) {
  const view = useLabel((s) => s.view)
  const setView = useLabel((s) => s.setView)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  return (
    <div className="toolbar">
      <span className="wordmark">▤ Labelic</span>
      <button type="button" onClick={onNew} title="New from template">
        New
      </button>
      <button type="button" onClick={onOpen} title="Open a project file or exported SVG (⌘O)">
        Open…
      </button>
      <LabelSwitcher onNew={onNew} />
      <span className="toolbar-spacer" />
      <div className="toolbar-group">
        <button type="button" disabled={!canUndo} onClick={undo} title="Undo (⌘Z)">
          ↩
        </button>
        <button type="button" disabled={!canRedo} onClick={redo} title="Redo (⇧⌘Z)">
          ↪
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => useViewport.getState().zoomBy(1 / 1.3)} title="Zoom out (−)">
          −
        </button>
        <button
          type="button"
          onClick={() => {
            const doc = useLabel.getState().doc
            useViewport.getState().zoomFit(doc.widthMM, doc.heightMM)
          }}
          title="Zoom to fit (0)"
        >
          fit
        </button>
        <button type="button" onClick={() => useViewport.getState().zoomBy(1.3)} title="Zoom in (=)">
          +
        </button>
      </div>
      <div className="toolbar-group">
        <button
          type="button"
          className={view.showGuides ? 'active' : ''}
          onClick={() => setView({ showGuides: !view.showGuides })}
          title="Toggle guides"
        >
          ◔
        </button>
        <button
          type="button"
          className={view.snapping ? 'active' : ''}
          onClick={() => setView({ snapping: !view.snapping })}
          title="Toggle snapping (Alt bypasses while dragging)"
        >
          snap
        </button>
      </div>
      <SegmentedControl
        value={view.mode}
        options={[
          { value: 'flat', label: 'Flat', title: 'Vector artwork proofing' },
          { value: 'woven', label: 'Woven', title: 'Thread-level weave preview (M)' },
        ]}
        onChange={(mode) => setView({ mode })}
      />
      {view.mode === 'woven' && (
        <>
          <button
            type="button"
            className={view.folded ? 'active' : ''}
            onClick={() => setView({ folded: !view.folded })}
            title="Present the label folded (per its fold type)"
          >
            fold
          </button>
          <span className="light-control" title="Light angle">
            <span className="light-icon">☀</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={view.lightDeg}
              onChange={(e) => setView({ lightDeg: Number(e.target.value) })}
            />
          </span>
        </>
      )}
      <button type="button" className="button-primary" onClick={onExport}>
        Export
      </button>
    </div>
  )
}
