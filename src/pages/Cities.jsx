import { ArrowUpRight, CalendarDays, MapPin, Plus } from 'lucide-react'
import { cityTrips } from '../data/cityTrips'
import { getTripMetaForTrip } from '../data/store'

function CityCover({ trip }) {
  if (trip.coverImage) {
    return (
      <img
        src={trip.coverImage}
        alt={`${trip.cityCn}城市风景`}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#B9C7BF] px-6 py-7 text-ink">
      <div className="absolute inset-x-6 top-1/2 border-t border-ink/20" />
      <div className="absolute -right-14 top-10 h-52 w-52 rounded-full border border-ink/20" />
      <div className="absolute -right-2 top-22 h-36 w-36 rounded-full border border-ink/15" />
      <p className="editorial-label absolute left-6 top-6">3.1390 N / 101.6869 E</p>
      <p className="absolute bottom-7 left-6 max-w-[85%] font-display text-[44px] leading-[0.9] text-ink/80 sm:text-[58px]">
        KUALA<br />LUMPUR
      </p>
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
    <div className="min-h-screen bg-paper">
      <div className="mx-auto min-h-screen w-full max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header>
          <div className="flex items-center justify-between border-b border-ink/20 pb-4">
            <p className="editorial-label text-ink">Field notes / Travel archive</p>
            <p className="text-[10px] font-medium text-slate">2026-2027</p>
          </div>
          <div className="grid gap-8 pb-9 pt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:pb-12 lg:pt-16">
            <div>
              <p className="editorial-label text-gold">Personal travel index</p>
              <h1 className="mt-4 max-w-3xl font-display text-[58px] leading-[0.88] text-ink sm:text-[76px] lg:text-[108px]">
                我的旅行
              </h1>
            </div>
            <div className="border-t border-ink/20 pt-4 lg:border-l lg:border-t-0 lg:pl-8">
              <p className="max-w-sm text-[13px] leading-6 text-slate">
                收藏每一座去过的城市，也为下一次出发留好位置。旅行资料、地点与现场记录都从这里开始。
              </p>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                {trips.length} journeys archived
              </p>
            </div>
          </div>
        </header>

        <main className="grid gap-10 pb-12 pt-8 lg:grid-cols-2 lg:gap-8 lg:pt-10">
          {trips.map((trip, index) => (
            <button
              key={trip.tripId}
              type="button"
              onClick={() => onSelectTrip(trip.tripId)}
              className="group block min-w-0 text-left"
            >
              <div className="flex items-center justify-between border-b border-ink/20 pb-3">
                <span className="font-display text-lg text-ink">{String(index + 1).padStart(2, '0')}</span>
                <span className="editorial-label text-slate">{trip.status}</span>
              </div>
              <div className={`mt-4 overflow-hidden bg-sand ${index === 0 ? 'aspect-[4/3] lg:aspect-[5/4]' : 'aspect-[4/3] lg:aspect-[5/4]'}`}>
                <CityCover trip={trip} />
              </div>
              <div className="pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="editorial-label text-gold">{trip.country}</p>
                    <h2 className="mt-2 font-display text-[38px] leading-none text-ink sm:text-[46px]">{trip.cityCn}</h2>
                    <p className="mt-1 text-[12px] text-slate">{trip.city}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/30 text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-t border-ink/15 pt-3 text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    <CalendarDays size={13} className="text-gold" />
                    {trip.dates}
                  </span>
                  <span className="flex min-w-0 items-center justify-end gap-1.5 truncate text-slate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{trip.theme}</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </main>

        <button
          type="button"
          onClick={() => window.alert('新增旅行城市入口已预留，下一阶段可继续接入新城市。')}
          className="flex w-full items-center justify-between border-y border-ink/20 py-5 text-left text-[12px] font-semibold text-slate transition-colors hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} />
            新增旅行城市
          </span>
          <span className="editorial-label">Coming next</span>
        </button>
      </div>
    </div>
  )
}
