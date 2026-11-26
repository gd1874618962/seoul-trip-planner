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
  Coffee,
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
  抵达: { icon: Plane },
  餐饮: { icon: UtensilsCrossed },
  早餐: { icon: Coffee },
  午餐: { icon: UtensilsCrossed },
  晚餐: { icon: UtensilsCrossed },
  咖啡: { icon: Coffee },
  下午茶: { icon: Coffee },
  小吃: { icon: UtensilsCrossed },
  甜品: { icon: UtensilsCrossed },
  街区: { icon: Camera },
  景点: { icon: Camera },
  拍照: { icon: Camera },
  购物: { icon: ShoppingBag },
  备用: { icon: CircleAlert },
  Kpop: { icon: Star },
  整理: { icon: Luggage },
  交通: { icon: TrainFront },
  住宿: { icon: BedDouble },
  休息: { icon: Moon },
  准备: { icon: ClipboardCheck },
  演出: { icon: Music4 },
  收尾: { icon: Moon },
  退房: { icon: Luggage },
  返程: { icon: Plane },
  机场: { icon: Plane },
}

const transportMeta = {
  transit: { icon: TrainFront, label: '公共交通', color: 'text-accent' },
  walk: { icon: Footprints, label: '步行', color: 'text-muted' },
  taxi: { icon: Car, label: '打车', color: 'text-clay' },
  other: { icon: Bus, label: '其他', color: 'text-muted' },
}

function TransportIcon({ mode }) {
  const meta = transportMeta[mode] || { icon: Bus, color: 'text-muted' }
  const Icon = meta.icon
  return <Icon size={12} className={meta.color} />
}

