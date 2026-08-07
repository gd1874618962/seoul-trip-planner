import { useState } from 'react'
import {
  ArrowLeft,
  BedDouble,
  Check,
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
  getTravelers,
  getTripMeta,
  pushAllToCloud,
  saveTripEdits,
} from '../data/store'
import PageHeader from '../components/PageHeader'

const inputCls =
  'w-full rounded-md border border-line bg-white px-2.5 py-2 text-xs font-medium text-ink outline-none focus:border-blue'

const LOCATIONS = Array.from({ length: 16 }, (_, i) => `loc-${i + 1}`)

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-bold text-slate">{label}</span>
      <input
        type={type}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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

  const patchMeta = (field, value) => setMeta({ ...meta, [field]: value })

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

  const patchTraveler = (index, field, value) => {
    const list = [...travelerData]
    list[index] = { ...list[index], [field]: value }
    setTravelerData(list)
  }

  const save = () => {
    saveTripEdits({ meta, flights: flightData, hotels: hotelData, travelers: travelerData })
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
      setCloudStatus('已连接')
      pushAllToCloud().catch(() => {})
    } else {
      setCloudStatus(`连接失败：${result.reason}`)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Trip Editor" title="基础信息编辑中心" subtitle="改一次，首页/地图/行程/提醒同步更新" />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
        <span className="text-[11px] font-medium text-slate">保存后立即生效</span>
      </div>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <h2 className="text-[15px] font-black text-ink">基本信息</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="旅行名称" value={meta.title} placeholder="Seoul Trip Planner 2026" onChange={(v) => patchMeta('title', v)} />
            <Field label="日期" value={meta.dates} placeholder="2026.08.21 - 08.24" onChange={(v) => patchMeta('dates', v)} />
            <Field label="天数" value={meta.duration} placeholder="4天3晚" onChange={(v) => patchMeta('duration', v)} />
            <Field label="总预算（RMB/人）" type="number" value={meta.budgetPerPerson} onChange={(v) => patchMeta('budgetPerPerson', Number(v) || 0)} />
            <Field label="人数" type="number" value={meta.people} onChange={(v) => patchMeta('people', Number(v) || 0)} />
            <Field label="年龄" type="number" value={meta.age} onChange={(v) => patchMeta('age', Number(v) || 0)} />
          </div>
          <Field label="主题" value={meta.theme} onChange={(v) => patchMeta('theme', v)} />
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[15px] font-black text-ink">
              <Plane size={15} className="text-blue" />
              航班
            </h2>
            <span className="text-[11px] font-bold text-slate">可增删航班段</span>
          </div>
          {['outbound', 'return'].map((side) => (
            <div key={side} className="mt-3">
              <p className="text-xs font-bold text-slate">{side === 'outbound' ? '去程' : '回程'}</p>
              <div className="mt-2 space-y-2.5">
                {flightData[side].map((flight, index) => (
                  <div key={`${side}-${index}`} className="rounded-md border border-line bg-cream/50 p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="日期" value={flight.date} placeholder="8.20 晚" onChange={(v) => patchFlight(side, index, 'date', v)} />
                      <Field label="航班号" value={flight.flight} placeholder="MU6984" onChange={(v) => patchFlight(side, index, 'flight', v)} />
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <Field label="路线" value={flight.route} placeholder="上海浦东T1 → 转机" onChange={(v) => patchFlight(side, index, 'route', v)} />
                      <button
                        type="button"
                        onClick={() => removeFlight(side, index)}
                        className="mt-4 flex h-8 w-8 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
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
                  className="inline-flex items-center gap-1 rounded-md bg-mist px-2.5 py-1.5 text-[11px] font-bold text-blue active:opacity-90"
                >
                  <Plus size={13} />
                  添加航班段
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-ink">
            <BedDouble size={15} className="text-gold" />
            酒店
          </h2>
          <div className="mt-3 space-y-4">
            {hotelData.map((hotel, index) => (
              <div key={hotel.locationId || index} className="rounded-md border border-line bg-cream/50 p-2.5">
                <p className="text-[11px] font-bold text-slate">第 {index + 1} 晚 · {hotel.night}</p>
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
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-ink">
            <Users size={15} className="text-sage" />
            旅行成员
          </h2>
          <div className="mt-3 space-y-3">
            {travelerData.map((traveler, index) => (
              <div key={traveler.id} className="rounded-md border border-line bg-cream/50 p-2.5">
                <p className="text-[11px] font-bold text-slate">成员 {index + 1}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="姓名" value={traveler.name} placeholder="姓名" onChange={(v) => patchTraveler(index, 'name', v)} />
                  <Field label="备注" value={traveler.note || ''} placeholder="27 岁" onChange={(v) => patchTraveler(index, 'note', v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-blue/15 bg-gradient-to-br from-mist via-white to-cream p-4 shadow-card">
          <h2 className="text-[15px] font-black text-ink">云同步（Supabase）</h2>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate">
            填写 Supabase 项目地址和 anon key 后，修改会自动上传；其他设备刷新后同步。
          </p>
          <div className="mt-3 space-y-2">
            <Field label="Project URL" value={cloudConfig.url} placeholder="https://xxxx.supabase.co" onChange={(v) => setCloudConfig({ ...cloudConfig, url: v })} />
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-bold text-slate">Anon Key</span>
              <input
                type="password"
                className={inputCls}
                value={cloudConfig.anonKey}
                placeholder="eyJhbGciOi..."
                onChange={(e) => setCloudConfig({ ...cloudConfig, anonKey: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={connectCloud}
              className="inline-flex items-center gap-1 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white active:opacity-90"
            >
              <Check size={14} />
              保存并连接
            </button>
            <span className="text-[11px] font-bold text-slate">{cloudStatus}</span>
          </div>
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink py-3 text-sm font-bold text-white active:opacity-90"
          >
            <Check size={16} />
            保存全部修改
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-4 py-3 text-xs font-bold text-slate active:bg-cream"
          >
            <RotateCcw size={15} />
            恢复默认
          </button>
        </div>
      </section>
    </div>
  )
}
