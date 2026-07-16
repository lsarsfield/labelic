import type { EdgeFinish, FoldType, GroundWeave, LoomType } from '../../model/types'
import { edgeOptionsFor, FOLD_TYPE_LABELS, LOOM_TABLE, SIZE_PRESETS } from '../../model/types'
import { useLabel } from '../../state/store'
import { NumberField } from '../controls/NumberField'
import { PaletteEditor } from '../controls/PaletteEditor'
import { SegmentedControl } from '../controls/SegmentedControl'
import { Select } from '../controls/Select'
import { Toggle } from '../controls/Toggle'

const GROUNDS: readonly { value: GroundWeave; label: string }[] = [
  { value: 'taffeta', label: 'Taffeta (plain, matte)' },
  { value: 'satin', label: 'Satin (shiny ground)' },
  { value: 'damask', label: 'Damask (dense, premium)' },
]

const EDGE_LABELS: Record<EdgeFinish, string> = {
  selvedge: 'Selvedge (woven)',
  hotCut: 'Hot cut',
  ultrasonic: 'Ultrasonic cut',
}

const FOLDS = (Object.entries(FOLD_TYPE_LABELS) as [FoldType, string][]).map(([value, label]) => ({
  value,
  label,
}))

export function DocPanel() {
  const doc = useLabel((s) => s.doc)
  const view = useLabel((s) => s.view)
  const updateDocMeta = useLabel((s) => s.updateDocMeta)
  const updateWeave = useLabel((s) => s.updateWeave)
  const setView = useLabel((s) => s.setView)

  const sizeValue =
    SIZE_PRESETS.find((p) => p.widthMM === doc.widthMM && p.heightMM === doc.heightMM)?.label ??
    'custom'
  const profile = LOOM_TABLE[doc.weave.loom][doc.weave.ground]
  const densityIsDefault =
    doc.weave.endsPerMM === profile.endsPerMM && doc.weave.picksPerMM === profile.picksPerMM

  /** Loom/ground changes re-apply the profile's density + edge (predictable defaults). */
  const setLoomGround = (loom: LoomType, ground: GroundWeave) => {
    const p = LOOM_TABLE[loom][ground]
    updateWeave({ loom, ground, endsPerMM: p.endsPerMM, picksPerMM: p.picksPerMM, edge: p.defaultEdge })
  }

  return (
    <>
      <div className="field-group">
        <Select
          label="Size"
          value={sizeValue}
          options={[
            ...SIZE_PRESETS.map((p) => ({ value: p.label, label: p.label })),
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={(label) => {
            const preset = SIZE_PRESETS.find((p) => p.label === label)
            if (preset) updateDocMeta({ widthMM: preset.widthMM, heightMM: preset.heightMM })
          }}
        />
        <NumberField
          label="Width"
          value={doc.widthMM}
          min={10}
          max={120}
          step={1}
          unit="mm"
          onChange={(widthMM) => updateDocMeta({ widthMM })}
        />
        <NumberField
          label="Height"
          value={doc.heightMM}
          min={6}
          max={80}
          step={1}
          unit="mm"
          onChange={(heightMM) => updateDocMeta({ heightMM })}
        />
        <Select label="Fold" value={doc.fold} options={FOLDS} onChange={(fold) => updateDocMeta({ fold })} />
      </div>

      <div className="field-group">
        <SegmentedControl
          label="Loom"
          stack
          value={doc.weave.loom}
          options={[
            { value: 'shuttle', label: 'Shuttle', title: 'Vintage: coarse grid, selvedge edges, ≤3 wefts' },
            { value: 'needle', label: 'Needle', title: 'Modern: fine grid, cut edges, ≤8 wefts' },
          ]}
          onChange={(loom) => setLoomGround(loom, doc.weave.ground)}
        />
        <Select
          label="Ground"
          value={doc.weave.ground}
          options={GROUNDS}
          onChange={(ground) => setLoomGround(doc.weave.loom, ground)}
        />
        <Select
          label="Edge"
          value={doc.weave.edge}
          options={edgeOptionsFor(doc.weave.loom).map((e) => ({ value: e, label: EDGE_LABELS[e] }))}
          onChange={(edge) => updateWeave({ edge })}
        />
        <NumberField
          label="Ends"
          value={doc.weave.endsPerMM}
          min={1}
          max={12}
          step={0.1}
          unit="/mm"
          onChange={(endsPerMM) => updateWeave({ endsPerMM })}
        />
        <NumberField
          label="Picks"
          value={doc.weave.picksPerMM}
          min={1}
          max={14}
          step={0.1}
          unit="/mm"
          onChange={(picksPerMM) => updateWeave({ picksPerMM })}
        />
        {!densityIsDefault && (
          <button
            type="button"
            className="link-button"
            onClick={() => updateWeave({ endsPerMM: profile.endsPerMM, picksPerMM: profile.picksPerMM })}
          >
            Reset density to {doc.weave.loom} {doc.weave.ground} default
          </button>
        )}
      </div>

      <div className="field-group">
        <PaletteEditor />
      </div>

      <div className="field-group">
        <Toggle label="Guides" value={view.showGuides} onChange={(showGuides) => setView({ showGuides })} />
        <Toggle
          label="Light artboard"
          value={view.artboardLight}
          onChange={(artboardLight) => setView({ artboardLight })}
        />
      </div>
      <p className="coming-soon">
        Select a layer to edit it. Every layer is woven in one thread from the palette — pick it at
        the top of the layer's panel.
      </p>
    </>
  )
}
