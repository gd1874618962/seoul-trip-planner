export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="sticky top-[57px] z-20 border-b border-ink/15 bg-paper/95 px-5 py-5 backdrop-blur-md lg:static lg:px-10 lg:pb-8 lg:pt-10">
      <p className="editorial-label text-gold">{eyebrow}</p>
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(250px,420px)] lg:items-end lg:gap-10">
        <h1 className="font-display text-[32px] leading-[1.02] text-ink lg:text-[48px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-slate lg:mt-0 lg:text-right lg:text-[13px]">{subtitle}</p>}
      </div>
    </header>
  )
}
