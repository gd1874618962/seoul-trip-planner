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
import { getDays, getTimelineOverrides, saveTimelineOverrides } from '../data/store'
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
        <span key={i} className="inline-flex items-center gap-1 text-[13px] font-bold text-slate">
          {p}
        </span>
      ))}
    </div>
  )
}

export default function Today({ onNavigate }) {
  const [tick, setTick] = useState(0)
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
    <div
      className={`rounded-lg border bg-white p-4 shadow-card ${
        entry.status === 'completed' ? 'border-line opacity-70' : 'border-blue/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl font-black text-blue">{entry.time}</span>
        {entry.status === 'completed' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage">
            <CheckCircle2 size={14} />
            已完成
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[10px] font-bold text-coral">
            {entry === active ? '正在进行' : '下一项'}
          </span>
        )}
      </div>
      <h3
        className={`mt-1.5 text-lg font-black leading-snug ${
          entry.status === 'completed' ? 'text-slate/60 line-through' : 'text-ink'
        }`}
      >
        {entry.title}
      </h3>
      {entry.address && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-relaxed text-slate">
          <MapPin size={14} className="mt-0.5 shrink-0 text-sage" />
          {entry.address}
        </p>
      )}
      <TransportLine entry={entry} />
      {entry.suggestedDeparture && entry.status !== 'completed' && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-[12px] font-bold text-blue">
          <Clock size={13} />
          建议出发 {entry.suggestedDeparture}
        </p>
      )}
      {entry.status !== 'completed' && (
        <button
          type="button"
          onClick={() => complete(entry)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white active:opacity-90"
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

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
        >
          <ArrowLeft size={14} />
          返回
        </button>
        <button
          type="button"
          onClick={() => onNavigate('timeline')}
          className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
        >
          <CalendarDays size={14} />
          编辑
        </button>
      </div>

      {next && (
        <section className="mt-4 px-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate">下一步</p>
          {big(next)}
        </section>
      )}

      <section className="mt-5 space-y-3 px-4">
        {entries.map((entry) => (
          <div key={entry.id}>{entry === next || entry === active ? null : big(entry)}</div>
        ))}
      </section>
    </div>
  )
}
