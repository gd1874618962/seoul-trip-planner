import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BedDouble,
  Bus,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronDown,
  Clock,
  Coffee,
  ExternalLink,
  Footprints,
  GripVertical,
  Hotel,
  Info,
  LockKeyhole,
  MapPin,
  Music4,
  Plane,
  RotateCcw,
  ShoppingBag,
  TrainFront,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import TripMap from '../components/TripMap'
import {
  getDays,
  getFlights,
  getHotels,
  getPoints,
  getTimelineOverrides,
  getTripMeta,
  saveTimelineOverrides,
} from '../data/store'
import {
  buildKualaLumpurPlanner,
  KL_GROUP_ORDER,
  KL_PLACE_GROUPS,
  KL_STATUS_LABELS,
} from '../utils/kualaLumpurPlanner'

const FIXED_ENTRY_IDS = new Set([
  'kl-d1-e01',
  'kl-d1-e02',
  'kl-d1-e03',
  'kl-d2-e06',
  'kl-d2-e07',
  'kl-d2-e08',
  'kl-d4-e05',
  'kl-d4-e06',
  'kl-d4-e08',
])
const FEEDBACK_NOTICE_KEY = 'kl-planner-feedback-notice'
const FEEDBACK_TIME_KEY = 'kl-planner-feedback-time'

function readSessionValue(key) {
  try {
    return sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function writeSessionValue(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const groupIcons = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  attraction: Camera,
  shopping: ShoppingBag,
  transport: TrainFront,
}

const transportIcons = {
  walk: Footprints,
  taxi: Car,
  transit: TrainFront,
  other: Bus,
}

function isFixedEntry(entry) {
  return FIXED_ENTRY_IDS.has(entry.id)
}

function StatusTag({ status, verificationPending }) {
  const label = KL_STATUS_LABELS[status] || '备选'
  const tone =
    status === 'scheduled'
      ? 'border-accent/45 text-accent'
      : status === 'unverified'
        ? 'border-clay/45 text-clay'
        : 'border-line text-muted'
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`border px-1.5 py-0.5 type-caption font-semibold ${tone}`}>{label}</span>
      {status === 'scheduled' && verificationPending && (
        <span className="type-caption font-medium text-clay">地址待核实</span>
      )}
    </span>
  )
}

function CategoryMark({ place, size = 12 }) {
  const Icon = groupIcons[place.group] || MapPin
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ color: place.markerColor }}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={1.8} />
    </span>
  )
}

