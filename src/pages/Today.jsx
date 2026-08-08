import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Wallet,
} from 'lucide-react'
import { getDays } from '../data/store'
import PageHeader from '../components/PageHeader'

function todayKey() {
  const d = new Date()
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

const modeLabel = {
  transit: '🚇 地铁',
  walk: '🚶 步行',
  taxi: '🚕 打车',
  other: '其他',
}

export default function Today({ onNavigate }) {
  const days = getDays()
  const day = days.find((d) => d.date === todayKey()) || days[0]
  if (!day) return null

  return (
    <div>
      <PageHeader eyebrow="Today" title="今日行程" subtitle={`${day.date} ${day.weekday} · ${day.theme}`} />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
        <button
          type="button"
          onClick={() => onNavigate('timeline')}
          className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
        >
          <CalendarDays size={14} />
          去行程页编辑
        </button>
      </div>

      <section className="mt-4 space-y-3 px-4">
        {day.entries.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-lg border border-line bg-white p-3.5 shadow-card ${
              entry.status === 'completed' ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-blue">{entry.time}</span>
              {entry.status === 'completed' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sage">
                  <CheckCircle2 size={13} />
                  已完成
                </span>
              )}
            </div>
            <h3 className={`mt-1 text-[15px] font-black leading-snug ${entry.status === 'completed' ? 'text-slate/60 line-through' : 'text-ink'}`}>
              {entry.title}
            </h3>
            {entry.address && (
              <p className="mt-1 flex items-start gap-1 text-[11px] font-medium leading-relaxed text-slate">
                <MapPin size={11} className="mt-0.5 shrink-0 text-sage" />
                {entry.address}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
              {typeof entry.transport === 'string' && entry.transport !== '—' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                  {modeLabel[entry.transportMode] || '🚇 '}
                  {entry.transport}
                </span>
              )}
              {entry.transportEta && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                  <Clock size={12} className="text-blue" />
                  {entry.transportEta}
                </span>
              )}
              {entry.transportCostEstimate && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                  <Wallet size={12} className="text-gold" />
                  {entry.transportCostEstimate}
                </span>
              )}
              {entry.suggestedDeparture && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage">
                  建议出发 {entry.suggestedDeparture}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
