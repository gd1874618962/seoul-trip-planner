export const DEFAULT_SHOPPING_CONFIG = {
  krwToRmb: 0.00477,
}

export function krwToRmb(krw) {
  return Math.round(krw * DEFAULT_SHOPPING_CONFIG.krwToRmb * 100) / 100
}

export function formatKRW(krw) {
  return `₩${Number(krw || 0).toLocaleString()}`
}

export function formatCNY(rmb) {
  return `≈ ¥${Number(rmb || 0).toFixed(2)}`
}
