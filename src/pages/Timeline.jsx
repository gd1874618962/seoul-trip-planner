import { useEffect, useRef, useState } from 'react'
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
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  TrainFront,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import {
  getDays,
  getPoints,
  getTimelineOverrides,
  getTripMeta,
  saveTimelineOverrides,
} from '../data/store'
import PageHeader from '../components/PageHeader'
import { generateTransportRoute } from '../services/transportService'

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

function TransportCard({ transport }) {
  if (typeof transport !== 'object' || !transport?.options?.length) return null
  return (
    <div className="mt-2.5 space-y-2">
      <p className="text-xs font-semibold text-slate">
        交通攻略{transport.status === 'estimated' ? '（估算，接入 API 后为真实线路）' : ''}
      </p>
      {transport.options.map((opt, i) => (
        <div key={`${opt.type}-${i}`} className="rounded-md border border-blue/10 bg-mist/40 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">
              {opt.type === 'subway' ? '🚇 地铁' : opt.type === 'taxi' ? '🚕 打车' : '🚶 步行'}
            </span>
            <span className="text-xs font-semibold text-slate">
              {opt.duration} · {opt.costKRW}
            </span>
          </div>
          {opt.steps && opt.steps.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {opt.steps.map((step, j) => (
                <p key={j} className="text-xs font-medium leading-relaxed text-slate">
                  {step.mode === 'subway'
                    ? `${step.line || '地铁'}：${step.from} → ${step.to}`
                    : `🚶 ${step.description}`}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
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
      <span className="mb-1 block text-xs font-semibold text-slate">{label}</span>
      {textarea ? (
        <textarea rows={2} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

function LocationSearch({ onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const sources = [
    {
      name: 'OpenStreetMap',
      request: async (q) => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
        )
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      },
      map: (items) =>
        items.map((item) => ({
          key: item.place_id,
          display_name: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
        })),
    },
    {
      name: 'Photon',
      request: async (q) => {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        return data.features || []
      },
      map: (items) =>
        items.map((item) => {
          const p = item.properties || {}
          const name = p.name || ''
          const city = p.city || p.state || ''
          const country = p.country || ''
          return {
            key: `${p.osm_id || name}-${item.geometry.coordinates[0]}`,
            display_name: [name, city, country].filter(Boolean).join(', '),
            lat: item.geometry.coordinates[1],
            lng: item.geometry.coordinates[0],
          }
        }),
    },
  ]

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setBusy(true)
    setError('')
    setResults([])
    setOpen(false)
    for (const source of sources) {
      try {
        const mapped = source.map(await source.request(q)).filter((r) => r.display_name)
        if (mapped.length) {
          setResults(mapped)
          setOpen(true)
          setBusy(false)
          return
        }
      } catch {
        /* try next source */
      }
    }
    setBusy(false)
    setError('地图服务无法访问，请手动输入经纬度')
  }

  const applyManual = () => {
    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (!latNum || !lngNum) {
      setError('请填写正确的纬度和经度')
      return
    }
    onPick({
      address: query.trim() || '手动地点',
      lat: latNum,
      lng: lngNum,
      locationId: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    })
    setOpen(false)
    setResults([])
  }

  const pick = (item) => {
    onPick({
      address: item.display_name,
      lat: item.lat,
      lng: item.lng,
      locationId: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    })
    setOpen(false)
    setResults([])
  }

  return (
    <div className="rounded-md border border-blue/15 bg-mist/50 p-2">
      <div className="flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blue"
          placeholder="输入地点搜索（在线地图）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={search}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue px-2.5 py-1.5 text-sm font-semibold text-white active:opacity-90"
        >
          <Search size={12} />
          {busy ? '搜索中' : '搜索'}
        </button>
      </div>
      {open && results.length > 0 && (
        <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item)}
              className="block w-full rounded-md bg-white px-2 py-1.5 text-left text-xs font-medium leading-relaxed text-slate active:bg-mist"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-semibold text-coral">{error}</p>}
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <input
          className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blue"
          placeholder="纬度（如 37.5512）"
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blue"
          placeholder="经度（如 126.9882）"
          inputMode="decimal"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={applyManual}
        className="mt-1.5 w-full rounded-md bg-cream px-2 py-1.5 text-xs font-semibold text-gold active:bg-sand"
      >
        手动定位到该坐标
      </button>
    </div>
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
  const [genError, setGenError] = useState({})
  const overridesRef = useRef(overrides)
  const persistTimer = useRef(null)
  const days = getDays()
  const pointMap = Object.fromEntries(getPoints().map((p) => [p.locationId, p]))
  const baseDay = days.find((d) => d.id === activeDay)
  const entries = baseDay.entries

  useEffect(
    () => () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current)
        saveTimelineOverrides(overridesRef.current)
      }
    },
    [],
  )

  const persist = (next) => {
    const versioned = {
      ...next,
      __itineraryVersion: {
        ...(next.__itineraryVersion || {}),
        [activeDay]: getTripMeta().itineraryVersion,
      },
    }
    setOverrides(versioned)
    overridesRef.current = versioned
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      saveTimelineOverrides(overridesRef.current)
    }, 300)
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

  const patchEntryFields = (index, fields) => {
    const next = entries.map((entry, i) => (i === index ? { ...entry, ...fields } : entry))
    setEntries(next)
  }

  const getCoords = (entry) => {
    if (entry.lat != null && entry.lng != null) return { lat: Number(entry.lat), lng: Number(entry.lng) }
    const point = entry.locationId ? pointMap[entry.locationId] : null
    return point ? { lat: Number(point.lat), lng: Number(point.lng) } : null
  }

  const generateTransport = async (index) => {
    const current = entries[index]
    const previous = entries[index - 1]
    const origin = previous ? getCoords(previous) : null
    const destination = getCoords(current)
    if (!origin || !destination) {
      setGenError((prev) => ({ ...prev, [index]: '暂无自动路线，请使用地图导航' }))
      return
    }
    const plan = await generateTransportRoute(
      {
        name: previous?.title || '出发地',
        locationId: previous.locationId,
        ...origin,
      },
      {
        name: current.title,
        locationId: current.locationId,
        ...destination,
      },
      { provider: 'estimated' },
    )
    if (!plan) {
      setGenError((prev) => ({ ...prev, [index]: '暂无自动路线，请使用地图导航' }))
      return
    }
    setGenError((prev) => ({ ...prev, [index]: '' }))
    patchEntryFields(index, {
      transport: {
        status: 'estimated',
        provider: plan.provider || 'estimated',
        origin: { name: previous?.title || '出发地', ...origin },
        destination: { name: current.title, ...destination },
        options: plan.options,
      },
    })
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

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-y border-line px-5 py-3 lg:px-10">
        {days.map((d) => {
          const active = d.id === activeDay
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                active ? 'border-ink bg-ink text-paper' : 'border-line bg-transparent text-slate active:bg-cream'
              }`}
            >
              <span>{d.label}</span>
              <span className={active ? 'text-white/75' : 'text-slate/70'}>{d.date}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 px-5 pt-4 lg:px-10">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white active:opacity-90"
            >
              <Check size={14} />
              完成编辑
            </button>
            <button
              type="button"
              onClick={() => setEntries(reflowEntries(entries))}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate active:bg-cream"
            >
              <Clock size={14} />
              顺延时间
            </button>
            <button
              type="button"
              onClick={resetDay}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate active:bg-cream"
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-semibold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑行程
          </button>
        )}
        <span className="text-sm font-normal text-slate">{editing ? '用箭头调整顺序' : '步行参考 ~2 万步/天'}</span>
      </div>

      <div className="mx-5 mt-4 border-y border-line py-5 lg:mx-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">
              {baseDay.label} · {baseDay.date} {baseDay.weekday}
            </p>
            <h2 className="mt-1 font-display text-[24px] font-semibold leading-snug text-ink">{baseDay.theme}</h2>
          </div>
          <div className="shrink-0 text-center">
            <p className="text-xs font-semibold text-slate">已完成</p>
            <p className="text-sm font-semibold text-blue">
              {entries.filter((e) => e.status === 'completed').length}/{entries.length}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-5 px-5 pb-12 lg:px-10">
        {entries.length === 0 && (
          <div className="mb-3 rounded-lg border border-dashed border-blue/30 bg-mist/45 px-4 py-7 text-center">
            <Plane size={22} className="mx-auto text-blue" />
            <p className="mt-2 text-sm font-semibold text-ink">这一天还没有行程</p>
            <p className="mt-1 text-sm font-medium text-slate">先完成航班、酒店和演唱会信息，再逐步添加地点。</p>
            <button
              type="button"
              onClick={() => {
                setEditing(true)
                addEntry()
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-blue px-3 py-2 text-sm font-semibold text-white active:opacity-90"
            >
              <Plus size={13} />
              添加第一个地点
            </button>
          </div>
        )}
        <div className="relative">
          <div className="absolute bottom-2 left-[52px] top-2 w-px bg-line" />
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.id || `${activeDay}-${index}`} className="relative flex gap-3">
                <div className="w-[52px] shrink-0 pt-3 text-right">
                  <span className="text-sm font-semibold leading-tight text-ink">{entry.time}</span>
                </div>
                <div className="relative z-10 flex w-6 shrink-0 justify-center pt-3">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-blue shadow-sm" />
                </div>
                <div
                  className={`mb-2 flex-1 rounded-lg border bg-paper p-4 ${
                    entry.isBackup ? 'border-dashed border-sand bg-cream/60' : 'border-line'
                  } ${entry.status === 'completed' ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${
                        entry.isBackup ? 'bg-sand/70 text-slate' : 'bg-mist text-blue'
                      }`}
                    >
                      {entry.isBackup ? '备用方案' : entry.type}
                    </span>
                    {editing && (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            patchEntry(
                              index,
                              'status',
                              entry.status === 'completed' ? 'planned' : 'completed',
                            )
                          }
                          className={`flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold active:bg-cream ${
                            entry.status === 'completed'
                              ? 'border-sage/40 bg-mist text-sage'
                              : 'border-line bg-white text-slate'
                          }`}
                        >
                          {entry.status === 'completed' ? '已完成' : '标记完成'}
                        </button>
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
                      <LocationSearch
                        onPick={(picked) => {
                          patchEntryFields(index, {
                            address: picked.address,
                            lat: picked.lat,
                            lng: picked.lng,
                            locationId: picked.locationId,
                          })
                        }}
                      />
                      <div>
                        <span className="mb-1 block text-xs font-semibold text-slate">交通方式</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['transit', 'walk', 'taxi', 'other'].map((mode) => {
                            const active = entry.transportMode === mode
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => patchEntry(index, 'transportMode', active ? undefined : mode)}
                                className={`rounded-md border px-1 py-1.5 text-xs font-semibold ${
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
                          value={typeof entry.transport === 'string' ? entry.transport : ''}
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
                      <h3
                        className={`mt-2 text-lg font-semibold leading-snug ${
                          entry.status === 'completed' ? 'text-slate/60 line-through' : 'text-ink'
                        }`}
                      >
                        {entry.title}
                      </h3>
                      {entry.address && (
                        <p className="mt-1 text-sm font-normal leading-6 text-slate">{entry.address}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                        {typeof entry.transport === 'string' && entry.transport !== '—' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate">
                            <TransportIcon mode={entry.transportMode} />
                            {entry.transport}
                            {entry.transportCost ? <span className="text-slate/70"> · {entry.transportCost}</span> : null}
                          </span>
                        )}
                        {entry.transportEta && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate">
                            <Clock size={12} className="text-blue" />
                            {entry.transportEta}
                          </span>
                        )}
                        {entry.transportCostEstimate && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate">
                            <Wallet size={12} className="text-gold" />
                            {entry.transportCostEstimate}
                          </span>
                        )}
                        {entry.suggestedDeparture && (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-sage">
                            建议出发 {entry.suggestedDeparture}
                          </span>
                        )}
                        {entry.cost && entry.cost !== '—' && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate">
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
                              className="rounded-md border border-blue/15 bg-mist/70 px-2 py-0.5 text-xs font-semibold text-blue"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <TransportCard transport={entry.transport} />
                      {(typeof entry.transport !== 'object' || !entry.transport?.options?.length) && (
                        <button
                          type="button"
                          onClick={() => generateTransport(index)}
                          className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-blue/10 px-2.5 py-1.5 text-xs font-semibold text-blue active:bg-mist"
                        >
                          生成交通攻略
                        </button>
                      )}
                      {genError[index] && (
                        <p className="mt-1.5 text-xs font-semibold text-coral">{genError[index]}</p>
                      )}
                      {entry.note && (
                        <p className="mt-2.5 border-t border-line/70 pt-2 text-sm font-medium leading-relaxed text-slate">
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
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue/40 bg-mist/50 py-3 text-xs font-semibold text-blue active:bg-mist"
          >
            <Plus size={15} />
            新增一个时间点
          </button>
        )}
      </section>
    </div>
  )
}
