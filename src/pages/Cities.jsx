import { ArrowUpRight, Building2, CalendarDays, MapPin, Plus, Sparkles } from 'lucide-react'
import { cityTrips } from '../data/cityTrips'
import { getTripMetaForTrip } from '../data/store'

function CityCover({ trip, compact = false }) {
  if (trip.coverImage) {
    return (
      <img
        src={trip.coverImage}
        alt={`${trip.cityCn}城市风景`}
        className={`h-full w-full object-cover ${compact ? '' : 'transition duration-500 group-active:scale-[1.02]'}`}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full items-end overflow-hidden bg-[#DDE8E4] p-5">
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full border-[18px] border-white/35" />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1.5 px-5 opacity-35">
        {[42, 68, 50, 82, 61, 94, 56].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-7 rounded-t-sm bg-navy"
            style={{ height }}
          />
        ))}
      </div>
      <Building2 className="absolute right-5 top-5 text-navy/40" size={30} strokeWidth={1.4} />
      <p className="relative z-10 font-display text-3xl font-black leading-none text-navy/80">KUALA<br />LUMPUR</p>
    </div>
  )
}

export default function Cities({ onSelectTrip }) {
  const trips = cityTrips.map((city) => {
    const meta = getTripMetaForTrip(city.tripId)
    return {
      ...city,
      city: meta.city || city.city,
      cityCn: meta.cityCn || city.cityCn,
      country: meta.countryCn || city.country,
      dates: meta.dates || city.dates,
      status: meta.status || city.status,
      theme: meta.theme || city.theme,
      coverImage: meta.coverImage || city.cover,
    }
  })

  return (
    <div className="min-h-screen bg-[#FCFBF8]">
      <header className="px-5 pb-6 pt-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-gold">Travel Archive</p>
            <h1 className="mt-2 font-display text-[36px] font-black leading-none text-ink">我的旅行</h1>
            <p className="mt-3 max-w-[260px] text-[13px] font-medium leading-relaxed text-slate">
              收藏每一座去过的城市，也为下一次出发留好位置。
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-blue shadow-card">
            <Sparkles size={18} />
          </span>
        </div>
      </header>

      <main className="space-y-4 px-4 pb-10">
        {trips.map((trip, index) => (
          <button
            key={trip.tripId}
            type="button"
            onClick={() => onSelectTrip(trip.tripId)}
            className="group block w-full overflow-hidden rounded-lg border border-line bg-white text-left shadow-card active:translate-y-px"
          >
            <div className="relative h-52 overflow-hidden bg-mist">
              <CityCover trip={trip} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102933]/80 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/85 px-2.5 py-1 text-[10px] font-black text-ink backdrop-blur-sm">
                {trip.status}
              </span>
              <span className="absolute right-4 top-4 font-display text-3xl font-black text-white/75">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                    {trip.country}
                  </p>
                  <h2 className="mt-1 truncate font-display text-2xl font-black">{trip.cityCn}</h2>
                  <p className="truncate text-[12px] font-bold text-white/80">{trip.city}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink">
                  <ArrowUpRight size={17} />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[12px] font-black text-ink">
                  <CalendarDays size={13} className="text-blue" />
                  {trip.dates}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] font-medium text-slate">
                  <MapPin size={12} className="shrink-0 text-gold" />
                  {trip.theme}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-blue">
                打开攻略
              </span>
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => window.alert('新增旅行城市入口已预留，下一阶段可继续接入新城市。')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue/35 bg-mist/45 py-5 text-sm font-bold text-blue active:bg-mist"
        >
          <Plus size={17} />
          新增旅行城市
        </button>
      </main>
    </div>
  )
}
