const SHARE_PREFIX = 's1'
const DEFLATE_PREFIX = 'd'
const JSON_PREFIX = 'j'

function bytesToBase64Url(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function deflate(bytes) {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

async function inflate(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('unsupported-browser')
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function compactImage(dataUrl, maxSide = 720) {
  return new Promise((resolve) => {
    if (!String(dataUrl).startsWith('data:image/')) {
      resolve(dataUrl)
      return
    }
    const image = new Image()
    image.onerror = () => resolve('')
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.68))
    }
    image.src = dataUrl
  })
}

async function encodeJson(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const compressed = await deflate(bytes)
  if (compressed) return `${SHARE_PREFIX}.${DEFLATE_PREFIX}.${bytesToBase64Url(compressed)}`
  return `${SHARE_PREFIX}.${JSON_PREFIX}.${bytesToBase64Url(bytes)}`
}

export async function encodeShareSnapshot(snapshot) {
  const prepared = JSON.parse(JSON.stringify(snapshot))
  if (prepared?.trip?.meta?.coverImage) {
    prepared.trip.meta.coverImage = await compactImage(prepared.trip.meta.coverImage)
  }
  let token = await encodeJson(prepared)
  if (token.length > 120_000) {
    prepared.trip.meta.coverImage = ''
    token = await encodeJson(prepared)
  }
  return token
}

export async function decodeShareSnapshot(token) {
  const [version, encoding, value] = String(token || '').split('.')
  if (version !== SHARE_PREFIX || !value) throw new Error('invalid-share-token')
  const encodedBytes = base64UrlToBytes(value)
  const bytes = encoding === DEFLATE_PREFIX ? await inflate(encodedBytes) : encodedBytes
  const parsed = JSON.parse(new TextDecoder().decode(bytes))
  if (!parsed?.trip?.meta || !Array.isArray(parsed.trip.days)) throw new Error('invalid-share-data')
  return parsed
}

export function getShareTokenFromLocation(location = window.location) {
  const hash = String(location.hash || '').replace(/^#/, '')
  const params = new URLSearchParams(hash)
  return params.get('share') || ''
}

export function buildShareUrl(token, location = window.location) {
  const url = new URL(location.href)
  url.hash = `share=${token}`
  return url.toString()
}

export function clearShareHash() {
  if (!getShareTokenFromLocation()) return
  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState(null, '', url.toString())
}
