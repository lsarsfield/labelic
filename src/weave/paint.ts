import type { LabelDoc } from '../model/types'
import { loomProfile } from '../model/types'
import { DEG2RAD } from '../geometry/angle'
import { visiblePanelMM } from '../geometry/folds'
import { rgbToCss, shade, shadeCss } from './color'
import type { WeaveGrid } from './grid'
import { hash2 } from './grid'
import { groundTile } from './threadSprites'

/**
 * The thread painter. Weft floats are drawn as RUNS: a horizontal stretch of
 * same-thread cells is one continuous physical thread, so it renders as one
 * capsule (round ends only where the float turns under), with faint warp
 * dimples across it suggesting the ends it rides over. Adjacent picks stay
 * separate threads — the row seam is real. On-change rendering; callers
 * coalesce with rAF; there is no frame loop.
 */

export interface PaintOpts {
  /** Device pixels per mm. */
  pxPerMM: number
  /** Device-pixel position of the label centre on the target canvas. */
  originX: number
  originY: number
  lightDeg: number
}

/** Vertical light component: −1 = lit from straight above. */
const lightDy = (lightDeg: number) => -Math.cos(lightDeg * DEG2RAD)

export function paintWeave(
  ctx: CanvasRenderingContext2D,
  grid: WeaveGrid,
  doc: LabelDoc,
  opts: PaintOpts,
): void {
  const profile = loomProfile(doc.weave.loom, doc.weave.ground)
  const cellW = grid.cellWMM * opts.pxPerMM
  const cellH = grid.cellHMM * opts.pxPerMM
  const labelW = grid.cols * cellW
  const labelH = grid.rows * cellH
  const left = opts.originX - labelW / 2
  const top = opts.originY - labelH / 2

  ctx.save()

  // 1 — ground
  const tile = groundTile({
    warpHex: doc.weave.warp.hex,
    ground: doc.weave.ground,
    profile,
    lightDeg: opts.lightDeg,
    cellWpx: cellW,
    cellHpx: cellH,
  })
  ctx.save()
  ctx.translate(left, top)
  const pattern = ctx.createPattern(tile, 'repeat')
  if (pattern) {
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, labelW, labelH)
  }
  ctx.restore()

  // 2 — weft floats as runs
  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, labelW, labelH)
  ctx.clip()

  const dy = lightDy(opts.lightDeg)
  const litFromTop = dy <= 0
  const dyStrength = 0.6 + Math.abs(dy) * 0.4
  const gradients = doc.weave.wefts.map((w) => {
    const topShade = (litFromTop ? 0.22 + profile.sheen * 0.1 : -0.28) * dyStrength
    const botShade = (litFromTop ? -0.28 : 0.22 + profile.sheen * 0.1) * dyStrength
    // gradient in a unit row frame; we translate per row so y spans [0, cellH]
    const g = ctx.createLinearGradient(0, 0, 0, cellH)
    g.addColorStop(0.06, rgbToCss(shade(w.hex, topShade)))
    g.addColorStop(0.5, w.hex)
    g.addColorStop(0.94, rgbToCss(shade(w.hex, botShade)))
    return g
  })

  const { data, cols, rows } = grid
  const useFuzz = profile.fuzz > 0.12
  for (let r = 0; r < rows; r++) {
    const rowBase = r * cols
    const y = top + r * cellH
    ctx.save()
    ctx.translate(0, y) // row frame: gradients span this row's height
    let c = 0
    while (c < cols) {
      const v = data[rowBase + c]!
      if (v === 0) {
        c++
        continue
      }
      let end = c + 1
      while (end < cols && data[rowBase + end] === v) end++

      const wob = profile.jitter * ((hash2(c, r, v) % 1000) / 1000 - 0.5)
      const capH = cellH * (0.9 + wob * 0.18)
      const cy = cellH / 2 + wob * cellH * 0.14
      const x0 = left + c * cellW - cellW * 0.08
      const x1 = left + end * cellW + cellW * 0.08

      if (useFuzz) {
        ctx.shadowColor = shadeCss(doc.weave.wefts[v - 1]!.hex, 0.05, Math.min(0.5, profile.fuzz * 0.5))
        ctx.shadowBlur = profile.fuzz * cellH * 0.4
      }
      ctx.fillStyle = gradients[v - 1]!
      capsule(ctx, x0, x1, cy, capH)
      ctx.fill()
      ctx.shadowBlur = 0

      // specular stripe along the run
      if (profile.sheen > 0.2) {
        const sy = cy + (litFromTop ? -capH * 0.18 : capH * 0.18)
        ctx.fillStyle = `rgba(255,255,255,${0.28 * profile.sheen})`
        ctx.fillRect(x0 + capH * 0.4, sy - capH * 0.08, x1 - x0 - capH * 0.8, capH * 0.16)
      }

      // warp dimples: the ends this float rides over
      if (end - c > 1 && cellW > 2.5) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.13)'
        ctx.lineWidth = Math.max(0.5, cellW * 0.07)
        ctx.beginPath()
        for (let k = c + 1; k < end; k++) {
          const x = left + k * cellW
          ctx.moveTo(x, cy - capH * 0.42)
          ctx.lineTo(x, cy + capH * 0.42)
        }
        ctx.stroke()
      }

      c = end
    }
    ctx.restore()
  }

  // 3 — pick seams: adjacent picks are separate threads; keep the rows honest
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = Math.max(0.5, cellH * 0.05)
  ctx.beginPath()
  for (let r = 1; r < rows; r++) {
    const y = top + r * cellH
    ctx.moveTo(left, y)
    ctx.lineTo(left + labelW, y)
  }
  ctx.stroke()

  // 4 — directional sheen wash from the light
  const rad = opts.lightDeg * DEG2RAD
  const lx = Math.sin(rad)
  const ly = -Math.cos(rad)
  const wash = ctx.createLinearGradient(
    opts.originX + (lx * labelW) / 2,
    opts.originY + (ly * labelH) / 2,
    opts.originX - (lx * labelW) / 2,
    opts.originY - (ly * labelH) / 2,
  )
  wash.addColorStop(0, 'rgba(255,255,255,0.055)')
  wash.addColorStop(0.5, 'rgba(255,255,255,0)')
  wash.addColorStop(1, 'rgba(0,0,0,0.07)')
  ctx.fillStyle = wash
  ctx.fillRect(left, top, labelW, labelH)
  ctx.restore() // clip off

  // 5 — edges
  paintSideEdges(ctx, doc, { left, top, labelW, labelH, cellW, cellH })
  paintEnds(ctx, doc, { left, top, labelW, labelH, cellW, cellH })

  ctx.restore()
}

