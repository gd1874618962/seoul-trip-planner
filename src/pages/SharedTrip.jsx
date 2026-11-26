import { useState } from 'react'
import {
  BellRing,
  CalendarDays,
  Clock,
  Compass,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Plane,
  Route,
  Share2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import TripMap, { buildDayRoutes, getDayColor } from '../components/TripMap'

const tabs = [
  { id: 'overview', label: '概览', icon: Compass },
  { id: 'timeline', label: '行程', icon: CalendarDays },
  { id: 'map', label: '地图', icon: MapIcon },
  { id: 'food', label: '吃喝', icon: UtensilsCrossed },
  { id: 'reminders', label: '提醒', icon: BellRing },
]

function mapHref(meta, point) {
  if (meta.tripId === 'seoul-2026') {
    return `https://map.naver.com/p/search/${encodeURIComponent(
      point.officialAddress || point.naver || point.displayName || point.name || '',
    )}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    point.officialAddress || point.address || point.displayName || point.name || '',
  )}`
}

function SectionTitle({ eyebrow, title, note }) {
  return (
    <div className="grid gap-2 border-b border-line pb-4 md:grid-cols-[140px_minmax(0,1fr)_auto] md:items-end md:gap-5">
      <p className="journal-label text-accent">{eyebrow}</p>
      <div>
        <h2 className="type-h1 text-ink">{title}</h2>
        {note && <p className="type-small mt-1 text-muted">{note}</p>}
      </div>
    </div>
  )
}

function Overview({ trip }) {
  const { meta, flights, hotels } = trip
  return (
    <div className="space-y-12">
      <section className="grid border-b border-line pb-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="journal-media aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
          {meta.coverImage ? (
            <img
              src={meta.coverImage}
              alt={`${meta.cityCn || meta.city}旅行封面`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col justify-between bg-surface p-6">
              <p className="journal-label text-accent">Shared journey</p>
              <p className="type-display-xl max-w-[8ch] text-ink">{meta.cityCn || meta.city}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col border-x border-b border-line p-6 lg:min-h-[480px] lg:border-b-0 lg:border-l-0 lg:p-8">
          <p className="journal-label text-accent">
            {meta.countryCn || meta.country || 'Travel plan'}
          </p>
          <div className="my-auto py-8">
            <h1 className="type-display-xl max-w-[9ch] text-ink">
              {meta.heroTitle || meta.cityCn || meta.title}
            </h1>
            <p className="journal-label mt-4">{meta.heroSubtitle || 'TRAVEL PLAN'}</p>
            <p className="type-small mt-5 max-w-sm text-muted">{meta.subtitle || meta.theme}</p>
          </div>
          <dl className="border-t border-line">
            {[
              ['日期', meta.dates],
              ['时长', meta.duration],
              ['同行', `${meta.people || 1} 人`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-line py-3 type-small"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="01 / Flight log" title="航班" note="分享快照中的往返时间与航班信息" />
        <div className="grid border-b border-line md:grid-cols-2 md:divide-x md:divide-line">
          {[
            ['去程 / Outbound', flights.outbound || []],
            ['返程 / Return', flights.return || []],
          ].map(([label, items]) => (
            <div key={label} className="py-5 md:px-5">
              <p className="journal-label flex items-center gap-2 text-accent">
                <Plane size={13} />
                {label}
              </p>
              <div className="mt-4 space-y-4">
                {items.map((flight, index) => (
                  <div key={`${flight.flight || label}-${index}`}>
                    <p className="type-caption text-muted">{flight.date}</p>
                    <p className="type-h3 mt-1 text-ink">{flight.flight || '待填写'}</p>
                    <p className="type-small mt-1 text-muted">{flight.route}</p>
                    {flight.note && <p className="type-caption mt-1 text-muted">{flight.note}</p>}
                  </div>
                ))}
                {items.length === 0 && <p className="type-small text-muted">暂无航班信息</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="02 / Stay" title="住宿" note="按行程顺序整理的落脚点" />
        <div className="border-b border-line">
          {hotels.map((hotel, index) => (
            <article
              key={`${hotel.locationId || hotel.name || 'hotel'}-${index}`}
              className="grid gap-3 border-b border-line py-5 last:border-b-0 md:grid-cols-[110px_minmax(0,1fr)_minmax(220px,0.65fr)]"
            >
              <p className="journal-label text-accent">{hotel.night || '住宿'}</p>
              <div>
                <h3 className="type-h3 text-ink">{hotel.name}</h3>
                {hotel.en && <p className="type-small mt-1 text-muted">{hotel.en}</p>}
                {hotel.note && <p className="type-small mt-2 text-muted">{hotel.note}</p>}
              </div>
              <p className="flex items-start gap-1.5 type-small text-muted md:border-l md:border-line md:pl-5">
                <MapPin size={12} className="mt-0.5 shrink-0 text-accent" />
                {hotel.address}
              </p>
            </article>
          ))}
          {hotels.length === 0 && <p className="journal-empty type-small">暂无住宿信息</p>}
        </div>
      </section>
    </div>
  )
}

function TimelineView({ trip }) {
  const [activeDay, setActiveDay] = useState(trip.days[0]?.id || 1)
  const day = trip.days.find((item) => item.id === activeDay) || trip.days[0]
  if (!day) return <p className="journal-empty type-small">分享中没有行程内容</p>

  return (
    <div>
      <SectionTitle
        eyebrow="Daily timeline"
        title="每日行程"
        note="时间、地点与交通顺序均来自分享时保存的只读快照"
      />
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {trip.days.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveDay(item.id)}
            className="journal-filter"
            data-active={item.id === activeDay}
          >
            <span>{item.label}</span>
            <span>{item.date}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="journal-label text-accent">
            {day.label} · {day.date} {day.weekday}
          </p>
          <h2 className="type-h2 mt-2 text-ink">{day.theme}</h2>
        </div>
        <span className="journal-label">{day.entries.length} 个节点</span>
      </div>
      <div className="mt-5 space-y-0">
        {day.entries.map((entry, index) => (
          <article
            key={entry.id || `${day.id}-${index}`}
            className="grid gap-3 border-b border-line py-5 md:grid-cols-[90px_36px_minmax(0,1fr)]"
          >
            <p className="type-caption font-semibold text-ink">{entry.time}</p>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full type-caption font-semibold text-paper"
              style={{ backgroundColor: getDayColor(day.id) }}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="type-caption font-semibold text-accent">{entry.type}</p>
              <h3 className="type-h3 mt-1 text-ink">{entry.title}</h3>
              {entry.address && <p className="type-small mt-1 text-muted">{entry.address}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {typeof entry.transport === 'string' && entry.transport !== '—' && (
                  <span className="inline-flex items-center gap-1 type-caption text-muted">
                    <Route size={11} className="text-accent" />
                    {entry.transport}
                  </span>
                )}
                {entry.duration && (
                  <span className="inline-flex items-center gap-1 type-caption text-muted">
                    <Clock size={11} className="text-accent" />
                    {entry.duration}
                  </span>
                )}
                {entry.cost && entry.cost !== '—' && (
                  <span className="inline-flex items-center gap-1 type-caption text-muted">
                    <Wallet size={11} className="text-accent" />
                    {entry.cost}
                  </span>
                )}
              </div>
              {entry.note && <p className="type-small mt-3 text-muted">{entry.note}</p>}
            </div>
          </article>
        ))}
        {day.entries.length === 0 && <p className="journal-empty type-small">这一天还没有安排</p>}
      </div>
    </div>
  )
}

function MapView({ trip }) {
  const points = trip.points.filter(
    (point) => point.lat != null && point.lng != null && Number.isFinite(Number(point.lat)),
  )
  const routePoints = []
  const seen = new Set()
  trip.days.forEach((day) => {
    day.entries.forEach((entry) => {
      const refs = entry.locationId
        ? [entry.locationId]
        : Array.isArray(entry.pointIds)
          ? entry.pointIds.map((id) => `loc-${id}`)
          : []
      refs.forEach((ref) => {
        const point = points.find((item) => item.locationId === ref)
        if (point && !seen.has(point.locationId)) {
          seen.add(point.locationId)
          routePoints.push({ ...point, day: day.id, markerNo: routePoints.length + 1 })
        }
      })
    })
  })
  const routes = buildDayRoutes(routePoints, trip.days)

  return (
    <div>
      <SectionTitle
        eyebrow="Route map"
        title="路线地图"
        note="不同颜色代表不同日期，箭头表示行进方向，编号表示到访顺序"
      />
      <div className="mt-5">
        <TripMap
          items={routePoints}
          days={trip.days}
          tripMeta={trip.meta}
          heightClass="h-[420px] lg:h-[620px]"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {trip.days.map((day) => {
          const route = routes.find((item) => item.day === day.id)
          return (
            <span key={day.id} className="inline-flex items-center gap-1.5 type-caption text-muted">
              <span className="h-0.5 w-5" style={{ backgroundColor: getDayColor(day.id) }} />
              <span className="font-semibold text-ink">{day.label}</span>
              <span>{route ? `${route.route.length} 站` : '无路线'}</span>
            </span>
          )
        })}
      </div>
      <div className="mt-6 border-y border-line">
        {routePoints.map((point) => (
          <div
            key={point.locationId}
            className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-3 border-b border-line py-3 last:border-b-0"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full type-caption font-semibold text-paper"
              style={{ backgroundColor: getDayColor(point.day) }}
            >
              {point.markerNo}
            </span>
            <div className="min-w-0">
              <p className="type-small font-semibold text-ink">{point.displayName || point.name}</p>
              <p className="mt-1 line-clamp-2 type-caption text-muted">
                {point.officialAddress || point.address}
              </p>
            </div>
            <a
              href={mapHref(trip.meta, point)}
              target="_blank"
              rel="noreferrer"
              className="journal-button journal-button--quiet shrink-0"
            >
              导航
              <ExternalLink size={10} />
            </a>
          </div>
        ))}
        {routePoints.length === 0 && (
          <p className="journal-empty type-small">分享中没有可定位的路线地点</p>
        )}
      </div>
    </div>
  )
}

function FoodView({ trip }) {
  const restaurants = trip.restaurants || []
  return (
    <div>
      <SectionTitle
        eyebrow="Food notes"
        title="吃喝清单"
        note="餐厅、咖啡与推荐菜来自分享时保存的攻略内容"
      />
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {restaurants.map((restaurant) => (
          <article key={restaurant.id} className="border-b border-line pb-5">
            {restaurant.image && (
              <div className="journal-media aspect-[16/9]">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <p className="journal-label mt-4 text-accent">{restaurant.type || restaurant.day}</p>
            <h3 className="type-h2 mt-2 text-ink">{restaurant.name}</h3>
            <p className="type-small mt-1 text-muted">{restaurant.address}</p>
            {restaurant.recommend?.length > 0 && (
              <p className="mt-2 type-caption text-muted">
                推荐：{restaurant.recommend.join(' · ')}
              </p>
            )}
            {restaurant.note && <p className="mt-2 type-small text-muted">{restaurant.note}</p>}
          </article>
        ))}
        {restaurants.length === 0 && (
          <p className="journal-empty type-small md:col-span-2">分享中没有餐厅清单</p>
        )}
      </div>
    </div>
  )
}

function RemindersView({ trip }) {
  return (
    <div>
      <SectionTitle
        eyebrow="Before departure"
        title="出行提醒"
        note="朋友可按这份只读清单核对证件、交通与现场事项"
      />
      <div className="mt-5 border-y border-line">
        {trip.reminders.map((group) => (
          <section key={group.id} className="border-b border-line py-5 last:border-b-0">
            <h3 className="type-h3 text-ink">{group.title}</h3>
            <div className="mt-3 space-y-2">
              {(group.items || []).map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <p className="type-small text-muted">{item}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
        {trip.reminders.length === 0 && (
          <p className="journal-empty type-small">分享中没有提醒清单</p>
        )}
      </div>
    </div>
  )
}

export default function SharedTrip({ snapshot }) {
  const [active, setActive] = useState('overview')
  const trip = snapshot.trip

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto min-h-screen w-full max-w-[1180px] bg-paper">
        <header className="border-b border-line px-5 py-4 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="journal-label text-accent">小韩之旅 / Shared plan</p>
              <p className="type-small mt-1 font-semibold text-ink">{trip.meta.title}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 type-caption font-semibold text-muted">
              <Share2 size={12} />
              只读分享
            </span>
          </div>
        </header>

        <main className="app-content journal-shell pb-12">
          <div className="mb-8 flex items-start gap-2 border-y border-accent/30 py-3 text-ink">
            <Share2 size={14} className="mt-0.5 shrink-0 text-accent" />
            <p className="type-caption">
              这是一份只读链接快照。任何拿到链接的人都能查看，链接内容不会随原计划自动更新，也不包含账本、预算和代购订单。
            </p>
          </div>
          {active === 'overview' && <Overview trip={trip} />}
          {active === 'timeline' && <TimelineView trip={trip} />}
          {active === 'map' && <MapView trip={trip} />}
          {active === 'food' && <FoodView trip={trip} />}
          {active === 'reminders' && <RemindersView trip={trip} />}
        </main>

        <nav
          className="bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper px-2 pt-2"
          aria-label="分享行程导航"
        >
          <div className="mx-auto grid max-w-[1180px] grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const selected = active === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActive(tab.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`flex min-h-12 flex-col items-center justify-center gap-1 type-caption font-medium ${
                    selected ? 'text-ink' : 'text-muted'
                  }`}
                  aria-current={selected ? 'page' : undefined}
                >
                  <Icon size={16} strokeWidth={selected ? 1.9 : 1.5} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
