import type { RepeatRowLayer } from '../../model/types'
import { useLabel } from '../../state/store'
import { MotifPicker } from '../controls/MotifPicker'
import { NumberField } from '../controls/NumberField'
import { SegmentedControl } from '../controls/SegmentedControl'
import { Slider } from '../controls/Slider'
import { SvgAssetPicker } from '../controls/SvgAssetPicker'
import { Toggle } from '../controls/Toggle'
import { StrokeControls } from './StrokeControls'

export function RepeatRowPanel({ layer }: { layer: RepeatRowLayer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  const up = (patch: Partial<RepeatRowLayer>) => updateLayer(layer.id, patch)

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
        <NumberField label="Count" value={layer.count} min={1} max={60} step={1} onChange={(count) => up({ count })} />
        <Slider label="" value={layer.count} min={1} max={40} step={1} onChange={(count) => up({ count })} />
        <NumberField label="X" value={layer.xMM} min={-60} max={60} step={0.1} unit="mm" onChange={(xMM) => up({ xMM })} />
        <NumberField label="Y" value={layer.yMM} min={-40} max={40} step={0.1} unit="mm" onChange={(yMM) => up({ yMM })} />
        <NumberField
          label="Span"
          value={layer.widthMM}
          min={1}
          max={110}
          step={0.5}
          unit="mm"
          onChange={(widthMM) => up({ widthMM })}
        />
        <NumberField
          label="Size"
          value={layer.sizeMM}
          min={0.5}
          max={20}
          step={0.1}
          unit="mm"
          onChange={(sizeMM) => up({ sizeMM })}
        />
        <Toggle
          label="Alternate flip"
          value={layer.alternateFlip}
          onChange={(alternateFlip) => up({ alternateFlip })}
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
        <StrokeControls
          cap={layer.cap}
          join={layer.join}
          onCap={(cap) => up({ cap })}
          onJoin={(join) => up({ join })}
        />
      </div>
      <div className="field-group">
        <SegmentedControl
          label="Rows"
          value={String(layer.rows)}
          options={[
            { value: '1', label: 'One' },
            { value: '2', label: 'Two' },
          ]}
          onChange={(rows) => up({ rows: Number(rows) as 1 | 2 })}
        />
        {layer.rows === 2 && (
          <>
            <NumberField
              label="Row gap"
              value={layer.rowGapMM}
              min={0.2}
              max={20}
              step={0.1}
              unit="mm"
              onChange={(rowGapMM) => up({ rowGapMM })}
            />
            <Toggle
              label="Stagger row 2"
              value={layer.staggerRow2}
              onChange={(staggerRow2) => up({ staggerRow2 })}
            />
            <Toggle
              label="Flip row 2"
              value={layer.flipRow2}
              onChange={(flipRow2) => up({ flipRow2 })}
            />
          </>
        )}
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
