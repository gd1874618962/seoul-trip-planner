import { shoppingProducts, shoppingCategories } from '../src/data/shoppingProducts.js'
import { krwToRmb } from '../src/data/shoppingConfig.js'

const byId = Object.fromEntries(shoppingProducts.map((p) => [p.id, p]))
const unit = {
  count48: shoppingProducts.length === 48,
  ids01to48: shoppingProducts.every((p, i) => p.id === `bb-${String(i + 1).padStart(2, '0')}`),
  maxQuantity3: shoppingProducts.every((p) => p.maxQuantity === 3),
  priceSpot: byId['bb-01']?.priceKRW === 52000 && byId['bb-48']?.priceKRW === 22000,
  item24Variants:
    byId['bb-24']?.variants?.[0]?.priceKRW === 8000 &&
    byId['bb-24']?.variants?.[1]?.priceKRW === 10000,
  imagesCanonical: shoppingProducts.every((p) => /\/shopping\/catalog\/P[123]_.+\.jpg$/.test(p.image)),
  hasImageAlt: shoppingProducts.every((p) => Boolean(p.imageAlt)),
  categories: shoppingCategories.length >= 8,
  conversion: krwToRmb(1000) === 4.77,
}

console.log(JSON.stringify({ unit, sample: byId['bb-01'], item24: byId['bb-24'] }, null, 2))
