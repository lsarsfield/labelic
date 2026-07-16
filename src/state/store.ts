import { create } from 'zustand'
import { useStore } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'
import type {
  Asset,
  AssetId,
  FontId,
  LabelDoc,
  Layer,
  LayerId,
  LayerType,
  LocalFontRef,
  ThreadColor,
  WeaveSpec,
} from '../model/types'
import { GROUND_WEFT_INDEX, LAYER_FACTORIES, makeBlankDoc, newId } from '../model/types'

export type ViewMode = 'flat' | 'woven'

export interface ViewState {
  mode: ViewMode
  /** Azimuth of the weave-preview light. */
  lightDeg: number
  /** Woven mode: present the label folded (per doc.fold) instead of flat. */
  folded: boolean
  showGuides: boolean
  /** Light artboard behind the label in flat mode (proofing on white). */
  artboardLight: boolean
  snapping: boolean
}

export interface LabelState {
  doc: LabelDoc
  selection: LayerId | null
  view: ViewState
  /** Bumped when an uploaded SVG/font finishes parsing; layers depending on assets recompile. */
  assetsRevision: number
  fontsRevision: number

  setDoc: (doc: LabelDoc) => void
  updateDocMeta: (patch: Partial<Pick<LabelDoc, 'name' | 'widthMM' | 'heightMM' | 'fold'>>) => void
  /** Patch the weave spec (loom, ground, densities, edge, warp thread). */
  updateWeave: (patch: Partial<WeaveSpec>) => void
  addWeft: (color: ThreadColor) => void
  updateWeft: (index: number, color: ThreadColor) => void
  /**
   * Remove a palette thread and remap every layer's weftIndex in the same
   * undo step: later indices shift down, layers on the removed thread fall
   * back to thread 0 (the ground sentinel is untouched).
   */
  removeWeft: (index: number) => void
  /** Replace warp + weft palette wholesale (a named preset); clamps layer weftIndex. */
  applyPalette: (warp: ThreadColor, wefts: ThreadColor[]) => void
  addLayer: (type: LayerType) => void
  removeLayer: (id: LayerId) => void
  duplicateLayer: (id: LayerId) => void
  moveLayer: (id: LayerId, delta: number) => void
  moveLayerTo: (id: LayerId, index: number) => void
  updateLayer: (id: LayerId, patch: Partial<Layer>) => void
  updateDocAssets: (patch: Record<AssetId, Asset>) => void
  addLocalFontRef: (fontId: FontId, ref: LocalFontRef) => void
  /** Embed a local font: store bytes as an asset, repoint layers, drop the reference. */
  embedLocalFontRef: (fontId: FontId, assetId: AssetId, asset: Asset) => void
  select: (id: LayerId | null) => void
  setView: (patch: Partial<ViewState>) => void
  bumpAssetsRevision: () => void
  bumpFontsRevision: () => void
}

