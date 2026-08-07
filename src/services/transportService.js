import { buildTransportPlan } from '../utils/transportEngine.js'
import { getSupabaseConfig, isCloudConfigured } from '../data/supabase.js'

const routeCache = new Map()

function cacheKey(origin, destination) {
  return `${origin?.locationId || origin?.name || 'A'}|${destination?.locationId || destination?.name || 'B'}`
}

async function naverTransport(origin, destination) {
  if (!isCloudConfigured()) return null
  try {
    const config = getSupabaseConfig()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${config.url.replace(/\/$/, '')}/functions/v1/transport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      body: JSON.stringify({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.status === 'generated' && Array.isArray(data.options) && data.options.length) {
      return { status: 'generated', options: data.options }
    }
    return null
  } catch {
    return null
  }
}

async function googleTransport(origin, destination) {
  if (!isCloudConfigured()) return null
  try {
    const config = getSupabaseConfig()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${config.url.replace(/\/$/, '')}/functions/v1/transport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      body: JSON.stringify({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        provider: 'google',
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.status === 'generated' && Array.isArray(data.options) && data.options.length) {
      return { status: 'generated', options: data.options }
    }
    return null
  } catch {
    return null
  }
}

function estimatedTransport(origin, destination) {
  return buildTransportPlan(origin, destination)
}

export async function generateTransportRoute(origin, destination, options = {}) {
  const provider = options.provider || 'google'
  const key = cacheKey(origin, destination)
  if (routeCache.has(key)) return routeCache.get(key)

  let result = null
  if (provider === 'google') {
    result = await googleTransport(origin, destination)
    if (result) result.provider = 'google'
  } else if (provider === 'naver') {
    result = await naverTransport(origin, destination)
    if (result) result.provider = 'naver'
  }
  if (!result) {
    result = estimatedTransport(origin, destination)
    if (result) result.provider = 'estimated'
  }
  if (!result) return null
  result.status = result.status || (result.provider === 'google' || result.provider === 'naver' ? 'generated' : 'estimated')
  routeCache.set(key, result)
  return result
}

export function clearTransportCache() {
  routeCache.clear()
}

export function getTransportCacheSize() {
  return routeCache.size
}
