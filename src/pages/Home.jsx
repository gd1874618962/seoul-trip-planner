import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Compass,
  Download,
  MapPin,
  Pencil,
  Plane,
  RefreshCw,
  Share2,
  ShoppingBag,
  Ticket,
  Upload,
  UtensilsCrossed,
  Wallet,
  WifiOff,
} from 'lucide-react'
import {
  exportAllState,
  createShareSnapshot,
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
import { buildShareUrl, encodeShareSnapshot } from '../data/share'
import ShareSheet from '../components/ShareSheet'

function SectionHeading({ index, title, sub, action }) {
  return (
    <div className="journal-section grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-start md:gap-6">
      <p className="journal-label text-accent">{index}</p>
      <div>
        <h2 className="type-h1 text-ink">{title}</h2>
        {sub && <p className="type-small mt-2 max-w-xl text-muted">{sub}</p>}
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
      className="group flex items-center justify-between gap-4 border-b border-line px-0 py-4 text-left type-small font-semibold text-ink md:border-b-0 md:border-r md:px-5"
    >
      <span className="flex items-center gap-2">
        <Icon size={15} strokeWidth={1.5} className="text-accent" />
        <span>{label}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function FlightBlock({ label, items, direction }) {
  return (
    <article className="py-6 lg:px-6">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="journal-label text-accent">{label}</p>
        <Plane size={16} strokeWidth={1.5} className={direction === 'return' ? '-rotate-45 text-muted' : 'rotate-45 text-muted'} />
      </div>
      <div className="mt-4 space-y-5">
        {items.map((f, index) => (
          <div key={`${f.flight || label}-${index}`}>
            <p className="type-caption font-medium text-muted">{f.date}</p>
            <p className="type-h2 mt-1 text-ink">{f.flight || '待填写'}</p>
            <p className="type-small mt-1 text-muted">{f.route || '航班信息待补充'}</p>
            {f.note && <p className="type-caption mt-1 text-muted">{f.note}</p>}
          </div>
        ))}
        {items.length === 0 && <p className="type-small text-muted">航班待填写</p>}
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
    <div className="flex h-full min-h-[360px] flex-col justify-between bg-surface p-6 text-ink lg:min-h-[520px]">
      <p className="journal-label text-accent">{tripMeta.city} / Travel notes</p>
      <div>
        <p className="type-display-xl max-w-[8ch] text-ink">{tripMeta.cityCn || tripMeta.city}</p>
        <p className="type-small mt-4 max-w-xs text-muted">{tripMeta.dates} · {tripMeta.theme}</p>
      </div>
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const fileRef = useRef(null)
  const [sync, setSync] = useState(() => getSyncStatus())
  const [shareUrl, setShareUrl] = useState('')
  const [sharing, setSharing] = useState(false)
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

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const token = await encodeShareSnapshot(createShareSnapshot())
      setShareUrl(buildShareUrl(token))
    } catch {
      window.alert('分享链接生成失败，请稍后重试。')
    } finally {
      setSharing(false)
    }
  }

  useEffect(() => onSyncStatus((next) => setSync(next)), [])

  const syncMeta = {
    idle: { icon: Cloud, label: '待同步', cls: 'text-muted' },
    syncing: { icon: RefreshCw, label: '正在同步', cls: 'text-accent' },
    success: { icon: CheckCircle2, label: '已同步', cls: 'text-muted' },
    error: { icon: AlertTriangle, label: '同步失败', cls: 'text-clay' },
    offline: { icon: WifiOff, label: '离线模式', cls: 'text-muted' },
  }
  const SyncIcon = syncMeta[sync.status]?.icon || Cloud
  const metrics = [
    { label: '总预算', value: budgetState.perPerson ? String(budgetState.perPerson) : '待设置', unit: budgetState.perPerson ? 'RMB / 人' : '' },
    { label: '已消费', value: String(spentTotal), unit: 'RMB' },
    { label: '剩余', value: String(remaining), unit: 'RMB' },
  ]
  const isKualaLumpur = tripMeta.tripId === 'kuala-lumpur-2027-01'
  const guideLinks = [
    { label: '每日行程', note: 'DAY 1—DAY 4', icon: CalendarDays, page: 'timeline' },
    { label: '美食与咖啡', note: '正餐 · 咖啡 · 小吃', icon: UtensilsCrossed, page: 'food' },
    { label: '地点图谱', note: '地图 · 打卡 · 待确认', icon: Compass, page: 'map' },
    { label: '出行提醒', note: '机场 · 演唱会 · 返程', icon: BellRing, page: 'reminders' },
  ]

  return (
    <div className="journal-shell">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.58fr)] xl:gap-8">
        <figure>
          <div className="journal-media">
          <div className="h-[330px] sm:h-[420px] lg:h-[520px] xl:h-[560px]">
            <JourneyImage tripMeta={tripMeta} />
          </div>
          </div>
          <figcaption className="flex items-center justify-between gap-4 border-b border-line py-3 type-caption text-muted">
            <span className="journal-label">{tripMeta.countryCn || tripMeta.country}</span>
            <span>{tripMeta.dates}</span>
          </figcaption>
        </figure>

        <aside className="flex min-h-[410px] flex-col border-y border-line py-5 xl:min-h-[560px]">
          <div className="flex items-center justify-between gap-4">
            <p className="journal-label text-accent">Journey dossier</p>
            <span className="type-caption font-semibold text-muted">{tripMeta.status || '旅行档案'}</span>
          </div>
          <div className="my-auto py-10">
            <h1 className="type-display-xl max-w-[9ch] text-ink">
              {tripMeta.heroTitle || tripMeta.city}
            </h1>
            <p className="journal-label mt-4">
              {tripMeta.heroSubtitle || tripMeta.title}
            </p>
            <p className="type-small mt-5 max-w-sm text-muted">{tripMeta.subtitle || tripMeta.title}</p>
          </div>
          <dl className="border-t border-line">
            {[
              ['日期', tripMeta.dates],
              ['时长', tripMeta.duration],
              ['同行', `${tripMeta.people} 人${tripMeta.age ? ` · ${tripMeta.age} 岁` : ''}`],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-line py-3 type-small">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="grid grid-cols-3 border-y border-line">
        {metrics.map((item, index) => (
          <div key={item.label} className={`journal-stat px-3 text-center sm:px-5 sm:text-left ${index < 2 ? 'border-r border-line' : ''}`}>
            <p className="type-caption text-muted">{item.label}</p>
            <p className="type-h2 text-ink">
              {item.value}
              {item.unit && <span className="ml-1 type-caption font-medium text-muted">{item.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      <section className="grid border-b border-line md:grid-cols-4">
        <QuickAction icon={Pencil} label="编辑旅行资料" onClick={() => onNavigate('editTrip')} />
        <QuickAction icon={CalendarDays} label="查看今日行程" onClick={() => onNavigate('today')} />
        <QuickAction icon={ShoppingBag} label="打开代购订单" onClick={() => onNavigate('shopping')} />
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="group flex items-center justify-between gap-4 border-b border-line px-0 py-4 text-left type-small font-semibold text-ink disabled:text-muted md:border-b-0 md:border-r md:px-5"
        >
          <span className="flex items-center gap-2">
            <Share2 size={15} strokeWidth={1.5} className="text-accent" />
            <span>{sharing ? '正在生成…' : '分享这份旅行'}</span>
          </span>
          <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      <div className="mt-4 flex items-start justify-between gap-5 border-b border-line pb-3">
        <span className={`inline-flex items-center gap-1.5 type-caption font-semibold ${syncMeta[sync.status]?.cls || 'text-muted'}`}>
          <SyncIcon size={12} />
          {syncMeta[sync.status]?.label || '待同步'}
        </span>
        {sync.error && <span className="text-right type-caption text-clay">{sync.error}</span>}
      </div>

      {isKualaLumpur && (
        <section className="mt-12 border-y border-ink/15 py-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12">
            <div>
              <p className="journal-label text-accent">Guide index / Complete edition</p>
              <h2 className="type-h1 mt-3 max-w-md text-ink">四天三晚，完整执行版</h2>
              <p className="type-small mt-3 max-w-lg text-muted">{tripMeta.notes}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4">
                {(tripMeta.quickFacts || []).map((fact) => (
                  <p key={fact.label} className="type-caption text-muted">
                    <span className="font-semibold text-ink">{fact.label}</span>
                    <span className="mx-1.5 text-line">/</span>
                    {fact.value}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-px bg-line">
                {guideLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <button
                      key={link.page}
                      type="button"
                      onClick={() => onNavigate(link.page)}
                      className="group flex min-h-[92px] items-start justify-between gap-3 bg-paper p-4 text-left transition-colors hover:bg-surface"
                    >
                      <span>
                        <span className="journal-label text-accent">{link.note}</span>
                        <span className="mt-2 block type-h3 text-ink">{link.label}</span>
                      </span>
                      <Icon size={16} className="shrink-0 text-accent" strokeWidth={1.5} />
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="journal-label text-accent">Must visit checklist</p>
                  <Compass size={14} className="text-accent" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                  {(tripMeta.mustVisitChecklist || []).map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-accent/50 text-accent">
                        <CheckCircle2 size={10} />
                      </span>
                      <span className="type-caption text-ink">
                        {item.name}
                        <span className="block text-muted">{item.note}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-16">
        <SectionHeading
          index="01 / Flight log"
          title="航班"
          sub={`${tripMeta.cityCn || tripMeta.city}旅行航班与关键抵达时间`}
        />
        <div className="mt-5 grid border-y border-line md:grid-cols-2 md:divide-x md:divide-line">
          <FlightBlock label="去程 / Outbound" items={flights.outbound} direction="outbound" />
          <FlightBlock label="返程 / Return" items={flights.return} direction="return" />
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading
          index="02 / Stay"
          title="住宿"
          sub="每晚都有明确落脚点，不把酒店当作信息卡片堆叠。"
        />
        <div className="mt-5 border-y border-line">
          {hotels.map((hotel, index) => (
            <article key={`${hotel.locationId || hotel.name || 'hotel'}-${index}`} className="grid gap-4 border-b border-line py-6 last:border-b-0 md:grid-cols-[110px_minmax(0,1.25fr)_minmax(220px,0.75fr)] md:gap-6">
              <div>
                <p className="journal-label text-accent">{hotel.night || '住宿'}</p>
                {hotel.area && <p className="type-caption mt-2 text-muted">{hotel.area}</p>}
              </div>
              <div>
                <h3 className="type-h2 text-ink">{hotel.name}</h3>
                {hotel.en && <p className="type-small mt-1 text-muted">{hotel.en}</p>}
                {(hotel.features || []).length > 0 && (
                  <p className="type-caption mt-3 text-muted">{hotel.features.join(' · ')}</p>
                )}
                {hotel.checkOutTime && (
                  <p className="type-caption mt-2 font-semibold text-muted">退房 {hotel.checkOutTime}</p>
                )}
                {hotel.note && (
                  <p className="type-small mt-3 border-t border-line pt-3 text-muted">{hotel.note}</p>
                )}
              </div>
              <div className="md:border-l md:border-line md:pl-6">
                <p className="flex items-start gap-1.5 type-small text-muted">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-accent" />
                  {hotel.address}
                </p>
                {hotel.price && <p className="type-caption mt-2 font-semibold text-muted">{hotel.price}</p>}
              </div>
            </article>
          ))}
          {hotels.length === 0 && <p className="journal-empty type-small">酒店信息待填写</p>}
        </div>
      </section>

      {tripMeta.concert?.name && (
        <section className="mt-16">
          <SectionHeading
            index="03 / Key date"
            title="演唱会"
            sub={`${tripMeta.cityCn || tripMeta.city}行程的核心时间锚点`}
          />
          <div className="mt-5 grid bg-ink text-paper md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
            <div className="border-b border-paper/15 p-6 md:border-b-0 md:border-r md:p-8">
              <p className="journal-label text-accent">{tripMeta.concert.date || '日期待确认'}</p>
              <p className="type-display-l mt-5 text-paper">LIVE</p>
            </div>
            <div className="p-6 md:p-8">
              <Ticket size={18} className="text-accent" strokeWidth={1.5} />
              <h3 className="type-h1 mt-5 text-paper">{tripMeta.concert.name}</h3>
              <p className="type-small mt-3 text-paper/70">{tripMeta.concert.venue}</p>
              {(tripMeta.concert.entryTime || tripMeta.concert.endTime) && (
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-paper/15 pt-4 type-small">
                  <span>{tripMeta.concert.entryNote || `入场 ${tripMeta.concert.entryTime || '待确认'}`}</span>
                  <span>{tripMeta.concert.endNote || `结束 ${tripMeta.concert.endTime || '待确认'}`}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-16">
        <SectionHeading
          index="04 / Itinerary"
          title={`${days.length} 日行程速览`}
          sub={days.some((day) => day.entries.length) ? '以日期为索引，进入当天完整时间线。' : '基础资料已建立，行程地点待规划。'}
          action={
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="journal-button journal-button--quiet"
            >
              全部行程
              <ChevronRight size={12} />
            </button>
          }
        />
        <div className="mt-5 grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => onNavigate('timeline')}
              className="journal-day-card group flex flex-col justify-between bg-paper p-4 text-left md:p-5"
            >
              <div className="flex items-start justify-between">
                <span className="journal-label text-accent">{day.label}</span>
                <ArrowRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <p className="type-display-l text-ink">{day.id}</p>
                <p className="type-caption mt-4 font-semibold text-muted">{day.date} · {day.weekday}</p>
                <p className="type-small mt-1 line-clamp-2 font-semibold text-ink">{day.theme}</p>
                <p className="type-caption mt-2 text-muted">{day.entries.length} 个时间节点</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="border-y border-line py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="journal-label text-accent">Before departure</p>
              <h3 className="type-h2 mt-3 text-ink">
                {reminders.length ? reminders.slice(0, 3).map((group) => group.title).join(' · ') : '旅行提醒待建立'}
              </h3>
              <p className="type-small mt-2 text-muted">
                {reminders.length
                  ? '证件、交通与现场事项集中检查，出发前逐项确认。'
                  : '可以在提醒页新增机场、演唱会和行李清单。'}
              </p>
            </div>
            <BellRing size={18} className="shrink-0 text-accent" strokeWidth={1.5} />
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="journal-button journal-button--quiet mt-6"
          >
            打开提醒清单
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="border-y border-line py-6">
          <p className="journal-label text-accent">Archive & sync</p>
          <h3 className="type-h2 mt-3 text-ink">数据备份与同步</h3>
          <p className="type-small mt-2 text-muted">
            行程、提醒、预算可以打包成数据文件。在家自动同步，出门导出导入。
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="journal-button journal-button--secondary"
            >
              <Download size={12} />
              导出数据
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="journal-button journal-button--secondary"
            >
              <Upload size={12} />
              导入数据
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <div>
          <p className="type-caption text-muted">剩余预算</p>
          <p className="type-h2 mt-1 text-ink">
            ≈ {remaining} <span className="type-caption font-medium text-muted">RMB / 人</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('budget')}
          className="journal-button journal-button--quiet"
        >
          <Wallet size={13} />
          看预算分配
          <ChevronRight size={12} />
        </button>
      </section>

      {shareUrl && (
        <ShareSheet
          title={tripMeta.title}
          url={shareUrl}
          onClose={() => setShareUrl('')}
        />
      )}
    </div>
  )
}
