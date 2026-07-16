import type { HatchLayer } from '../../model/types'
import { useLabel } from '../../state/store'
import { NumberField } from '../controls/NumberField'
import { SegmentedControl } from '../controls/SegmentedControl'
import { Slider } from '../controls/Slider'
import { StrokeControls } from './StrokeControls'

export function HatchPanel({ layer }: { layer: HatchLayer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const up = (patch: Partial<HatchLayer>) => updateLayer(layer.id, patch)

  return (
    <>
      <div className="field-group">
        <NumberField
          label="Angle"
          value={layer.angleDeg}
          min={-90}
          max={90}
          step={1}
          unit="°"
          onChange={(angleDeg) => up({ angleDeg })}
        />
        <Slider label="" value={layer.angleDeg} min={-90} max={90} step={1} unit="°" onChange={(angleDeg) => up({ angleDeg })} />
        <NumberField
          label="Pitch"
          value={layer.pitchMM}
          min={0.3}
          max={8}
          step={0.1}
          unit="mm"
          onChange={(pitchMM) => up({ pitchMM })}
        />
        <NumberField
          label="Stroke"
          value={layer.strokeMM}
          min={0.1}
          max={3}
          step={0.05}
          unit="mm"
          onChange={(strokeMM) => up({ strokeMM })}
        />
        <StrokeControls cap={layer.cap} onCap={(cap) => up({ cap })} />
      </div>
      <div className="field-group">
        <SegmentedControl
          label="Area"
          stack
          value={layer.area}
          options={[
            { value: 'label', label: 'Fill' },
            { value: 'border', label: 'Frame' },
            { value: 'rect', label: 'Band' },
          ]}
          onChange={(area) => up({ area })}
        />
        {layer.area !== 'rect' && (
          <NumberField
            label="Inset"
            value={layer.insetMM}
            min={0}
            max={15}
            step={0.1}
            unit="mm"
            onChange={(insetMM) => up({ insetMM })}
          />
        )}
        {layer.area === 'border' && (
          <NumberField
            label="Band"
            value={layer.bandMM}
            min={0.5}
            max={20}
            step={0.1}
            unit="mm"
            onChange={(bandMM) => up({ bandMM })}
          />
        )}
        {layer.area === 'rect' && (
          <>
            <NumberField label="X" value={layer.xMM} min={-60} max={60} step={0.1} unit="mm" onChange={(xMM) => up({ xMM })} />
            <NumberField label="Y" value={layer.yMM} min={-40} max={40} step={0.1} unit="mm" onChange={(yMM) => up({ yMM })} />
            <NumberField
              label="Width"
              value={layer.widthMM}
              min={1}
              max={120}
              step={0.5}
              unit="mm"
              onChange={(widthMM) => up({ widthMM })}
            />
            <NumberField
              label="Height"
              value={layer.heightMM}
              min={1}
              max={80}
              step={0.5}
              unit="mm"
              onChange={(heightMM) => up({ heightMM })}
            />
          </>
        )}
      </div>
    </>
  )
}