export const useLabel = create<LabelState>()(
  temporal(
    immer((set) => ({
      doc: makeBlankDoc(),
      selection: null,
      view: {
        mode: 'flat' as ViewMode,
        lightDeg: 315,
        folded: false,
        showGuides: true,
        artboardLight: false,
        snapping: true,
      },
      assetsRevision: 0,
      fontsRevision: 0,

      setDoc: (doc) =>
        set((s) => {
          s.doc = doc
          s.selection = null
        }),

      updateDocMeta: (patch) =>
        set((s) => {
          Object.assign(s.doc, patch)
        }),

      updateWeave: (patch) =>
        set((s) => {
          Object.assign(s.doc.weave, patch)
        }),

      addWeft: (color) =>
        set((s) => {
          s.doc.weave.wefts.push(color)
        }),

      updateWeft: (index, color) =>
        set((s) => {
          if (s.doc.weave.wefts[index]) s.doc.weave.wefts[index] = color
        }),

      removeWeft: (index) =>
        set((s) => {
          if (s.doc.weave.wefts.length <= 1) return // never empty the palette
          if (!s.doc.weave.wefts[index]) return
          s.doc.weave.wefts.splice(index, 1)
          for (const layer of s.doc.layers) {
            if (layer.weftIndex === GROUND_WEFT_INDEX) continue
            if (layer.weftIndex === index) layer.weftIndex = 0
            else if (layer.weftIndex > index) layer.weftIndex -= 1
          }
        }),

      applyPalette: (warp, wefts) =>
        set((s) => {
          if (wefts.length === 0) return
          s.doc.weave.warp = { ...warp }
          s.doc.weave.wefts = wefts.map((w) => ({ ...w }))
          const maxIndex = wefts.length - 1
          for (const layer of s.doc.layers) {
            if (layer.weftIndex === GROUND_WEFT_INDEX) continue
            if (layer.weftIndex > maxIndex) layer.weftIndex = maxIndex
          }
        }),

      addLayer: (type) =>
        set((s) => {
          const layer = LAYER_FACTORIES[type]()
          const selectedAt = s.doc.layers.findIndex((l) => l.id === s.selection)
          const at = selectedAt === -1 ? s.doc.layers.length : selectedAt + 1
          s.doc.layers.splice(at, 0, layer)
          s.selection = layer.id
        }),

      removeLayer: (id) =>
        set((s) => {
          const at = s.doc.layers.findIndex((l) => l.id === id)
          if (at === -1) return
          s.doc.layers.splice(at, 1)
          if (s.selection === id) {
            const next = s.doc.layers[Math.min(at, s.doc.layers.length - 1)]
            s.selection = next ? next.id : null
          }
        }),

      duplicateLayer: (id) =>
        set((s) => {
          const at = s.doc.layers.findIndex((l) => l.id === id)
          const source = s.doc.layers[at]
          if (!source) return
          const copy: Layer = { ...source, id: newId(), name: source.name + ' copy' }
          s.doc.layers.splice(at + 1, 0, copy)
          s.selection = copy.id
        }),

      moveLayer: (id, delta) =>
        set((s) => {
          const at = s.doc.layers.findIndex((l) => l.id === id)
          if (at === -1) return
          const to = Math.max(0, Math.min(s.doc.layers.length - 1, at + delta))
          if (to === at) return
          const [layer] = s.doc.layers.splice(at, 1)
          s.doc.layers.splice(to, 0, layer as Layer)
        }),

      moveLayerTo: (id, index) =>
        set((s) => {
          const at = s.doc.layers.findIndex((l) => l.id === id)
          if (at === -1) return
          const to = Math.max(0, Math.min(s.doc.layers.length - 1, index))
          if (to === at) return
          const [layer] = s.doc.layers.splice(at, 1)
          s.doc.layers.splice(to, 0, layer as Layer)
        }),

      updateLayer: (id, patch) =>
        set((s) => {
          const layer = s.doc.layers.find((l) => l.id === id)
          if (!layer) return
          Object.assign(layer, patch)
        }),

      updateDocAssets: (patch) =>
        set((s) => {
          Object.assign(s.doc.assets, patch)
        }),

      addLocalFontRef: (fontId, ref) =>
        set((s) => {
          s.doc.localFonts[fontId] = ref
        }),

      embedLocalFontRef: (fontId, assetId, asset) =>
        set((s) => {
          s.doc.assets[assetId] = asset
          for (const layer of s.doc.layers) {
            if (layer.type === 'textLine' && layer.fontId === fontId) {
              layer.fontId = assetId
            }
          }
          delete s.doc.localFonts[fontId]
        }),

      select: (id) =>
        set((s) => {
          s.selection = id
        }),

      setView: (patch) =>
        set((s) => {
          Object.assign(s.view, patch)
        }),

      bumpAssetsRevision: () =>
        set((s) => {
          s.assetsRevision += 1
        }),

      bumpFontsRevision: () =>
        set((s) => {
          s.fontsRevision += 1
        }),
    })),
    {
      // Only the document participates in undo history; selection and view
      // changes never create steps (equality below skips them).
      partialize: (state) => ({ doc: state.doc }),
      equality: (past, current) => past.doc === current.doc,
      limit: 100,
    },
  ),
)

// ---------------------------------------------------------------------------
// Gesture-scoped undo: a whole drag or scrub is exactly one history step.
//
// zundo records the *previous* state on each tracked set, so pausing alone
// would lose the pre-gesture snapshot. Pattern: snapshot at gesture start,
// mutate freely while paused, then at gesture end silently restore the
// snapshot, resume tracking, and re-apply the final doc — that single tracked
// set pushes the pre-gesture snapshot into history.
// ---------------------------------------------------------------------------

let gestureDepth = 0
let gestureSnapshot: LabelDoc | null = null

export function beginGesture(): void {
  if (gestureDepth === 0) {
    gestureSnapshot = useLabel.getState().doc
    useLabel.temporal.getState().pause()
  }
  gestureDepth += 1
}

export function endGesture(): void {
  gestureDepth = Math.max(0, gestureDepth - 1)
  if (gestureDepth > 0) return
  const snapshot = gestureSnapshot
  gestureSnapshot = null
  const temporalApi = useLabel.temporal.getState()
  const finalDoc = useLabel.getState().doc
  if (snapshot && snapshot !== finalDoc) {
    useLabel.setState({ doc: snapshot })
    temporalApi.resume()
    useLabel.setState({ doc: finalDoc })
  } else {
    temporalApi.resume()
  }
}

export function undo(): void {
  useLabel.temporal.getState().undo()
}

export function redo(): void {
  useLabel.temporal.getState().redo()
}

export function useCanUndo(): boolean {
  return useStore(useLabel.temporal, (s) => s.pastStates.length > 0)
}

export function useCanRedo(): boolean {
  return useStore(useLabel.temporal, (s) => s.futureStates.length > 0)
}
