const CUSTOM_TRIPS_KEY = 'stp-custom-trips-v1'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function readCustomTripRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_TRIPS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((record) => record?.tripId && record?.dataset) : []
  } catch {
    return []
  }
}

function writeCustomTripRecords(records) {
  localStorage.setItem(CUSTOM_TRIPS_KEY, JSON.stringify(records))
}

function parseDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatShortDate(date) {
  return `${date.getUTCMonth() + 1}.${String(date.getUTCDate()).padStart(2, '0')}`
}

function formatFullDate(date) {
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`
}

function buildDays(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate) || start
  if (!start) return []

  const days = []
  const cursor = new Date(start)
  let guard = 0
  while (cursor <= end && guard < 60) {
    days.push({
      id: days.length + 1,
      label: `DAY ${days.length + 1}`,
      date: formatShortDate(cursor),
      weekday: WEEKDAYS[cursor.getUTCDay()],
      theme: '待安排',
      entries: [],
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    guard += 1
  }
  return days
}

export function createCustomTripDataset(input) {
  const tripId = `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const startDate = input.startDate || ''
  const endDate = input.endDate || startDate
  const start = parseDate(startDate)
  const end = parseDate(endDate) || start
  const days = buildDays(startDate, endDate)
  const dateCount = Math.max(
    1,
    start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 : days.length || 1,
  )
  const dates =
    start && end
      ? `${formatFullDate(start)} - ${formatFullDate(end).slice(4)}`
      : input.dates || '日期待定'
  const title = input.title || `${input.cityCn || input.city || '新的旅行'}计划`

  return {
    tripId,
    createdAt: new Date().toISOString(),
    tripMeta: {
      tripId,
      itineraryVersion: `${tripId}-v1`,
      title,
      heroTitle: input.cityCn || input.city || title,
      heroSubtitle: 'TRAVEL PLANNER',
      subtitle: input.theme || '我的旅行计划',
      city: input.city || '',
      cityCn: input.cityCn || input.city || '',
      country: input.country || '',
      countryCn: input.countryCn || input.country || '',
      dates,
      startDate,
      endDate,
      duration: dateCount <= 1 ? '1日' : `${dateCount}天${dateCount - 1}晚`,
      people: Number(input.people) || 2,
      age: 0,
      theme: input.theme || '自由行',
      budgetPerPerson: 0,
      status: '规划中',
      coverImage: input.coverImage || '',
      mapCenter: input.mapCenter || null,
      concert: {},
      notes: input.notes || '',
    },
    flights: { outbound: [], return: [] },
    hotels: [],
    travelers: [{ id: 'traveler-1', name: '我', avatar: '', note: '' }],
    days,
    points: [],
    restaurants: [],
    reminders: [],
    foodGuide: {
      meals: [],
      pendingMeals: [],
      snacks: [],
      coffee: [],
    },
    budget: {
      perPerson: 0,
      spent: [],
      planned: [],
    },
  }
}

export function getCustomTripRecords() {
  return readCustomTripRecords()
}

export function getCustomTripDataset(tripId) {
  return readCustomTripRecords().find((record) => record.tripId === tripId)?.dataset || null
}

export function saveCustomTripDataset(dataset) {
  if (!dataset?.tripId) throw new Error('missing trip id')
  const records = readCustomTripRecords()
  const record = {
    tripId: dataset.tripId,
    createdAt: dataset.createdAt || new Date().toISOString(),
    dataset,
  }
  const next = [record, ...records.filter((item) => item.tripId !== dataset.tripId)]
  writeCustomTripRecords(next)
  return dataset
}

export function removeCustomTripDataset(tripId) {
  writeCustomTripRecords(readCustomTripRecords().filter((record) => record.tripId !== tripId))
}

export function isCustomTripDataset(tripId) {
  return readCustomTripRecords().some((record) => record.tripId === tripId)
}
