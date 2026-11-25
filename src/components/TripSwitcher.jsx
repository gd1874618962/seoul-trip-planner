import { ChevronDown, MapPin } from 'lucide-react'

export default function TripSwitcher({ trip, onSwitch }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 bg-[#FCFBF8] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-blue">
          <MapPin size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-ink">
            {trip.cityCn} <span className="font-medium text-slate">· {trip.city}</span>
          </p>
          <p className="truncate text-[10px] font-medium text-slate">{trip.dates}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSwitch}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate active:bg-cream"
      >
        切换城市
        <ChevronDown size={12} />
      </button>
    </div>
  )
}
