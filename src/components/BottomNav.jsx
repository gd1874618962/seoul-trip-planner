import { tabs } from '../App'

export default function BottomNav({ current, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-line/80 bg-white/90 px-1 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur-md">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = current === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className="group flex min-w-0 flex-col items-center gap-1 rounded-md py-1"
              aria-label={tab.label}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-full transition ${
                  active ? 'bg-mist text-blue' : 'text-slate/70 group-active:bg-cream'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span className={`max-w-full truncate text-[10px] leading-none ${active ? 'font-bold text-blue' : 'font-medium text-slate/75'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
