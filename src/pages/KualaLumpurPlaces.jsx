import { useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  Coffee,
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import TripMap from '../components/TripMap'
import {
  getFavoritePlaceIds,
  getPoints,
  getTripMeta,
  saveFavoritePlaceIds,
} from '../data/store'

const areaColors = {
  '武吉免登 / Pavilion / Jalan Alor': '#4B7B9C',
  'KLCC / 双子塔': '#7E9B85',
  'TRX / 市中心东侧': '#D97B5F',
  '独立广场 / 中央市场 / 唐人街': '#B99A5B',
  '十五碑 / Brickfields': '#8A7C9B',
  '甲洞 / Kepong': '#A56A58',
  'Petaling Jaya / Mid Valley': '#67877B',
  '雪兰莪 / 巴生方向': '#98765B',
  '机场 / 返程': '#2E4A5C',
  '其他 / 待确认区域': '#7B8285',
  'Bukit Jalil / 演唱会场馆': '#C56F59',
}

const typeFilters = [
  { id: 'all', label: '全部' },
  { id: 'key', label: '重点正餐', icon: Star },
  { id: 'must', label: '必去', icon: Compass },
  { id: 'food', label: '美食', icon: UtensilsCrossed },
  { id: 'cafe', label: '咖啡甜品', icon: Coffee },
  { id: 'shopping', label: '购物', icon: ShoppingBag },
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
    <article
      className={`rounded-lg border bg-white transition ${
        point.keyRestaurant ? 'border-gold/35' : 'border-line'
      } ${expanded ? 'shadow-card' : 'shadow-none'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3.5 text-left active:bg-cream/40"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
              point.hasCoordinates ? 'text-white' : 'bg-cream text-gold'
            }`}
            style={point.hasCoordinates ? { backgroundColor: point.markerColor } : undefined}
          >
            {point.hasCoordinates ? point.markerNo : <MapPin size={14} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[14px] font-black leading-snug text-ink">{point.displayName}</h3>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate">
                  {point.area}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {point.keyRestaurant && (
                  <span className="rounded-full bg-cream px-2 py-1 text-[9px] font-black text-gold">
                    重点正餐
                  </span>
                )}
                {point.mustVisit && !point.keyRestaurant && (
                  <span className="rounded-full bg-mist px-2 py-1 text-[9px] font-black text-blue">必去</span>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate">
              {point.note || point.category}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-line bg-[#FBFAF6] px-2 py-0.5 text-[9px] font-bold text-slate">
                {point.category}
              </span>
              {point.branchPending && (
                <span className="rounded-md border border-gold/25 bg-cream/70 px-2 py-0.5 text-[9px] font-bold text-gold">
                  分店 / 地址待确认
                </span>
              )}
              {point.distanceLevel && (
                <span className="rounded-md border border-coral/25 bg-coral/5 px-2 py-0.5 text-[9px] font-bold text-coral">
                  {point.distanceLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line/70 px-3.5 pb-3.5 pt-3">
          <p className="flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-slate">
            <MapPin size={12} className="mt-0.5 shrink-0 text-sage" />
            {hasAddress ? point.officialAddress : '地址或分店尚未确认，请先通过地图搜索核实。'}
          </p>
          {point.recommended?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {point.recommended.map((item) => (
                <span
                  key={item}
                  className="rounded-md bg-mist/70 px-2 py-1 text-[10px] font-bold text-blue"
                >
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
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2 text-[11px] font-bold text-white active:opacity-90"
            >
              <Navigation size={12} />
              搜索 / 导航
            </a>
            <button
              type="button"
              onClick={onFavorite}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[11px] font-bold ${
                point.isFavorite
                  ? 'border-gold/40 bg-cream text-gold'
                  : 'border-line bg-white text-slate'
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

  const points = [...getPoints()].sort(
    (a, b) => Number(a.areaOrder || 99) - Number(b.areaOrder || 99) || a.displayName.localeCompare(b.displayName),
  )
  const areas = Array.from(
    new Map(points.map((point) => [point.area, Number(point.areaOrder || 99)])).entries(),
  ).sort((a, b) => a[1] - b[1])

  const withMeta = points.map((point) => ({
    ...point,
    hasCoordinates: point.lat != null && point.lng != null && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng)),
    markerColor: areaColors[point.area] || '#4B7B9C',
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
        subtitle="按区域自由组合路线，不锁定每天的餐厅和时间"
      />

      <section className="px-4 pt-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                {tripMeta.dates} · {tripMeta.people}人
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-black leading-tight text-ink">
                先看位置，再定路线
              </h1>
              <p className="mt-1.5 max-w-[275px] text-[12px] font-medium leading-relaxed text-slate">
                地点已按真实区域归组。城际移动优先 Grab / 出租车，不默认远距离地点步行可达。
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-blue">
              <Compass size={18} />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-3 text-center">
            <div>
              <p className="text-lg font-black text-ink">{points.length}</p>
              <p className="text-[9px] font-bold text-slate">地点</p>
            </div>
            <div>
              <p className="text-lg font-black text-ink">{mapped.length}</p>
              <p className="text-[9px] font-bold text-slate">地图已定位</p>
            </div>
            <div>
              <p className="text-lg font-black text-gold">{keyCount}</p>
              <p className="text-[9px] font-bold text-slate">重点正餐</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <TripMap
          items={mapped}
          focusId={focusId}
          showRoutes={false}
          onSelectPoint={(locationId) => {
            setFocusId(locationId)
            setExpandedId(locationId)
          }}
          heightClass="h-[340px]"
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-[10px] font-medium leading-relaxed text-slate">
            金色光圈表示重点正餐。{unlocatedCount} 个地点因分店或地址待确认，暂不放置推测坐标。
          </p>
          <span className="shrink-0 text-[10px] font-bold text-blue">{mapped.length} PIN</span>
        </div>
      </section>

      <section className="mt-4 px-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate">区域</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setAreaFilter('all')
              setFocusId('')
            }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
              areaFilter === 'all' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate'
            }`}
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
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                areaFilter === area ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate'
              }`}
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
                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[10px] font-bold ${
                  typeFilter === filter.id
                    ? 'border-blue/30 bg-mist text-blue'
                    : 'border-line bg-white text-slate'
                }`}
              >
                {Icon && <Icon size={11} />}
                {filter.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-5 space-y-6 px-4 pb-4">
        {grouped.map((group) => (
          <div key={group.area}>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gold">Area</p>
                <h2 className="mt-0.5 font-display text-lg font-black leading-tight text-ink">
                  {group.area}
                </h2>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-slate">{group.points.length} 个地点</span>
            </div>
            <div className="space-y-2.5">
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
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-cream/50 px-4 py-8 text-center">
            <MapPin size={20} className="mx-auto text-gold" />
            <p className="mt-2 text-sm font-black text-ink">当前筛选没有地点</p>
            <p className="mt-1 text-[11px] font-medium text-slate">切换区域或类型后再试。</p>
          </div>
        )}
      </section>

      <div className="px-4 pb-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Kuala Lumpur attractions restaurants')}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2.5 text-[11px] font-bold text-slate active:bg-cream"
        >
          在 Google Maps 查看吉隆坡全城
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
