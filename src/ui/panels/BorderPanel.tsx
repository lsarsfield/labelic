import type { BorderLayer, BorderPattern } from '../../model/types'
import { BORDER_PATTERN_LABELS } from '../../model/types'
import { useLabel } from '../../state/store'
import { NumberField } from '../controls/NumberField'
import { SegmentedControl } from '../controls/SegmentedControl'
import { Select } from '../controls/Select'

const PATTERNS = (Object.entries(BORDER_PATTERN_LABELS) as [BorderPattern, string][]).map(
  ([value, label]) => ({ value, label }),
)

export function BorderPanel({ layer }: { layer: BorderLayer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const up = (patch: Partial<BorderLayer>) => updateLayer(layer.id, patch)
  const patterned = layer.pattern !== 'keyline'

  return (
    <>
      <div className="field-group">
        <Select label="Pattern" value={layer.pattern} options={PATTERNS} onChange={(pattern) => up({ pattern })} />
        <NumberField
          label="Inset"
          value={layer.insetMM}
          min={0.2}
          max={15}
          step={0.1}
          unit="mm"
          onChange={(insetMM) => up({ insetMM })}
        />
        <NumberField
          label="Stroke"
          value={layer.strokeMM}
          min={0.1}
          max={2}
          step={0.05}
          unit="mm"
          onChange={(strokeMM) => up({ strokeMM })}
        />
        {patterned && (
          <NumberField
            label="Unit"
            value={layer.unitMM}
            min={0.5}
            max={8}
            step={0.1}
            unit="mm"
            onChange={(unitMM) => up({ unitMM })}
          />
        )}
        <SegmentedControl
          label="Sides"
          stack
          value={layer.sides}
          options={[
            { value: 'all', label: 'All' },
            { value: 'topBottom', label: 'Top + bottom' },
            { value: 'leftRight', label: 'Left + right' },
          ]}
          onChange={(sides) => up({ sides })}
        />
      </div>
    </>
  )
}
