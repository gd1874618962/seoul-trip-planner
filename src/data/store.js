import {
  budget as defaultBudget,
  days,
  flights,
  hotels,
  points,
  reminders,
  restaurants,
  travelers,
  tripMeta,
} from './trip'
import {
  fetchTripRow,
  isCloudConfigured,
  upsertRows,
  upsertTripRow,
} from './supabase'

const TIMELINE_KEY = 'seoul-timeline-edits-v1'
const REMINDER_KEY = 'seoul-reminder-edits-v1'
const BUDGET_KEY = 'seoul-budget-v1'
const LEDGER_KEY = 'seoul-ledger-v1'
const TRIP_KEY = 'seoul-trip-edits-v1'
const RESTAURANT_KEY = 'seoul-restaurant-edits-v1'
const CLOUD_META_KEY = 'seoul-cloud-meta'
const STATE_URL = '/api/state'

let remoteState = null
let remoteEnabled = false
let cloudTimer = null

function readCloudMeta() {
  try {
    const raw = localStorage.getItem(CLOUD_META_KEY)
    return raw ? JSON.parse(raw) : { updatedAt: '', createdAt: '' }
  } catch {
    return { updatedAt: '', createdAt: '' }
  }
}

let cloudMeta = readCloudMeta()

let syncStatus = 'offline'
let syncError = ''
const syncListeners = new Set()

function setSyncStatus(status, error = '') {
  syncStatus = status
  syncError = error
  syncListeners.forEach((cb) => cb({ status, error }))
}

export function getSyncStatus() {
  return { status: syncStatus, error: syncError }
}

export function onSyncStatus(cb) {
  syncListeners.add(cb)
  return () => syncListeners.delete(cb)
}

export function getTripId() {
  return getTripMeta().tripId || 'seoul-2026'
}

const TRANSPORT_RULES = {
  walk: { minutes: 15, cost: '免费' },
  transit: { minutes: 25, cost: '约 1,450 KRW' },
  taxi: { minutes: 20, cost: '约 15,000 KRW' },
  other: { minutes: 20, cost: '—' },
}

