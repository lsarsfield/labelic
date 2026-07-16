import { GROUND_WEFT_INDEX } from '../../model/types'
import { useLabel } from '../../state/store'

/**
 * Per-layer thread assignment: the doc's weft palette as a chip strip plus a
 * "ground" chip (weave in the warp — the knockout that makes reversed-out
 * labels). One click = one thread; the authentic loom constraint made
 * visible at the top of every layer panel.
 */
export function ThreadRow({
  value,
  onChange,
}: {
  value: number
  onChange: (weftIndex: number) => void
}) {
  const wefts = useLabel((s) => s.doc.weave.wefts)
  const warpHex = useLabel((s) => s.doc.weave.warp.hex)
  return (
    <label className="field field-stack">
      <span className="field-label">Thread</span>
      <span className="thread-row">
        {wefts.map((w, i) => (
          <button
            key={i}
            type="button"
            className={'thread-chip' + (value === i ? ' active' : '')}
            style={{ background: w.hex }}
            title={`${w.name} · ${w.hex}`}
            onClick={() => onChange(i)}
          />
        ))}
        <button
          type="button"
          className={'thread-chip thread-chip-ground' + (value === GROUND_WEFT_INDEX ? ' active' : '')}
          style={{ background: warpHex }}
          title="Ground — woven in the warp: knocks out to the background (reversed-out designs)"
          onClick={() => onChange(GROUND_WEFT_INDEX)}
        />
      </span>
    </label>
  )
}
