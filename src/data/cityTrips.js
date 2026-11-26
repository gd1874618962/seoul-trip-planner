const assetBase = import.meta.env?.BASE_URL || './'

export const cityTrips = [
  {
    tripId: 'seoul-2026',
    city: 'Seoul',
    cityCn: '首尔',
    country: '韩国',
    countryEn: 'Korea',
    dates: '2026.08.21 - 08.24',
    status: '已完成',
    theme: '弘大 · 圣水 · 明洞 · 金浦',
    cover: `${assetBase}images/seoul-hero.jpg`,
  },
  {
    tripId: 'kuala-lumpur-2027-01',
    city: 'Kuala Lumpur',
    cityCn: '吉隆坡',
    country: 'Malaysia',
    countryCn: '马来西亚',
    dates: '2027.01.08 - 01.11',
    status: '规划中',
    theme: '城市游玩 · 演唱会',
    cover: `${assetBase}images/kuala-lumpur-hero.jpg`,
  },
]
