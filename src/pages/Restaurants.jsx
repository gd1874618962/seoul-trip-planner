import { ExternalLink, MapPin, UtensilsCrossed, Wallet } from 'lucide-react'
import { getRestaurants } from '../data/store'
import PageHeader from '../components/PageHeader'

export default function Restaurants() {
  const restaurants = getRestaurants()
  return (
    <div>
      <PageHeader eyebrow="Food Guide" title="餐厅收藏" subtitle="四家必吃餐厅 · 地址与推荐菜都在这" />

      <section className="mt-4 space-y-4 px-4">
        {restaurants.map((r) => (
          <article key={r.id} className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
            <div className="relative">
              <img src={r.image} alt={r.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-blue shadow-sm backdrop-blur-sm">
                {r.day}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                {r.type}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[17px] font-black leading-tight text-ink">{r.name}</h2>
                  <p className="mt-0.5 text-[11px] font-bold text-slate">{r.ko}</p>
                </div>
                <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-black text-blue">{r.price}</span>
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-slate">
                <MapPin size={12} className="mt-0.5 shrink-0 text-sage" />
                {r.address}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.recommend.map((item) => (
                  <span key={item} className="rounded-md border border-blue/15 bg-mist/70 px-2 py-1 text-[11px] font-bold text-blue">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-cream/70 px-3 py-2 text-[11px] font-medium leading-relaxed text-slate">
                {r.note}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate">
                  <Wallet size={12} className="text-gold" />
                  {r.priceRange}
                </span>
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(`${r.name} ${r.ko}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-2 text-[11px] font-bold text-white active:opacity-90"
                >
                  <ExternalLink size={12} />
                  Naver 导航
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="flex items-center justify-center gap-1.5 px-4 pb-2 pt-4 text-center text-[11px] font-medium text-slate">
        <UtensilsCrossed size={12} />
        按天安排，不绕路，人均都已写入预算
      </p>
    </div>
  )
}
