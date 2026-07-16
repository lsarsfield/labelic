import type { Font } from 'opentype.js'
import type { TextLineLayer } from '../model/types'
import { RAD2DEG } from './angle'
import { flattenSegs } from './flatten'
import { glyphPathD, opentypePathToSegs } from './glyphs'
import { rotateThenTranslate, translation } from './mat2d'
import type { CompiledLayer, Shape } from './shapes'
import { fillPaint } from './shapes'
import { subPathsToD, warpSubPaths, type WarpFn } from './warp'

/**
 * A line of text on a straight or gently arched baseline — the vintage-label
 * analogue of coin ring text. Layout is shared: per-glyph advances with
 * kerning and letter-spacing, anchored left/center/right at (xMM, yMM).
 *
 * Arch (`archMM` = sagitta, + bows up / − bows down) places the baseline on a
 * circle of radius R = W²/(8|s|) + |s|/2 (chord W = laid-out width), with
 * ARC LENGTH preserved along the baseline so letterforms never squeeze:
 *  - `arc` mode (default): upright glyphs rotated tangent — exact beziers,
 *    the classic arched-wordmark look.
 *  - `warp` mode: outlines genuinely bent through the arc map (stems curve),
 *    flatten-then-warp like every non-affine map in this codebase.
 *
 * Below ~0.05 mm of sagitta the arch is treated as straight (R would exceed
 * metres; the eye can't see it and huge radii invite float noise).
 */

const MIN_ARCH_MM = 0.05
/** Serviceable regular-weight stem estimate, em-relative, for legibility warnings. */
const STEM_EM = 0.09

export interface TextLineDensity {
  endsPerMM: number
  picksPerMM: number
}

