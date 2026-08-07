import { buildTransportPlan } from '../utils/transportEngine'

const routeCache = new Map()

function cacheKey(origin, destination) {
  return `${origin?.locationId || origin?.name || 'A'}|${destination?.locationId || destination?.name || 'B'}`
}

async function naverTransport() {
  // 未来接入点：调用 Supabase Edge Function -> Naver Directions API
  return null
}

function estimatedTransport(origin, destination) {
  return buildTransportPlan(origin, destination)
}

export async function generateTransportRoute(origin, destination, options = {}) {
  const provider = options.provider || 'estimated'
  const key = cacheKey(origin, destination)
  if (routeCache.has(key)) return routeCache.get(key)

  let result = null
  if (provider === 'naver') {
    result = await naverTransport(origin, destination)
  }
  if (!result) {
    result = estimatedTransport(origin, destination)
    if (result) result.provider = 'estimated'
  } else {
    result.provider = 'naver'
  }
  if (!result) return null
  result.status = result.status || (result.provider === 'naver' ? 'generated' : 'estimated')
  routeCache.set(key, result)
  return result
}

export function clearTransportCache() {
  routeCache.clear()
}

export function getTransportCacheSize() {
  return routeCache.size
}
