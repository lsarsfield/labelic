import type { Layer } from '../model/types'
import { useLabel } from './store'

export function useSelectedLayer(): Layer | null {
  return useLabel((s) => s.doc.layers.find((l) => l.id === s.selection) ?? null)
}

export function useLabelWidthMM(): number {
  return useLabel((s) => s.doc.widthMM)
}

export function useLabelHeightMM(): number {
  return useLabel((s) => s.doc.heightMM)
}
