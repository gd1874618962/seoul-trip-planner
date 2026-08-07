export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-[#FCFBF8]/95 px-4 pb-3 pt-4 backdrop-blur-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
      <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-[13px] font-medium text-slate">{subtitle}</p>}
    </header>
  )
}
