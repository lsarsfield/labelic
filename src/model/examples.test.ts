import { describe, expect, it } from 'vitest'
import { EXAMPLES } from './examples'
import { parseDoc, stringifyDoc } from './serialize'

describe('example recreations', () => {
  it('every example round-trips through serialize unchanged', () => {
    for (const ex of EXAMPLES) {
      const doc = ex.make()
      const round = parseDoc(stringifyDoc(doc))
      expect(round.ok, ex.id).toBe(true)
      if (round.ok) expect(round.doc).toEqual(doc)
    }
  })

  it('example ids are unique and every example has layers', () => {
    const ids = EXAMPLES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const ex of EXAMPLES) expect(ex.make().layers.length).toBeGreaterThan(0)
  })
})
