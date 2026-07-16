import type { LabelDoc, Layer } from '../model/types'
import { CELL_BUDGET, GROUND_WEFT_INDEX, maxWeftsFor } from '../model/types'
import { compileLayer, EXPORT_TOLERANCE_MM, type CompileCtx } from '../geometry/compile'
import { expandInstanced, defMatrix } from '../geometry/expand'
import { foldLinesMM } from '../geometry/folds'
import { dilatedShapes, haloOf } from '../geometry/halo'
import { fmt } from '../geometry/format'
import { flattenSegs } from '../geometry/flatten'
import { parsePathData, transformSegs } from '../geometry/pathData'
import type { Paint, Shape } from '../geometry/shapes'
import { stringifyDoc } from '../model/serialize'
import { getLoadedFont } from './fonts'
import { getSvgAsset } from './svgAssets'

/**
 * Artwork export: the mm-true flat file a label mill weaves from. Recompiles
 * every layer at export tolerance, (by default) expands all instances to
 * plain paths, colors each layer in its weft thread's hex (the capped palette
 * IS the deliverable — the mill's software maps flat colors to threads), and
 * embeds the project JSON in <metadata> so the exported SVG re-opens as a
 * document. No filters, no masks, no CSS.
 */

export interface SvgExportOptions {
  expandInstances: boolean
  /** Draw the warp-colored ground rect under the artwork (default true). */
  includeGround: boolean
  /** Label outline + fold lines as a light guides group (default true). */
  includeGuides: boolean
  /** Embed the project JSON in <metadata> (default true; thumbnails pass false). */
  embedProject?: boolean
}

export const DEFAULT_SVG_OPTIONS: SvgExportOptions = {
  expandInstances: true,
  includeGround: true,
  includeGuides: true,
}

