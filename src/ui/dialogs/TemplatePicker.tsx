import { TEMPLATES } from '../../model/presets'
import { LAYOUTS } from '../../model/layouts'
import { createFromDoc } from '../../io/workspace'

/**
 * New-label picker: finished era templates (fully-designed period labels) and
 * layout skeletons (empty vintage compositions to fill with your own copy).
 * Both open as a NEW workspace entry — the current label stays cached.
 */
export function TemplatePicker({ onClose }: { onClose: () => void }) {
  const open = (make: () => import('../../model/types').LabelDoc) => {
    void createFromDoc(make()).then(onClose)
  }
  return (
    <div className="modal-backdrop" onPointerDown={onClose}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-title">New label</div>

        <div className="modal-section-title">Era templates</div>
        <p className="modal-blurb">Fully-designed period labels — a finished starting point.</p>
        <div className="template-cards">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" className="template-card" onClick={() => open(t.make)}>
              <span className="template-name">{t.name}</span>
              <span className="template-blurb">{t.blurb}</span>
            </button>
          ))}
        </div>

        <div className="modal-section-title">Layouts</div>
        <p className="modal-blurb">
          Vintage compositions — an arrangement of placeholder layers to fill with your own brand,
          thread palette and motifs.
        </p>
        <div className="template-cards">
          {LAYOUTS.map((l) => (
            <button key={l.id} type="button" className="template-card" onClick={() => open(l.make)}>
              <span className="template-name">{l.name}</span>
              <span className="template-blurb">{l.blurb}</span>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
