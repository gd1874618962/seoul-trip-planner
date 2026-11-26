import { tabs } from '../App'
import { ArrowUpRight } from 'lucide-react'

export default function BottomNav({ current, trip, onNavigate, onSwitch }) {
  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper px-2 pt-2 lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:border-r lg:border-t-0 lg:bg-surface lg:px-6 lg:pb-8 lg:pt-8"
      aria-label="旅行页面导航"
    >
      <div className="flex h-full flex-col">
        <button type="button" onClick={onSwitch} className="hidden border-b border-line pb-6 text-left lg:block">
          <p className="journal-label text-accent">Travel archive</p>
          <p className="type-h2 mt-4 text-ink">{trip.cityCn}</p>
          <p className="type-small mt-1 text-muted">{trip.city} · {trip.dates}</p>
        </button>

        <div className="grid lg:mt-8 lg:block" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = current === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`group relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 py-1 type-caption font-medium transition-colors lg:w-full lg:flex-row lg:gap-3 lg:border-b lg:border-line lg:py-3 lg:text-left lg:text-sm lg:font-semibold ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className={`absolute top-0 h-px w-5 lg:left-0 lg:top-1/2 lg:h-4 lg:w-px lg:-translate-y-1/2 ${active ? 'bg-accent' : 'bg-transparent'}`} />
                <Icon size={16} strokeWidth={active ? 1.9 : 1.5} className="shrink-0" />
                <span className="max-w-full truncate leading-none lg:leading-normal">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSwitch}
          className="mt-auto hidden items-center justify-between border-t border-line pt-5 type-small font-semibold text-muted hover:text-ink lg:flex"
        >
          切换旅行
          <ArrowUpRight size={15} />
        </button>
      </div>
    </nav>
  )
}
