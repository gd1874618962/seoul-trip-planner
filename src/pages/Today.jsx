import { useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Wallet,
} from 'lucide-react'
import { getDays, getTimelineOverrides, getTripMeta, saveTimelineOverrides } from '../data/store'
import PageHeader from '../components/PageHeader'

function todayKey() {
  const d = new Date()
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function entryStart(entry) {
  const m = String(entry.time || '').match(/^(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

const modeLabel = {
  transit: '🚇 地铁',
  walk: '🚶 步行',
  taxi: '🚕 打车',
  other: '其他',
}

function TransportLine({ entry }) {
  const parts = []
  if (typeof entry.transport === 'string' && entry.transport !== '—') {
    parts.push(`${modeLabel[entry.transportMode] || ''} ${entry.transport}`)
  }
  if (entry.transportEta) parts.push(entry.transportEta)
  if (entry.transportCostEstimate) parts.push(entry.transportCostEstimate)
  if (parts.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1 type-small font-semibold text-muted">
          {p}
        </span>
      ))}
    </div>
  )
}

export default function Today({ onNavigate }) {
  const [tick, setTick] = useState(0)
  const tripMeta = getTripMeta()
  const days = getDays()
  const day = days.find((d) => d.date === todayKey()) || days[0]
  if (!day) return null

  const entries = day.entries
  const now = nowMinutes()
  let activeIndex = entries.findIndex(
    (e) => e.status !== 'completed' && entryStart(e) != null && entryStart(e) <= now,
  )
  if (activeIndex === -1) activeIndex = entries.findIndex((e) => e.status !== 'completed')
  const nextIndex = entries.findIndex((e, i) => i > activeIndex && e.status !== 'completed')
  const active = activeIndex >= 0 ? entries[activeIndex] : null
  const next = nextIndex >= 0 ? entries[nextIndex] : null

  const complete = (entry) => {
    const overrides = getTimelineOverrides()
    const nextEntries = entries.map((e) =>
      e.id === entry.id ? { ...e, status: 'completed' } : e,
    )
    saveTimelineOverrides({ ...overrides, [day.id]: nextEntries })
    setTick((t) => t + 1)
  }

  const big = (entry) => (
    <div className={`border-y border-line py-5 ${entry.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="type-h2 text-accent">{entry.time}</span>
        {entry.status === 'completed' ? (
          <span className="inline-flex items-center gap-1 type-caption font-semibold text-muted">
            <CheckCircle2 size={14} />
            已完成
          </span>
        ) : (
          <span className="journal-label text-accent">
            {entry === active ? '正在进行' : '下一项'}
          </span>
        )}
      </div>
      <h3
        className={`type-h2 mt-2 ${
          entry.status === 'completed' ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {entry.title}
      </h3>
      {entry.address && (
        <p className="type-small mt-2 flex items-start gap-1.5 text-muted">
          <MapPin size={13} className="mt-0.5 shrink-0 text-accent" />
          {entry.address}
        </p>
      )}
      <TransportLine entry={entry} />
      {entry.suggestedDeparture && entry.status !== 'completed' && (
        <p className="type-caption mt-2 inline-flex items-center gap-1 font-semibold text-accent">
          <Clock size={13} />
          建议出发 {entry.suggestedDeparture}
        </p>
      )}
      {entry.status !== 'completed' && (
        <button
          type="button"
          onClick={() => complete(entry)}
          className="journal-button journal-button--primary mt-4"
        >
          <Check size={15} />
          完成
        </button>
      )}
    </div>
  )

  return (
    <div key={tick}>
      <PageHeader eyebrow="Today" title="今日行程" subtitle={`${day.date} ${day.weekday} · ${day.theme}`} />

      <div className="mx-5 mt-5 flex items-center justify-between gap-2 lg:mx-10">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="journal-button journal-button--secondary"
        >
          <ArrowLeft size={14} />
          返回
        </button>
        <button
          type="button"
          onClick={() => onNavigate('timeline')}
          className="journal-button journal-button--secondary"
        >
          <CalendarDays size={14} />
          编辑
        </button>
      </div>

      {next && (
        <section className="mx-5 mt-5 lg:mx-10">
          <p className="journal-label mb-2">下一步</p>
          {big(next)}
        </section>
      )}

      <section className="mx-5 mt-6 space-y-0 pb-12 lg:mx-10">
        {entries.length === 0 && (
          <div className="journal-empty">
            <CalendarDays size={22} className="mx-auto text-accent" />
            <p className="type-small mt-3 font-semibold text-ink">{tripMeta.cityCn}行程待规划</p>
            <p className="type-small mt-1 text-muted">当前旅行已独立载入，之后添加的地点会在这里按时间执行。</p>
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="journal-button journal-button--primary mt-4"
            >
              <CalendarDays size={13} />
              打开行程页
            </button>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id}>{entry === next || entry === active ? null : big(entry)}</div>
        ))}
      </section>
    </div>
  )
}
