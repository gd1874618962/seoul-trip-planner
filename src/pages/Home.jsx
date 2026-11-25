import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
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

function SectionHeading({ index, title, sub, action }) {
  return (
    <div className="editorial-rule grid gap-3 pt-4 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-start md:gap-6">
      <p className="editorial-label text-gold">{index}</p>
      <div>
        <h2 className="font-display text-[26px] font-semibold leading-tight text-ink md:text-[30px]">{title}</h2>
        {sub && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate">{sub}</p>}
      </div>
      {action && <div className="md:pt-1">{action}</div>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-4 bg-paper px-4 py-4 text-left text-sm font-semibold text-ink active:bg-cream lg:px-5"
    >
      <span className="flex items-center gap-2.5">
        <Icon size={14} strokeWidth={1.7} className="text-gold" />
        <span>{label}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function FlightBlock({ label, items, direction }) {
  return (
    <article className="py-5 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between border-b border-ink/15 pb-3">
        <p className="editorial-label text-gold">{label}</p>
        <Plane size={16} strokeWidth={1.5} className={direction === 'return' ? '-rotate-45 text-slate' : 'rotate-45 text-slate'} />
      </div>
      <div className="mt-4 space-y-5">
        {items.map((f, index) => (
          <div key={`${f.flight || label}-${index}`}>
            <p className="text-xs font-medium text-slate">{f.date}</p>
            <p className="mt-1 font-display text-[24px] leading-tight text-ink">{f.flight || '待填写'}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{f.route || '航班信息待补充'}</p>
            {f.note && <p className="mt-1 text-xs leading-relaxed text-slate/90">{f.note}</p>}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate">航班待填写</p>}
      </div>
    </article>
  )
}

function JourneyImage({ tripMeta }) {
  if (tripMeta.coverImage) {
    return (
      <img
        src={tripMeta.coverImage}
        alt={`${tripMeta.cityCn || tripMeta.city}城市景观`}
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden bg-[#B9C7BF] text-ink lg:min-h-[520px]">
      <div className="absolute inset-x-7 top-1/2 border-t border-ink/20" />
      <div className="absolute -right-20 top-14 h-72 w-72 rounded-full border border-ink/20" />
      <div className="absolute right-3 top-32 h-48 w-48 rounded-full border border-ink/15" />
      <p className="editorial-label absolute left-6 top-6">Kuala Lumpur / 3.1390 N</p>
      <p className="absolute bottom-7 left-6 font-display text-[44px] font-semibold leading-[0.96] text-ink/30 sm:text-[56px]">
        CITY<br />NOTES
      </p>
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
  const metrics = [
    { label: '总预算', value: budgetState.perPerson ? String(budgetState.perPerson) : '待设置', unit: budgetState.perPerson ? 'RMB / 人' : '' },
    { label: '已消费', value: String(spentTotal), unit: 'RMB' },
    { label: '剩余', value: String(remaining), unit: 'RMB' },
  ]

  return (
    <div className="px-5 pb-16 pt-4 lg:px-10 lg:pb-24 lg:pt-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.58fr)] xl:gap-8">
        <figure className="overflow-hidden bg-sand">
          <div className="h-[330px] sm:h-[420px] lg:h-[520px] xl:h-[560px]">
            <JourneyImage tripMeta={tripMeta} />
          </div>
          <figcaption className="flex items-center justify-between gap-4 border-b border-ink/20 py-3 text-xs text-slate">
            <span className="editorial-label">{tripMeta.countryCn || tripMeta.country}</span>
            <span>{tripMeta.dates}</span>
          </figcaption>
        </figure>

        <aside className="flex min-h-[410px] flex-col border-y border-ink/20 py-5 xl:min-h-[605px]">
          <div className="flex items-center justify-between gap-4">
            <p className="editorial-label text-gold">Journey dossier</p>
            <span className="text-xs font-semibold text-slate">{tripMeta.status || '旅行档案'}</span>
          </div>
          <div className="my-auto py-10">
            <h1 className="max-w-[9ch] font-display text-[44px] font-semibold leading-[1.02] text-ink sm:text-[52px]">
              {tripMeta.heroTitle || tripMeta.city}
            </h1>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
              {tripMeta.heroSubtitle || tripMeta.title}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate">{tripMeta.subtitle || tripMeta.title}</p>
          </div>
          <dl className="border-t border-ink/20">
            {[
              ['日期', tripMeta.dates],
              ['时长', tripMeta.duration],
              ['同行', `${tripMeta.people} 人${tripMeta.age ? ` · ${tripMeta.age} 岁` : ''}`],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-ink/10 py-2.5 text-sm">
                <dt className="text-slate">{label}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="grid grid-cols-3 border-y border-ink/20">
        {metrics.map((item, index) => (
          <div key={item.label} className={`px-2 py-4 text-center sm:px-5 sm:text-left ${index < 2 ? 'border-r border-ink/15' : ''}`}>
            <p className="text-xs text-slate">{item.label}</p>
            <p className="mt-1 font-display text-[24px] leading-none text-ink sm:text-[30px]">
              {item.value}
              {item.unit && <span className="ml-1 font-sans text-xs font-medium text-slate">{item.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-px bg-ink/15 md:grid-cols-3">
        <QuickAction icon={Pencil} label="编辑基础资料（城市/航班/酒店/成员）" onClick={() => onNavigate('editTrip')} />
        <QuickAction icon={CalendarDays} label="今日行程（当天执行视图）" onClick={() => onNavigate('today')} />
        <QuickAction icon={ShoppingBag} label="代购订单（DAISY / 梧桐）" onClick={() => onNavigate('shopping')} />
      </section>

      <div className="mt-4 flex items-start justify-between gap-5 border-b border-ink/15 pb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${syncMeta[sync.status]?.cls || 'text-slate'}`}>
          <SyncIcon size={12} />
          {syncMeta[sync.status]?.label || '待同步'}
        </span>
        {sync.error && <span className="text-right text-xs leading-relaxed text-coral">{sync.error}</span>}
      </div>

      <section className="mt-14">
        <SectionHeading
          index="01 / Flight log"
          title="航班"
          sub={`${tripMeta.cityCn || tripMeta.city}旅行航班与关键抵达时间`}
        />
        <div className="mt-5 grid border-y border-ink/20 md:grid-cols-2 md:divide-x md:divide-ink/15">
          <FlightBlock label="去程 / Outbound" items={flights.outbound} direction="outbound" />
          <FlightBlock label="返程 / Return" items={flights.return} direction="return" />
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          index="02 / Stay"
          title="住宿"
          sub="每晚都有明确落脚点，不把酒店当作信息卡片堆叠。"
        />
        <div className="mt-5 border-y border-ink/20">
          {hotels.map((hotel, index) => (
            <article key={`${hotel.locationId || hotel.name || 'hotel'}-${index}`} className="grid gap-4 py-5 md:grid-cols-[110px_minmax(0,1.25fr)_minmax(220px,0.75fr)] md:gap-6">
              <div>
                <p className="editorial-label text-gold">{hotel.night || '住宿'}</p>
                {hotel.area && <p className="mt-2 text-xs text-slate">{hotel.area}</p>}
              </div>
              <div>
                <h3 className="font-display text-[22px] font-semibold leading-tight text-ink">{hotel.name}</h3>
                {hotel.en && <p className="mt-1 text-sm text-slate">{hotel.en}</p>}
                {(hotel.features || []).length > 0 && (
                  <p className="mt-3 text-xs leading-relaxed text-slate">{hotel.features.join(' · ')}</p>
                )}
              </div>
              <div className="md:border-l md:border-ink/15 md:pl-6">
                <p className="flex items-start gap-1.5 text-sm leading-relaxed text-slate">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-gold" />
                  {hotel.address}
                </p>
                {hotel.price && <p className="mt-2 text-xs font-semibold text-sage">{hotel.price}</p>}
              </div>
            </article>
          ))}
          {hotels.length === 0 && <p className="py-8 text-center text-xs text-slate">酒店信息待填写</p>}
        </div>
      </section>

      {tripMeta.concert?.name && (
        <section className="mt-14">
          <SectionHeading
            index="03 / Key date"
            title="演唱会"
            sub={`${tripMeta.cityCn || tripMeta.city}行程的核心时间锚点`}
          />
          <div className="mt-5 grid bg-ink text-paper md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
            <div className="border-b border-paper/15 p-6 md:border-b-0 md:border-r md:p-8">
              <p className="editorial-label text-gold">{tripMeta.concert.date || '日期待确认'}</p>
              <p className="mt-5 font-display text-[40px] font-semibold leading-none md:text-[48px]">LIVE</p>
            </div>
            <div className="p-6 md:p-8">
              <Ticket size={18} className="text-gold" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-[26px] font-semibold leading-tight md:text-[32px]">{tripMeta.concert.name}</h3>
              <p className="mt-3 text-sm text-paper/70">{tripMeta.concert.venue}</p>
              {(tripMeta.concert.entryTime || tripMeta.concert.endTime) && (
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-paper/15 pt-4 text-sm">
                  <span>入场 {tripMeta.concert.entryTime || '待确认'}</span>
                  <span>结束 {tripMeta.concert.endTime || '待确认'}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-14">
        <SectionHeading
          index="04 / Itinerary"
          title={`${days.length} 日行程速览`}
          sub={days.some((day) => day.entries.length) ? '以日期为索引，进入当天完整时间线。' : '基础资料已建立，行程地点待规划。'}
          action={
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="flex items-center gap-1 border-b border-ink/30 pb-0.5 text-xs font-semibold text-ink"
            >
              全部行程
              <ChevronRight size={12} />
            </button>
          }
        />
        <div className="mt-5 grid grid-cols-2 gap-px bg-ink/15 md:grid-cols-4">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => onNavigate('timeline')}
              className="group flex min-h-[178px] flex-col justify-between bg-paper p-4 text-left active:bg-cream/70 md:min-h-[210px] md:p-5"
            >
              <div className="flex items-start justify-between">
                <span className="editorial-label text-gold">{day.label}</span>
                <ArrowRight size={14} className="text-slate transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <p className="font-display text-[46px] font-semibold leading-none text-ink md:text-[54px]">{day.id}</p>
                <p className="mt-4 text-xs font-semibold text-slate">{day.date} · {day.weekday}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-ink">{day.theme}</p>
                <p className="mt-2 text-xs text-slate">{day.entries.length} 个时间节点</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
        <div className="border-y border-ink/20 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="editorial-label text-gold">Before departure</p>
              <h3 className="mt-3 font-display text-[28px] leading-tight text-ink">
                {reminders.length ? reminders.slice(0, 3).map((group) => group.title).join(' · ') : '旅行提醒待建立'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                {reminders.length
                  ? '证件、交通与现场事项集中检查，出发前逐项确认。'
                  : '可以在提醒页新增机场、演唱会和行李清单。'}
              </p>
            </div>
            <BellRing size={18} className="shrink-0 text-gold" strokeWidth={1.5} />
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="mt-6 flex items-center gap-1.5 border-b border-ink/30 pb-1 text-xs font-semibold text-ink"
          >
            打开提醒清单
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="border-y border-ink/20 py-5">
          <p className="editorial-label text-gold">Archive & sync</p>
          <h3 className="mt-3 font-display text-[28px] leading-tight text-ink">数据备份与同步</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            行程、提醒、预算可以打包成数据文件。在家自动同步，出门导出导入。
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 border border-ink/25 px-3 py-2 text-xs font-semibold text-ink active:bg-cream"
            >
              <Download size={12} />
              导出数据
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 border border-ink/25 px-3 py-2 text-xs font-semibold text-ink active:bg-cream"
            >
              <Upload size={12} />
              导入数据
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink/20 pt-5">
        <div>
          <p className="text-xs text-slate">剩余预算</p>
          <p className="mt-1 font-display text-[28px] leading-none text-ink">
            ≈ {remaining} <span className="font-sans text-xs font-medium text-slate">RMB / 人</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('budget')}
          className="flex items-center gap-1.5 border-b border-ink/30 pb-1 text-xs font-semibold text-ink"
        >
          <Wallet size={13} />
          看预算分配
          <ChevronRight size={12} />
        </button>
      </section>
    </div>
  )
}
