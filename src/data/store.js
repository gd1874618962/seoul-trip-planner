import { budget as defaultBudget, days, reminders, restaurants, tripMeta } from './trip'

const TIMELINE_KEY = 'seoul-timeline-edits-v1'
const REMINDER_KEY = 'seoul-reminder-edits-v1'
const BUDGET_KEY = 'seoul-budget-v1'
const LEDGER_KEY = 'seoul-ledger-v1'
const STATE_URL = '/api/state'

let remoteState = null
let remoteEnabled = false

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
  try {
    localStorage.setItem(key, JSON.stringify(value || {}))
  } catch {
    /* ignore */
  }
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

export function getTimelineOverrides() {
  return read(TIMELINE_KEY) || {}
}

export function saveTimelineOverrides(value) {
  write(TIMELINE_KEY, value || {})
}

export function getDays(overrides = getTimelineOverrides()) {
  return days.map((d) => ({
    ...d,
    entries: overrides[d.id] ? [...overrides[d.id]] : [...d.entries],
  }))
}

export function getReminderOverrides() {
  return read(REMINDER_KEY) || {}
}

export function saveReminderOverrides(value) {
  write(REMINDER_KEY, value || {})
}

export function getReminders(overrides = getReminderOverrides()) {
  const byId = {}
  reminders.forEach((group) => {
    const saved = overrides[group.id]
    byId[group.id] = saved
      ? { ...group, ...saved, items: Array.isArray(saved.items) ? saved.items : group.items }
      : group
  })
  const order = Array.isArray(overrides.__order) && overrides.__order.length ? overrides.__order : reminders.map((g) => g.id)
  const seen = new Set()
  const ordered = order.map((id) => byId[id]).filter((g) => g && !seen.has(g.id) && seen.add(g.id))
  reminders.forEach((group) => {
    if (!seen.has(group.id)) {
      ordered.push(byId[group.id])
      seen.add(group.id)
    }
  })
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
}

export function getLedgerState() {
  const saved = read(LEDGER_KEY)
  return saved && Array.isArray(saved.entries) ? saved : { entries: [] }
}

export function saveLedgerState(value) {
  write(LEDGER_KEY, value)
}

const DATA_KEYS = [TIMELINE_KEY, REMINDER_KEY, BUDGET_KEY, LEDGER_KEY]

export function exportAllState() {
  const data = { version: 1, savedAt: new Date().toISOString(), data: {} }
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

export function getRestaurants() {
  const overrides = getTimelineOverrides()
  const edits = {}
  for (const day of days) {
    const entries = overrides[day.id] || day.entries
    for (const entry of entries) {
      if (!entry.restaurantId) continue
      const original = restaurants.find((r) => r.id === entry.restaurantId)
      const cleanName = entry.title.replace(NAME_PREFIX, '').trim()
      edits[entry.restaurantId] = {
        name: cleanName || original?.name,
        priceRange: entry.cost && entry.cost !== '—' ? entry.cost : undefined,
        note: entry.note || undefined,
        recommend: entry.recommend || undefined,
      }
    }
  }
  return restaurants.map((r) => {
    const edit = edits[r.id]
    if (!edit) return r
    const merged = { ...r }
    for (const key of ['name', 'priceRange', 'note', 'recommend']) {
      if (edit[key] !== undefined) merged[key] = edit[key]
    }
    return merged
  })
}
