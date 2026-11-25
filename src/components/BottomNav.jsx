import { tabs } from '../App'
import { ArrowUpRight } from 'lucide-react'

export default function BottomNav({ current, trip, onNavigate, onSwitch }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/15 bg-paper/95 px-1 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 backdrop-blur-md lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:border-r lg:border-t-0 lg:px-5 lg:pb-6 lg:pt-7 lg:backdrop-blur-none">
      <div className="flex h-full flex-col">
        <button type="button" onClick={onSwitch} className="hidden border-b border-ink/15 pb-5 text-left lg:block">
          <p className="editorial-label text-gold">Travel archive</p>
          <p className="mt-3 font-display text-2xl leading-tight text-ink">{trip.cityCn}</p>
          <p className="mt-1 text-[11px] text-slate">{trip.city} · {trip.dates}</p>
        </button>

        <div className="grid lg:mt-8 lg:block lg:space-y-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = current === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`group relative flex min-w-0 flex-col items-center gap-1 py-1 text-[9px] font-medium transition-colors lg:w-full lg:flex-row lg:gap-3 lg:py-2.5 lg:pl-4 lg:text-left lg:text-[12px] lg:font-semibold ${
                  active ? 'text-ink' : 'text-slate/80 hover:text-ink'
                }`}
                aria-label={tab.label}
              >
                <span className={`absolute top-0 h-px w-5 lg:left-0 lg:top-1/2 lg:h-4 lg:w-px lg:-translate-y-1/2 ${active ? 'bg-gold' : 'bg-transparent'}`} />
                <Icon size={17} strokeWidth={active ? 2.2 : 1.7} className="shrink-0" />
                <span className="max-w-full truncate leading-none lg:leading-normal">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSwitch}
          className="mt-auto hidden items-center justify-between border-t border-ink/15 pt-5 text-[11px] font-semibold text-slate hover:text-ink lg:flex"
        >
          切换旅行
          <ArrowUpRight size={14} />
        </button>
      </div>
    </nav>
  )
}
