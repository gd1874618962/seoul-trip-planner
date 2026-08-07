import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { getDays, getPoints } from '../data/store'
import TripMap, { dayColors } from '../components/TripMap'
import PageHeader from '../components/PageHeader'

const filters = [
  { id: 'all', label: '全部' },
  { id: 1, label: 'DAY 1' },
  { id: 2, label: 'DAY 2' },
  { id: 3, label: 'DAY 3' },
  { id: 4, label: 'DAY 4' },
]

export default function MapPage() {
  const [filter, setFilter] = useState('all')
  const customPoints = getDays().flatMap((d) =>
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
  const points = [...getPoints(), ...customPoints]
  const filtered = filter === 'all' ? points : points.filter((p) => p.day === filter)

  return (
    <div>
      <PageHeader eyebrow="Seoul Map" title="地图点位" subtitle="点击标记查看详情，或直接跳转 Naver 导航" />

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {filters.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold ${
                active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate active:bg-cream'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="px-4">
        <TripMap items={filtered} />
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
          {[1, 2, 3, 4].map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dayColors[d] }} />
              DAY {d}
            </span>
          ))}
        </div>
      </div>

      <section className="mt-5 px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">点位列表</h2>
          <span className="text-[11px] font-bold text-slate">{filtered.length} 个地点</span>
        </div>
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-card">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                style={{ backgroundColor: dayColors[p.day] }}
              >
                {p.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black text-ink">{p.name}</p>
                  <span className="shrink-0 rounded-md bg-cream px-1.5 py-0.5 text-[9px] font-bold text-gold">
                    DAY {p.day}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-slate">
                  <MapPin size={11} className="shrink-0" />
                  {p.address}
                </p>
              </div>
              <a
                href={`https://map.naver.com/p/search/${encodeURIComponent(p.naver)}`}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-md bg-blue px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                导航
                <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
