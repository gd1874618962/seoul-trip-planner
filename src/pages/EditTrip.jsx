import { useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Check,
  FileText,
  Music4,
  Plane,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from 'lucide-react'
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testCloudConnection,
} from '../data/supabase'
import {
  getFlights,
  getHotels,
  getTripId,
  getTravelers,
  getTripMeta,
  initCloudSync,
  pushAllToCloud,
  saveTripEdits,
} from '../data/store'
import PageHeader from '../components/PageHeader'

const inputCls = 'journal-input'

function Field({ label, value, onChange, type = 'text', placeholder, readOnly = false, textarea = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block type-caption font-semibold text-muted">{label}</span>
      {textarea ? (
        <textarea
          rows={3}
          className={inputCls}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className={`${inputCls} ${readOnly ? 'bg-surface text-muted' : ''}`}
          value={value ?? ''}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

export default function EditTrip({ onNavigate }) {
  const [meta, setMeta] = useState(() => getTripMeta())
  const [flightData, setFlightData] = useState(() => getFlights())
  const [hotelData, setHotelData] = useState(() => getHotels())
  const [travelerData, setTravelerData] = useState(() => getTravelers())
  const [cloudConfig, setCloudConfig] = useState(() => getSupabaseConfig())
  const [cloudStatus, setCloudStatus] = useState('未连接')
  const [naverId, setNaverId] = useState(() => {
    try {
      return localStorage.getItem('seoul-naver-client-id') || ''
    } catch {
      return ''
    }
  })

  const patchMeta = (field, value) => setMeta({ ...meta, [field]: value })
  const patchConcert = (field, value) =>
    setMeta({ ...meta, concert: { ...(meta.concert || {}), [field]: value } })

  const patchFlight = (side, index, field, value) => {
    const list = [...flightData[side]]
    list[index] = { ...list[index], [field]: value }
    setFlightData({ ...flightData, [side]: list })
  }

  const addFlight = (side) =>
    setFlightData({
      ...flightData,
      [side]: [...flightData[side], { date: '', flight: '', route: '', note: '' }],
    })

  const removeFlight = (side, index) =>
    setFlightData({ ...flightData, [side]: flightData[side].filter((_, i) => i !== index) })

  const patchHotel = (index, field, value) => {
    const list = [...hotelData]
    list[index] = { ...list[index], [field]: value }
    setHotelData(list)
  }

  const addHotel = () =>
    setHotelData([
      ...hotelData,
      {
        night: '',
        name: '',
        en: '',
        area: '',
        address: '',
        price: '',
        perPerson: '',
        features: [],
        locationId: `custom-hotel-${Date.now().toString(36)}`,
        checkInDate: meta.startDate || '',
        checkOutDate: meta.endDate || '',
        checkInTime: '',
        checkOutTime: '',
        note: '',
      },
    ])

  const removeHotel = (index) => {
    if (!window.confirm('确定删除这家酒店吗？')) return
    setHotelData(hotelData.filter((_, i) => i !== index))
  }

  const patchTraveler = (index, field, value) => {
    const list = [...travelerData]
    list[index] = { ...list[index], [field]: value }
    setTravelerData(list)
  }

  const save = () => {
    saveTripEdits({
      meta: { ...meta, tripId: getTripId() },
      flights: flightData,
      hotels: hotelData,
      travelers: travelerData,
    })
    window.alert('已保存，所有页面会同步更新')
    onNavigate('home')
  }

  const reset = () => {
    if (window.confirm('确定恢复默认基础资料吗？')) {
      saveTripEdits({})
      onNavigate('home')
    }
  }

  const connectCloud = async () => {
    saveSupabaseConfig(cloudConfig)
    setCloudStatus('连接中...')
    const result = await testCloudConnection()
    if (result.ok) {
      const synced = await initCloudSync()
      setCloudStatus(synced ? '已连接并同步' : '已连接')
      if (!synced) pushAllToCloud().catch(() => {})
    } else {
      setCloudStatus(`连接失败：${result.reason}`)
    }
  }

  const patchNaverId = (value) => {
    setNaverId(value)
    try {
      localStorage.setItem('seoul-naver-client-id', value)
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Trip Editor" title="基础信息编辑中心" subtitle="改一次，首页/地图/行程/提醒同步更新" />

      <div className="mx-5 mt-5 flex items-center justify-between gap-2 lg:mx-10">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="journal-button journal-button--secondary"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
        <span className="type-caption text-muted">保存后立即生效</span>
      </div>

      <section className="mx-5 mt-6 lg:mx-10">
        <div className="border-t border-line pt-6">
          <h2 className="type-h1 text-ink">基本信息</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="旅行ID（固定）" value={meta.tripId || getTripId()} readOnly onChange={() => {}} />
            <Field label="旅行名称" value={meta.title} placeholder="Seoul Trip Planner 2026" onChange={(v) => patchMeta('title', v)} />
            <Field label="城市（中文）" value={meta.cityCn} placeholder="吉隆坡" onChange={(v) => patchMeta('cityCn', v)} />
            <Field label="城市（英文）" value={meta.city} placeholder="Kuala Lumpur" onChange={(v) => patchMeta('city', v)} />
            <Field label="国家（英文）" value={meta.country} placeholder="Malaysia" onChange={(v) => patchMeta('country', v)} />
            <Field label="国家（中文）" value={meta.countryCn} placeholder="马来西亚" onChange={(v) => patchMeta('countryCn', v)} />
            <Field label="日期" value={meta.dates} placeholder="2026.08.21 - 08.24" onChange={(v) => patchMeta('dates', v)} />
            <Field label="开始日期" type="date" value={meta.startDate} onChange={(v) => patchMeta('startDate', v)} />
            <Field label="结束日期" type="date" value={meta.endDate} onChange={(v) => patchMeta('endDate', v)} />
            <Field label="天数" value={meta.duration} placeholder="4天3晚" onChange={(v) => patchMeta('duration', v)} />
            <Field label="总预算（RMB/人）" type="number" value={meta.budgetPerPerson} onChange={(v) => patchMeta('budgetPerPerson', Number(v) || 0)} />
            <Field label="人数" type="number" value={meta.people} onChange={(v) => patchMeta('people', Number(v) || 0)} />
            <Field label="年龄" type="number" value={meta.age} onChange={(v) => patchMeta('age', Number(v) || 0)} />
          </div>
          <Field label="主题" value={meta.theme} onChange={(v) => patchMeta('theme', v)} />
          <div className="mt-2">
            <Field
              label="封面图片链接"
              value={meta.coverImage || ''}
              placeholder="可填写图片网址，或在创建计划时从相册选择"
              onChange={(v) => patchMeta('coverImage', v)}
            />
          </div>
          <div className="mt-2">
            <Field label="旅行备注" value={meta.notes} placeholder="记录待确认事项" textarea onChange={(v) => patchMeta('notes', v)} />
          </div>
        </div>
      </section>

      <section className="mx-5 mt-8 lg:mx-10">
        <div className="border-t border-line pt-6">
          <h2 className="type-h1 flex items-center gap-1.5 text-ink">
            <Music4 size={15} className="text-accent" strokeWidth={1.5} />
            演唱会
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="演唱会名称" value={meta.concert?.name} placeholder="演唱会名称" onChange={(v) => patchConcert('name', v)} />
            <Field label="日期" type="date" value={meta.concert?.date} onChange={(v) => patchConcert('date', v)} />
            <Field label="入场时间" type="time" value={meta.concert?.entryTime} onChange={(v) => patchConcert('entryTime', v)} />
            <Field label="结束时间" type="time" value={meta.concert?.endTime} onChange={(v) => patchConcert('endTime', v)} />
          </div>
          <div className="mt-2">
            <Field label="场馆名称" value={meta.concert?.venue} placeholder="场馆名称" onChange={(v) => patchConcert('venue', v)} />
          </div>
        </div>
      </section>

      <section className="mx-5 mt-8 lg:mx-10">
        <div className="border-t border-line pt-6">
          <div className="flex items-center justify-between">
            <h2 className="type-h1 flex items-center gap-1.5 text-ink">
              <Plane size={15} className="text-accent" strokeWidth={1.5} />
              航班
            </h2>
            <span className="type-caption text-muted">可增删航班段</span>
          </div>
          {['outbound', 'return'].map((side) => (
            <div key={side} className="mt-3">
              <p className="journal-label">{side === 'outbound' ? '去程' : '回程'}</p>
              <div className="mt-3 space-y-3">
                {flightData[side].map((flight, index) => (
                  <div key={`${side}-${index}`} className="border border-line bg-surface p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="日期" value={flight.date} placeholder="8.20 晚" onChange={(v) => patchFlight(side, index, 'date', v)} />
                      <Field label="航班号" value={flight.flight} placeholder="MU6984" onChange={(v) => patchFlight(side, index, 'flight', v)} />
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <Field label="路线" value={flight.route} placeholder="上海浦东T1 → 转机" onChange={(v) => patchFlight(side, index, 'route', v)} />
                      <button
                        type="button"
                        onClick={() => removeFlight(side, index)}
                        className="mt-4 flex h-8 w-8 items-center justify-center border border-line text-clay"
                        aria-label="删除航班"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <Field label="备注" value={flight.note} placeholder="起飞时间 / 机场" onChange={(v) => patchFlight(side, index, 'note', v)} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFlight(side)}
                  className="journal-button journal-button--quiet"
                >
                  <Plus size={13} />
                  添加航班段
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-8 lg:mx-10">
        <div className="border-t border-line pt-6">
          <h2 className="type-h1 flex items-center gap-1.5 text-ink">
            <BedDouble size={15} className="text-accent" strokeWidth={1.5} />
            酒店
          </h2>
          <p className="type-caption mt-1 flex items-center gap-1 text-muted">
            <FileText size={11} />
            留空的航班、酒店与时间会原样保留，方便后续补充
          </p>
          <div className="mt-3 space-y-4">
            {hotelData.map((hotel, index) => (
              <div key={hotel.locationId || index} className="border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="type-caption font-semibold text-muted">第 {index + 1} 晚 · {hotel.night || '日期待填写'}</p>
                  <button
                    type="button"
                    onClick={() => removeHotel(index)}
                    className="flex h-8 w-8 items-center justify-center border border-line text-clay"
                    aria-label="删除酒店"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="酒店名称" value={hotel.name} placeholder="酒店名称" onChange={(v) => patchHotel(index, 'name', v)} />
                  <Field label="关联地点" value={hotel.locationId} onChange={(v) => patchHotel(index, 'locationId', v)} />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Field label="地址" value={hotel.address} placeholder="酒店地址" onChange={(v) => patchHotel(index, 'address', v)} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="入住日期" type="date" value={hotel.checkInDate || ''} onChange={(v) => patchHotel(index, 'checkInDate', v)} />
                  <Field label="退房日期" type="date" value={hotel.checkOutDate || ''} onChange={(v) => patchHotel(index, 'checkOutDate', v)} />
                  <Field label="入住时间" value={hotel.checkInTime || ''} placeholder="12:00 后" onChange={(v) => patchHotel(index, 'checkInTime', v)} />
                  <Field label="退房时间" value={hotel.checkOutTime || ''} placeholder="10:00" onChange={(v) => patchHotel(index, 'checkOutTime', v)} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="价格" value={hotel.price} placeholder="360 RMB / 2人" onChange={(v) => patchHotel(index, 'price', v)} />
                  <Field label="区域" value={hotel.area} placeholder="弘大 / 延南洞" onChange={(v) => patchHotel(index, 'area', v)} />
                </div>
                <Field
                  label="功能（逗号分隔）"
                  value={(hotel.features || []).join('，')}
                  onChange={(v) =>
                    patchHotel(
                      index,
                      'features',
                      v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
                    )
                  }
                />
                <Field label="备注" value={hotel.note || ''} placeholder="酒店备注" onChange={(v) => patchHotel(index, 'note', v)} />
              </div>
            ))}
            <button
              type="button"
              onClick={addHotel}
              className="journal-button journal-button--quiet"
            >
              <Plus size={13} />
              添加酒店
            </button>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-8 lg:mx-10">
        <div className="border-t border-line pt-6">
          <h2 className="type-h1 flex items-center gap-1.5 text-ink">
            <Users size={15} className="text-accent" strokeWidth={1.5} />
            旅行成员
          </h2>
          <div className="mt-3 space-y-3">
            {travelerData.map((traveler, index) => (
              <div key={traveler.id} className="border border-line bg-surface p-3">
                <p className="type-caption font-semibold text-muted">成员 {index + 1}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="姓名" value={traveler.name} placeholder="姓名" onChange={(v) => patchTraveler(index, 'name', v)} />
                  <Field label="备注" value={traveler.note || ''} placeholder="27 岁" onChange={(v) => patchTraveler(index, 'note', v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-5 mt-8 lg:mx-10">
        <div className="border-y border-line py-6">
          <h2 className="type-h1 text-ink">云同步（Supabase）</h2>
          <p className="type-small mt-2 text-muted">
            公网部署时建议在构建环境注入 Project URL 和 publishable / anon key；也可以在两台设备上填写同一组配置。
            anon key 是浏览器公开密钥，不是注册密码，数据权限仍需由 Supabase RLS 控制。
          </p>
          <div className="mt-3 space-y-2">
            <Field label="Project URL" value={cloudConfig.url} placeholder="https://xxxx.supabase.co" onChange={(v) => setCloudConfig({ ...cloudConfig, url: v })} />
            <label className="block min-w-0">
              <span className="mb-1 block type-caption font-semibold text-muted">
                Publishable / Anon Key（不是账户密码）
              </span>
              <input
                type="password"
                className={inputCls}
                value={cloudConfig.anonKey}
                placeholder="eyJhbGciOi..."
                onChange={(e) => setCloudConfig({ ...cloudConfig, anonKey: e.target.value })}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block type-caption font-semibold text-muted">Naver Maps Client ID（可选，填了地图切换为 Naver）</span>
              <input
                className={inputCls}
                value={naverId}
                placeholder="从 Naver Cloud 获取"
                onChange={(e) => patchNaverId(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={connectCloud}
              className="journal-button journal-button--primary"
            >
              <Check size={14} />
              保存并立即同步
            </button>
            <span className="type-caption font-semibold text-muted">{cloudStatus}</span>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-8 pb-12 lg:mx-10">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="journal-button journal-button--primary flex-1"
          >
            <Check size={16} />
            保存全部修改
          </button>
          <button
            type="button"
            onClick={reset}
            className="journal-button journal-button--secondary"
          >
            <RotateCcw size={15} />
            恢复默认
          </button>
        </div>
      </section>
    </div>
  )
}
