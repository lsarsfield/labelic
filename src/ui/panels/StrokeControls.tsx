import type { StrokeCap, StrokeJoin } from '../../model/types'
import { SegmentedControl } from '../controls/SegmentedControl'

/**
 * Shared stroke end-cap / corner controls (Buttonic's StrokeControls,
 * cartesian edition). Join is optional — hatch stripes have no corners.
 */
export function StrokeControls({
  cap,
  join,
  onCap,
  onJoin,
}: {
  cap: StrokeCap
  join?: StrokeJoin
  onCap: (cap: StrokeCap) => void
  onJoin?: (join: StrokeJoin) => void
}) {
  return (
    <>
      <SegmentedControl
        label="Ends"
        value={cap}
        options={[
          { value: 'butt', label: 'Butt' },
          { value: 'round', label: 'Round' },
          { value: 'square', label: 'Square' },
        ]}
        onChange={onCap}
      />
      {join !== undefined && onJoin && (
        <SegmentedControl
          label="Corners"
          value={join}
          options={[
            { value: 'miter', label: 'Sharp' },
            { value: 'round', label: 'Round' },
            { value: 'bevel', label: 'Bevel' },
          ]}
          onChange={onJoin}
        />
      )}
    </>
  )
}
