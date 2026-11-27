export const KL_PLACE_GROUPS = {
  hotel: { id: 'hotel', label: '酒店', color: '#6E4B5E' },
  restaurant: { id: 'restaurant', label: '餐厅', color: '#A2583F' },
  cafe: { id: 'cafe', label: '咖啡 / 甜品', color: '#3F746B' },
  attraction: { id: 'attraction', label: '景点 / 打卡', color: '#A07A2E' },
  shopping: { id: 'shopping', label: '商场 / 购物', color: '#526B87' },
  transport: { id: 'transport', label: '交通 / 演出', color: '#55565A' },
}

export const KL_GROUP_ORDER = ['hotel', 'restaurant', 'cafe', 'attraction', 'shopping', 'transport']

export const KL_STATUS_LABELS = {
  scheduled: '已安排',
  backup: '备选',
  unverified: '待核实',
}

export function getKualaLumpurPlaceGroup(pointOrCategory) {
  const category = typeof pointOrCategory === 'string'
    ? pointOrCategory
    : pointOrCategory?.category || ''

  if (/住宿|酒店|Hotel/i.test(category)) return 'hotel'
  if (/机场餐饮/i.test(category)) return 'restaurant'
  if (/机场|演出场馆|交通|演唱会/i.test(category)) return 'transport'
  if (/咖啡|甜品|茶餐厅|茶饮|烘焙|榴莲体验/i.test(category)) return 'cafe'
  if (/购物|商场|超市|书店|纪念品/i.test(category)) return 'shopping'
  if (/餐|美食|小吃|烧烤|肉骨茶|椰浆饭|炸鸡|咖喱|汉堡|榴莲体验|正餐/i.test(category)) {
    return 'restaurant'
  }
  return 'attraction'
}

export function getKualaLumpurPlaceMeta(pointOrCategory) {
  return KL_PLACE_GROUPS[getKualaLumpurPlaceGroup(pointOrCategory)]
}

export function hasKualaLumpurCoordinates(point) {
  const rawLat = point?.latitude ?? point?.lat
  const rawLng = point?.longitude ?? point?.lng
  if (rawLat == null || rawLng == null || rawLat === '' || rawLng === '') return false
  const lat = Number(rawLat)
  const lng = Number(rawLng)
  return Number.isFinite(lat) && Number.isFinite(lng)
}

function isoDateForDay(meta, day) {
  const start = String(meta?.startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!start) return null
  const date = new Date(Date.UTC(Number(start[1]), Number(start[2]) - 1, Number(start[3])))
  date.setUTCDate(date.getUTCDate() + Math.max(0, Number(day?.id || 1) - 1))
  return date.toISOString().slice(0, 10)
}

export function buildKualaLumpurPlanner(points, days, meta) {
  const occurrencesByLocation = new Map()

  days.forEach((day) => {
    day.entries.forEach((entry, index) => {
      if (!entry.locationId) return
      const list = occurrencesByLocation.get(entry.locationId) || []
      list.push({
        dayId: day.id,
        dayLabel: day.label,
        date: isoDateForDay(meta, day),
        order: index + 1,
        time: entry.time || '',
        title: entry.title || '',
        transport: typeof entry.transport === 'string' ? entry.transport : '',
        note: entry.note || '',
      })
      occurrencesByLocation.set(entry.locationId, list)
    })
  })

  const places = points.map((point) => {
    const schedule = occurrencesByLocation.get(point.locationId) || []
    const located = hasKualaLumpurCoordinates(point)
    const verificationPending = Boolean(point.branchPending || point.addressPending || !located)
    const first = schedule[0]
    const status = first
      ? 'scheduled'
      : verificationPending
        ? 'unverified'
        : 'backup'
    const group = getKualaLumpurPlaceGroup(point)

    return {
      ...point,
      id: point.locationId || point.id,
      name: point.displayName || point.name,
      displayName: point.displayName || point.name,
      category: point.category || '地点',
      address: point.officialAddress || point.address || '待确认地址',
      latitude: located ? Number(point.latitude ?? point.lat) : null,
      longitude: located ? Number(point.longitude ?? point.lng) : null,
      date: first?.date || null,
      order: first?.order || null,
      status,
      statusLabel: KL_STATUS_LABELS[status],
      verificationPending,
      located,
      group,
      groupLabel: KL_PLACE_GROUPS[group].label,
      markerColor: KL_PLACE_GROUPS[group].color,
      schedule,
      notes: point.notes || point.note || '',
    }
  })

  const scheduled = places.filter((place) => place.status === 'scheduled')
  const pending = places.filter((place) => place.status !== 'scheduled')

  return {
    places,
    scheduled,
    pending,
    located: places.filter((place) => place.located),
    unlocated: places.filter((place) => !place.located),
  }
}

