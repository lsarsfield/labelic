import { useState } from 'react'
import type { ThreadColor } from '../../model/types'
import { maxWeftsFor, THREAD_CANON } from '../../model/types'
import { useLabel } from '../../state/store'

/**
 * The doc's thread palette: the warp (ground) chip plus the ordered weft
 * chips. Clicking a chip opens the thread-canon swatch grid (plus a custom
 * color input); wefts can be added up to the loom's cap and removed (the
 * store remaps every layer's weftIndex in the same undo step).
 *
 * Switching needle → shuttle with more than 3 wefts keeps the data and warns
 * instead of truncating — non-destructive beats tidy.
 */
export function PaletteEditor() {
  const weave = useLabel((s) => s.doc.weave)
  const updateWeave = useLabel((s) => s.updateWeave)
  const addWeft = useLabel((s) => s.addWeft)
  const updateWeft = useLabel((s) => s.updateWeft)
  const removeWeft = useLabel((s) => s.removeWeft)
  const [editing, setEditing] = useState<number | 'warp' | null>(null)

  const cap = maxWeftsFor(weave.loom)
  const overCap = weave.wefts.length > cap

  const pick = (t: ThreadColor) => {
    if (editing === 'warp') updateWeave({ warp: t })
    else if (typeof editing === 'number') updateWeft(editing, t)
    setEditing(null)
  }

  const nextCanon = (): ThreadColor => {
    const used = new Set([weave.warp.hex, ...weave.wefts.map((w) => w.hex)])
    return THREAD_CANON.find((t) => !used.has(t.hex)) ?? THREAD_CANON[0]!
  }

  const editingColor =
    editing === 'warp' ? weave.warp : typeof editing === 'number' ? weave.wefts[editing] : null

  return (
    <div className="palette">
      <div className="field field-stack">
        <span className="field-label">Warp (ground)</span>
        <span className="thread-row">
          <button
            type="button"
            className={'thread-chip thread-chip-lg' + (editing === 'warp' ? ' active' : '')}
            style={{ background: weave.warp.hex }}
            title={`${weave.warp.name} · ${weave.warp.hex}`}
            onClick={() => setEditing(editing === 'warp' ? null : 'warp')}
          />
          <span className="thread-name">{weave.warp.name}</span>
        </span>
      </div>
      <div className="field field-stack">
        <span className="field-label">
          Wefts <span className="field-hint">{weave.wefts.length}/{cap}</span>
        </span>
        <span className="thread-row">
          {weave.wefts.map((w, i) => (
            <span key={i} className="thread-chip-wrap">
              <button
                type="button"
                className={'thread-chip thread-chip-lg' + (editing === i ? ' active' : '')}
                style={{ background: w.hex }}
                title={`${w.name} · ${w.hex}`}
                onClick={() => setEditing(editing === i ? null : i)}
              />
              {weave.wefts.length > 1 && (
                <button
                  type="button"
                  className="thread-remove"
                  title={`Remove ${w.name} (layers on it fall back to weft 1)`}
                  onClick={() => {
                    setEditing(null)
                    removeWeft(i)
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          <button
            type="button"
            className="thread-add"
            disabled={weave.wefts.length >= cap}
            title={weave.wefts.length >= cap ? `A ${weave.loom} loom carries at most ${cap} wefts` : 'Add a weft thread'}
            onClick={() => addWeft(nextCanon())}
          >
            +
          </button>
        </span>
      </div>
      {overCap && (
        <p className="palette-warning">
          Shuttle looms weave at most {cap} wefts — extra threads still render but will flag on
          export.
        </p>
      )}
      {editing !== null && editingColor && (
        <div className="swatch-grid">
          {THREAD_CANON.map((t) => (
            <button
              key={t.hex}
              type="button"
              className={'swatch' + (editingColor.hex === t.hex ? ' active' : '')}
              style={{ background: t.hex }}
              title={t.name}
              onClick={() => pick(t)}
            />
          ))}
          <label className="swatch-custom" title="Custom thread color">
            <input
              type="color"
              value={editingColor.hex}
              onChange={(e) => pick({ name: 'Custom', hex: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  )
}
