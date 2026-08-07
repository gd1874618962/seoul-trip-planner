import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Bus,
  Camera,
  Car,
  Check,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Footprints,
  Luggage,
  Moon,
  Music4,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  TrainFront,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { getDays, getTimelineOverrides, saveTimelineOverrides } from '../data/store'
import PageHeader from '../components/PageHeader'

const typeMeta = {
  抵达: { icon: Plane, color: 'bg-mist text-blue' },
  餐饮: { icon: UtensilsCrossed, color: 'bg-cream text-gold' },
  街区: { icon: Camera, color: 'bg-mist text-sage' },
  购物: { icon: ShoppingBag, color: 'bg-cream text-coral' },
  备用: { icon: CircleAlert, color: 'bg-sand/70 text-slate' },
  Kpop: { icon: Star, color: 'bg-mist text-blue' },
  整理: { icon: Luggage, color: 'bg-cream text-slate' },
  交通: { icon: TrainFront, color: 'bg-mist text-blue' },
  住宿: { icon: BedDouble, color: 'bg-cream text-gold' },
  休息: { icon: Moon, color: 'bg-mist text-sage' },
  准备: { icon: ClipboardCheck, color: 'bg-cream text-blue' },
  演出: { icon: Music4, color: 'bg-mist text-coral' },
  收尾: { icon: Moon, color: 'bg-cream text-slate' },
  返程: { icon: Plane, color: 'bg-mist text-navy' },
  机场: { icon: Plane, color: 'bg-mist text-navy' },
}

const transportMeta = {
  transit: { icon: TrainFront, label: '公共交通', color: 'text-blue' },
  walk: { icon: Footprints, label: '步行', color: 'text-sage' },
  taxi: { icon: Car, label: '打车', color: 'text-coral' },
  other: { icon: Bus, label: '其他', color: 'text-gold' },
}

function TransportIcon({ mode }) {
  const meta = transportMeta[mode] || { icon: Bus, color: 'text-sage' }
  const Icon = meta.icon
  return <Icon size={12} className={meta.color} />
}

function IconForType({ type }) {
  const meta = typeMeta[type] || { icon: Sparkles, color: 'bg-mist text-blue' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
      <Icon size={15} />
    </span>
  )
}

