import { ChevronDown, MapPin } from 'lucide-react'

export default function TripSwitcher({ trip, onSwitch }) {
  return (
    <div className="sticky top-0 z-30 border-b border-ink/15 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <MapPin size={15} className="shrink-0 text-gold" strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-ink">
              {trip.cityCn} <span className="font-normal text-slate">/ {trip.city}</span>
            </p>
            <p className="mt-0.5 truncate text-[10px] text-slate">{trip.dates}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSwitch}
          className="inline-flex shrink-0 items-center gap-1 border-b border-ink/30 pb-0.5 text-[10px] font-semibold text-slate active:text-ink"
        >
          切换城市
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  )
}
