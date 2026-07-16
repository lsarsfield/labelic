/** Tiny color math for the thread painter. Hex in, hex/rgba strings out. */

export interface Rgb {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

export function rgbToCss({ r, g, b }: Rgb, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** amount −1..1: negative darkens toward black, positive lightens toward white. */
export function shade(hex: string, amount: number): Rgb {
  const { r, g, b } = hexToRgb(hex)
  if (amount >= 0) {
    return { r: clamp255(r + (255 - r) * amount), g: clamp255(g + (255 - g) * amount), b: clamp255(b + (255 - b) * amount) }
  }
  const f = 1 + amount
  return { r: clamp255(r * f), g: clamp255(g * f), b: clamp255(b * f) }
}

export const shadeCss = (hex: string, amount: number, alpha = 1): string =>
  rgbToCss(shade(hex, amount), alpha)
