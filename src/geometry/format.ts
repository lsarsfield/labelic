/**
 * Number → path-data formatting: fixed 4 decimals (0.1 µm — far beyond
 * weaving resolution), trailing zeros stripped, never "-0". Deterministic
 * output keeps golden snapshots stable and export files small.
 */
export function fmt(n: number): string {
  let s = n.toFixed(4)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s === '-0' ? '0' : s
}
