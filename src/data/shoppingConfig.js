export const DEFAULT_SHOPPING_CONFIG = {
  krwToRmb: 0.00477,
}

export const COLOR_PALETTE = [
  { id: 'yellow', name: '黄色', hex: '#F5C84C' },
  { id: 'blue', name: '蓝色', hex: '#4A90D9' },
  { id: 'green', name: '绿色', hex: '#58B368' },
  { id: 'red', name: '红色', hex: '#E05D5D' },
  { id: 'purple', name: '紫色', hex: '#9B6DD0' },
  { id: 'orange', name: '橙色', hex: '#E8893C' },
  { id: 'pink', name: '粉色', hex: '#E77FAE' },
  { id: 'cyan', name: '青色', hex: '#4FB6C9' },
  { id: 'navy', name: '深蓝', hex: '#31456E' },
  { id: 'darkgreen', name: '深绿', hex: '#2F6B4F' },
  { id: 'brown', name: '棕色', hex: '#8B6A4A' },
  { id: 'black', name: '黑色', hex: '#2B2B2B' },
  { id: 'gray', name: '灰色', hex: '#9AA0A6' },
  { id: 'beige', name: '米色', hex: '#D9C7A7' },
  { id: 'lavender', name: '薰衣草紫', hex: '#B8A6E8' },
  { id: 'teal', name: '青碧', hex: '#2E8B8B' },
]

export function krwToRmb(krw) {
  return Math.round(krw * DEFAULT_SHOPPING_CONFIG.krwToRmb * 100) / 100
}

export function formatKRW(krw) {
  return `₩${Number(krw || 0).toLocaleString()}`
}

export function formatCNY(rmb) {
  return `≈ ¥${Number(rmb || 0).toFixed(2)}`
}
