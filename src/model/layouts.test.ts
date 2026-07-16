import { describe, expect, it } from 'vitest'
import { parseDoc, stringifyDoc } from './serialize'
import { LAYOUTS } from './layouts'

/**
 * Structural acceptance for the layout skeletons. Mirrors the structural half
 * of presets.test.ts — serialize round-trip + id uniqueness — but deliberately
 * compiles NO geometry (so no fonts are needed) and freezes NO golden
 * snapshots: layouts carry placeholder copy the user overwrites, so their
 * compiled geometry is not a stable contract.
 *
 * The round-trip check doubles as the validity gate: parseDoc runs the full
 * migrate + validate pipeline, so a missing field, a bad enum, or an
 * out-of-palette weftIndex (which validate CLAMPS) would surface as a diff.
 */
describe('layouts', () => {
  it('every layout round-trips through serialize unchanged', () => {
    for (const layout of LAYOUTS) {
      const doc = layout.make()
      const round = parseDoc(stringifyDoc(doc))
      expect(round.ok, layout.id).toBe(true)
      if (round.ok) expect(round.doc, layout.id).toEqual(doc)
    }
  })

  it('layout ids are unique', () => {
    const ids = LAYOUTS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
