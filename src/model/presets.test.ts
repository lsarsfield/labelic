import { describe, expect, it } from 'vitest'
import { parseDoc, stringifyDoc } from './serialize'
import { TEMPLATES } from './presets'

/**
 * Preset round-trip acceptance. Golden Shape-IR snapshots of the era presets
 * arrive with the content milestone (compile each preset at export tolerance
 * with fonts loaded via readFileSync, snapshot the IR — see Buttonic's
 * presets.test.ts for the harness). Once generated they are frozen: never
 * `vitest -u`.
 */

describe('templates', () => {
  it('every template round-trips through serialize unchanged', () => {
    for (const template of TEMPLATES) {
      const doc = template.make()
      const round = parseDoc(stringifyDoc(doc))
      expect(round.ok).toBe(true)
      if (round.ok) expect(round.doc).toEqual(doc)
    }
  })

  it('template ids are unique', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
