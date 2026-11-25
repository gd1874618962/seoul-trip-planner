import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { getDays, getPoints, getTripMeta } from '../data/store'
import TripMap, { dayColors } from '../components/TripMap'
import PageHeader from '../components/PageHeader'
import KualaLumpurPlaces from './KualaLumpurPlaces'

function SeoulMapPage() {
  const [filter, setFilter] = useState('all')
  const tripMeta = getTripMeta()
  const daysList = getDays()
  const basePoints = getPoints()
  const customPoints = daysList.flatMap((d) =>
    d.entries
      .filter((e) => e.lat && e.lng)
      .map((e) => ({
        id: `evt-${e.id}`,
        locationId: e.locationId || `custom-${e.id}`,
        day: d.id,
        name: e.title,
        category: e.type || '自定义',
        address: e.address || '',
        lat: e.lat,
        lng: e.lng,
        naver: e.address || e.title,
      })),
  )
  const allPoints = [...basePoints, ...customPoints]
  const ordered = []
  const seen = new Set()
  daysList.forEach((d) =>
    d.entries.forEach((e) => {
      const refs = []
      if (e.locationId) refs.push(e.locationId)
      else if (Array.isArray(e.pointIds)) e.pointIds.forEach((id) => refs.push(`loc-${id}`))
      refs.forEach((ref) => {
        const point = allPoints.find((p) => p.locationId === ref)
        if (point && !seen.has(point.id)) {
          seen.add(point.id)
          ordered.push(point)
        }
      })
    }),
  )
  allPoints.forEach((p) => {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      ordered.push(p)
    }
  })
  const points = ordered.map((p, i) => ({ ...p, markerNo: i + 1 }))
  const filtered = filter === 'all' ? points : points.filter((p) => p.day === filter)
  const filters = [
    { id: 'all', label: '全部' },
    ...daysList.map((day) => ({ id: day.id, label: day.label })),
  ]

  return (
    <div>
      <PageHeader
        eyebrow={`${tripMeta.city} Map`}
        title="地图点位"
        subtitle="点击标记查看详情，或直接打开外部地图导航"
      />

      <div className="px-5 pb-16 pt-5 lg:px-10">
        <section className="editorial-rule flex flex-col justify-between gap-3 pt-4 md:flex-row md:items-center">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {filters.map((f) => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 border px-3 py-2 text-xs font-semibold ${
                    active ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-slate active:bg-cream'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <p className="shrink-0 text-xs text-slate">{filtered.length} 个地点</p>
        </section>

        <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-start">
          <div className="lg:sticky lg:top-[82px]">
            <TripMap items={filtered} heightClass="h-[320px] lg:h-[600px]" />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {daysList.map((day) => (
                <span key={day.id} className="inline-flex items-center gap-1.5 text-xs text-slate">
                  <span className="h-px w-4" style={{ backgroundColor: dayColors[day.id] }} />
                  {day.label}
                </span>
              ))}
            </div>
          </div>

          <section className="min-w-0">
            <div className="flex items-end justify-between border-b border-ink/20 pb-3">
              <h2 className="font-display text-[24px] font-semibold leading-none text-ink">点位列表</h2>
              <span className="editorial-label text-slate">Map index</span>
            </div>
            <div>
              {filtered.map((p) => (
                <div key={p.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 border-b border-ink/15 py-4">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-ink/30 text-xs font-semibold text-ink">
                    {p.markerNo}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-medium text-ink">{p.displayName}</p>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                        Day {p.day}
                      </span>
                    </div>
                    <p className="mt-1 flex items-start gap-1 text-sm leading-6 text-slate">
                      <MapPin size={10} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{p.officialAddress}</span>
                    </p>
                  </div>
                  <a
                    href={
                      tripMeta.tripId === 'seoul-2026'
                        ? `https://map.naver.com/p/search/${encodeURIComponent(p.officialAddress || p.naver)}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.officialAddress || p.address || p.name)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 border-b border-ink/30 pb-0.5 text-xs font-semibold text-ink"
                  >
                    导航
                    <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function MapPage() {
  return getTripMeta().tripId === 'kuala-lumpur-2027-01'
    ? <KualaLumpurPlaces />
    : <SeoulMapPage />
}
