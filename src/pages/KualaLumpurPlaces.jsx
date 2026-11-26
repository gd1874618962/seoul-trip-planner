import { useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleAlert,
  Coffee,
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  Route,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import TripMap, { buildDayRoutes, getDayColor } from '../components/TripMap'
import {
  getFavoritePlaceIds,
  getDays,
  getPoints,
  getTripMeta,
  saveFavoritePlaceIds,
} from '../data/store'

const areaColors = {
  '武吉免登 / Pavilion / Jalan Alor': '#775736',
  'KLCC / 双子塔': '#775736',
  'TRX / 市中心东侧': '#775736',
  '独立广场 / 中央市场 / 唐人街': '#775736',
  '十五碑 / Brickfields': '#775736',
  '甲洞 / Kepong': '#775736',
  'Petaling Jaya / Mid Valley': '#775736',
  'PJ Section 17': '#775736',
  '独立广场 / 老城区': '#775736',
  'Quill City Mall': '#775736',
  'Pavilion Damansara Heights': '#775736',
  '机场 / KLIA': '#775736',
  '待确认区域': '#775736',
  '雪兰莪 / 巴生方向': '#775736',
  '机场 / 返程': '#775736',
  '其他 / 待确认区域': '#775736',
  'Bukit Jalil / 演唱会场馆': '#775736',
}

const typeFilters = [
  { id: 'all', label: '全部' },
  { id: 'key', label: '重点正餐', icon: Star },
  { id: 'must', label: '必去', icon: Compass },
  { id: 'food', label: '美食', icon: UtensilsCrossed },
  { id: 'cafe', label: '咖啡甜品', icon: Coffee },
  { id: 'shopping', label: '购物', icon: ShoppingBag },
  { id: 'pending', label: '待核实', icon: CircleAlert },
  { id: 'saved', label: '已收藏', icon: Bookmark },
]

function matchesType(point, type) {
  if (type === 'key') return point.keyRestaurant
  if (type === 'must') return point.mustVisit
  if (type === 'saved') return point.isFavorite
  if (type === 'food') {
    return point.keyRestaurant || /餐|美食|茶餐厅|海鲜|客家|炸鸡|小吃|机场餐饮/.test(point.category)
  }
  if (type === 'cafe') return /咖啡|甜品/.test(point.category)
  if (type === 'shopping') return /购物|超市/.test(point.category)
  if (type === 'pending') return point.branchPending || point.addressPending || !point.hasCoordinates
  return true
}

function mapHref(point) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    point.mapQuery || `${point.displayName || point.name} Kuala Lumpur`,
  )}`
}

function PlaceCard({ point, expanded, onToggle, onFavorite }) {
  const hasAddress = point.officialAddress && !point.officialAddress.startsWith('待确认')
  return (
    <article className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-4 text-left"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border type-caption font-semibold ${
              point.hasCoordinates ? 'border-line text-ink' : 'border-dashed border-accent/60 text-accent'
            }`}
          >
            {point.hasCoordinates ? point.markerNo : <MapPin size={12} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="type-h3 text-ink">{point.displayName}</h3>
                <p className="journal-label mt-1">
                  {point.area}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {point.keyRestaurant && (
                  <span className="type-caption font-medium text-accent">
                    重点正餐
                  </span>
                )}
                {point.mustVisit && !point.keyRestaurant && (
                  <span className="type-caption font-medium text-accent">必去</span>
                )}
              </div>
            </div>
            <p className="type-small mt-2 text-muted">
              {point.note || point.category}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-muted">
              <span>{point.category}</span>
              {point.days?.length > 0 && (
                <span className="border-l border-line pl-3 text-ink">
                  {point.days.map((day) => `DAY ${day}`).join(' · ')}
                </span>
              )}
              {(point.branchPending || point.addressPending) && (
                <span className="border-l border-accent/40 pl-3 text-accent">
                  {point.addressPending ? '地点待确认' : '分店 / 地址待确认'}
                </span>
              )}
              {!point.hasCoordinates && (
                <span className="border-l border-line pl-3 text-muted">暂不放置推测坐标</span>
              )}
              {point.distanceLevel && (
                <span className="border-l border-clay/40 pl-3 text-clay">
                  {point.distanceLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-10 border-l border-line pb-4 pl-4">
          <p className="flex items-start gap-1.5 type-small text-muted">
            <MapPin size={12} className="mt-0.5 shrink-0 text-accent" />
            {hasAddress ? point.officialAddress : '地址或分店尚未确认，请先通过地图搜索核实。'}
          </p>
          {point.recommended?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {point.recommended.map((item) => (
                <span key={item} className="type-caption text-accent">
                  {item}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <a
              href={mapHref(point)}
              target="_blank"
              rel="noreferrer"
              className="journal-button journal-button--primary flex-1"
            >
              <Navigation size={12} />
              搜索 / 导航
            </a>
            <button
              type="button"
              onClick={onFavorite}
              className={`journal-button journal-button--secondary ${
                point.isFavorite
                  ? 'border-accent/40 text-accent'
                  : 'text-muted'
              }`}
            >
              {point.isFavorite ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {point.isFavorite ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function KualaLumpurPlaces() {
  const tripMeta = getTripMeta()
  const [areaFilter, setAreaFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [focusId, setFocusId] = useState('')
  const [expandedId, setExpandedId] = useState('')
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoritePlaceIds())
  const [mapMode, setMapMode] = useState('route')

  const points = [...getPoints()].sort(
    (a, b) => Number(a.areaOrder || 99) - Number(b.areaOrder || 99) || a.displayName.localeCompare(b.displayName),
  )
  const areas = Array.from(
    new Map(points.map((point) => [point.area, Number(point.areaOrder || 99)])).entries(),
  ).sort((a, b) => a[1] - b[1])

  const withMeta = points.map((point) => ({
    ...point,
    hasCoordinates: point.lat != null && point.lng != null && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)),
    markerColor: areaColors[point.area] || '#536E6F',
    isFavorite: favoriteIds.includes(point.locationId),
  }))
  const filtered = withMeta.filter(
    (point) =>
      (areaFilter === 'all' || point.area === areaFilter) &&
      matchesType(point, typeFilter),
  )
  const mapped = filtered
    .filter((point) => point.hasCoordinates)
    .map((point, index) => ({ ...point, markerNo: index + 1 }))
  const mappedLocationIds = new Set(mapped.map((point) => point.locationId))
  const daysList = getDays()
  const routePoints = []
  const routeSeen = new Set()
  daysList.forEach((day) => {
    day.entries.forEach((entry) => {
      const refs = entry.locationId
        ? [entry.locationId]
        : Array.isArray(entry.pointIds)
          ? entry.pointIds.map((id) => `loc-${id}`)
          : []
      refs.forEach((ref) => {
        const point = withMeta.find((item) => item.locationId === ref && item.hasCoordinates)
        if (point && !routeSeen.has(point.locationId)) {
          routeSeen.add(point.locationId)
          routePoints.push({ ...point, day: day.id, markerNo: routePoints.length + 1 })
        }
      })
    })
  })
  const dayRoutes = buildDayRoutes(routePoints, daysList)
  const mapItems = mapMode === 'route' ? routePoints : mapped
  const cardPoints = filtered.map((point) => ({
    ...point,
    markerNo: mapped.find((entry) => entry.locationId === point.locationId)?.markerNo,
  }))
  const grouped = areas
    .map(([area]) => ({
      area,
      points: cardPoints.filter((point) => point.area === area),
    }))
    .filter((group) => group.points.length)
  const unlocatedCount = cardPoints.filter((point) => !mappedLocationIds.has(point.locationId)).length
  const keyCount = points.filter((point) => point.keyRestaurant).length

  const toggleFavorite = (locationId) => {
    const next = favoriteIds.includes(locationId)
      ? favoriteIds.filter((id) => id !== locationId)
      : [...favoriteIds, locationId]
    setFavoriteIds(next)
    saveFavoritePlaceIds(next)
  }

  const selectPoint = (point) => {
    setExpandedId(expandedId === point.locationId ? '' : point.locationId)
    if (point.hasCoordinates) setFocusId(point.locationId)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kuala Lumpur / Place Index"
        title="地点图谱"
        subtitle="已确认地点按区域整理；分店、地址或位置未核实的项目明确标记，不放置推测坐标"
      />

      <div className="mx-5 pb-14 pt-6 lg:mx-10">
        <section className="grid gap-8 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="journal-label text-accent">
              {tripMeta.dates} · {tripMeta.people} people
            </p>
            <h2 className="type-h1 mt-3 max-w-2xl text-ink">
              先看位置，再定路线
            </h2>
            <p className="type-small mt-4 max-w-xl text-muted">
              必打卡地点与每日餐厅均已纳入地点索引。市内移动以 Grab 为主，远距离地点不默认步行可达。
            </p>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-line pt-4">
              {(tripMeta.mustVisitChecklist || []).map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-accent" strokeWidth={1.5} />
                  <span className="type-caption text-ink">
                    {item.name}
                    <span className="block text-muted">{item.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 border-y border-ink/20">
            <div>
              <p className="numeric py-3 text-center type-h1 text-ink lg:text-left">{points.length}</p>
              <p className="pb-3 text-center type-caption text-muted lg:text-left">地点</p>
            </div>
            <div className="border-l border-ink/15 pl-3">
              <p className="numeric py-3 text-center type-h1 text-ink lg:text-left">{mapped.length}</p>
              <p className="pb-3 text-center type-caption text-muted lg:text-left">地图已定位</p>
            </div>
            <div className="border-l border-ink/15 pl-3">
              <p className="numeric py-3 text-center type-h1 text-accent lg:text-left">{keyCount}</p>
              <p className="pb-3 text-center type-caption text-muted lg:text-left">重点正餐</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(350px,0.85fr)] lg:items-start">
          <div className="lg:sticky lg:top-[82px]">
            <div className="mb-3 flex items-end justify-between border-b border-line pb-3">
              <p className="type-h2 text-ink">地理分布</p>
              <span className="journal-label">{mapped.length} pins</span>
            </div>
            <TripMap
              items={mapItems}
              focusId={focusId}
              showRoutes={mapMode === 'route'}
              onSelectPoint={(locationId) => {
                setFocusId(locationId)
                setExpandedId(locationId)
              }}
              heightClass="h-[330px] lg:h-[600px]"
            />
            <div className="mt-3 flex items-center gap-2 border-y border-line py-2">
              <button
                type="button"
                onClick={() => setMapMode('route')}
                className="journal-filter"
                data-active={mapMode === 'route'}
              >
                <Route size={11} />
                按日路线
              </button>
              <button
                type="button"
                onClick={() => setMapMode('places')}
                className="journal-filter"
                data-active={mapMode === 'places'}
              >
                <MapPin size={11} />
                全部地点
              </button>
              <span className="ml-auto type-caption text-muted">
                {mapMode === 'route' ? `${routePoints.length} 个途经点` : `${mapped.length} 个定位点`}
              </span>
            </div>
            {mapMode === 'route' && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {daysList.map((day) => {
                  const route = dayRoutes.find((item) => item.day === day.id)
                  return (
                    <span key={day.id} className="inline-flex items-center gap-1.5 type-caption text-muted">
                      <span className="h-0.5 w-5" style={{ backgroundColor: getDayColor(day.id) }} />
                      <span className="font-semibold text-ink">{day.label}</span>
                      <span>{route ? `${route.route.length} 站` : '无路线'}</span>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="mt-3 flex items-start justify-between gap-4">
              <p className="max-w-xl type-caption text-muted">
                {mapMode === 'route'
                  ? '不同颜色代表不同日期，箭头表示行进方向，地点编号与当天行程顺序一致。'
                  : `金色光圈表示重点正餐。${unlocatedCount} 个地点因分店或地址待确认，暂不放置推测坐标。`}
              </p>
              <span className="shrink-0 journal-label text-accent">
                {mapMode === 'route' ? dayRoutes.length : mapped.length} {mapMode === 'route' ? 'ROUTES' : 'PIN'}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <section className="border-y border-line py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="journal-label text-accent">Area</p>
                <p className="type-caption text-muted">按地理区域浏览</p>
              </div>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setAreaFilter('all')
                    setFocusId('')
                  }}
                  className="journal-filter"
                  data-active={areaFilter === 'all'}
                >
                  全部区域
                </button>
                {areas.map(([area]) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setAreaFilter(area)
                      setFocusId('')
                    }}
                    className="journal-filter"
                    data-active={areaFilter === area}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                {typeFilters.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setTypeFilter(filter.id)
                        setFocusId('')
                      }}
                      className="journal-filter"
                      data-active={typeFilter === filter.id}
                    >
                      {Icon && <Icon size={10} />}
                      {filter.label}
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="lg:max-h-[720px] lg:overflow-y-auto lg:pr-3">
              {grouped.map((group) => (
                <section key={group.area} className="pt-6">
                  <div className="flex items-end justify-between gap-3 border-b border-line pb-3">
                    <div>
                      <p className="journal-label text-accent">Area</p>
                      <h3 className="type-h2 mt-1 text-ink">
                        {group.area}
                      </h3>
                    </div>
                    <span className="shrink-0 type-caption text-muted">{group.points.length} 个地点</span>
                  </div>
                  <div>
                    {group.points.map((point) => (
                      <PlaceCard
                        key={point.locationId}
                        point={point}
                        expanded={expandedId === point.locationId}
                        onToggle={() => selectPoint(point)}
                        onFavorite={() => toggleFavorite(point.locationId)}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {grouped.length === 0 && (
                <div className="border-b border-line py-12 text-center">
                  <MapPin size={20} className="mx-auto text-accent" />
                  <p className="type-h3 mt-3 text-ink">当前筛选没有地点</p>
                  <p className="type-caption mt-1 text-muted">切换区域或类型后再试。</p>
                </div>
              )}
            </div>

            <div className="pt-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Kuala Lumpur attractions restaurants')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between border-y border-line py-3 type-small font-medium text-muted"
              >
                在 Google Maps 查看吉隆坡全城
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
