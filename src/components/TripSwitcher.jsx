import { ChevronDown, MapPin } from 'lucide-react'

export default function TripSwitcher({ trip, onSwitch }) {
  return (
    <div className="border-b border-line bg-canvas lg:hidden">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin size={14} className="shrink-0 text-accent" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="truncate type-small font-semibold text-ink">
              {trip.cityCn} <span className="font-normal text-muted">/ {trip.city}</span>
            </p>
            <p className="truncate type-caption text-muted">{trip.dates}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSwitch}
          className="inline-flex shrink-0 items-center gap-1 border-b border-accent pb-0.5 type-caption font-semibold text-ink"
        >
          切换旅行
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  )
}
