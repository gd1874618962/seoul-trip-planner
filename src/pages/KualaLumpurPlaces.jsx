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
    <article className="border-b border-ink/15">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-4 text-left active:bg-cream/40"
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
              point.hasCoordinates ? 'border-ink/35 text-ink' : 'border-dashed border-gold/60 text-gold'
            }`}
          >
            {point.hasCoordinates ? point.markerNo : <MapPin size={12} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug text-ink">{point.displayName}</h3>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate">
                  {point.area}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {point.keyRestaurant && (
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-gold">
                    重点正餐
                  </span>
                )}
                {point.mustVisit && !point.keyRestaurant && (
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-blue">必去</span>
                )}
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate">
              {point.note || point.category}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-semibold uppercase tracking-[0.09em] text-slate">
              <span>{point.category}</span>
              {point.branchPending && (
                <span className="border-l border-gold/40 pl-3 text-gold">
                  分店 / 地址待确认
                </span>
              )}
              {point.distanceLevel && (
                <span className="border-l border-coral/40 pl-3 text-coral">
                  {point.distanceLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-11 border-l border-ink/15 pb-4 pl-4">
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate">
            <MapPin size={12} className="mt-0.5 shrink-0 text-sage" />
            {hasAddress ? point.officialAddress : '地址或分店尚未确认，请先通过地图搜索核实。'}
          </p>
          {point.recommended?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {point.recommended.map((item) => (
                <span key={item} className="text-[9px] text-blue">
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
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-ink px-3 py-2 text-[10px] font-semibold text-paper active:opacity-90"
            >
              <Navigation size={12} />
              搜索 / 导航
            </a>
            <button
              type="button"
              onClick={onFavorite}
              className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 text-[10px] font-semibold ${
                point.isFavorite
                  ? 'border-gold/40 text-gold'
                  : 'border-ink/20 text-slate'
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

      <div className="px-5 pb-14 pt-5 lg:px-10">
        <section className="grid gap-6 border-b border-ink/20 pb-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="editorial-label text-gold">
              {tripMeta.dates} · {tripMeta.people} people
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[36px] leading-[1.02] text-ink lg:text-[52px]">
              先看位置，再定路线
            </h2>
            <p className="mt-4 max-w-xl text-[12px] leading-6 text-slate">
              地点按真实区域归组。城际移动优先 Grab / 出租车，不默认远距离地点步行可达。
            </p>
          </div>
          <div className="grid grid-cols-3 border-y border-ink/20">
            <div>
              <p className="py-3 text-center font-display text-[28px] leading-none text-ink lg:text-left">{points.length}</p>
              <p className="pb-3 text-center text-[9px] text-slate lg:text-left">地点</p>
            </div>
            <div className="border-l border-ink/15 pl-3">
              <p className="py-3 text-center font-display text-[28px] leading-none text-ink lg:text-left">{mapped.length}</p>
              <p className="pb-3 text-center text-[9px] text-slate lg:text-left">地图已定位</p>
            </div>
            <div className="border-l border-ink/15 pl-3">
              <p className="py-3 text-center font-display text-[28px] leading-none text-gold lg:text-left">{keyCount}</p>
              <p className="pb-3 text-center text-[9px] text-slate lg:text-left">重点正餐</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(350px,0.85fr)] lg:items-start">
          <div className="lg:sticky lg:top-[82px]">
            <div className="mb-3 flex items-end justify-between border-b border-ink/20 pb-3">
              <p className="font-display text-[24px] leading-none text-ink">地理分布</p>
              <span className="editorial-label text-slate">{mapped.length} pins</span>
            </div>
            <TripMap
              items={mapped}
              focusId={focusId}
              showRoutes={false}
              onSelectPoint={(locationId) => {
                setFocusId(locationId)
                setExpandedId(locationId)
              }}
              heightClass="h-[330px] lg:h-[600px]"
            />
            <div className="mt-3 flex items-start justify-between gap-4">
              <p className="max-w-xl text-[9px] leading-relaxed text-slate">
                金色光圈表示重点正餐。{unlocatedCount} 个地点因分店或地址待确认，暂不放置推测坐标。
              </p>
              <span className="shrink-0 text-[9px] font-semibold text-blue">{mapped.length} PIN</span>
            </div>
          </div>

          <div className="min-w-0">
            <section className="border-y border-ink/20 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="editorial-label text-gold">Area</p>
                <p className="text-[9px] text-slate">按地理区域浏览</p>
              </div>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setAreaFilter('all')
                    setFocusId('')
                  }}
                  className={`shrink-0 border px-3 py-1.5 text-[10px] font-semibold ${
                    areaFilter === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-slate'
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
                    className={`shrink-0 border px-3 py-1.5 text-[10px] font-semibold ${
                      areaFilter === area ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-slate'
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
                      className={`inline-flex shrink-0 items-center gap-1 border px-2.5 py-1.5 text-[9px] font-semibold ${
                        typeFilter === filter.id
                          ? 'border-gold text-gold'
                          : 'border-ink/15 text-slate'
                      }`}
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
                  <div className="flex items-end justify-between gap-3 border-b border-ink/20 pb-3">
                    <div>
                      <p className="editorial-label text-gold">Area</p>
                      <h3 className="mt-1 font-display text-[24px] leading-tight text-ink">
                        {group.area}
                      </h3>
                    </div>
                    <span className="shrink-0 text-[9px] text-slate">{group.points.length} 个地点</span>
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
                <div className="border-b border-ink/15 py-12 text-center">
                  <MapPin size={20} className="mx-auto text-gold" />
                  <p className="mt-3 font-display text-lg text-ink">当前筛选没有地点</p>
                  <p className="mt-1 text-[10px] text-slate">切换区域或类型后再试。</p>
                </div>
              )}
            </div>

            <div className="pt-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Kuala Lumpur attractions restaurants')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between border-y border-ink/20 py-3 text-[10px] font-semibold text-slate active:text-ink"
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
