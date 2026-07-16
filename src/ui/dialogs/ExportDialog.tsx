import { useMemo, useRef, useState } from 'react'
import { DEFAULT_SVG_OPTIONS, exportArtworkSvg, type SvgExportOptions } from '../../io/exportSvg'
import { exportDraftPng } from '../../io/exportDraftPng'
import { exportWovenPng } from '../../io/exportWovenPng'
import { downloadBlob, downloadText, safeFilename } from '../../io/download'
import { loadProjectFile, saveProject } from '../../io/project'
import { useLabel } from '../../state/store'
import { Select } from '../controls/Select'
import { Toggle } from '../controls/Toggle'

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const doc = useLabel((s) => s.doc)
  const lightDeg = useLabel((s) => s.view.lightDeg)
  const [svgOptions, setSvgOptions] = useState<SvgExportOptions>(DEFAULT_SVG_OPTIONS)
  const [pngPx, setPngPx] = useState('2048')
  const [pngFolded, setPngFolded] = useState(false)
  const [pngError, setPngError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const downloadWoven = async () => {
    setPngError(null)
    setBusy(true)
    try {
      const blob = await exportWovenPng(doc, { px: Number(pngPx), lightDeg, folded: pngFolded })
      downloadBlob(blob, `${safeFilename(doc.name)}-woven-${pngPx}px.png`)
    } catch (e) {
      setPngError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const downloadDraft = async () => {
    setPngError(null)
    try {
      const blob = await exportDraftPng(doc)
      downloadBlob(blob, `${safeFilename(doc.name)}-draft.png`)
    } catch (e) {
      setPngError(e instanceof Error ? e.message : String(e))
    }
  }

  // Live warnings: run the artwork export whenever options change.
  const { warnings } = useMemo(() => exportArtworkSvg(doc, svgOptions), [doc, svgOptions])

  const downloadSvg = () => {
    const result = exportArtworkSvg(doc, svgOptions)
    downloadText(result.svg, `${safeFilename(doc.name)}.svg`, 'image/svg+xml')
  }

  const onLoadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLoadError(null)
    const result = await loadProjectFile(file)
    if (result.ok) onClose()
    else setLoadError(result.error)
  }

  return (
    <div className="modal-backdrop" onPointerDown={onClose}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-title">Export</div>

        <div className="modal-section">
          <div className="modal-section-title">
            Artwork · SVG ({doc.widthMM} × {doc.heightMM} mm true size · {doc.weave.wefts.length}{' '}
            thread{doc.weave.wefts.length === 1 ? '' : 's'})
          </div>
          <Toggle
            label="Expand instances"
            value={svgOptions.expandInstances}
            onChange={(expandInstances) => setSvgOptions({ ...svgOptions, expandInstances })}
          />
          <Toggle
            label="Ground rect"
            value={svgOptions.includeGround}
            onChange={(includeGround) => setSvgOptions({ ...svgOptions, includeGround })}
          />
          <Toggle
            label="Fold guides"
            value={svgOptions.includeGuides}
            onChange={(includeGuides) => setSvgOptions({ ...svgOptions, includeGuides })}
          />
          {warnings.length > 0 && (
            <div className="export-warnings">
              {warnings.map((w, i) => (
                <div key={i} className="warning-note">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}
          <button type="button" className="button-primary" onClick={downloadSvg}>
            Download SVG
          </button>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">Woven mockup · PNG</div>
          <Select
            label="Size"
            value={pngPx}
            options={[
              { value: '1024', label: '1024 px' },
              { value: '2048', label: '2048 px' },
              { value: '4096', label: '4096 px' },
            ]}
            onChange={setPngPx}
          />
          <Toggle label={`Folded (${doc.fold})`} value={pngFolded} onChange={setPngFolded} />
          {pngError && <div className="warning-note">{pngError}</div>}
          <div className="modal-row">
            <button type="button" className="button-primary" disabled={busy} onClick={() => void downloadWoven()}>
              {busy ? 'Weaving…' : 'Download woven PNG'}
            </button>
            <button type="button" onClick={() => void downloadDraft()} title="The grid itself, one pixel per thread — the punchcard">
              Weave draft PNG
            </button>
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">Project</div>
          <div className="modal-row">
            <button type="button" onClick={() => saveProject(doc)}>
              Save project (.label.json)
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              Open project / exported SVG…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.svg,application/json,image/svg+xml"
              style={{ display: 'none' }}
              onChange={onLoadFile}
            />
          </div>
          {loadError && <div className="warning-note">{loadError}</div>}
          <div className="readout">Exported SVGs embed the project — they re-open as documents.</div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