export interface SvgExportResult {
  svg: string
  warnings: string[]
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function paintAttrs(paint: Paint, hex: string): string {
  const parts: string[] = []
  parts.push(`fill="${paint.fill ? hex : 'none'}"`)
  if (paint.stroke) {
    const join = paint.stroke.join ? ` stroke-linejoin="${paint.stroke.join}"` : ''
    parts.push(
      `stroke="${hex}" stroke-width="${fmt(paint.stroke.widthMM)}" stroke-linecap="${paint.stroke.cap}"${join}`,
    )
  }
  return parts.join(' ')
}

function shapeToMarkup(shape: Shape, hex: string, defIdBase: string, out: string[], defs: string[]): void {
  switch (shape.kind) {
    case 'circle':
      out.push(`<circle r="${fmt(shape.rMM)}" ${paintAttrs(shape.paint, hex)}/>`)
      break
    case 'line':
      out.push(
        `<line x1="${fmt(shape.x1)}" y1="${fmt(shape.y1)}" x2="${fmt(shape.x2)}" y2="${fmt(
          shape.y2,
        )}" ${paintAttrs(shape.paint, hex)}/>`,
      )
      break
    case 'path': {
      const fr = shape.fillRule ? ` fill-rule="${shape.fillRule}"` : ''
      out.push(`<path d="${shape.d}"${fr} ${paintAttrs(shape.paint, hex)}/>`)
      break
    }
    case 'instanced': {
      const dm = defMatrix(shape.def)
      const strokeScale = Math.abs(shape.def.scale)
      const adjustedPaint: Paint = shape.paint.stroke
        ? {
            ...shape.paint,
            stroke: { ...shape.paint.stroke, widthMM: shape.paint.stroke.widthMM / strokeScale },
          }
        : shape.paint
      const matAttr = `matrix(${fmt(dm.a)} ${fmt(dm.b)} ${fmt(dm.c)} ${fmt(dm.d)} ${fmt(dm.e)} ${fmt(dm.f)})`
      defs.push(
        `<path id="${defIdBase}" d="${shape.def.d}" transform="${matAttr}" ${paintAttrs(adjustedPaint, hex)}/>`,
      )
      for (const tr of shape.transforms) {
        const parts: string[] = []
        if (tr.dx !== 0 || tr.dy !== 0) parts.push(`translate(${fmt(tr.dx)} ${fmt(tr.dy)})`)
        if (tr.rotateDeg !== 0) parts.push(`rotate(${fmt(tr.rotateDeg)})`)
        if (tr.mirrorX) parts.push('scale(-1 1)')
        const t = parts.length > 0 ? ` transform="${parts.join(' ')}"` : ''
        out.push(`<use href="#${defIdBase}"${t}/>`)
      }
      break
    }
  }
}

/** Rough axis-aligned extents of a shape in mm, for the off-label warning. */
function shapeExtentsMM(shape: Shape): { x: number; y: number } {
  let mx = 0
  let my = 0
  const eat = (x: number, y: number) => {
    mx = Math.max(mx, Math.abs(x))
    my = Math.max(my, Math.abs(y))
  }
  switch (shape.kind) {
    case 'circle':
      eat(shape.rMM, shape.rMM)
      break
    case 'line':
      eat(shape.x1, shape.y1)
      eat(shape.x2, shape.y2)
      break
    case 'path':
      for (const sub of flattenSegs(parsePathData(shape.d), 0.1)) {
        for (const p of sub.pts) eat(p.x, p.y)
      }
      break
    case 'instanced': {
      let defMax = 0
      const segs = transformSegs(parsePathData(shape.def.d), defMatrix(shape.def))
      for (const sub of flattenSegs(segs, 0.1)) {
        for (const p of sub.pts) defMax = Math.max(defMax, Math.hypot(p.x, p.y))
      }
      for (const tr of shape.transforms) eat(Math.abs(tr.dx) + defMax, Math.abs(tr.dy) + defMax)
      break
    }
  }
  return { x: mx, y: my }
}

/** The thread hex a layer exports in. */
function exportHex(doc: LabelDoc, layer: Layer): { hex: string; threadName: string } {
  if (layer.weftIndex === GROUND_WEFT_INDEX) {
    return { hex: doc.weave.warp.hex, threadName: `Ground · ${doc.weave.warp.name}` }
  }
  const weft = doc.weave.wefts[layer.weftIndex] ?? doc.weave.wefts[0]
  return weft
    ? { hex: weft.hex, threadName: `${weft.name} ${weft.hex}` }
    : { hex: doc.weave.warp.hex, threadName: 'Ground' }
}

export function exportArtworkSvg(
  doc: LabelDoc,
  options: SvgExportOptions = DEFAULT_SVG_OPTIONS,
): SvgExportResult {
  const warnings: string[] = []
  const w2 = doc.widthMM / 2
  const h2 = doc.heightMM / 2
  const ctx: CompileCtx = {
    widthMM: doc.widthMM,
    heightMM: doc.heightMM,
    endsPerMM: doc.weave.endsPerMM,
    picksPerMM: doc.weave.picksPerMM,
    toleranceMM: EXPORT_TOLERANCE_MM,
    assetsRevision: -1, // export never reuses the interactive memo entries
    fontsRevision: -1,
    getFont: getLoadedFont,
    getSvgAsset,
  }

  const minStrokeMM = 1 / doc.weave.picksPerMM
  const cap = maxWeftsFor(doc.weave.loom)
  if (doc.weave.wefts.length > cap) {
    warnings.push(
      `${doc.weave.wefts.length} weft threads — a ${doc.weave.loom} loom carries at most ${cap}`,
    )
  }
  const cells =
    Math.round(doc.widthMM * doc.weave.endsPerMM) * Math.round(doc.heightMM * doc.weave.picksPerMM)
  if (cells > CELL_BUDGET) {
    warnings.push(`${cells.toLocaleString()} weave cells — reduce density or label size`)
  }

  const layerMarkup: string[] = []
  const defs: string[] = []

  doc.layers.forEach((layer) => {
    if (!layer.visible) return
    const compiled = compileLayer(layer, ctx)
    for (const w of compiled.warnings) warnings.push(`${layer.name}: ${w}`)

    const { hex, threadName } = exportHex(doc, layer)
    const body: string[] = []
    // halo: the clearance moat under-painted in the warp color, inside this
    // layer's group (above lower layers, below the layer's own thread)
    const halo = haloOf(layer)
    if (halo > 0) {
      dilatedShapes(compiled.shapes, halo).forEach((shape, si) => {
        if (shape.kind === 'instanced' && options.expandInstances) {
          for (const flat of expandInstanced(shape)) {
            shapeToMarkup(flat, doc.weave.warp.hex, '', body, defs)
          }
        } else {
          shapeToMarkup(shape, doc.weave.warp.hex, `halo-${layer.id}-${si}`, body, defs)
        }
      })
    }
    compiled.shapes.forEach((shape, si) => {
      if (shape.paint.stroke && shape.paint.stroke.widthMM < minStrokeMM) {
        warnings.push(
          `${layer.name}: stroke ${shape.paint.stroke.widthMM.toFixed(2)} mm is thinner than one pick (${minStrokeMM.toFixed(2)} mm at this density)`,
        )
      }
      const ext = shapeExtentsMM(shape)
      if (ext.x > w2 + 0.01 || ext.y > h2 + 0.01) {
        warnings.push(`${layer.name}: geometry extends beyond the label`)
      }
      if (shape.kind === 'instanced' && options.expandInstances) {
        for (const flat of expandInstanced(shape)) shapeToMarkup(flat, hex, '', body, defs)
      } else {
        shapeToMarkup(shape, hex, `def-${layer.id}-${si}`, body, defs)
      }
    })
    if (body.length === 0) return

    layerMarkup.push(
      `<g id="layer-${layer.id}" data-name="${xmlEscape(layer.name)}" data-thread="${xmlEscape(threadName)}">\n${body.join('\n')}\n</g>`,
    )
  })

  const ground = options.includeGround
    ? `<rect x="${fmt(-w2)}" y="${fmt(-h2)}" width="${fmt(doc.widthMM)}" height="${fmt(doc.heightMM)}" fill="${doc.weave.warp.hex}" data-name="ground · ${xmlEscape(doc.weave.warp.name)}"/>`
    : ''
  const guideLines = foldLinesMM(doc.fold, doc.widthMM, doc.heightMM)
    .map(
      (f) =>
        `<line x1="${fmt(f.x1)}" y1="${fmt(f.y1)}" x2="${fmt(f.x2)}" y2="${fmt(f.y2)}" stroke="#00000022" stroke-width="0.05" stroke-dasharray="0.8 0.4"/>`,
    )
    .join('\n')
  const guides = options.includeGuides
    ? `<g data-name="guides">
<rect x="${fmt(-w2)}" y="${fmt(-h2)}" width="${fmt(doc.widthMM)}" height="${fmt(doc.heightMM)}" fill="none" stroke="#00000022" stroke-width="0.05"/>
${guideLines}
</g>`
    : ''
  const defsBlock = defs.length > 0 ? `<defs>\n${defs.join('\n')}\n</defs>\n` : ''
  const meta =
    options.embedProject === false
      ? ''
      : `<metadata id="labelic-project">${xmlEscape(stringifyDoc(doc))}</metadata>`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(-w2)} ${fmt(-h2)} ${fmt(doc.widthMM)} ${fmt(
    doc.heightMM,
  )}" width="${fmt(doc.widthMM)}mm" height="${fmt(doc.heightMM)}mm">
<title>${xmlEscape(doc.name)}</title>
${meta}
${defsBlock}<g id="artwork">
${ground}
${layerMarkup.join('\n')}
${guides}
</g>
</svg>`

  return { svg, warnings: [...new Set(warnings)] }
}

/** Re-open an exported SVG as a project (reads the embedded metadata JSON). */
export function extractEmbeddedProject(svgText: string): string | null {
  const m = svgText.match(/<metadata id="labelic-project">([\s\S]*?)<\/metadata>/)
  if (!m) return null
  return m[1]!
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}