/**
 * Folded presentation: the flat weave rendered offscreen, then the finished
 * visible panel composited at its true position with a drop shadow and
 * fold-roll shading. Fabric is cropped at fold lines — the folded-under
 * material is behind the panel, and the roll gradient at a folded edge is
 * what reads as cloth turning over.
 */
export function paintFoldedWeave(
  ctx: CanvasRenderingContext2D,
  grid: WeaveGrid,
  doc: LabelDoc,
  opts: PaintOpts,
): void {
  const cellW = grid.cellWMM * opts.pxPerMM
  const cellH = grid.cellHMM * opts.pxPerMM
  const labelW = grid.cols * cellW
  const labelH = grid.rows * cellH

  // 1 — flat weave, offscreen
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(labelW))
  off.height = Math.max(1, Math.ceil(labelH))
  const offCtx = off.getContext('2d')
  if (!offCtx) return
  paintWeave(offCtx, grid, doc, {
    pxPerMM: opts.pxPerMM,
    originX: off.width / 2,
    originY: off.height / 2,
    lightDeg: opts.lightDeg,
  })

  // 2 — the visible panel, at its true position
  const panel = visiblePanelMM(doc.fold, doc.widthMM, doc.heightMM)
  const px = (mm: number) => mm * opts.pxPerMM
  const labelLeft = opts.originX - labelW / 2
  const labelTop = opts.originY - labelH / 2
  const dst = {
    x: labelLeft + px(panel.x + doc.widthMM / 2),
    y: labelTop + px(panel.y + doc.heightMM / 2),
    w: px(panel.w),
    h: px(panel.h),
  }
  const src = {
    x: px(panel.x + doc.widthMM / 2),
    y: px(panel.y + doc.heightMM / 2),
    w: px(panel.w),
    h: px(panel.h),
  }

  // drop shadow cast by the fabric onto the page, offset away from the light
  const rad = opts.lightDeg * DEG2RAD
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = px(1.6)
  ctx.shadowOffsetX = -Math.sin(rad) * px(0.7)
  ctx.shadowOffsetY = Math.cos(rad) * px(0.7)
  ctx.fillStyle = doc.weave.warp.hex
  ctx.fillRect(dst.x, dst.y, dst.w, dst.h)
  ctx.restore()

  ctx.drawImage(off, src.x, src.y, src.w, src.h, dst.x, dst.y, dst.w, dst.h)

  // 3 — fold rolls: a bright turn line fading into shade, along each folded edge
  const roll = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    inward: { x: number; y: number },
  ) => {
    const depth = px(1.4)
    const grad = ctx.createLinearGradient(x0, y0, x0 + inward.x * depth, y0 + inward.y * depth)
    grad.addColorStop(0, 'rgba(255,255,255,0.22)')
    grad.addColorStop(0.25, 'rgba(0,0,0,0.28)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    const w = inward.x !== 0 ? depth : x1 - x0
    const h = inward.y !== 0 ? depth : y1 - y0
    ctx.fillRect(inward.x < 0 ? x0 - depth : x0, inward.y < 0 ? y0 - depth : y0, w, h)
  }

  switch (doc.fold) {
    case 'endFold':
      roll(dst.x, dst.y, dst.x, dst.y + dst.h, { x: 1, y: 0 })
      roll(dst.x + dst.w, dst.y, dst.x + dst.w, dst.y + dst.h, { x: -1, y: 0 })
      break
    case 'loopFold':
      // the loop's turn is the panel's bottom edge
      roll(dst.x, dst.y + dst.h, dst.x + dst.w, dst.y + dst.h, { x: 0, y: -1 })
      break
    case 'centreFold':
      // book spine on the left
      roll(dst.x, dst.y, dst.x, dst.y + dst.h, { x: 1, y: 0 })
      break
    case 'mitreFold': {
      // 45° tabs folded behind the bottom corners: diagonal crease shadows
      const m = px(Math.min(3, doc.widthMM / 4, doc.heightMM))
      for (const side of [0, 1] as const) {
        const cx = side === 0 ? dst.x : dst.x + dst.w
        const dir = side === 0 ? 1 : -1
        const grad = ctx.createLinearGradient(cx + (dir * m) / 2, dst.y + dst.h - m / 2, cx, dst.y + dst.h)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, 'rgba(0,0,0,0.35)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.moveTo(cx, dst.y + dst.h - m)
        ctx.lineTo(cx + dir * m, dst.y + dst.h)
        ctx.lineTo(cx, dst.y + dst.h)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.14)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx, dst.y + dst.h - m)
        ctx.lineTo(cx + dir * m, dst.y + dst.h)
        ctx.stroke()
      }
      break
    }
    case 'straight':
      break
  }

  // 4 — a whisper of curl: corners lift slightly away from the page
  const curl = ctx.createRadialGradient(
    dst.x + dst.w / 2,
    dst.y + dst.h / 2,
    Math.min(dst.w, dst.h) * 0.35,
    dst.x + dst.w / 2,
    dst.y + dst.h / 2,
    Math.hypot(dst.w, dst.h) / 2,
  )
  curl.addColorStop(0, 'rgba(0,0,0,0)')
  curl.addColorStop(1, 'rgba(0,0,0,0.10)')
  ctx.fillStyle = curl
  ctx.fillRect(dst.x, dst.y, dst.w, dst.h)
}

