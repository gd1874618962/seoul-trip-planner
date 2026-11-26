export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="journal-page-header mx-5 mt-8 lg:mx-10 lg:mt-10">
      <p className="journal-label text-accent">{eyebrow}</p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] lg:items-end lg:gap-10">
        <h1 className="type-display-l text-ink">{title}</h1>
        {subtitle && <p className="type-small max-w-xl text-muted lg:text-right">{subtitle}</p>}
      </div>
    </header>
  )
}