export function compileTextLine(
  layer: TextLineLayer,
  font: Font | null,
  toleranceMM: number,
  density: TextLineDensity,
  labelWidthMM: number,
): CompiledLayer {
  const warnings: string[] = []
  const shapes: Shape[] = []

  if (!font) {
    warnings.push('Font unavailable — text not rendered (loading, or a missing local font).')
    return { shapes, warnings }
  }
  if (layer.text.length === 0 || layer.sizeMM <= 0) return { shapes, warnings }

  const scale = layer.sizeMM / font.unitsPerEm
  const glyphs = font.stringToGlyphs(layer.text)
  const advanceMM = glyphs.map((g) => (g.advanceWidth ?? 0) * scale)
  const gapMM = glyphs.map((g, i) => {
    if (i === glyphs.length - 1) return 0
    const kern = layer.useKerning ? font.getKerningValue(g, glyphs[i + 1]!) * scale : 0
    return kern + layer.letterSpacingMM
  })
  const totalMM = advanceMM.reduce((s, a) => s + a, 0) + gapMM.reduce((s, k) => s + k, 0)

  // left edge of the run, from the anchor alignment
  const x0 =
    layer.anchorAlign === 'left'
      ? layer.xMM
      : layer.anchorAlign === 'right'
        ? layer.xMM - totalMM
        : layer.xMM - totalMM / 2

  if (totalMM > labelWidthMM) {
    warnings.push(`Text is ${totalMM.toFixed(1)} mm wide — wider than the ${labelWidthMM} mm label.`)
  }
  const minDensity = Math.min(density.endsPerMM, density.picksPerMM)
  if (STEM_EM * layer.sizeMM * minDensity < 1.6) {
    const legibleMM = 1.6 / (STEM_EM * minDensity)
    warnings.push(
      `Text strokes span under ~2 threads at this density — expect chunky or broken strokes below ≈ ${legibleMM.toFixed(1)} mm.`,
    )
  }

  const sag = Math.abs(layer.archMM) < MIN_ARCH_MM ? 0 : layer.archMM

  if (sag === 0) {
    // straight baseline: exact glyph outlines, one merged path
    const parts: string[] = []
    let cursor = x0
    for (let i = 0; i < glyphs.length; i++) {
      const path = glyphs[i]!.getPath(cursor, layer.yMM, layer.sizeMM)
      const d = glyphPathD(path, translation(0, 0))
      if (d.length > 0) parts.push(d)
      cursor += advanceMM[i]! + gapMM[i]!
    }
    if (parts.length > 0) shapes.push({ kind: 'path', d: parts.join(' '), paint: fillPaint() })
    return { shapes, warnings }
  }

  // arched baseline
  const s = Math.abs(sag)
  const up = sag > 0 // rainbow (bows toward −y) vs valley
  const W = Math.max(totalMM, 0.1)
  const R = (W * W) / (8 * s) + s / 2
  const xMid = x0 + totalMM / 2
  // circle centre: R beyond the apex, on the concave side of the baseline
  const yC = up ? layer.yMM - s + R : layer.yMM + s - R

  if (s > W / 2) {
    warnings.push('Arch exceeds half the text width — the curve is past a semicircle and will distort.')
  }

  if (layer.archMode === 'warp') {
    // Bend the outlines through the arc map. Source space: glyphs laid on a
    // straight baseline at y = 0, x in label coordinates.
    const warp = archWarp(R, xMid, yC, up)
    const parts: string[] = []
    let cursor = x0
    for (let i = 0; i < glyphs.length; i++) {
      const segs = opentypePathToSegs(glyphs[i]!.getPath(cursor, 0, layer.sizeMM))
      const subs = warpSubPaths(flattenSegs(segs, toleranceMM), warp, toleranceMM)
      const d = subPathsToD(subs)
      if (d.length > 0) parts.push(d)
      cursor += advanceMM[i]! + gapMM[i]!
    }
    if (parts.length > 0) shapes.push({ kind: 'path', d: parts.join(' '), paint: fillPaint() })
    return { shapes, warnings }
  }

  // arc mode: upright glyphs placed by their advance midpoints along the arc,
  // rotated tangent. Arc length along the baseline = laid-out length.
  const parts: string[] = []
  let cursor = 0 // arc-length position along the run, from its left end
  for (let i = 0; i < glyphs.length; i++) {
    const mid = cursor + advanceMM[i]! / 2
    const u = x0 + mid - xMid // signed arc length from the apex
    const a = u / R // radians
    const px = xMid + R * Math.sin(a)
    const py = up ? yC - R * Math.cos(a) : yC + R * Math.cos(a)
    const rotDeg = (up ? a : -a) * RAD2DEG
    // glyph drawn with its advance midpoint at the origin, baseline at y=0
    const path = glyphs[i]!.getPath(-advanceMM[i]! / 2, 0, layer.sizeMM)
    const d = glyphPathD(path, rotateThenTranslate(rotDeg, px, py))
    if (d.length > 0) parts.push(d)
    cursor += advanceMM[i]! + gapMM[i]!
  }
  if (parts.length > 0) shapes.push({ kind: 'path', d: parts.join(' '), paint: fillPaint() })
  return { shapes, warnings }
}

/**
 * Baseline-space → arched-label-space map. Source y is height relative to the
 * baseline (y-down: ascenders negative); the glyph's up direction maps to the
 * convex side of the arch so type always reads upright.
 */
export function archWarp(R: number, xMid: number, yC: number, up: boolean): WarpFn {
  return (p) => {
    const a = (p.x - xMid) / R
    if (up) {
      const r = R - p.y // up (−y) = outward, away from the centre below
      return { x: xMid + r * Math.sin(a), y: yC - r * Math.cos(a) }
    }
    const r = R + p.y // up (−y) = toward the centre above
    return { x: xMid + r * Math.sin(a), y: yC + r * Math.cos(a) }
  }
}

/** Laid-out run width in mm (layout metadata for tests, handles, warnings). */
export function textLineWidthMM(layer: TextLineLayer, font: Font): number {
  const scale = layer.sizeMM / font.unitsPerEm
  const glyphs = font.stringToGlyphs(layer.text)
  let mm = 0
  for (let i = 0; i < glyphs.length; i++) {
    mm += (glyphs[i]!.advanceWidth ?? 0) * scale
    if (i < glyphs.length - 1) {
      mm += layer.letterSpacingMM
      if (layer.useKerning) mm += font.getKerningValue(glyphs[i]!, glyphs[i + 1]!) * scale
    }
  }
  return mm
}
