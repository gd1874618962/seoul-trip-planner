import * as seoulDefaults from './trip.js'
import { kualaLumpurTrip } from './kualaLumpur.js'
import {
  fetchTripRow,
  isCloudConfigured,
  upsertRows,
  upsertTripRow,
} from './supabase.js'

const SEOUL_TRIP_ID = 'seoul-2026'
const KUALA_LUMPUR_TRIP_ID = 'kuala-lumpur-2027-01'
const TIMELINE_KEY = 'seoul-timeline-edits-v1'
const REMINDER_KEY = 'seoul-reminder-edits-v1'
const BUDGET_KEY = 'seoul-budget-v1'
const LEDGER_KEY = 'seoul-ledger-v1'
const TRIP_KEY = 'seoul-trip-edits-v1'
const RESTAURANT_KEY = 'seoul-restaurant-edits-v1'
const PLACE_FAVORITES_KEY = 'seoul-place-favorites-v1'
const SHOPPING_DAISY_KEY = 'seoul-shopping-daisy-v1'
const SHOPPING_WUTONG_KEY = 'seoul-shopping-wutong-v1'
const CLOUD_META_KEY = 'seoul-cloud-meta'
const ITINERARY_MIGRATION_KEY = 'seoul-itinerary-migration'
const ACTIVE_TRIP_KEY = 'stp-active-trip'
const STATE_URL = '/api/state'

export const SUPPORTED_TRIP_IDS = [SEOUL_TRIP_ID, KUALA_LUMPUR_TRIP_ID]

const DEFAULT_TRIPS = {
  [SEOUL_TRIP_ID]: {
    tripMeta: seoulDefaults.tripMeta,
    flights: seoulDefaults.flights,
    hotels: seoulDefaults.hotels,
    travelers: seoulDefaults.travelers,
    days: seoulDefaults.days,
    points: seoulDefaults.points,
    restaurants: seoulDefaults.restaurants,
    reminders: seoulDefaults.reminders,
    budget: seoulDefaults.budget,
  },
  [KUALA_LUMPUR_TRIP_ID]: kualaLumpurTrip,
}

let remoteState = null
let remoteEnabled = false
let cloudTimer = null
let activeTripId = null

function getLegacyOrScopedKey(key, tripId = getActiveTripId()) {
  return tripId === SEOUL_TRIP_ID ? key : `${key}--${tripId}`
}

export function getTripStorageKey(key, tripId = getActiveTripId()) {
  return getLegacyOrScopedKey(key, tripId)
}

export function getReminderCheckKey(groupId, tripId = getActiveTripId()) {
  const key = `seoul-reminders-${groupId}`
  return getLegacyOrScopedKey(key, tripId)
}

function readCloudMeta(tripId = getActiveTripId()) {
  try {
    const raw = localStorage.getItem(getLegacyOrScopedKey(CLOUD_META_KEY, tripId))
    return raw ? JSON.parse(raw) : { updatedAt: '', createdAt: '' }
  } catch {
    return { updatedAt: '', createdAt: '' }
  }
}

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

export function getActiveTripId() {
  if (activeTripId && DEFAULT_TRIPS[activeTripId]) return activeTripId
  try {
    const stored = localStorage.getItem(ACTIVE_TRIP_KEY)
    if (stored && DEFAULT_TRIPS[stored]) {
      activeTripId = stored
      return stored
    }
  } catch {
    /* ignore */
  }
  activeTripId = SEOUL_TRIP_ID
  return activeTripId
}

export function setActiveTripId(tripId) {
  if (!DEFAULT_TRIPS[tripId]) return false
  activeTripId = tripId
  try {
    localStorage.setItem(ACTIVE_TRIP_KEY, tripId)
  } catch {
    /* ignore */
  }
  if (cloudTimer) {
    clearTimeout(cloudTimer)
    cloudTimer = null
  }
  setSyncStatus('idle')
  return true
}

