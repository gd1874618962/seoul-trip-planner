const CONFIG_KEY = 'seoul-supabase-config'

export function getSupabaseConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null')
    return {
      url: String(saved?.url || import.meta.env.VITE_SUPABASE_URL || '').trim(),
      anonKey: String(saved?.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    }
  } catch {
    return {
      url: String(import.meta.env.VITE_SUPABASE_URL || '').trim(),
      anonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    }
  }
}

export function saveSupabaseConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config || {}))
  } catch {
    /* ignore */
  }
}

export function isCloudConfigured() {
  const config = getSupabaseConfig()
  return Boolean(config.url && config.anonKey)
}

async function request(config, path, options = {}) {
  const headers = {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const res = await fetch(`${config.url.replace(/\/$/, '')}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`supabase ${res.status} ${path}`)
  return res.status === 204 ? null : res.json()
}

export async function testCloudConnection() {
  if (!isCloudConfigured()) return { ok: false, reason: 'not-configured' }
  try {
    const config = getSupabaseConfig()
    await request(config, '/rest/v1/trips?select=id&limit=1')
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: String(error.message || error) }
  }
}

export async function fetchTripRow(id) {
  const config = getSupabaseConfig()
  const rows = await request(config, `/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=*`)
  return rows && rows.length ? rows[0] : null
}

export async function upsertTripRow(payload) {
  const config = getSupabaseConfig()
  await request(config, '/rest/v1/trips?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(payload),
  })
}

export async function upsertRows(table, rows) {
  if (!rows.length) return
  const config = getSupabaseConfig()
  await request(config, `/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  })
}
