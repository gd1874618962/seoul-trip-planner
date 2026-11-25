export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="sticky top-[57px] z-20 border-b border-ink/15 bg-paper/95 px-5 py-5 backdrop-blur-md lg:static lg:px-10 lg:pb-8 lg:pt-10">
      <p className="editorial-label text-slate">{eyebrow}</p>
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(250px,420px)] lg:items-end lg:gap-10">
        <h1 className="font-display text-[34px] font-semibold leading-[1.08] text-ink lg:text-[46px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm leading-6 text-slate lg:mt-0 lg:text-right lg:text-[15px]">{subtitle}</p>}
      </div>
    </header>
  )
}
