import type { TextLineLayer } from '../../model/types'
import { useLabel } from '../../state/store'
import { FontPicker } from '../controls/FontPicker'
import { NumberField } from '../controls/NumberField'
import { SegmentedControl } from '../controls/SegmentedControl'
import { Slider } from '../controls/Slider'
import { TextField } from '../controls/TextField'
import { Toggle } from '../controls/Toggle'

export function TextLinePanel({ layer }: { layer: TextLineLayer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const up = (patch: Partial<TextLineLayer>) => updateLayer(layer.id, patch)
  const arched = Math.abs(layer.archMM) >= 0.05

  return (
    <>
      <div className="field-group">
        <TextField label="Text" value={layer.text} onChange={(text) => up({ text })} maxLength={64} />
        <FontPicker value={layer.fontId} onChange={(fontId) => up({ fontId })} />
        <NumberField
          label="Size"
          value={layer.sizeMM}
          min={0.8}
          max={40}
          step={0.1}
          unit="mm"
          onChange={(sizeMM) => up({ sizeMM })}
        />
        <Toggle label="Kerning" value={layer.useKerning} onChange={(useKerning) => up({ useKerning })} />
        <NumberField
          label="Spacing"
          value={layer.letterSpacingMM}
          min={-1}
          max={5}
          step={0.05}
          unit="mm"
          onChange={(letterSpacingMM) => up({ letterSpacingMM })}
        />
      </div>
      <div className="field-group">
        <NumberField label="X" value={layer.xMM} min={-60} max={60} step={0.1} unit="mm" onChange={(xMM) => up({ xMM })} />
        <NumberField label="Y" value={layer.yMM} min={-40} max={40} step={0.1} unit="mm" onChange={(yMM) => up({ yMM })} />
        <SegmentedControl
          label="Align"
          value={layer.anchorAlign}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={(anchorAlign) => up({ anchorAlign })}
        />
      </div>
      <div className="field-group">
        <NumberField
          label="Arch"
          value={layer.archMM}
          min={-15}
          max={15}
          step={0.1}
          unit="mm"
          onChange={(archMM) => up({ archMM })}
        />
        <Slider label="" value={layer.archMM} min={-15} max={15} step={0.1} unit="mm" onChange={(archMM) => up({ archMM })} />
        {arched && (
          <SegmentedControl
            label="Arch style"
            value={layer.archMode}
            options={[
              { value: 'arc', label: 'Upright', title: 'Upright glyphs rotated along the arc (classic)' },
              { value: 'warp', label: 'Bent', title: 'Glyph outlines genuinely bent through the arc' },
            ]}
            onChange={(archMode) => up({ archMode })}
          />
        )}
      </div>
      <div className="field-group">
        <NumberField
          label="Halo"
          value={layer.haloMM}
          min={0}
          max={5}
          step={0.1}
          unit="mm"
          onChange={(haloMM) => up({ haloMM })}
        />
        <p className="coming-soon">
          Halo weaves a ground-colored moat around the text — it clears hatch and pattern layers
          below.
        </p>
      </div>
    </>
  )
}