function Field({ label, value, onChange, textarea }) {
  const cls =
    'w-full rounded-md border border-line bg-white px-2.5 py-2 text-xs font-medium text-ink outline-none focus:border-blue'
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-bold text-slate">{label}</span>
      {textarea ? (
        <textarea rows={2} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

function parseRange(text) {
  const m = String(text || '').match(/^(\d{1,2}):(\d{2})\s*[-–—~至]\s*(\d{1,2}):(\d{2})/)
  if (m) return { start: Number(m[1]) * 60 + Number(m[2]), end: Number(m[3]) * 60 + Number(m[4]) }
  const s = String(text || '').match(/^(\d{1,2}):(\d{2})$/)
  if (s) {
    const start = Number(s[1]) * 60 + Number(s[2])
    return { start, end: start + 30 }
  }
  return null
}

function fmtTime(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function reflowEntries(list) {
  const out = [...list]
  let cursor = null
  let prevEnd = null
  for (let i = 0; i < out.length; i++) {
    const t = parseRange(out[i].time)
    if (!t) continue
    if (cursor === null) {
      cursor = t.start
    } else {
      const gap = Math.max(0, t.start - prevEnd)
      cursor = prevEnd + gap
    }
    const duration = Math.max(15, t.end - t.start)
    const end = cursor + duration
    out[i] = { ...out[i], time: `${fmtTime(cursor)} - ${fmtTime(end)}` }
    prevEnd = end
  }
  return out
}

export default function Timeline() {
  const [activeDay, setActiveDay] = useState(1)
  const [editing, setEditing] = useState(false)
  const [overrides, setOverrides] = useState(() => getTimelineOverrides())
  const days = getDays()
  const baseDay = days.find((d) => d.id === activeDay)
  const entries = overrides[activeDay] ? [...overrides[activeDay]] : [...baseDay.entries]

  const persist = (next) => {
    setOverrides(next)
    saveTimelineOverrides(next)
  }

  const setEntries = (nextEntries) => persist({ ...overrides, [activeDay]: nextEntries })

  const move = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= entries.length) return
    const next = [...entries]
    ;[next[index], next[target]] = [next[target], next[index]]
    setEntries(reflowEntries(next))
  }

  const patchEntry = (index, field, value) => {
    const next = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    setEntries(next)
  }

  const removeEntry = (index) => {
    setEntries(reflowEntries(entries.filter((_, i) => i !== index)))
  }

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        time: '新时间',
        title: '新地点',
        type: '自定义',
        address: '',
        transport: '',
        cost: '',
        note: '',
      },
    ])
  }

  const resetDay = () => {
    if (!window.confirm(`确定把 ${baseDay.label} 恢复成默认行程吗？`)) return
    const next = { ...overrides }
    delete next[activeDay]
    persist(next)
  }

  return (
    <div>
      <PageHeader eyebrow="Daily Timeline" title="每日行程" subtitle="时间 · 地点 · 交通 · 费用一目了然" />

      <div className="no-scrollbar sticky top-[104px] z-20 flex gap-2 overflow-x-auto bg-[#FCFBF8]/95 px-4 py-3 backdrop-blur-md">
        {days.map((d) => {
          const active = d.id === activeDay
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                active ? 'border-ink bg-ink text-white shadow-card' : 'border-line bg-white text-slate active:bg-cream'
              }`}
            >
              <span>{d.label}</span>
              <span className={active ? 'text-white/75' : 'text-slate/70'}>{d.date}</span>
            </button>
          )
        })}
      </div>

      <div className="mx-4 mt-1 flex items-center justify-between gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-bold text-white active:opacity-90"
            >
              <Check size={14} />
              完成编辑
            </button>
            <button
              type="button"
              onClick={() => setEntries(reflowEntries(entries))}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
            >
              <Clock size={14} />
              顺延时间
            </button>
            <button
              type="button"
              onClick={resetDay}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑行程
          </button>
        )}
        <span className="text-[11px] font-medium text-slate">{editing ? '用箭头调整顺序' : '步行参考 ~2 万步/天'}</span>
      </div>

      <div className="mx-4 mt-3 rounded-lg border border-blue/15 bg-gradient-to-r from-mist via-white to-cream p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
              {baseDay.label} · {baseDay.date} {baseDay.weekday}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold leading-snug text-ink">{baseDay.theme}</h2>
          </div>
          <div className="shrink-0 text-center">
            <p className="text-[10px] font-bold text-slate">节点</p>
            <p className="text-sm font-black text-blue">{entries.length}</p>
          </div>
        </div>
      </div>

      <section className="mt-5 px-4">
        <div className="relative">
          <div className="absolute bottom-2 left-[52px] top-2 w-px bg-line" />
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.id || `${activeDay}-${index}`} className="relative flex gap-3">
                <div className="w-[52px] shrink-0 pt-3 text-right">
                  <span className="text-[11px] font-black leading-tight text-ink">{entry.time}</span>
                </div>
                <div className="relative z-10 flex w-6 shrink-0 justify-center pt-3">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-blue shadow-sm" />
                </div>
                <div
                  className={`mb-1 flex-1 rounded-lg border bg-white p-3.5 shadow-card ${
                    entry.isBackup ? 'border-dashed border-sand bg-cream/60' : 'border-line'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${
                        entry.isBackup ? 'bg-sand/70 text-slate' : 'bg-mist text-blue'
                      }`}
                    >
                      {entry.isBackup ? '备用方案' : entry.type}
                    </span>
                    {editing && (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
                          aria-label="上移"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === entries.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
                          aria-label="下移"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-coral active:bg-cream"
                          aria-label="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </div>

                  {editing ? (
                    <div className="mt-3 space-y-2.5">
                      <div className="grid grid-cols-[88px_1fr] gap-2">
                        <Field label="时间" value={entry.time} onChange={(v) => patchEntry(index, 'time', v)} />
                        <Field label="标题" value={entry.title} onChange={(v) => patchEntry(index, 'title', v)} />
                      </div>
                      <Field label="地址" value={entry.address || ''} onChange={(v) => patchEntry(index, 'address', v)} />
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-slate">交通方式</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['transit', 'walk', 'taxi', 'other'].map((mode) => {
                            const active = entry.transportMode === mode
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => patchEntry(index, 'transportMode', active ? undefined : mode)}
                                className={`rounded-md border px-1 py-1.5 text-[10px] font-bold ${
                                  active ? 'border-blue bg-blue text-white' : 'border-line bg-white text-slate active:bg-cream'
                                }`}
                              >
                                {transportMeta[mode].label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="交通说明"
                          value={entry.transport || ''}
                          onChange={(v) => patchEntry(index, 'transport', v)}
                        />
                        <Field
                          label="交通费用"
                          value={entry.transportCost || ''}
                          onChange={(v) => patchEntry(index, 'transportCost', v)}
                        />
                      </div>
                      <Field label="总费用（餐饮/门票等）" value={entry.cost || ''} onChange={(v) => patchEntry(index, 'cost', v)} />
                      <Field
                        label="备注"
                        value={entry.note || ''}
                        textarea
                        onChange={(v) => patchEntry(index, 'note', v)}
                      />
                      {entry.recommend && (
                        <Field
                          label="推荐菜（用逗号分隔）"
                          value={entry.recommend.join('，')}
                          onChange={(v) =>
                            patchEntry(
                              index,
                              'recommend',
                              v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
                            )
                          }
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="mt-2 text-[15px] font-black leading-snug text-ink">{entry.title}</h3>
                      {entry.address && (
                        <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate">{entry.address}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                        {entry.transport && entry.transport !== '—' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                            <TransportIcon mode={entry.transportMode} />
                            {entry.transport}
                            {entry.transportCost ? <span className="text-slate/70"> · {entry.transportCost}</span> : null}
                          </span>
                        )}
                        {entry.cost && entry.cost !== '—' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                            <Wallet size={12} className="text-gold" />
                            {entry.cost}
                          </span>
                        )}
                      </div>
                      {entry.recommend && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {entry.recommend.map((r) => (
                            <span
                              key={r}
                              className="rounded-md border border-blue/15 bg-mist/70 px-2 py-0.5 text-[10px] font-bold text-blue"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.note && (
                        <p className="mt-2.5 border-t border-line/70 pt-2 text-[11px] font-medium leading-relaxed text-slate">
                          {entry.note}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <button
            type="button"
            onClick={addEntry}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue/40 bg-mist/50 py-3 text-xs font-bold text-blue active:bg-mist"
          >
            <Plus size={15} />
            新增一个时间点
          </button>
        )}
      </section>
    </div>
  )
}
