import { describe, expect, it } from 'vitest'
import { presetBlank } from '../model/presets'
import { renderThumbSvg } from './thumbnail'

describe('renderThumbSvg', () => {
  it('omits the project metadata block', () => {
    const svg = renderThumbSvg(presetBlank())
    expect(svg).not.toBeNull()
    expect(svg).not.toContain('<metadata')
  })

  it('draws the warp ground so thumbnails read on the dark UI', () => {
    const doc = presetBlank()
    const svg = renderThumbSvg(doc)!
    expect(svg).toContain(doc.weave.warp.hex)
  })

  it('is a whole self-contained document (never an extracted group)', () => {
    // regression: extracting an inner group would strip <defs> and render
    // instanced layers (borders/repeat rows) empty
    const svg = renderThumbSvg(presetBlank())
    expect(svg).not.toBeNull()
    expect(svg!.startsWith('<?xml')).toBe(true)
  })

  it('returns null over the byte cap', () => {
    expect(renderThumbSvg(presetBlank(), 10)).toBeNull()
  })
})
