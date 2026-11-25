import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Download,
  MapPin,
  Pencil,
  Plane,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Upload,
  Wallet,
  WifiOff,
} from 'lucide-react'
import {
  exportAllState,
  getBudgetState,
  getDays,
  getFlights,
  getHotels,
  getLedgerExpenseTotal,
  getReminders,
  getSyncStatus,
  getTripMeta,
  importAllState,
  onSyncStatus,
} from '../data/store'

function SectionTitle({ title, sub, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-xs font-medium text-slate">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const fileRef = useRef(null)
  const [sync, setSync] = useState(() => getSyncStatus())
  const days = getDays()
  const tripMeta = getTripMeta()
  const flights = getFlights()
  const hotels = getHotels()
  const reminders = getReminders()
  const budgetState = getBudgetState()
  const totalSpent = budgetState.spent.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const ledgerTotal = getLedgerExpenseTotal()
  const spentTotal = totalSpent + ledgerTotal
  const remaining = budgetState.perPerson - spentTotal

  const handleExport = () => {
    try {
      const json = exportAllState()
      try {
        navigator.clipboard.writeText(json)
      } catch {
        /* clipboard optional */
      }
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tripMeta.tripId}-data.json`
      a.click()
      URL.revokeObjectURL(url)
      window.alert('已导出：文件已下载，内容也已复制到剪贴板')
    } catch (err) {
      window.alert(`导出失败：${err.message}`)
    }
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importAllState(String(reader.result))
        window.alert('导入成功，页面即将刷新')
        window.location.reload()
      } catch {
        window.alert('导入失败，请确认选择的是导出的 .json 文件')
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => onSyncStatus((next) => setSync(next)), [])

  const syncMeta = {
    idle: { icon: Cloud, label: '待同步', cls: 'text-slate' },
    syncing: { icon: RefreshCw, label: '正在同步', cls: 'text-blue' },
    success: { icon: CheckCircle2, label: '已同步', cls: 'text-sage' },
    error: { icon: AlertTriangle, label: '同步失败', cls: 'text-coral' },
    offline: { icon: WifiOff, label: '离线模式', cls: 'text-slate' },
  }
  const SyncIcon = syncMeta[sync.status]?.icon || Cloud

  return (
    <div>
      <section className="relative h-[440px] overflow-hidden bg-sand">
        {tripMeta.coverImage ? (
          <img src={tripMeta.coverImage} alt={`${tripMeta.cityCn || tripMeta.city}城市景观`} className="h-full w-full object-cover" />
        ) : (
          <div className="relative h-full w-full bg-[#DDE8E4]">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[24px] border-white/35" />
            <div className="absolute bottom-24 left-0 right-0 flex items-end justify-center gap-2 opacity-30">
              {[78, 126, 94, 158, 112, 184, 102].map((height, index) => (
                <span key={`${height}-${index}`} className="w-10 rounded-t-sm bg-navy" style={{ height }} />
              ))}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F222B]/95 via-[#0F222B]/40 to-[#0F222B]/10" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            <MapPin size={12} />
            {tripMeta.city} · {tripMeta.country}
          </span>
          <h1 className="mt-3 font-display text-[40px] font-black leading-[1.02] text-white">
            {tripMeta.heroTitle || tripMeta.city}
            <br />
            {tripMeta.heroSubtitle || 'TRIP PLANNER'}
          </h1>
          <p className="mt-2 text-[15px] font-bold text-white/95">{tripMeta.subtitle || tripMeta.title}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-bold text-white">
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">{tripMeta.dates}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">{tripMeta.duration}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
              {tripMeta.people}人{tripMeta.age ? ` · ${tripMeta.age}岁` : ''}
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-9 px-4">
        <div className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-white p-3 shadow-card">
          {[
            { label: '总预算', value: budgetState.perPerson ? String(budgetState.perPerson) : '待设置', unit: budgetState.perPerson ? 'RMB/人' : '' },
            { label: '已消费', value: String(spentTotal), unit: 'RMB' },
            { label: '剩余', value: String(remaining), unit: 'RMB' },
          ].map((item) => (
            <div key={item.label} className="px-2 text-center">
              <p className="text-[11px] font-medium text-slate">{item.label}</p>
              <p className="mt-1 text-xl font-black leading-none text-ink">
                {item.value}
                <span className="ml-0.5 text-[10px] font-bold text-slate"> {item.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onNavigate('editTrip')}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue/20 bg-mist/60 py-2.5 text-xs font-bold text-blue active:bg-mist"
        >
          <Pencil size={14} />
          编辑基础资料（城市/航班/酒店/成员）
        </button>
        <button
          type="button"
          onClick={() => onNavigate('today')}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-coral/25 bg-cream/70 py-2.5 text-xs font-bold text-coral active:bg-cream"
        >
          <CalendarDays size={14} />
          今日行程（当天执行视图）
        </button>
        <button
          type="button"
          onClick={() => onNavigate('shopping')}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue/25 bg-mist/70 py-2.5 text-xs font-bold text-blue active:bg-mist"
        >
          <ShoppingBag size={14} />
          代购订单（DAISY / 梧桐）
        </button>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-white/95 px-3 py-2 shadow-card">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${syncMeta[sync.status]?.cls || 'text-slate'}`}>
            <SyncIcon size={13} />
            {syncMeta[sync.status]?.label || '待同步'}
          </span>
          {sync.error && <span className="text-[10px] font-medium leading-tight text-coral">{sync.error}</span>}
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionTitle title="航班" sub={`${tripMeta.cityCn || tripMeta.city}旅行航班`} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-line bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-mist text-blue">
                <Plane size={16} className="rotate-45" />
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-gold">去程</span>
            </div>
            {flights.outbound.map((f, index) => (
              <div key={`${f.flight || 'outbound'}-${index}`} className="mt-3">
                <p className="text-[10px] font-medium text-slate">{f.date}</p>
                <p className="mt-0.5 text-sm font-black text-ink">{f.flight || '待填写'}</p>
                <p className="text-[11px] font-medium text-slate">{f.route || '航班信息待补充'}</p>
                {f.note && <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate/80">{f.note}</p>}
              </div>
            ))}
            {flights.outbound.length === 0 && <p className="mt-3 text-xs font-medium text-slate">去程航班待填写</p>}
          </div>
          <div className="rounded-lg border border-line bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cream text-gold">
                <Plane size={16} className="-rotate-45" />
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-gold">回程</span>
            </div>
            {flights.return.map((f, index) => (
              <div key={`${f.flight || 'return'}-${index}`} className="mt-3">
                <p className="text-[10px] font-medium text-slate">{f.date}</p>
                <p className="mt-0.5 text-sm font-black text-ink">{f.flight || '待填写'}</p>
                <p className="text-[11px] font-medium text-slate">{f.route || '航班信息待补充'}</p>
                {f.note && <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate/80">{f.note}</p>}
              </div>
            ))}
            {flights.return.length === 0 && <p className="mt-3 text-xs font-medium text-slate">返程航班待填写</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionTitle title="住宿" sub="每晚都有明确落脚点" />
        <div className="space-y-3">
          {hotels.map((h, index) => (
            <div key={`${h.locationId || h.name || 'hotel'}-${index}`} className="rounded-lg border border-line bg-white p-3.5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-mist px-2.5 py-1 text-[10px] font-bold text-blue">{h.night || '住宿'}</span>
                {h.price && <span className="text-[11px] font-bold text-sage">{h.price}</span>}
              </div>
              <div className="mt-2.5 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-black text-ink">{h.name}</h3>
                  {h.en && <p className="text-[11px] font-medium text-slate">{h.en}</p>}
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate">
                    <MapPin size={11} />
                    {h.address}
                  </p>
                </div>
                {h.area && <span className="mt-0.5 shrink-0 rounded-md bg-cream px-2 py-1 text-[10px] font-bold text-gold">{h.area}</span>}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(h.features || []).map((f) => (
                  <span key={f} className="rounded-md border border-line bg-cream/70 px-2 py-0.5 text-[10px] font-medium text-slate">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {hotels.length === 0 && (
            <div className="rounded-lg border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-xs font-medium text-slate">
              酒店信息待填写
            </div>
          )}
        </div>
      </section>

      {tripMeta.concert?.name && (
        <section className="mt-6 px-4">
          <SectionTitle title="演唱会" sub={`${tripMeta.cityCn || tripMeta.city}行程核心事项`} />
          <div className="rounded-lg border border-blue/15 bg-gradient-to-br from-mist via-white to-cream p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-xs font-bold text-blue">
              <Ticket size={14} />
              {tripMeta.concert.date || '日期待确认'}
            </p>
            <h3 className="mt-1.5 font-display text-lg font-black text-ink">{tripMeta.concert.name}</h3>
            <p className="mt-1 text-xs font-medium text-slate">{tripMeta.concert.venue}</p>
            {(tripMeta.concert.entryTime || tripMeta.concert.endTime) && (
              <p className="mt-2 rounded-md bg-white/70 px-3 py-2 text-[11px] font-bold text-slate">
                入场 {tripMeta.concert.entryTime || '待确认'} · 结束 {tripMeta.concert.endTime || '待确认'}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="mt-6 px-4">
        <SectionTitle title="数据备份与同步" sub="电脑改完导出，手机导入即可带走" />
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <p className="text-xs font-medium leading-relaxed text-slate">
            行程、提醒、预算的修改都可以打包成一个数据文件。在家时用局域网网址会自动同步，出门用导出导入。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue px-3 py-2.5 text-xs font-bold text-white active:opacity-90"
            >
              <Download size={14} />
              导出数据
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-mist px-3 py-2.5 text-xs font-bold text-blue active:opacity-90"
            >
              <Upload size={14} />
              导入数据
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionTitle
          title={`${days.length} 日行程速览`}
          sub={days.some((day) => day.entries.length) ? '点击查看当天完整时间线' : '基础资料已建立，行程地点待规划'}
          action={
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="flex items-center gap-0.5 text-xs font-bold text-blue"
            >
              全部行程
              <ChevronRight size={14} />
            </button>
          }
        />
        <div className="space-y-2.5">
          {days.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onNavigate('timeline')}
              className="flex w-full items-center gap-3 rounded-lg border border-line bg-white p-3 text-left shadow-card active:bg-cream/60"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-mist">
                <span className="text-[10px] font-bold text-slate">DAY</span>
                <span className="text-lg font-black leading-none text-blue">{d.id}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate">{d.date} · {d.weekday}</p>
                <p className="truncate text-sm font-black text-ink">{d.theme}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate">{d.entries.length} 个时间节点</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-slate/60" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="rounded-lg border border-blue/20 bg-gradient-to-br from-mist via-white to-cream p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-blue">
                <BellRing size={14} />
                出发前必看
              </p>
              <h3 className="mt-1.5 font-display text-lg font-bold text-ink">
                {reminders.length ? reminders.slice(0, 3).map((group) => group.title).join(' · ') : '旅行提醒待建立'}
              </h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate">
                {reminders.length
                  ? '出发前逐项检查，重要证件、交通和行程事项集中在这里。'
                  : '可以在提醒页新增机场、演唱会和行李清单。'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white p-2.5 text-gold shadow-card">
              <Ticket size={18} />
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-ink py-2.5 text-sm font-bold text-white active:opacity-90"
          >
            打开提醒清单
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="flex items-center justify-between rounded-lg border border-line bg-white p-3.5 shadow-card">
          <div>
            <p className="text-[11px] font-medium text-slate">剩余预算</p>
            <p className="mt-1 text-lg font-black text-ink">
              ≈ {remaining} <span className="text-[11px] font-bold text-slate">RMB / 人</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="flex items-center gap-1 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"
          >
            <Wallet size={14} />
            看预算分配
          </button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 pb-2 text-center text-[11px] font-medium text-slate">
          <CalendarDays size={12} />
          {tripMeta.cityCn || tripMeta.city}行程资料已载入，随时打开查看
        </p>
      </section>
    </div>
  )
}
