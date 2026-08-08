function timeoutFetch(url, ms = 9000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

export async function searchRestaurantImages(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  try {
    const key = import.meta.env?.VITE_UNSPLASH_ACCESS_KEY || ''
    if (key) {
      const res = await timeoutFetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(trimmed)}&per_page=6`,
      )
      if (res.ok) {
        const data = await res.json()
        const urls = (data.results || [])
          .map((item) => item.urls?.regular)
          .filter(Boolean)
        if (urls.length) return urls
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6' +
      `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${trimmed}`)}` +
      '&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=900&format=json'
    const res = await timeoutFetch(url, 10000)
    if (!res.ok) return []
    const data = await res.json()
    const pages = data?.query?.pages || {}
    return Object.values(pages)
      .map((page) => page.imageinfo?.[0])
      .filter((info) => info && info.mime === 'image/jpeg')
      .map((info) => info.thumburl || info.url)
      .filter(Boolean)
  } catch {
    return []
  }
}