function externalMapHref(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.address && !place.address.startsWith('待确认') ? place.address : place.displayName || place.name,
  )}`
}

function scheduleText(place) {
  if (!place.schedule?.length) return '尚未安排日期'
  return place.schedule
    .map((item) => `${item.dayLabel} · ${item.time || '时间待定'}`)
    .join('；')
}

function PlaceDetail({ place, days, onMove }) {
  if (!place) {
    return (
      <div className="border-y border-line py-4">
        <p className="journal-label text-accent">Place detail</p>
        <p className="type-small mt-2 text-muted">点击地图标记或右侧地点，查看类别、地址、日期与备注。</p>
      </div>
    )
  }

  return (
    <div className="border-y border-line py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="journal-label text-accent">{place.groupLabel}</p>
          <h3 className="type-h2 mt-1 text-ink">{place.displayName}</h3>
          <p className="type-small mt-1 text-muted">{place.category}</p>
        </div>
        <StatusTag status={place.status} verificationPending={place.verificationPending} />
      </div>
      <dl className="mt-3 grid gap-2 border-t border-line pt-3 type-small">
        <div className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)]">
          <dt className="font-semibold text-muted">地址</dt>
          <dd className="text-ink">{place.address || '待确认地址'}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)]">
          <dt className="font-semibold text-muted">所属日期</dt>
          <dd className="text-ink">{scheduleText(place)}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)]">
          <dt className="font-semibold text-muted">备注</dt>
          <dd className="text-muted">{place.notes || '暂无备注'}</dd>
        </div>
        {!place.located && (
          <div className="grid gap-1 sm:grid-cols-[72px_minmax(0,1fr)]">
            <dt className="font-semibold text-muted">定位</dt>
            <dd className="text-clay">坐标或分店尚未核实，地图不放置推测位置。</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={externalMapHref(place)}
          target="_blank"
          rel="noreferrer"
          className="journal-button journal-button--secondary"
        >
          <ExternalLink size={13} />
          搜索地图
        </a>
        <label className="inline-flex min-h-10 items-center gap-2 border border-line bg-paper px-3 type-caption text-muted">
          <span>{place.status === 'scheduled' ? '移动到' : '加入'}</span>
          <select
            className="bg-transparent type-caption font-semibold text-ink outline-none"
            defaultValue=""
            onChange={(event) => {
              const value = event.target.value
              event.target.value = ''
              if (value) onMove(value)
            }}
            aria-label={`${place.displayName} 调整日期`}
          >
            <option value="">选择日期</option>
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {day.label} · {day.date}
              </option>
            ))}
            {place.status === 'scheduled' && <option value="pending">待安排</option>}
          </select>
          <ChevronDown size={12} />
        </label>
      </div>
    </div>
  )
}

export default function KualaLumpurItinerary() {
  const meta = getTripMeta()
  const flights = getFlights()
  const hotels = getHotels()
  const hotel = hotels[0]
  const outbound = flights.outbound?.[0]
  const companion = flights.outbound?.[1]
  const returnFlight = flights.return?.[0]
  const [selectedId, setSelectedId] = useState('')
  const [mapFilter, setMapFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [overrides, setOverrides] = useState(() => getTimelineOverrides())
  const [savedAt, setSavedAt] = useState(() => readSessionValue(FEEDBACK_TIME_KEY))
  const [notice, setNotice] = useState(() => readSessionValue(FEEDBACK_NOTICE_KEY))
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)
  const overridesRef = useRef(overrides)

  const days = useMemo(() => getDays(overrides), [overrides])
  const daysRef = useRef(days)
  useEffect(() => {
    daysRef.current = days
  }, [days])

  useEffect(() => {
    overridesRef.current = overrides
  }, [overrides])

  const points = getPoints()
  const planner = buildKualaLumpurPlanner(points, days, meta)
  const placesByLocation = Object.fromEntries(
    planner.places.map((place) => [place.locationId, place]),
  )
  const selectedPlace = planner.places.find((place) => place.locationId === selectedId)
  const allLocated = planner.located
  const filteredMapItems = allLocated
    .filter((place) => {
      if (groupFilter !== 'all' && place.group !== groupFilter) return false
      if (mapFilter === 'all') return true
      return place.schedule.some((item) => String(item.dayId) === String(mapFilter))
    })
    .map((place, index) => ({ ...place, markerNo: place.order || index + 1 }))
  const unlocatedCount = planner.unlocated.length
  const pendingCount = planner.pending.length

  const commitOverrides = (next, message) => {
    const version = meta.itineraryVersion
    const versioned = {
      ...next,
      __itineraryVersion: {
        ...(next.__itineraryVersion || {}),
        ...Object.fromEntries(days.map((day) => [day.id, version])),
      },
    }
    overridesRef.current = versioned
    setOverrides(versioned)
    saveTimelineOverrides(versioned)
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    setSavedAt(time)
    writeSessionValue(FEEDBACK_TIME_KEY, time)
    setNotice(message)
    writeSessionValue(FEEDBACK_NOTICE_KEY, message)
  }

  const hiddenEntriesFor = (dayId, excludingId = '') => {
    const saved = overridesRef.current[dayId]
    if (!Array.isArray(saved)) return []
    return saved.filter((entry) => entry.__hidden && entry.id !== excludingId)
  }

  const moveEntryToDay = (source, targetDayId, targetIndex = null) => {
    const sourceDay = daysRef.current.find((day) => String(day.id) === String(source.dayId))
    const targetDay = daysRef.current.find((day) => String(day.id) === String(targetDayId))
    if (!sourceDay || !targetDay) return
    const entry = sourceDay.entries.find((item) => item.id === source.entryId)
    if (!entry) return

    if (String(source.dayId) === String(targetDayId)) {
      const nextEntries = [...sourceDay.entries]
      const currentIndex = nextEntries.findIndex((item) => item.id === entry.id)
      if (currentIndex < 0) return
      nextEntries.splice(currentIndex, 1)
      const insertAt = targetIndex == null ? nextEntries.length : Math.max(0, Math.min(targetIndex, nextEntries.length))
      nextEntries.splice(insertAt, 0, entry)
      commitOverrides(
        {
          ...overridesRef.current,
          [sourceDay.id]: [...nextEntries, ...hiddenEntriesFor(sourceDay.id)],
        },
        `${entry.title} 已调整为 ${targetDay.label} 第 ${insertAt + 1} 项`,
      )
      return
    }

    const sourceEntries = sourceDay.entries.filter((item) => item.id !== entry.id)
    const sourceHidden = [
      ...hiddenEntriesFor(sourceDay.id, entry.id),
      { ...entry, __hidden: true },
    ]
    const targetEntries = targetDay.entries.filter((item) => item.id !== entry.id)
    const insertAt = targetIndex == null
      ? targetEntries.length
      : Math.max(0, Math.min(targetIndex, targetEntries.length))
    targetEntries.splice(insertAt, 0, entry)
    const targetHidden = hiddenEntriesFor(targetDay.id, entry.id)
    commitOverrides(
      {
        ...overridesRef.current,
        [sourceDay.id]: [...sourceEntries, ...sourceHidden],
        [targetDay.id]: [...targetEntries, ...targetHidden],
      },
      `${entry.title} 已移至 ${targetDay.label} 第 ${insertAt + 1} 项`,
    )
  }

  const moveEntryToPending = (source) => {
    const sourceDay = daysRef.current.find((day) => String(day.id) === String(source.dayId))
    if (!sourceDay) return
    const entry = sourceDay.entries.find((item) => item.id === source.entryId)
    if (!entry) return
    const nextEntries = sourceDay.entries.filter((item) => item.id !== entry.id)
    commitOverrides(
      {
        ...overridesRef.current,
        [sourceDay.id]: [
          ...nextEntries,
          ...hiddenEntriesFor(sourceDay.id, entry.id),
          { ...entry, __hidden: true },
        ],
      },
      `${entry.title} 已移回待安排`,
    )
  }

  const makeEntryFromPlace = (place) => ({
    id: `kl-plan-${place.locationId}-${Date.now().toString(36)}`,
    time: '待定',
    title: place.displayName,
    type: place.category,
    locationId: place.locationId,
    address: place.address,
    transport: '待安排',
    transportMode: '',
    note: place.notes,
    status: 'planned',
  })

  const addPendingPlaceToDay = (locationId, targetDayId, targetIndex = null) => {
    const place = placesByLocation[locationId]
    const targetDay = daysRef.current.find((day) => String(day.id) === String(targetDayId))
    if (!place || !targetDay) return
    const entry = makeEntryFromPlace(place)
    const targetEntries = [...targetDay.entries]
    const insertAt = targetIndex == null
      ? targetEntries.length
      : Math.max(0, Math.min(targetIndex, targetEntries.length))
    targetEntries.splice(insertAt, 0, entry)
    commitOverrides(
      {
        ...overridesRef.current,
        [targetDay.id]: [...targetEntries, ...hiddenEntriesFor(targetDay.id, entry.id)],
      },
      `${place.displayName} 已加入 ${targetDay.label} 第 ${insertAt + 1} 项`,
    )
    setSelectedId(place.locationId)
  }

  const getDropTarget = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY)
    if (!element) return null
    const pendingZone = element.closest('[data-drop-pending]')
    if (pendingZone) return { kind: 'pending' }
    const dayZone = element.closest('[data-drop-day]')
    if (!dayZone) return null
    const cards = Array.from(dayZone.querySelectorAll('[data-entry-id]'))
    let index = cards.length
    for (let i = 0; i < cards.length; i += 1) {
      const rect = cards[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) {
        index = i
        break
      }
    }
    return { kind: 'day', dayId: Number(dayZone.dataset.dropDay), index }
  }

  const finishDrop = (source, target) => {
    if (!source || !target) return
    if (source.kind === 'pending' && target.kind === 'day') {
      addPendingPlaceToDay(source.locationId, target.dayId, target.index)
      return
    }
    if (source.kind !== 'day') return
    if (target.kind === 'pending') {
      moveEntryToPending(source)
      return
    }
    if (target.kind === 'day') {
      moveEntryToDay(source, target.dayId, target.index)
    }
  }

  const dragging = Boolean(drag)
  useEffect(() => {
    if (!dragging) return undefined
    const onPointerMove = (event) => {
      event.preventDefault()
      if (event.clientY > window.innerHeight - 72) window.scrollBy(0, 14)
      if (event.clientY < 72) window.scrollBy(0, -14)
      const target = getDropTarget(event.clientX, event.clientY)
      setDrag((current) => current ? { ...current, x: event.clientX, y: event.clientY, target } : null)
    }
    const onPointerUp = (event) => {
      finishDrop(dragRef.current, getDropTarget(event.clientX, event.clientY))
      dragRef.current = null
      setDrag(null)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [dragging])

  const startDrag = (event, source) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    const next = { ...source, x: event.clientX, y: event.clientY, target: null }
    dragRef.current = next
    setDrag(next)
  }

  const selectPlace = (locationId) => {
    const place = placesByLocation[locationId]
    setSelectedId(locationId)
    if (!place) return
    if (mapFilter !== 'all' && !place.schedule.some((item) => String(item.dayId) === String(mapFilter))) {
      setMapFilter('all')
    }
  }

  const moveSelectedPlace = (target) => {
    if (!selectedPlace) return
    if (target === 'pending') {
      const first = selectedPlace.schedule[0]
      if (first) moveEntryToPending({ kind: 'day', dayId: first.dayId, entryId: first.entryId })
      return
    }
    if (selectedPlace.status === 'scheduled') {
      const first = selectedPlace.schedule[0]
      const sourceDay = days.find((day) => String(day.id) === String(first.dayId))
      const entry = sourceDay?.entries.find((item) => item.locationId === selectedPlace.locationId)
      if (entry && !isFixedEntry(entry)) {
        moveEntryToDay(
          { kind: 'day', dayId: first.dayId, entryId: entry.id },
          Number(target),
          null,
        )
      } else if (entry) {
        setNotice(`${entry.title} 是固定节点，不能移动到其他日期`)
      }
      return
    }
    addPendingPlaceToDay(selectedPlace.locationId, Number(target), null)
  }

  const resetOrder = () => {
    if (!window.confirm('恢复吉隆坡默认行程顺序？你通过拖拽新增或移动的安排会被清除。')) return
    overridesRef.current = {}
    setOverrides({})
    saveTimelineOverrides({})
    const message = '已恢复默认行程顺序'
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    setNotice(message)
    setSavedAt(time)
    writeSessionValue(FEEDBACK_NOTICE_KEY, message)
    writeSessionValue(FEEDBACK_TIME_KEY, time)
  }

  const dragPreview = dragRef.current
    ? drag.kind === 'pending'
      ? placesByLocation[drag.locationId]?.displayName
      : days
          .find((day) => String(day.id) === String(drag.dayId))
          ?.entries.find((entry) => entry.id === drag.entryId)?.title
    : ''

  return (
    <div>
      <PageHeader
        eyebrow="Kuala Lumpur / 2027"
        title="吉隆坡旅行计划"
        subtitle="完整地点清单与四日动线放在同一页。地图、行程和顺序调整读取同一份数据，未核实地点不会放置推测坐标。"
      />

      <div className="mx-5 pb-16 pt-6 lg:mx-10">
        <section className="grid gap-5 border-b border-line pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-start lg:gap-8">
          <div>
            <p className="journal-label text-accent">Overview</p>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              <div>
                <p className="type-caption text-muted">日期</p>
                <p className="type-small mt-1 font-semibold text-ink">{meta.dates}</p>
              </div>
              <div>
                <p className="type-caption text-muted">同行</p>
                <p className="type-small mt-1 font-semibold text-ink">{meta.people} 人</p>
              </div>
              <div className="col-span-2">
                <p className="type-caption text-muted">酒店</p>
                <p className="type-small mt-1 font-semibold text-ink">
                  {hotel?.en || hotel?.name} <span className="font-normal text-muted">/ {hotel?.name}</span>
                </p>
                <p className="type-caption mt-1 text-muted">{hotel?.address}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4">
              <span className="inline-flex items-center gap-1.5 type-caption text-muted">
                <MapPin size={12} className="text-accent" />
                {planner.places.length} 个地点
              </span>
              <span className="inline-flex items-center gap-1.5 type-caption text-muted">
                <Check size={12} className="text-accent" />
                {allLocated.length} 个已定位
              </span>
              <span className="inline-flex items-center gap-1.5 type-caption text-muted">
                <Info size={12} className="text-clay" />
                {pendingCount} 个待安排 / 备选
              </span>
            </div>
          </div>

          <div className="border-y border-line">
            <div className="flex gap-3 border-b border-line py-3">
              <Plane size={15} className="mt-0.5 shrink-0 text-accent" />
              <div className="min-w-0 type-small">
                <p className="font-semibold text-ink">{outbound?.flight || 'MH387'}</p>
                <p className="mt-0.5 text-muted">{outbound?.route}</p>
                <p className="mt-0.5 text-ink">{outbound?.note}</p>
                {companion && <p className="mt-1 text-muted">{companion.note}</p>}
              </div>
            </div>
            <div className="flex gap-3 border-b border-line py-3">
              <Music4 size={15} className="mt-0.5 shrink-0 text-clay" />
              <div className="min-w-0 type-small">
                <p className="font-semibold text-ink">1月9日 · BIGBANG</p>
                <p className="mt-0.5 text-muted">TM Stadium Nasional / 国家体育场</p>
                <p className="mt-0.5 text-ink">预计 14:00 入场 · 约 22:00 结束</p>
              </div>
            </div>
            <div className="flex gap-3 py-3">
              <Plane size={15} className="mt-0.5 shrink-0 text-accent" />
              <div className="min-w-0 type-small">
                <p className="font-semibold text-ink">1月11日 · 19:35 返程</p>
                <p className="mt-0.5 text-muted">{returnFlight?.route}</p>
                <p className="mt-0.5 text-ink">17:00 前抵达 T2，预留取行李、值机、托运与安检时间。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(430px,1.04fr)] lg:items-start">
          <section className="min-w-0 lg:sticky lg:top-6">
            <div className="flex items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="journal-label text-accent">Map</p>
                <h2 className="type-h1 mt-1 text-ink">全城地点图谱</h2>
              </div>
              <p className="shrink-0 type-caption text-muted">{filteredMapItems.length} pins</p>
            </div>

            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setMapFilter('all')}
                className="journal-filter"
                data-active={mapFilter === 'all'}
              >
                全部地点
              </button>
              {days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setMapFilter(String(day.id))}
                  className="journal-filter"
                  data-active={mapFilter === String(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setGroupFilter('all')}
                className="journal-filter"
                data-active={groupFilter === 'all'}
              >
                全部类型
              </button>
              {KL_GROUP_ORDER.map((groupId) => {
                const group = KL_PLACE_GROUPS[groupId]
                const Icon = groupIcons[groupId]
                return (
                  <button
                    key={groupId}
                    type="button"
                    onClick={() => setGroupFilter(groupId)}
                    className="journal-filter"
                    data-active={groupFilter === groupId}
                  >
                    <Icon size={11} />
                    {group.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-3">
              <TripMap
                items={filteredMapItems}
                focusId={selectedPlace?.located ? selectedPlace.locationId : ''}
                showRoutes={false}
                clusterByPosition
                onSelectPoint={selectPlace}
                heightClass="h-[360px] lg:h-[540px]"
                days={days}
                tripMeta={meta}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {KL_GROUP_ORDER.map((groupId) => (
                <span key={groupId} className="inline-flex items-center gap-1.5 type-caption text-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: KL_PLACE_GROUPS[groupId].color }}
                  />
                  {KL_PLACE_GROUPS[groupId].label}
                </span>
              ))}
            </div>
            <p className="mt-2 type-caption text-muted">
              地图支持缩放与邻近聚合；{unlocatedCount} 个地点因地址、分店或坐标待核实，不放置推测位置。
            </p>
            {unlocatedCount > 0 && (
              <details className="mt-2 border-y border-line py-2">
                <summary className="cursor-pointer type-caption font-semibold text-accent">
                  查看 {unlocatedCount} 个未定位地点
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {planner.unlocated.map((place) => (
                    <button
                      key={place.locationId}
                      type="button"
                      onClick={() => selectPlace(place.locationId)}
                      className="border-b border-line py-0.5 type-caption text-muted hover:text-ink"
                    >
                      {place.displayName}
                    </button>
                  ))}
                </div>
              </details>
            )}

            <PlaceDetail place={selectedPlace} days={days} onMove={moveSelectedPlace} />
          </section>

          <section className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="journal-label text-accent">Itinerary</p>
                <h2 className="type-h1 mt-1 text-ink">按日期调整顺序</h2>
              </div>
              <button type="button" onClick={resetOrder} className="journal-button journal-button--quiet">
                <RotateCcw size={13} />
                恢复默认
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-y border-line py-2">
              <p className="type-caption text-muted">
                拖动卡片把手调整顺序，也可将地点拖入其他日期或“待安排”。
              </p>
              <p className="inline-flex items-center gap-1.5 type-caption font-semibold text-accent">
                <Check size={11} />
                {savedAt ? `本地已保存 ${savedAt}` : '调整后自动保存在本机'}
              </p>
            </div>
            {notice && (
              <div
                data-testid="planner-notice"
                className="mt-2 flex items-center justify-between gap-3 bg-surface px-3 py-2"
              >
                <p className="type-caption font-medium text-ink">{notice}</p>
                <button
                  type="button"
                  onClick={() => {
                    setNotice('')
                    writeSessionValue(FEEDBACK_NOTICE_KEY, '')
                  }}
                  className="type-caption text-muted"
                >
                  关闭
                </button>
              </div>
            )}

            <div className="mt-5">
              {days.map((day) => {
                const isDropTarget = drag?.target?.kind === 'day' && String(drag.target.dayId) === String(day.id)
                return (
                  <section
                    key={day.id}
                    data-drop-day={day.id}
                    className={`border-b border-line pb-5 pt-1 ${isDropTarget ? 'kl-drop-active' : ''}`}
                  >
                    <header className="flex items-start justify-between gap-3 border-t border-ink/30 pt-3">
                      <div className="min-w-0">
                        <p className="journal-label text-accent">
                          {day.label} · {day.date} {day.weekday}
                        </p>
                        <h3 className="type-h2 mt-1 text-ink">{day.theme}</h3>
                      </div>
                      <span className="shrink-0 type-caption text-muted">{day.entries.length} 项</span>
                    </header>
                    {day.note && <p className="mt-2 type-caption text-muted">{day.note}</p>}

                    <div className="mt-3">
                      {day.entries.map((entry, index) => {
                        const place = entry.locationId ? placesByLocation[entry.locationId] : null
                        const fixed = isFixedEntry(entry)
                        const TransportIcon = transportIcons[entry.transportMode] || Bus
                        return (
                          <div
                            key={entry.id}
                            data-entry-id={entry.id}
                            className={`kl-itinerary-row grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2 border-b border-line py-3 ${
                              selectedId === entry.locationId ? 'bg-surface' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1 pt-0.5">
                              {fixed ? (
                                <span className="flex h-8 w-7 items-center justify-center text-muted">
                                  <LockKeyhole size={12} />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onPointerDown={(event) =>
                                    startDrag(event, {
                                      kind: 'day',
                                      dayId: day.id,
                                      entryId: entry.id,
                                      locationId: entry.locationId,
                                    })
                                  }
                                  className="kl-drag-handle flex min-h-8 w-7 items-center justify-center text-muted"
                                  aria-label={`拖动 ${entry.title} 调整顺序`}
                                  title="拖动调整顺序"
                                >
                                  <GripVertical size={14} />
                                </button>
                              )}
                              <span className="type-caption font-semibold text-muted">{index + 1}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => place && selectPlace(place.locationId)}
                              className="min-w-0 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="type-caption font-semibold text-ink">{entry.time}</span>
                                {place && <CategoryMark place={place} size={11} />}
                                <span className="type-caption text-muted">
                                  {place?.groupLabel || entry.type}
                                </span>
                                {fixed && (
                                  <span className="type-caption font-medium text-clay">固定节点</span>
                                )}
                                {place?.verificationPending && (
                                  <span className="type-caption font-medium text-clay">待核实</span>
                                )}
                              </div>
                              <p className="mt-1 type-small font-semibold text-ink">{entry.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-muted">
                                {entry.address && <span className="line-clamp-1">{entry.address}</span>}
                                {entry.transport && (
                                  <span className="inline-flex items-center gap-1">
                                    <TransportIcon size={10} />
                                    {typeof entry.transport === 'string' ? entry.transport : '交通待定'}
                                  </span>
                                )}
                                {entry.note && !selectedId && <span className="line-clamp-1">{entry.note}</span>}
                              </div>
                              {selectedId === entry.locationId && entry.note && (
                                <p className="mt-2 border-l border-accent/35 pl-2 type-caption text-muted">
                                  {entry.note}
                                </p>
                              )}
                            </button>
                          </div>
                        )
                      })}
                      {!day.entries.length && (
                        <div className="border border-dashed border-line px-4 py-6 text-center">
                          <p className="type-small text-muted">把地点拖到这里</p>
                        </div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>

            <section
              data-drop-pending
              className={`mt-5 border-y border-line pb-5 pt-4 ${
                drag?.target?.kind === 'pending' ? 'kl-drop-active' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="journal-label text-clay">Unscheduled</p>
                  <h3 className="type-h2 mt-1 text-ink">待安排地点</h3>
                  <p className="mt-1 type-caption text-muted">
                    包含备选餐厅、咖啡、购物点、未核实地址和暂未排日期的地点。拖回这里即可从某一天移出。
                  </p>
                </div>
                <span className="shrink-0 type-caption text-muted">{planner.pending.length} 项</span>
              </div>

              <div className="mt-3 grid gap-x-5 md:grid-cols-2">
                {planner.pending.map((place) => (
                  <div
                    key={place.locationId}
                    className={`kl-pending-row grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2 border-b border-line py-3 ${
                      selectedId === place.locationId ? 'bg-surface' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onPointerDown={(event) =>
                        startDrag(event, { kind: 'pending', locationId: place.locationId })
                      }
                      className="kl-drag-handle flex min-h-8 w-7 items-center justify-center text-muted"
                      aria-label={`拖动 ${place.displayName} 加入某一天`}
                      title="拖到某一天加入行程"
                    >
                      <GripVertical size={14} />
                    </button>
                    <button type="button" onClick={() => selectPlace(place.locationId)} className="min-w-0 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="type-small font-semibold text-ink">{place.displayName}</p>
                          <p className="mt-0.5 type-caption text-muted">{place.category}</p>
                        </div>
                        <StatusTag status={place.status} verificationPending={place.verificationPending} />
                      </div>
                      <p className="mt-1 line-clamp-1 type-caption text-muted">
                        {place.located ? place.address : '地址 / 坐标待核实，未在地图绘制'}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
              {!planner.pending.length && (
                <div className="mt-3 border border-dashed border-line px-4 py-6 text-center">
                  <p className="type-small text-muted">当前所有地点都已排入日期</p>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>

      {drag && (
        <div
          className="pointer-events-none fixed z-[1000] max-w-64 border border-accent bg-paper px-3 py-2 type-caption font-semibold text-ink"
          style={{ left: Math.min(drag.x + 14, window.innerWidth - 220), top: drag.y + 14 }}
        >
          {dragPreview}
          <span className="ml-2 font-normal text-muted">
            {drag.target?.kind === 'pending'
              ? '→ 待安排'
              : drag.target?.kind === 'day'
                ? `→ DAY ${drag.target.dayId}`
                : '拖到某一天'}
          </span>
        </div>
      )}
    </div>
  )
}