function TransportCard({ transport }) {
  if (typeof transport !== 'object' || !transport?.options?.length) return null
  return (
    <div className="mt-2.5 space-y-2">
      <p className="type-caption font-semibold text-muted">
        交通攻略{transport.status === 'estimated' ? '（估算，接入 API 后为真实线路）' : ''}
      </p>
      {transport.options.map((opt, i) => (
        <div key={`${opt.type}-${i}`} className="border-l border-accent/40 pl-3">
          <div className="flex items-center justify-between gap-2">
            <span className="type-small font-semibold text-ink">
              {opt.type === 'subway' ? '地铁' : opt.type === 'taxi' ? '打车' : '步行'}
            </span>
            <span className="type-caption font-semibold text-muted">
              {opt.duration} · {opt.costKRW}
            </span>
          </div>
          {opt.steps && opt.steps.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {opt.steps.map((step, j) => (
                <p key={j} className="type-caption font-medium text-muted">
                  {step.mode === 'subway'
                    ? `${step.line || '地铁'}：${step.from} → ${step.to}`
                    : `步行 ${step.description}`}
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
  const meta = typeMeta[type] || { icon: Sparkles }
  const Icon = meta.icon
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-accent">
      <Icon size={14} strokeWidth={1.5} />
    </span>
  )
}

function Field({ label, value, onChange, textarea }) {
  const cls = 'journal-input'
  return (
    <label className="block min-w-0">
      <span className="mb-1 block type-caption font-semibold text-muted">{label}</span>
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
    <div className="border border-line bg-surface p-3">
      <div className="flex gap-2">
        <input
          className="journal-input min-w-0 flex-1"
          placeholder="输入地点搜索（在线地图）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={search}
          className="journal-button journal-button--primary shrink-0"
        >
          <Search size={12} />
          {busy ? '搜索中' : '搜索'}
        </button>
      </div>
      {open && results.length > 0 && (
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item)}
              className="block w-full border-b border-line bg-paper px-3 py-2 text-left type-caption font-medium text-muted"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 type-caption font-semibold text-clay">{error}</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          className="journal-input"
          placeholder="纬度（如 37.5512）"
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          className="journal-input"
          placeholder="经度（如 126.9882）"
          inputMode="decimal"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={applyManual}
        className="journal-button journal-button--secondary mt-2 w-full"
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
  const isKualaLumpur = getTripMeta().tripId === 'kuala-lumpur-2027-01'

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

      <div className="no-scrollbar mx-5 flex gap-2 overflow-x-auto border-y border-line py-3 lg:mx-10">
        {days.map((d) => {
          const active = d.id === activeDay
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className="journal-filter"
              data-active={active}
            >
              <span>{d.label}</span>
              <span className={active ? 'text-paper/70' : 'text-muted'}>{d.date}</span>
            </button>
          )
        })}
      </div>

      <div className="mx-5 flex items-center justify-between gap-2 pt-4 lg:mx-10">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="journal-button journal-button--primary"
            >
              <Check size={14} />
              完成编辑
            </button>
            <button
              type="button"
              onClick={() => setEntries(reflowEntries(entries))}
              className="journal-button journal-button--secondary"
            >
              <Clock size={14} />
              顺延时间
            </button>
            <button
              type="button"
              onClick={resetDay}
              className="journal-button journal-button--secondary"
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="journal-button journal-button--secondary"
          >
            <Pencil size={14} />
            编辑行程
          </button>
        )}
        <span className="type-caption text-muted">
          {editing
            ? '用箭头调整顺序'
            : isKualaLumpur
              ? '按既定路线执行 · 待确认项需先核实'
              : '步行参考 ~2 万步/天'}
        </span>
      </div>

      <div className="mx-5 mt-5 border-y border-line py-6 lg:mx-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="journal-label text-accent">
              {baseDay.label} · {baseDay.date} {baseDay.weekday}
            </p>
            <h2 className="type-h2 mt-2 text-ink">{baseDay.theme}</h2>
          </div>
          <div className="shrink-0 text-center">
            <p className="type-caption font-semibold text-muted">已完成</p>
            <p className="type-small font-semibold text-ink">
              {entries.filter((e) => e.status === 'completed').length}/{entries.length}
            </p>
          </div>
        </div>
      </div>

      <section className="mx-5 mt-5 pb-12 lg:mx-10">
        {entries.length === 0 && (
          <div className="journal-empty mb-4">
            <Plane size={22} className="mx-auto text-accent" />
            <p className="type-small mt-3 font-semibold text-ink">这一天还没有行程</p>
            <p className="type-small mt-1 text-muted">先完成航班、酒店和演唱会信息，再逐步添加地点。</p>
            <button
              type="button"
              onClick={() => {
                setEditing(true)
                addEntry()
              }}
              className="journal-button journal-button--primary mt-4"
            >
              <Plus size={13} />
              添加第一个地点
            </button>
          </div>
        )}
        <div className="relative">
          <div className="absolute bottom-6 left-16 top-5 w-px bg-line" />
          <div>
            {entries.map((entry, index) => (
              <div key={entry.id || `${activeDay}-${index}`} className="relative flex gap-3">
                <div className="w-16 shrink-0 pt-1 text-right">
                  <span className="type-caption font-semibold leading-tight text-ink">{entry.time}</span>
                </div>
                <div className="relative z-10 flex w-4 shrink-0 justify-center pt-1.5">
                  <span className="h-2 w-2 rounded-full border-2 border-paper bg-accent" />
                </div>
                <div
                  className={`flex-1 border-b border-line pb-6 ${
                    editing ? 'mt-0 bg-surface px-4 pt-4' : ''
                  } ${entry.isBackup ? 'opacity-80' : ''} ${entry.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 type-caption font-semibold text-accent">
                      {entry.isBackup ? '备用方案' : entry.type}
                      {entry.confirmation && (
                        <span className="border-l border-accent/35 pl-1.5 text-muted">
                          {entry.confirmation}
                        </span>
                      )}
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
                          className={`flex h-8 items-center gap-1 border px-2 type-caption font-semibold ${
                            entry.status === 'completed'
                              ? 'border-accent/40 bg-surface text-accent'
                              : 'border-line bg-paper text-muted'
                          }`}
                        >
                          {entry.status === 'completed' ? '已完成' : '标记完成'}
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
                          aria-label="上移"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === entries.length - 1}
                          className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
                          aria-label="下移"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-clay"
                          aria-label="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </div>

                  {editing ? (
                    <div className="mt-3 space-y-3">
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
                        <span className="mb-1 block type-caption font-semibold text-muted">交通方式</span>
                        <div className="grid grid-cols-4 gap-2">
                          {['transit', 'walk', 'taxi', 'other'].map((mode) => {
                            const active = entry.transportMode === mode
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => patchEntry(index, 'transportMode', active ? undefined : mode)}
                                className="journal-filter w-full px-1"
                                data-active={active}
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
                        className={`type-h3 mt-2 ${
                          entry.status === 'completed' ? 'text-muted line-through' : 'text-ink'
                        }`}
                      >
                        {entry.title}
                      </h3>
                      {entry.address && (
                        <p className="type-small mt-1 text-muted">{entry.address}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                        {typeof entry.transport === 'string' && entry.transport !== '—' && (
                          <span className="inline-flex items-center gap-1 type-small font-medium text-muted">
                            <TransportIcon mode={entry.transportMode} />
                            {entry.transport}
                            {entry.transportCost ? <span className="text-muted/70"> · {entry.transportCost}</span> : null}
                          </span>
                        )}
                        {entry.transportEta && (
                          <span className="inline-flex items-center gap-1 type-small font-medium text-muted">
                            <Clock size={12} className="text-accent" />
                            {entry.transportEta}
                          </span>
                        )}
                        {entry.transportCostEstimate && (
                          <span className="inline-flex items-center gap-1 type-small font-medium text-muted">
                            <Wallet size={12} className="text-accent" />
                            {entry.transportCostEstimate}
                          </span>
                        )}
                        {entry.suggestedDeparture && (
                          <span className="inline-flex items-center gap-1 type-small font-semibold text-accent">
                            建议出发 {entry.suggestedDeparture}
                          </span>
                        )}
                        {entry.cost && entry.cost !== '—' && (
                          <span className="inline-flex items-center gap-1 type-small font-medium text-muted">
                            <Wallet size={12} className="text-accent" />
                            {entry.cost}
                          </span>
                        )}
                      </div>
                      {entry.recommend && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.recommend.map((r) => (
                            <span
                              key={r}
                              className="border-b border-line pb-0.5 type-caption font-semibold text-muted"
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
                          className="journal-button journal-button--quiet mt-3"
                        >
                          生成交通攻略
                        </button>
                      )}
                      {genError[index] && (
                        <p className="mt-2 type-caption font-semibold text-clay">{genError[index]}</p>
                      )}
                      {entry.note && (
                        <p className="type-small mt-3 border-t border-line pt-3 text-muted">
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
            className="journal-button journal-button--secondary mt-4 w-full"
          >
            <Plus size={15} />
            新增一个时间点
          </button>
        )}
      </section>
    </div>
  )
}