/** Horizontal capsule from x0 to x1, centred on cy, height h. */
function capsule(ctx: CanvasRenderingContext2D, x0: number, x1: number, cy: number, h: number): void {
  const r = h / 2
  const w = x1 - x0
  ctx.beginPath()
  if (w <= h) {
    // shorter than round caps allow: an ellipse-ish blob
    ctx.ellipse((x0 + x1) / 2, cy, Math.max(w / 2, 0.5), r, 0, 0, Math.PI * 2)
    return
  }
  ctx.moveTo(x0 + r, cy - r)
  ctx.lineTo(x1 - r, cy - r)
  ctx.arc(x1 - r, cy, r, -Math.PI / 2, Math.PI / 2)
  ctx.lineTo(x0 + r, cy + r)
  ctx.arc(x0 + r, cy, r, Math.PI / 2, (3 * Math.PI) / 2)
  ctx.closePath()
}

interface EdgeBox {
  left: number
  top: number
  labelW: number
  labelH: number
  cellW: number
  cellH: number
}

/** Left/right: woven selvedge (shuttle) vs hot/ultrasonic cut (needle). */
function paintSideEdges(ctx: CanvasRenderingContext2D, doc: LabelDoc, b: EdgeBox): void {
  const warp = doc.weave.warp.hex
  if (doc.weave.edge === 'selvedge') {
    // the weft turns back at the edge: a tight rounded turn every other pick
    ctx.save()
    ctx.strokeStyle = shadeCss(warp, 0.12, 0.8)
    ctx.lineWidth = Math.max(0.7, b.cellH * 0.3)
    const rTurn = b.cellH * 0.55
    for (const side of [0, 1] as const) {
      const x = side === 0 ? b.left + rTurn * 0.5 : b.left + b.labelW - rTurn * 0.5
      ctx.beginPath()
      for (let y = b.top + rTurn; y < b.top + b.labelH - rTurn * 0.5; y += b.cellH * 2) {
        ctx.moveTo(x + (side === 0 ? rTurn : -rTurn) * 0.4, y - rTurn * 0.45)
        ctx.arc(x, y, rTurn * 0.45, side === 0 ? -Math.PI / 2 : Math.PI / 2, side === 0 ? Math.PI / 2 : (3 * Math.PI) / 2, side === 1)
      }
      ctx.stroke()
      // inward shadow that sets the selvedge band off the field
      const bandW = b.cellW * 1.2
      const gx = side === 0 ? b.left : b.left + b.labelW
      const grad = ctx.createLinearGradient(gx, 0, side === 0 ? gx + bandW : gx - bandW, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0.16)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(side === 0 ? gx : gx - bandW, b.top, bandW, b.labelH)
    }
    ctx.restore()
    return
  }
  // hot / ultrasonic cut: crisp dark melt line, ultrasonic adds a bead
  ctx.save()
  for (const side of [0, 1] as const) {
    const x = side === 0 ? b.left : b.left + b.labelW
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, b.top)
    ctx.lineTo(x, b.top + b.labelH)
    ctx.stroke()
    if (doc.weave.edge === 'ultrasonic') {
      ctx.strokeStyle = shadeCss(doc.weave.warp.hex, 0.25, 0.5)
      ctx.beginPath()
      ctx.moveTo(x + (side === 0 ? 1.2 : -1.2), b.top)
      ctx.lineTo(x + (side === 0 ? 1.2 : -1.2), b.top + b.labelH)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** Top/bottom ends: fray ticks on a shuttle blank, a cut line on needle. */
function paintEnds(ctx: CanvasRenderingContext2D, doc: LabelDoc, b: EdgeBox): void {
  ctx.save()
  if (doc.weave.loom === 'shuttle') {
    ctx.strokeStyle = shadeCss(doc.weave.warp.hex, 0.18, 0.55)
    ctx.lineWidth = Math.max(0.6, b.cellW * 0.14)
    ctx.beginPath()
    const cols = Math.round(b.labelW / b.cellW)
    for (let c = 0; c < cols; c++) {
      const h = hash2(c, 0, 11)
      if (h % 4 !== 0) continue
      const x = b.left + (c + 0.5) * b.cellW
      const len = b.cellH * (0.25 + (h % 3) * 0.12)
      ctx.moveTo(x, b.top)
      ctx.lineTo(x, b.top - len)
      const h2v = hash2(c, 1, 13)
      if (h2v % 4 === 0) {
        const len2 = b.cellH * (0.25 + (h2v % 3) * 0.12)
        ctx.moveTo(x, b.top + b.labelH)
        ctx.lineTo(x, b.top + b.labelH + len2)
      }
    }
    ctx.stroke()
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(b.left, b.top)
    ctx.lineTo(b.left + b.labelW, b.top)
    ctx.moveTo(b.left, b.top + b.labelH)
    ctx.lineTo(b.left + b.labelW, b.top + b.labelH)
    ctx.stroke()
  }
  ctx.restore()
}
