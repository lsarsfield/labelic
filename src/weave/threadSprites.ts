import type { GroundWeave, LoomProfile } from '../model/types'
import { rgbToCss, shade, shadeCss } from './color'
import { DEG2RAD } from '../geometry/angle'

/**
 * Prerendered ground tiles. The ground is a 2×2-cell tile applied via
 * createPattern (painting per-thread would melt at needle density); weft
 * floats are painted as continuous runs in paint.ts.
 */

/** Vertical light component: −1 = lit from straight above, +1 = from below. */
function lightDy(lightDeg: number): number {
  return -Math.cos(lightDeg * DEG2RAD)
}

const quantize = (n: number, step: number) => Math.round(n / step) * step

const tileCache = new Map<string, HTMLCanvasElement>()
const textureCache = new Map<string, HTMLCanvasElement>()

export interface WeaveTextureParams {
  cellWpx: number
  cellHpx: number
  lightDeg: number
}

/**
 * A one-cell RGBA overlay tiled across the WHOLE label (ground and figure
 * alike) so every surface reads as interlaced thread, not flat colour. It
 * encodes the weave structure: vertical warp ribbing (dark valleys at the
 * column gaps, a lit crown offset toward the light) plus a pick-gap shadow
 * at each row boundary. Drawn over the weft floats, this is what makes woven
 * letters show the warp crossing them — the single biggest "it's cloth" tell.
 */
export function weaveTextureTile(p: WeaveTextureParams): HTMLCanvasElement {
  const key = [quantize(p.cellWpx, 0.5), quantize(p.cellHpx, 0.5), quantize(lightDy(p.lightDeg), 0.25), quantize(Math.sin(p.lightDeg * DEG2RAD), 0.25)].join('|')
  const hit = textureCache.get(key)
  if (hit) return hit

  const cw = Math.max(2, Math.round(p.cellWpx))
  const ch = Math.max(2, Math.round(p.cellHpx))
  const canvas = makeCanvas(cw, ch)
  const ctx = canvas.getContext('2d')!

  // vertical warp rib: dark at the column edges (the inter-warp valley when
  // tiled), a lit crown shifted toward the horizontal light direction
  const lx = Math.sin(p.lightDeg * DEG2RAD)
  const crown = Math.max(0.3, Math.min(0.7, 0.5 + lx * 0.28))
  const g = ctx.createLinearGradient(0, 0, cw, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.17)')
  g.addColorStop(Math.max(0.12, crown - 0.18), 'rgba(255,255,255,0.055)')
  g.addColorStop(crown, 'rgba(255,255,255,0.11)')
  g.addColorStop(Math.min(0.88, crown + 0.18), 'rgba(255,255,255,0.055)')
  g.addColorStop(1, 'rgba(0,0,0,0.17)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cw, ch)

  // pick gap: a thin shadow at the row boundary + a faint crown highlight
  const gap = Math.max(1, Math.round(ch * 0.12))
  ctx.fillStyle = 'rgba(0,0,0,0.13)'
  ctx.fillRect(0, ch - gap, cw, gap)
  ctx.fillStyle = 'rgba(255,255,255,0.045)'
  ctx.fillRect(0, 0, cw, Math.max(1, Math.round(ch * 0.1)))

  textureCache.set(key, canvas)
  return canvas
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w))
  c.height = Math.max(1, Math.ceil(h))
  return c
}

export interface GroundTileParams {
  warpHex: string
  ground: GroundWeave
  profile: LoomProfile
  lightDeg: number
  cellWpx: number
  cellHpx: number
}

/**
 * A 2×2-cell ground tile for createPattern. Taffeta = matte plain-weave
 * checker; satin = elongated warp floats with vertical sheen; damask =
 * fine dense twill diagonal.
 */
export function groundTile(p: GroundTileParams): HTMLCanvasElement {
  const key = [
    p.warpHex,
    p.ground,
    quantize(p.cellWpx, 0.5),
    quantize(p.cellHpx, 0.5),
    quantize(lightDy(p.lightDeg), 0.25),
    p.profile.sheen,
  ].join('|')
  const hit = tileCache.get(key)
  if (hit) return hit

  const cw = Math.max(1, p.cellWpx)
  const ch = Math.max(1, p.cellHpx)
  const canvas = makeCanvas(cw * 2, ch * 2)
  const ctx = canvas.getContext('2d')!
  const dy = lightDy(p.lightDeg)
  const litFromTop = dy <= 0
  const hex = p.warpHex

  // base
  ctx.fillStyle = shadeCss(hex, -0.12)
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bump = (x: number, y: number, w: number, h: number, vertical: boolean, lift: number) => {
    const grad = vertical
      ? ctx.createLinearGradient(x, 0, x + w, 0)
      : ctx.createLinearGradient(0, y, 0, y + h)
    const lit = litFromTop ? lift : -lift * 0.6
    grad.addColorStop(0, rgbToCss(shade(hex, lit)))
    grad.addColorStop(0.5, rgbToCss(shade(hex, lift * 0.35)))
    grad.addColorStop(1, rgbToCss(shade(hex, -lift)))
    ctx.fillStyle = grad
    const r = Math.min(w, h) / 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  }

  if (p.ground === 'taffeta') {
    // plain weave: over/under checker, matte
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const over = (i + j) % 2 === 0
        const inset = 0.08
        bump(
          (i + (over ? inset * 0.5 : inset)) * cw,
          (j + (over ? inset : inset * 0.5)) * ch,
          cw * (over ? 0.9 : 0.82),
          ch * (over ? 0.82 : 0.9),
          over,
          0.1,
        )
      }
    }
  } else if (p.ground === 'satin') {
    // warp floats: tall columns with sheen
    for (let i = 0; i < 2; i++) {
      bump(i * cw + cw * 0.06, -ch * 0.2, cw * 0.88, ch * 2.4, true, 0.16)
    }
    const spec = ctx.createLinearGradient(0, 0, canvas.width, 0)
    spec.addColorStop(0, 'rgba(255,255,255,0)')
    spec.addColorStop(0.5, `rgba(255,255,255,${0.14 * p.profile.sheen})`)
    spec.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = spec
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    // damask: fine dense 45° twill
    ctx.strokeStyle = shadeCss(hex, 0.14, 0.65)
    ctx.lineWidth = Math.max(0.6, ch * 0.16)
    const step = Math.max(1.5, ch * 0.5)
    ctx.beginPath()
    for (let d = -canvas.height; d < canvas.width + canvas.height; d += step) {
      ctx.moveTo(d, canvas.height + 1)
      ctx.lineTo(d + canvas.height + 2, -1)
    }
    ctx.stroke()
    ctx.strokeStyle = shadeCss(hex, -0.2, 0.5)
    ctx.beginPath()
    for (let d = -canvas.height + step / 2; d < canvas.width + canvas.height; d += step) {
      ctx.moveTo(d, canvas.height + 1)
      ctx.lineTo(d + canvas.height + 2, -1)
    }
    ctx.stroke()
  }

  tileCache.set(key, canvas)
  return canvas
}

export function _resetSpriteCachesForTests(): void {
  tileCache.clear()
  textureCache.clear()
}