function parseStartMinutes(text) {
  const m = String(text || '').match(/^(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

function fmtMinutes(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function read(key) {
  try {
    if (remoteEnabled && remoteState && remoteState[key] !== undefined) return remoteState[key]
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  writeLocal(key, value)
  if (remoteEnabled) {
    const next = { ...(remoteState || {}), [key]: value || {} }
    remoteState = next
    fetch(STATE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {})
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value || {}))
  } catch {
    /* ignore */
  }
}

export async function initRemoteSync() {
  if (typeof window !== 'undefined' && !['http:', 'https:'].includes(window.location.protocol)) {
    return false
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(STATE_URL, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return false
    const data = await res.json()
    remoteState = data && typeof data === 'object' ? data : {}
    remoteEnabled = true
    return true
  } catch {
    remoteEnabled = false
    return false
  }
}

export async function pollRemote() {
  if (!remoteEnabled) return false
  try {
    const res = await fetch(STATE_URL, { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    if (JSON.stringify(data) !== JSON.stringify(remoteState)) {
      remoteState = data
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

function scheduleCloudPush() {
  if (!isCloudConfigured()) return
  if (cloudTimer) clearTimeout(cloudTimer)
  cloudTimer = setTimeout(() => {
    pushAllToCloud().catch(() => {})
  }, 1500)
}

export async function pushAllToCloud() {
  if (!isCloudConfigured()) return false
  const tripId = getTripId()
  setSyncStatus('syncing')
  try {
    const meta = getTripMeta()
    const hotelsList = getHotels()
    const travelersList = getTravelers()
    const flightsData = getFlights()
    const daysList = getDays()
    const pointsList = getPoints()
    const ledgerState = getLedgerState()
    const budgetState = getBudgetState()
    const updatedAt = new Date().toISOString()
    const createdAt = cloudMeta.createdAt || updatedAt

    const data = {
      [TIMELINE_KEY]: getTimelineOverrides(),
      [REMINDER_KEY]: getReminderOverrides(),
      [BUDGET_KEY]: budgetState,
      [LEDGER_KEY]: ledgerState,
      [TRIP_KEY]: getTripEdits(),
      [RESTAURANT_KEY]: getRestaurantEdits(),
    }

    cloudMeta = { createdAt, updatedAt }
    writeLocal(CLOUD_META_KEY, cloudMeta)

    await upsertTripRow({
      id: tripId,
      title: meta.title,
      start_date: '2026-08-21',
      end_date: '2026-08-24',
      budget: meta.budgetPerPerson,
      data,
      updated_at: updatedAt,
    })
    await upsertRows(
      'trip_members',
      travelersList.map((t, i) => ({
        id: t.id || `traveler-${i + 1}`,
        trip_id: tripId,
        name: t.name || '',
        avatar: t.avatar || '',
      })),
    )
    await upsertRows(
      'hotels',
      hotelsList.map((h, i) => ({
        id: h.locationId || `hotel-${i}`,
        trip_id: tripId,
        name: h.name || '',
        address: h.address || '',
        location_id: h.locationId || '',
        check_in: h.checkInDate || '',
        check_out: h.checkOutDate || '',
        note: h.note || '',
      })),
    )
    await upsertRows(
      'locations',
      pointsList.map((point) => ({
        id: point.locationId || `loc-${point.id}`,
        trip_id: tripId,
        name: point.name || '',
        address: point.address || '',
        lat: point.lat || 0,
        lng: point.lng || 0,
      })),
    )
    const allFlights = [
      ...(flightsData.outbound || []).map((f) => ({ ...f, type: 'outbound' })),
      ...(flightsData.return || []).map((f) => ({ ...f, type: 'return' })),
    ]
    await upsertRows(
      'flights',
      allFlights.map((f, i) => ({
        id: `flight-${i}`,
        trip_id: tripId,
        type: f.type,
        flight_no: f.flight || '',
        date: f.date || '',
        time: f.note || '',
      })),
    )
    await upsertRows(
      'events',
      daysList.flatMap((day) =>
        day.entries.map((entry) => ({
          id: entry.id || `evt-${day.id}-${day.entries.indexOf(entry)}`,
          trip_id: tripId,
          date: day.date,
          time: entry.time || '',
          title: entry.title || '',
          location_id:
            entry.locationId || (entry.pointIds && entry.pointIds.length ? `loc-${entry.pointIds[0]}` : null) || null,
          restaurant_id: entry.restaurantId ? String(entry.restaurantId) : null,
        })),
      ),
    )
  await upsertRows(
    'expenses',
    (ledgerState.entries || []).map((entry) => ({
      id: entry.id || `exp-${Date.now()}`,
      trip_id: tripId,
      payer: entry.payer || '',
      amount_krw: entry.amountKRW != null ? entry.amountKRW : '',
      amount_rmb: entry.amountRMB != null ? entry.amountRMB : entry.amount || 0,
      category: entry.category || '',
      merchant: entry.merchant || '',
      participants: entry.participants || [],
      note: entry.note || '',
      exchange_rate: entry.exchangeRate || ledgerState.exchangeRate || 187.5,
      updated_at: entry.updatedAt || updatedAt,
    })),
  )
    setSyncStatus('success')
    return true
  } catch (error) {
    setSyncStatus('error', '云同步失败，当前使用本地缓存')
    return false
  }
}

function applyCloudData(data) {
  if (!data || typeof data !== 'object') return
  const keys = [TIMELINE_KEY, REMINDER_KEY, BUDGET_KEY, LEDGER_KEY, TRIP_KEY]
  keys.forEach((key) => {
    if (data[key] && typeof data[key] === 'object') writeLocal(key, data[key])
  })
  if (remoteEnabled) {
    remoteState = { ...(remoteState || {}), ...data }
  }
}

export async function initCloudSync() {
  if (!isCloudConfigured()) {
    setSyncStatus('offline')
    return false
  }
  const tripId = getTripId()
  setSyncStatus('syncing')
  try {
    const row = await fetchTripRow(tripId)
    if (!row) {
      setSyncStatus('success')
      return true
    }
    const remoteTime = Date.parse(row.updated_at || '') || 0
    const localTime = Date.parse(cloudMeta.updatedAt || '') || 0
    if (remoteTime > localTime) {
      applyCloudData(row.data)
      cloudMeta = { createdAt: row.created_at || cloudMeta.createdAt, updatedAt: row.updated_at }
      writeLocal(CLOUD_META_KEY, cloudMeta)
      setSyncStatus('success')
      return true
    }
    if (localTime > remoteTime) {
      await pushAllToCloud()
    }
    setSyncStatus('success')
    return true
  } catch (error) {
    setSyncStatus('error', '云同步失败，当前使用本地缓存')
    return false
  }
}

export async function pollCloud() {
  if (!isCloudConfigured()) {
    setSyncStatus('offline')
    return false
  }
  const tripId = getTripId()
  try {
    const row = await fetchTripRow(tripId)
    if (!row) return false
    const remoteTime = Date.parse(row.updated_at || '') || 0
    const localTime = Date.parse(cloudMeta.updatedAt || '') || 0
    if (remoteTime > localTime) {
      applyCloudData(row.data)
      cloudMeta = { createdAt: row.created_at || cloudMeta.createdAt, updatedAt: row.updated_at }
      writeLocal(CLOUD_META_KEY, cloudMeta)
      setSyncStatus('success')
      return true
    }
    if (localTime > remoteTime) {
      await pushAllToCloud()
    }
    return false
  } catch (error) {
    setSyncStatus('error', '云同步失败，当前使用本地缓存')
    return false
  }
}

export function getTimelineOverrides() {
  return read(TIMELINE_KEY) || {}
}

export function saveTimelineOverrides(value) {
  write(TIMELINE_KEY, value || {})
  scheduleCloudPush()
}

export function getDays(overrides = getTimelineOverrides()) {
  const hotelMap = getHotelMap()
  return days.map((d) => {
    const raw = overrides[d.id] ? [...overrides[d.id]] : [...d.entries]
    const entries = raw.map((entry, index) => {
      const normalized = entry.id ? entry : { ...entry, id: `evt-${d.id}-${index}` }
      const hotel = normalized.locationId ? hotelMap[normalized.locationId] : null
      const withHotel = hotel ? { ...normalized, address: hotel.address || normalized.address } : normalized
      const enriched = { ...withHotel, status: withHotel.status || 'planned' }
      if (enriched.transportMode && !enriched.transportEta) {
        const rule = TRANSPORT_RULES[enriched.transportMode]
        if (rule) {
          enriched.transportEta = `约 ${rule.minutes} 分钟`
          if (!enriched.transportCostEstimate) enriched.transportCostEstimate = rule.cost
        }
      }
      return enriched
    })
    entries.forEach((entry, index) => {
      if (index === 0) return
      const start = parseStartMinutes(entry.time)
      const rule = TRANSPORT_RULES[entries[index - 1].transportMode]
      if (start != null && rule && start - rule.minutes >= 0) {
        entry.suggestedDeparture = fmtMinutes(start - rule.minutes)
      }
    })
    return { ...d, tripId: getTripId(), entries }
  })
}

export function getTripEdits() {
  return read(TRIP_KEY) || {}
}

export function saveTripEdits(value) {
  write(TRIP_KEY, value || {})
  scheduleCloudPush()
}

function getHotelMap() {
  const map = {}
  getHotels().forEach((hotel) => {
    if (hotel.locationId) map[hotel.locationId] = hotel
  })
  return map
}

export function getTripMeta() {
  return { tripId: 'seoul-2026', ...tripMeta, ...(getTripEdits().meta || {}) }
}

export function getFlights() {
  const tripId = getTripId()
  const saved = getTripEdits().flights
  if (saved && Array.isArray(saved.outbound) && Array.isArray(saved.return)) return { ...saved, tripId }
  return { ...flights, tripId }
}

export function getHotels() {
  const tripId = getTripId()
  const saved = getTripEdits().hotels
  return (Array.isArray(saved) ? saved : hotels).map((hotel) => ({ tripId, ...hotel }))
}

export function getTravelers() {
  const tripId = getTripId()
  const saved = getTripEdits().travelers
  return (Array.isArray(saved) ? saved : travelers).map((traveler) => ({ tripId, ...traveler }))
}

export function getPoints() {
  const tripId = getTripId()
  const hotelMap = getHotelMap()
  return points.map((point) => {
    const hotel = point.locationId ? hotelMap[point.locationId] : null
    const base = hotel
      ? { ...point, name: hotel.name || point.name, address: hotel.address || point.address }
      : point
    return {
      tripId,
      ...base,
      displayName: base.displayName || base.name,
      officialAddress: base.officialAddress || base.address,
      coordinates: { lat: base.lat, lng: base.lng },
    }
  })
}

export function getReminderOverrides() {
  return read(REMINDER_KEY) || {}
}

export function saveReminderOverrides(value) {
  write(REMINDER_KEY, value || {})
  scheduleCloudPush()
}

export function getReminders(overrides = getReminderOverrides()) {
  const byId = {}
  reminders.forEach((group) => {
    const saved = overrides[group.id]
    if (saved?._deleted) return
    byId[group.id] = saved
      ? { ...group, ...saved, items: Array.isArray(saved.items) ? saved.items : group.items }
      : group
  })
  const order = Array.isArray(overrides.__order) && overrides.__order.length ? overrides.__order : reminders.map((g) => g.id)
  const seen = new Set()
  const ordered = order.map((id) => byId[id]).filter((g) => g && !seen.has(g.id) && seen.add(g.id))
  reminders.forEach((group) => {
    if (overrides[group.id]?._deleted) return
    if (!seen.has(group.id)) {
      ordered.push(byId[group.id])
      seen.add(group.id)
    }
  })
  const airport = ordered.find((group) => group.id === 'airport')
  if (airport && airport.items.length) {
    const hotelsList = getHotels()
    const hotel = hotelsList[1] || hotelsList[0]
    if (hotel) airport.items[0] = `8.24 约 03:00 从 ${hotel.name}（${hotel.address}）出发`
  }
  return ordered
}

export function getDefaultBudgetState() {
  return {
    perPerson: tripMeta.budgetPerPerson,
    spent: defaultBudget.spent.map((item) => ({ ...item })),
    planned: defaultBudget.planned.map((item) => ({ ...item })),
  }
}

const DEFAULT_BUDGET = getDefaultBudgetState()

export function getBudgetState() {
  const saved = read(BUDGET_KEY)
  if (saved && Array.isArray(saved.spent) && Array.isArray(saved.planned)) {
    return { ...DEFAULT_BUDGET, ...saved }
  }
  return DEFAULT_BUDGET
}

export function saveBudgetState(value) {
  write(BUDGET_KEY, value)
  scheduleCloudPush()
}

function normalizeExpense(entry, index) {
  const now = new Date().toISOString()
  return {
    id: entry.id || `exp-${Date.now().toString(36)}-${index}`,
    tripId: entry.tripId || getTripId(),
    date: entry.date || '',
    merchant: entry.merchant || entry.note || '',
    category: entry.category || '其他',
    amountKRW: entry.amountKRW != null ? entry.amountKRW : '',
    amountRMB: entry.amountRMB != null ? entry.amountRMB : entry.amount || 0,
    exchangeRate: entry.exchangeRate || 0,
    payer: entry.payer || '',
    participants: Array.isArray(entry.participants) ? entry.participants : [],
    note: entry.note || '',
    type: entry.type || 'expense',
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || now,
  }
}

export function getLedgerState() {
  const saved = read(LEDGER_KEY)
  const entries = Array.isArray(saved?.entries) ? saved.entries.map(normalizeExpense) : []
  return { exchangeRate: Number(saved?.exchangeRate) || 187.5, entries }
}

export function saveLedgerState(value) {
  write(LEDGER_KEY, value)
  scheduleCloudPush()
}

const DATA_KEYS = [TIMELINE_KEY, REMINDER_KEY, BUDGET_KEY, LEDGER_KEY, TRIP_KEY, RESTAURANT_KEY]

export function exportAllState() {
  const data = { version: 1, tripId: getTripId(), savedAt: new Date().toISOString(), data: {} }
  DATA_KEYS.forEach((key) => {
    const value = read(key)
    if (value && Object.keys(value).length) data.data[key] = value
  })
  const checks = {}
  reminders.forEach((group) => {
    try {
      const raw = localStorage.getItem(`seoul-reminders-${group.id}`)
      if (raw) checks[group.id] = JSON.parse(raw)
    } catch {
      /* ignore */
    }
  })
  if (Object.keys(checks).length) data.data.reminderChecks = checks
  return JSON.stringify(data, null, 2)
}

export function importAllState(json) {
  const parsed = JSON.parse(json)
  const data = parsed && typeof parsed === 'object' ? parsed.data || parsed : {}
  DATA_KEYS.forEach((key) => {
    if (data[key] && typeof data[key] === 'object') write(key, data[key])
  })
  const checks = data.reminderChecks || {}
  Object.entries(checks).forEach(([id, arr]) => {
    if (Array.isArray(arr)) {
      try {
        localStorage.setItem(`seoul-reminders-${id}`, JSON.stringify(arr))
      } catch {
        /* ignore */
      }
    }
  })
}

const NAME_PREFIX = /^(早餐|午餐|晚餐)\s*[·•|:：-]\s*/

export function getRestaurantEdits() {
  return read(RESTAURANT_KEY) || {}
}

export function saveRestaurantEdits(value) {
  write(RESTAURANT_KEY, value || {})
  scheduleCloudPush()
}

export function getRestaurants() {
  const overrides = getTimelineOverrides()
  const directEdits = getRestaurantEdits()
  const edits = {}
  for (const day of days) {
    const entries = overrides[day.id] || day.entries
    for (const entry of entries) {
      if (!entry.restaurantId) continue
      const original = restaurants.find((r) => r.id === entry.restaurantId)
      edits[entry.restaurantId] = {
        name: original?.name,
        priceRange: entry.cost && entry.cost !== '—' ? entry.cost : undefined,
        note: entry.note || undefined,
        recommend: entry.recommend || undefined,
      }
      const direct = directEdits[entry.restaurantId]
      if (direct) {
        edits[entry.restaurantId] = { ...(edits[entry.restaurantId] || {}), ...direct }
      }
    }
  }
  return restaurants.map((r) => {
    const edit = edits[r.id]
    if (!edit) return r
    const merged = { ...r }
    for (const key of ['name', 'priceRange', 'note', 'recommend', 'photos']) {
      if (edit[key] !== undefined) merged[key] = edit[key]
    }
    return merged
  })
}