export async function switchActiveTrip(tripId) {
  if (!DEFAULT_TRIPS[tripId]) return false
  if (tripId === getActiveTripId()) return true
  if (cloudTimer) {
    clearTimeout(cloudTimer)
    cloudTimer = null
    await pushAllToCloud()
  }
  return setActiveTripId(tripId)
}

function getDataset(tripId = getActiveTripId()) {
  return DEFAULT_TRIPS[tripId] || DEFAULT_TRIPS[SEOUL_TRIP_ID]
}

export function getTripId() {
  return getActiveTripId()
}

const TRANSPORT_RULES = {
  walk: { minutes: 15, cost: '免费' },
  transit: { minutes: 25, cost: '约 1,450 KRW' },
  taxi: { minutes: 20, cost: '约 15,000 KRW' },
  other: { minutes: 20, cost: '—' },
}

const DEPRECATED_EVENT_IDS = new Set([
  'd1-e1', 'd1-e2', 'd1-e3', 'd1-e3b', 'd1-e4', 'd1-e5', 'd1-e6',
  'd2-e1', 'd2-e2', 'd2-e3', 'd2-e4', 'd2-e5', 'd2-e6', 'd2-e7', 'd2-e8', 'd2-e9', 'd2-e10',
])
const DEPRECATED_TITLE = /MUUT|Neo Teria|BIGBANG 20|BIGBANG 展|BIGBANG展览|빅뱅 20/

