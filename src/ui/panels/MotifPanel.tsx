import type { MotifLayer } from '../../model/types'
import { useLabel } from '../../state/store'
import { MotifPicker } from '../controls/MotifPicker'
import { NumberField } from '../controls/NumberField'
import { SegmentedControl } from '../controls/SegmentedControl'
import { SvgAssetPicker } from '../controls/SvgAssetPicker'
import { Toggle } from '../controls/Toggle'
import { StrokeControls } from './StrokeControls'

export function MotifPanel({ layer }: { layer: MotifLayer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const up = (patch: Partial<MotifLayer>) => updateLayer(layer.id, patch)

  return (
    <>
      <div className="field-group">
        <SegmentedControl
          label="Source"
          value={layer.source.kind}
          options={[
            { value: 'builtin', label: 'Library' },
            { value: 'asset', label: 'SVG' },
          ]}
          onChange={(kind) =>
            up({
              source:
                kind === 'builtin' ? { kind: 'builtin', motifId: 'star' } : { kind: 'asset', assetId: '' },
            })
          }
        />
        {layer.source.kind === 'builtin' ? (
          <MotifPicker
            value={layer.source.motifId}
            onChange={(motifId) => up({ source: { kind: 'builtin', motifId } })}
          />
        ) : (
          <SvgAssetPicker
            value={layer.source.assetId || null}
            onChange={(assetId) => up({ source: { kind: 'asset', assetId } })}
          />
        )}
      </div>
      <div className="field-group">
        <NumberField label="X" value={layer.xMM} min={-60} max={60} step={0.1} unit="mm" onChange={(xMM) => up({ xMM })} />
        <NumberField label="Y" value={layer.yMM} min={-40} max={40} step={0.1} unit="mm" onChange={(yMM) => up({ yMM })} />
        <NumberField
          label="Size"
          value={layer.sizeMM}
          min={0.5}
          max={60}
          step={0.1}
          unit="mm"
          onChange={(sizeMM) => up({ sizeMM })}
        />
        <NumberField
          label="Rotate"
          value={layer.rotationDeg}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(rotationDeg) => up({ rotationDeg })}
        />
        <Toggle label="Mirror" value={layer.mirrorX} onChange={(mirrorX) => up({ mirrorX })} />
        <NumberField
          label="Stroke"
          value={layer.strokeMM}
          min={0.1}
          max={3}
          step={0.05}
          unit="mm"
          onChange={(strokeMM) => up({ strokeMM })}
        />
        <StrokeControls
          cap={layer.cap}
          join={layer.join}
          onCap={(cap) => up({ cap })}
          onJoin={(join) => up({ join })}
        />
        <NumberField
          label="Halo"
          value={layer.haloMM}
          min={0}
          max={5}
          step={0.1}
          unit="mm"
          onChange={(haloMM) => up({ haloMM })}
        />
      </div>
    </>
  )
}
