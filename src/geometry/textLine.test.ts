import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as opentype from 'opentype.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { makeTextLineLayer } from '../model/types'
import { archWarp, compileTextLine, textLineWidthMM } from './textLine'

const DENSITY = { endsPerMM: 2.4, picksPerMM: 2.8 }
const LABEL_W = 50

const fonts = new Map<string, opentype.Font>()

function loadFont(id: string, rel: string) {
  const path = fileURLToPath(new URL(rel, import.meta.url))
  const buf = readFileSync(path)
  fonts.set(id, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
}

beforeAll(() => {
  loadFont('oswald', '../../public/fonts/oswald.ttf')
  loadFont('cinzel', '../../public/fonts/cinzel.ttf')
})

const oswald = () => fonts.get('oswald')!
const cinzel = () => fonts.get('cinzel')!

function compile(patch: Parameters<typeof makeTextLineLayer>[0] = {}, font = oswald()) {
  return compileTextLine(makeTextLineLayer({ text: 'SPECIMEN', sizeMM: 6, ...patch }), font, 0.01, DENSITY, LABEL_W)
}

describe('layout', () => {
  it('run width is the sum of advances, spacing and kerning', () => {
    const layer = makeTextLineLayer({ text: 'AVA', fontId: 'cinzel', sizeMM: 6, letterSpacingMM: 0.4 })
    const font = cinzel()
    const scale = layer.sizeMM / font.unitsPerEm
    const glyphs = font.stringToGlyphs('AVA')
    let expected = 0
    for (let i = 0; i < glyphs.length; i++) {
      expected += (glyphs[i]!.advanceWidth ?? 0) * scale
      if (i < glyphs.length - 1) {
        expected += 0.4 + font.getKerningValue(glyphs[i]!, glyphs[i + 1]!) * scale
      }
    }
    expect(textLineWidthMM(layer, font)).toBeCloseTo(expected, 9)
  })

  it('kerning off widens (or at least changes) a kerned pair', () => {
    const on = textLineWidthMM(makeTextLineLayer({ text: 'AV', fontId: 'cinzel', sizeMM: 10 }), cinzel())
    const off = textLineWidthMM(
      makeTextLineLayer({ text: 'AV', fontId: 'cinzel', sizeMM: 10, useKerning: false }),
      cinzel(),
    )
    // Cinzel kerns AV negative — turning kerning off must widen the run
    expect(off).toBeGreaterThan(on)
  })

  it('anchor alignment shifts the whole run, not its shape', () => {
    const left = compile({ anchorAlign: 'left', xMM: 0 })
    const right = compile({ anchorAlign: 'right', xMM: 0 })
    const center = compile({ anchorAlign: 'center', xMM: 0 })
    const w = textLineWidthMM(makeTextLineLayer({ text: 'SPECIMEN', sizeMM: 6 }), oswald())
    const firstX = (c: ReturnType<typeof compile>) => {
      const d = (c.shapes[0] as { d: string }).d
      return Number(d.match(/^M ([-\d.]+)/)![1])
    }
    expect(firstX(left) - firstX(center)).toBeCloseTo(w / 2, 4)
    expect(firstX(center) - firstX(right)).toBeCloseTo(w / 2, 4)
  })

  it('missing font compiles to a warning, not a crash', () => {
    const out = compileTextLine(makeTextLineLayer(), null, 0.01, DENSITY, LABEL_W)
    expect(out.shapes).toHaveLength(0)
    expect(out.warnings.join(' ')).toMatch(/Font unavailable/)
  })
})

describe('arch', () => {
  it('|arch| under the epsilon is byte-identical to straight', () => {
    const straight = compile({ archMM: 0 })
    const tiny = compile({ archMM: 0.01 })
    expect(tiny).toEqual(straight)
  })

  it('arc mode bows the run: edge glyphs sink, the middle rises', () => {
    const flat = compile({ archMM: 0 })
    const arched = compile({ archMM: 5 })
    const topOf = (c: ReturnType<typeof compile>) => {
      let min = Infinity
      const d = (c.shapes[0] as { d: string }).d
      for (const m of d.matchAll(/[ML] [-\d.]+ ([-\d.]+)/g)) min = Math.min(min, Number(m[1]))
      return min
    }
    // rainbow arch raises the run's top edge by roughly the sagitta
    expect(topOf(flat) - topOf(arched)).toBeGreaterThan(2.5)
    expect(topOf(flat) - topOf(arched)).toBeLessThan(7)
  })

  it('warp mode produces flattened outlines (L-only) that still form closed glyphs', () => {
    const out = compile({ archMM: 5, archMode: 'warp' })
    expect(out.shapes).toHaveLength(1)
    const d = (out.shapes[0] as { d: string }).d
    expect(d).toContain('L')
    expect(d).not.toContain('C') // flatten-then-warp: no curves survive
    expect(d.split('Z').length).toBeGreaterThan(4) // several closed contours
  })

  it('archWarp maps the baseline onto the circle, up = convex side', () => {
    const R = 40
    const xMid = 0
    const yC = 10 // rainbow: centre sits R below the apex
    const warp = archWarp(R, xMid, yC, true)
    // the apex: baseline point at xMid maps R above the centre
    const apex = warp({ x: 0, y: 0 })
    expect(apex.x).toBeCloseTo(0, 12)
    expect(apex.y).toBeCloseTo(yC - R, 12)
    // any baseline point stays exactly R from the centre
    const p = warp({ x: 18, y: 0 })
    expect(Math.hypot(p.x - xMid, p.y - yC)).toBeCloseTo(R, 9)
    // a point above the baseline (ascender, −y) lands OUTSIDE the circle
    const asc = warp({ x: 18, y: -4 })
    expect(Math.hypot(asc.x - xMid, asc.y - yC)).toBeCloseTo(R + 4, 9)
  })

  it('valley arch (negative) mirrors: the middle sinks', () => {
    const flat = compile({ archMM: 0 })
    const valley = compile({ archMM: -5 })
    const bottomOf = (c: ReturnType<typeof compile>) => {
      let max = -Infinity
      const d = (c.shapes[0] as { d: string }).d
      for (const m of d.matchAll(/[ML] [-\d.]+ ([-\d.]+)/g)) max = Math.max(max, Number(m[1]))
      return max
    }
    expect(bottomOf(valley) - bottomOf(flat)).toBeGreaterThan(2.5)
  })
})

describe('warnings', () => {
  it('legibility warning fires below ~2 threads per stem and not above', () => {
    const small = compile({ sizeMM: 4 })
    expect(small.warnings.join(' ')).toMatch(/threads at this density/)
    const big = compile({ sizeMM: 12 })
    expect(big.warnings.join(' ')).not.toMatch(/threads at this density/)
  })

  it('warns when the run is wider than the label', () => {
    const out = compile({ text: 'INCORPORATED MANUFACTURING CONCERN', sizeMM: 8 })
    expect(out.warnings.join(' ')).toMatch(/wider than/)
  })
})

describe('ring text', () => {
  const distsFrom = (c: ReturnType<typeof compile>, cx: number, cy: number) => {
    const d = (c.shapes[0] as { d: string }).d
    return [...d.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map((m) =>
      Math.hypot(Number(m[1]) - cx, Number(m[2]) - cy),
    )
  }

  it('places glyph outlines on a circle of radius ringMM around (xMM, yMM)', () => {
    const out = compile({ text: 'SEAL', ringMM: 20, xMM: 5, yMM: -3, sizeMM: 4 })
    expect(out.shapes).toHaveLength(1)
    const dists = distsFrom(out, 5, -3)
    // every outline point sits within an em of the 20 mm baseline ring
    const onRing = dists.filter((r) => Math.abs(r - 20) <= 4.5).length
    expect(onRing / dists.length).toBeGreaterThan(0.85)
  })

  it('top (outside) text sits above the centre; inside/bottom text sits below', () => {
    const topY = (c: ReturnType<typeof compile>) => {
      const d = (c.shapes[0] as { d: string }).d
      return [...d.matchAll(/[ML] [-\d.]+ ([-\d.]+)/g)].map((m) => Number(m[1]))
    }
    const top = topY(compile({ text: 'TOP', ringMM: 15, xMM: 0, yMM: 0, ringAnchorDeg: 0 }))
    expect(Math.max(...top)).toBeLessThan(-5) // above centre (−y)
    const bot = topY(
      compile({ text: 'BOT', ringMM: 15, xMM: 0, yMM: 0, ringAnchorDeg: 180, ringInside: true }),
    )
    expect(Math.min(...bot)).toBeGreaterThan(5) // below centre (+y)
  })

  it('ring overrides arch, and warns when the run outruns the circle', () => {
    const out = compile({ text: 'A VERY LONG WORDMARK THAT WRAPS', ringMM: 3, sizeMM: 4, archMM: 6 })
    expect(out.warnings.join(' ')).toMatch(/longer than the circle/)
    // still ring-placed (near the 3 mm ring), not arched
    expect(distsFrom(out, 0, 0).some((r) => r < 8)).toBe(true)
  })
})