function isDeprecatedEntry(entry) {
  const ids = entry.pointIds || []
  return (
    DEPRECATED_EVENT_IDS.has(entry.id) ||
    DEPRECATED_TITLE.test(entry.title || '') ||
    entry.locationId === 'loc-7' ||
    entry.locationId === 'loc-17' ||
    ids.includes(7) ||
    ids.includes(17)
  )
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

function setTripSyncStatus(tripId, status, error = '') {
  if (getActiveTripId() === tripId) setSyncStatus(status, error)
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
    const currentCloudMeta = readCloudMeta(tripId)
    const createdAt = currentCloudMeta.createdAt || updatedAt
    const scopedKey = (key) => getLegacyOrScopedKey(key, tripId)

    const data = {
      [scopedKey(TIMELINE_KEY)]: getTimelineOverrides(),
      [scopedKey(REMINDER_KEY)]: getReminderOverrides(),
      [scopedKey(BUDGET_KEY)]: budgetState,
      [scopedKey(LEDGER_KEY)]: ledgerState,
      [scopedKey(TRIP_KEY)]: getTripEdits(),
      [scopedKey(RESTAURANT_KEY)]: getRestaurantEdits(),
      [scopedKey(PLACE_FAVORITES_KEY)]: getFavoritePlaceIds(),
      [SHOPPING_DAISY_KEY]: getShoppingState('daisy'),
      [SHOPPING_WUTONG_KEY]: getShoppingState('wutong'),
    }

    const nextCloudMeta = { createdAt, updatedAt }
    writeLocal(scopedKey(CLOUD_META_KEY), nextCloudMeta)

    await upsertTripRow({
      id: tripId,
      title: meta.title,
      start_date: meta.startDate || '',
      end_date: meta.endDate || '',
      budget: meta.budgetPerPerson,
      data,
      updated_at: updatedAt,
    })
    await upsertRows(
      'trip_members',
      travelersList.map((t, i) => ({
        id: `${tripId}:${t.id || `traveler-${i + 1}`}`,
        trip_id: tripId,
        name: t.name || '',
        avatar: t.avatar || '',
      })),
    )
    await upsertRows(
      'hotels',
      hotelsList.map((h, i) => ({
        id: `${tripId}:${h.locationId || `hotel-${i}`}`,
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
        id: `${tripId}:${point.locationId || `loc-${point.id}`}`,
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
        id: `${tripId}:flight-${i}`,
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
          id: `${tripId}:${entry.id || `evt-${day.id}-${day.entries.indexOf(entry)}`}`,
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
      id: `${tripId}:${entry.id || `exp-${Date.now()}`}`,
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
  const shoppingCustomers = []
  const shoppingOrders = []
  ;[
    ['daisy', getShoppingState('daisy')],
    ['wutong', getShoppingState('wutong')],
  ].forEach(([owner, shoppingState]) => {
    ;(shoppingState.customers || []).forEach((customer) => {
      shoppingCustomers.push({
        id: `${tripId}:${owner}:${customer.id}`,
        owner,
        trip_id: tripId,
        customer_name: customer.customerName || '',
        color_id: customer.colorId || '',
        updated_at: customer.updatedAt || updatedAt,
      })
      ;(customer.orders || []).forEach((order, index) => {
        shoppingOrders.push({
          id: `${tripId}:${owner}:${customer.id}-${index}`,
          owner,
          trip_id: tripId,
          customer_id: customer.id,
          product_id: order.productId,
          quantity: order.quantity || 0,
          unit_price_krw: order.unitPriceKRW || 0,
          updated_at: customer.updatedAt || updatedAt,
        })
      })
    })
  })
  await upsertRows('shopping_customers', shoppingCustomers)
  await upsertRows('shopping_orders', shoppingOrders)
    setTripSyncStatus(tripId, 'success')
    return true
  } catch (error) {
    setTripSyncStatus(tripId, 'error', '云同步失败，当前使用本地缓存')
    return false
  }
}

function applyCloudData(data, tripId = getActiveTripId()) {
  if (!data || typeof data !== 'object') return
  const scopedKeys = [
    TIMELINE_KEY,
    REMINDER_KEY,
    BUDGET_KEY,
    LEDGER_KEY,
    TRIP_KEY,
    RESTAURANT_KEY,
    PLACE_FAVORITES_KEY,
  ].map((key) => getLegacyOrScopedKey(key, tripId))
  const allowedKeys = new Set([
    ...scopedKeys,
    SHOPPING_DAISY_KEY,
    SHOPPING_WUTONG_KEY,
  ])
  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.has(key) && value && typeof value === 'object') writeLocal(key, value)
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
      setTripSyncStatus(tripId, 'success')
      return true
    }
    const currentCloudMeta = readCloudMeta(tripId)
    const remoteTime = Date.parse(row.updated_at || '') || 0
    const localTime = Date.parse(currentCloudMeta.updatedAt || '') || 0
    if (remoteTime > localTime) {
      applyCloudData(row.data, tripId)
      writeLocal(getLegacyOrScopedKey(CLOUD_META_KEY, tripId), {
        createdAt: row.created_at || currentCloudMeta.createdAt,
        updatedAt: row.updated_at,
      })
      setTripSyncStatus(tripId, 'success')
      return true
    }
    if (localTime > remoteTime) {
      await pushAllToCloud()
    }
    setTripSyncStatus(tripId, 'success')
    return true
  } catch (error) {
    setTripSyncStatus(tripId, 'error', '云同步失败，当前使用本地缓存')
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
    const currentCloudMeta = readCloudMeta(tripId)
    const remoteTime = Date.parse(row.updated_at || '') || 0
    const localTime = Date.parse(currentCloudMeta.updatedAt || '') || 0
    if (remoteTime > localTime) {
      applyCloudData(row.data, tripId)
      writeLocal(getLegacyOrScopedKey(CLOUD_META_KEY, tripId), {
        createdAt: row.created_at || currentCloudMeta.createdAt,
        updatedAt: row.updated_at,
      })
      setTripSyncStatus(tripId, 'success')
      return true
    }
    if (localTime > remoteTime) {
      await pushAllToCloud()
    }
    return false
  } catch (error) {
    setTripSyncStatus(tripId, 'error', '云同步失败，当前使用本地缓存')
    return false
  }
}

export function getTimelineOverrides() {
  return read(getTripStorageKey(TIMELINE_KEY)) || {}
}

export function migrateItineraryOnce() {
  try {
    const version = getTripMeta().itineraryVersion
    if (!version) return
    const migrationKey = getTripStorageKey(ITINERARY_MIGRATION_KEY)
    if (localStorage.getItem(migrationKey) === version) return
    const overrides = getTimelineOverrides()
    const next = { ...overrides, 1: [], 2: [] }
    next.__itineraryVersion = {
      ...(next.__itineraryVersion || {}),
      1: version,
      2: version,
    }
    saveTimelineOverrides(next)
    localStorage.setItem(migrationKey, version)
  } catch {
    /* ignore */
  }
}

export function saveTimelineOverrides(value) {
  write(getTripStorageKey(TIMELINE_KEY), value || {})
  scheduleCloudPush()
}

export function getDays(overrides = getTimelineOverrides()) {
  const dataset = getDataset()
  const hotelMap = getHotelMap()
  return dataset.days.map((d) => {
    const currentVersion = getTripMeta().itineraryVersion
    const storedVersion = overrides.__itineraryVersion?.[d.id]
    const staleDay = (d.id === 1 || d.id === 2) && storedVersion !== currentVersion
    const raw = staleDay
      ? []
      : overrides[d.id]
        ? [...overrides[d.id]].filter(
            (entry) => !isDeprecatedEntry(entry),
          )
        : []
    const seen = new Set(raw.map((entry) => entry.id))
    d.entries.forEach((defaultEntry) => {
      if (!seen.has(defaultEntry.id)) raw.push({ ...defaultEntry })
    })
    const entries = raw.map((entry, index) => {
      const normalized = entry.id ? entry : { ...entry, id: `evt-${d.id}-${index}` }
      const hotel = normalized.locationId ? hotelMap[normalized.locationId] : null
      const withHotel = hotel ? { ...normalized, address: hotel.address || normalized.address } : normalized
      const enriched = { ...withHotel, status: withHotel.status || 'planned' }
      if (enriched.duration && !enriched.transportEta) {
        enriched.transportEta = enriched.duration
      }
      if (enriched.costKRW != null && enriched.costKRW > 0 && !enriched.transportCostEstimate) {
        enriched.transportCostEstimate = `约 ${enriched.costKRW.toLocaleString()} KRW`
      }
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
    entries.sort((a, b) => {
      const aStart = parseStartMinutes(a.time)
      const bStart = parseStartMinutes(b.time)
      if (aStart == null && bStart == null) return 0
      if (aStart == null) return 1
      if (bStart == null) return -1
      return aStart - bStart
    })
    return { ...d, tripId: getTripId(), entries }
  })
}

export function getTripEdits() {
  return read(getTripStorageKey(TRIP_KEY)) || {}
}

export function saveTripEdits(value) {
  write(getTripStorageKey(TRIP_KEY), value || {})
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
  const tripId = getTripId()
  return {
    ...getDataset(tripId).tripMeta,
    ...(getTripEdits().meta || {}),
    tripId,
  }
}

export function getTripMetaForTrip(tripId) {
  const dataset = getDataset(tripId)
  if (!DEFAULT_TRIPS[tripId]) return getTripMeta()
  const saved = read(getTripStorageKey(TRIP_KEY, tripId)) || {}
  return {
    ...dataset.tripMeta,
    ...(saved.meta || {}),
    tripId,
  }
}

export function getFlights() {
  const tripId = getTripId()
  const defaults = getDataset(tripId).flights
  const saved = getTripEdits().flights
  if (saved && Array.isArray(saved.outbound) && Array.isArray(saved.return)) return { ...saved, tripId }
  return { ...defaults, tripId }
}

export function getHotels() {
  const tripId = getTripId()
  const defaults = getDataset(tripId).hotels
  const saved = getTripEdits().hotels
  return (Array.isArray(saved) ? saved : defaults).map((hotel) => ({ tripId, ...hotel }))
}

export function getTravelers() {
  const tripId = getTripId()
  const defaults = getDataset(tripId).travelers
  const saved = getTripEdits().travelers
  return (Array.isArray(saved) ? saved : defaults).map((traveler) => ({ tripId, ...traveler }))
}

export function getPoints() {
  const tripId = getTripId()
  const hotelMap = getHotelMap()
  return getDataset(tripId).points.map((point) => {
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

export function getFavoritePlaceIds() {
  const saved = read(getTripStorageKey(PLACE_FAVORITES_KEY))
  return Array.isArray(saved?.ids) ? saved.ids : []
}

export function saveFavoritePlaceIds(ids) {
  write(getTripStorageKey(PLACE_FAVORITES_KEY), {
    ids: Array.from(new Set((ids || []).filter(Boolean))),
  })
  scheduleCloudPush()
}

export function getReminderOverrides() {
  return read(getTripStorageKey(REMINDER_KEY)) || {}
}

export function isDefaultReminderGroup(id) {
  return getDataset().reminders.some((group) => group.id === id)
}

export function saveReminderOverrides(value) {
  write(getTripStorageKey(REMINDER_KEY), value || {})
  scheduleCloudPush()
}

export function getReminders(overrides = getReminderOverrides()) {
  const datasetReminders = getDataset().reminders
  const byId = {}
  datasetReminders.forEach((group) => {
    const saved = overrides[group.id]
    if (saved?._deleted) return
    byId[group.id] = saved
      ? {
          ...group,
          ...saved,
          items: Array.isArray(saved.items) ? [...saved.items] : [...group.items],
        }
      : { ...group, items: [...group.items] }
  })
  Object.entries(overrides).forEach(([id, saved]) => {
    if (!saved || saved._deleted || byId[id]) return
    byId[id] = {
      id,
      title: saved.title || '新提醒块',
      items: Array.isArray(saved.items) ? saved.items : [],
    }
  })
  const order =
    Array.isArray(overrides.__order) && overrides.__order.length
      ? overrides.__order
      : datasetReminders.map((g) => g.id)
  const seen = new Set()
  const ordered = order.map((id) => byId[id]).filter((g) => g && !seen.has(g.id) && seen.add(g.id))
  datasetReminders.forEach((group) => {
    if (overrides[group.id]?._deleted) return
    if (!seen.has(group.id)) {
      ordered.push(byId[group.id])
      seen.add(group.id)
    }
  })
  const airport = getTripId() === SEOUL_TRIP_ID ? ordered.find((group) => group.id === 'airport') : null
  if (airport?.items.length) {
    const hotelsList = getHotels()
    const hotel = hotelsList[1] || hotelsList[0]
    if (hotel) airport.items[0] = `8.24 约 03:00 从 ${hotel.name}（${hotel.address}）出发`
  }
  return ordered
}

export function getDefaultBudgetState() {
  const defaultBudget = getDataset().budget
  return {
    perPerson: defaultBudget.perPerson || 0,
    spent: (defaultBudget.spent || []).map((item) => ({ ...item })),
    planned: (defaultBudget.planned || []).map((item) => ({ ...item })),
  }
}

export function getBudgetState() {
  const defaultBudget = getDefaultBudgetState()
  const saved = read(getTripStorageKey(BUDGET_KEY))
  if (saved && Array.isArray(saved.spent) && Array.isArray(saved.planned)) {
    return { ...defaultBudget, ...saved }
  }
  return defaultBudget
}

export function saveBudgetState(value) {
  write(getTripStorageKey(BUDGET_KEY), value)
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
  const saved = read(getTripStorageKey(LEDGER_KEY))
  const entries = Array.isArray(saved?.entries) ? saved.entries.map(normalizeExpense) : []
  return { exchangeRate: Number(saved?.exchangeRate) || 187.5, entries }
}

export function getLedgerExpenseTotal() {
  return getLedgerState().entries
    .filter((entry) => entry.type !== 'income')
    .reduce((sum, entry) => sum + Number(entry.amountRMB || 0), 0)
}

export function saveLedgerState(value) {
  write(getTripStorageKey(LEDGER_KEY), value)
  scheduleCloudPush()
}

export function getShoppingState(owner) {
  const key = owner === 'wutong' ? SHOPPING_WUTONG_KEY : SHOPPING_DAISY_KEY
  const saved = read(key)
  if (saved && Array.isArray(saved.customers)) return saved
  return { customers: [], settings: { krwToRmb: 0.00477 } }
}

export function saveShoppingState(owner, value) {
  const key = owner === 'wutong' ? SHOPPING_WUTONG_KEY : SHOPPING_DAISY_KEY
  write(key, value || { customers: [], settings: { krwToRmb: 0.00477 } })
  scheduleCloudPush()
}

const TRIP_DATA_BASE_KEYS = [
  TIMELINE_KEY,
  REMINDER_KEY,
  BUDGET_KEY,
  LEDGER_KEY,
  TRIP_KEY,
  RESTAURANT_KEY,
  PLACE_FAVORITES_KEY,
]

export function exportAllState() {
  const tripId = getTripId()
  const data = { version: 2, tripId, savedAt: new Date().toISOString(), data: {} }
  TRIP_DATA_BASE_KEYS.forEach((baseKey) => {
    const key = getTripStorageKey(baseKey, tripId)
    const value = read(key)
    if (value && Object.keys(value).length) data.data[key] = value
  })
  ;[SHOPPING_DAISY_KEY, SHOPPING_WUTONG_KEY].forEach((key) => {
    const value = read(key)
    if (value && Object.keys(value).length) data.data[key] = value
  })
  const checks = {}
  const groupIds = new Set([
    ...getDataset(tripId).reminders.map((group) => group.id),
    ...Object.keys(getReminderOverrides()).filter((key) => key !== '__order'),
  ])
  groupIds.forEach((id) => {
    try {
      const raw = localStorage.getItem(getReminderCheckKey(id, tripId))
      if (raw) checks[id] = JSON.parse(raw)
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
  const requestedTripId = parsed?.tripId
  const tripId = DEFAULT_TRIPS[requestedTripId] ? requestedTripId : getTripId()
  setActiveTripId(tripId)
  TRIP_DATA_BASE_KEYS.forEach((baseKey) => {
    const targetKey = getTripStorageKey(baseKey, tripId)
    const value = data[targetKey] || data[baseKey]
    if (value && typeof value === 'object') write(targetKey, value)
  })
  ;[SHOPPING_DAISY_KEY, SHOPPING_WUTONG_KEY].forEach((key) => {
    if (data[key] && typeof data[key] === 'object') write(key, data[key])
  })
  const checks = data.reminderChecks || {}
  Object.entries(checks).forEach(([id, arr]) => {
    if (Array.isArray(arr)) {
      try {
        localStorage.setItem(getReminderCheckKey(id, tripId), JSON.stringify(arr))
      } catch {
        /* ignore */
      }
    }
  })
}

const NAME_PREFIX = /^(早餐|午餐|晚餐)\s*[·•|:：-]\s*/

export function getRestaurantEdits() {
  return read(getTripStorageKey(RESTAURANT_KEY)) || {}
}

export function saveRestaurantEdits(value) {
  write(getTripStorageKey(RESTAURANT_KEY), value || {})
  scheduleCloudPush()
}

export function getRestaurants() {
  const dataset = getDataset()
  const overrides = getTimelineOverrides()
  const directEdits = getRestaurantEdits()
  const edits = {}
  for (const day of dataset.days) {
    const entries = overrides[day.id] || day.entries
    for (const entry of entries) {
      if (!entry.restaurantId) continue
      const original = dataset.restaurants.find((r) => r.id === entry.restaurantId)
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
  return dataset.restaurants.map((r) => {
    const edit = edits[r.id]
    if (!edit) return r
    const merged = { ...r }
    for (const key of ['name', 'priceRange', 'note', 'recommend', 'photos']) {
      if (edit[key] !== undefined) merged[key] = edit[key]
    }
    return merged
  })
}
