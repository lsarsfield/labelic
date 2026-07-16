import { DOC_VERSION } from './types'

/**
 * Sequential document migrations: migrations[n] upgrades a version n-1 doc to
 * version n. Convention (from Buttonic): spread defaults FIRST so stored
 * values win, and never alter what existing docs render.
 */
export const migrations: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {
  // v2: Buttonic-parity fields — halos (ground clearance moats), stroke
  // cap/join, repeat-row grids. Defaults reproduce v1 output exactly.
  2: (doc) => ({
    ...doc,
    layers: (Array.isArray(doc.layers) ? doc.layers : []).map((layer) => {
      if (typeof layer !== 'object' || layer === null) return layer
      const t = (layer as { type?: string }).type
      if (t === 'textLine') return { haloMM: 0, ...layer }
      if (t === 'motif') return { cap: 'round', join: 'miter', haloMM: 0, ...layer }
      if (t === 'border') return { cap: 'round', join: 'miter', ...layer }
      if (t === 'repeatRow') {
        return {
          rows: 1, rowGapMM: 2, staggerRow2: true, flipRow2: false,
          cap: 'round', join: 'miter', haloMM: 0,
          ...layer,
        }
      }
      return layer
    }),
  }),
}

export function migrateDoc(raw: Record<string, unknown>): Record<string, unknown> {
  let version = typeof raw.version === 'number' ? raw.version : NaN
  if (!Number.isInteger(version)) throw new Error('document has no version number')
  if (version > DOC_VERSION) {
    throw new Error(
      `document version ${version} is newer than this app understands (${DOC_VERSION})`,
    )
  }
  let doc = raw
  while (version < DOC_VERSION) {
    const step = migrations[version + 1]
    if (!step) throw new Error(`no migration path from document version ${version}`)
    doc = step(doc)
    version += 1
    doc = { ...doc, version }
  }
  return doc
}
