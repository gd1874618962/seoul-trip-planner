import { useRef, useState } from 'react'
import {
  Check,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import {
  getRestaurantEdits,
  getRestaurants,
  saveRestaurantEdits,
} from '../data/store'
import PageHeader from '../components/PageHeader'

function PhotoCarousel({ photos }) {
  const ref = useRef(null)
  const [index, setIndex] = useState(0)
  const list = Array.isArray(photos) && photos.length ? photos : []

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    setIndex(Math.min(list.length - 1, Math.round(el.scrollLeft / el.clientWidth)))
  }

  if (!list.length) {
    return <div className="aspect-[4/3] w-full bg-cream" />
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {list.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt="餐厅照片"
            loading="lazy"
            className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/35 px-2 py-1 backdrop-blur-sm">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Restaurants() {
  const [editing, setEditing] = useState(false)
  const restaurants = getRestaurants()
  const edits = getRestaurantEdits()

  const patchPhotos = (id, photos) => {
    saveRestaurantEdits({ ...edits, [id]: { ...(edits[id] || {}), photos } })
  }

  const patchRecommend = (id, recommend) => {
    saveRestaurantEdits({ ...edits, [id]: { ...(edits[id] || {}), recommend } })
  }

  return (
    <div>
      <PageHeader eyebrow="Food Guide" title="餐厅收藏" subtitle="实拍照片 · 菜单 · 地址导航" />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-bold text-white active:opacity-90"
          >
            <Check size={14} />
            完成编辑
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑照片/菜单
          </button>
        )}
        <span className="text-[11px] font-medium text-slate">{editing ? '可粘贴真实照片链接' : '图片可左右滑动'}</span>
      </div>

      <section className="mt-4 space-y-4 px-4">
        {restaurants.map((r) => {
          const direct = edits[r.id] || {}
          const photos = Array.isArray(direct.photos) && direct.photos.length ? direct.photos : r.photos || [r.image]
          return (
            <article key={r.id} className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <PhotoCarousel photos={photos} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[17px] font-black leading-tight text-ink">{r.name}</h2>
                    <p className="mt-0.5 text-[11px] font-bold text-slate">{r.ko}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-black text-blue">{r.price}</span>
                </div>

                {editing && (
                  <div className="mt-3 rounded-md border border-blue/15 bg-mist/50 p-2.5">
                    <p className="text-[10px] font-bold text-slate">照片链接（每行一张，可粘贴 Naver/Google 图片地址）</p>
                    <textarea
                      rows={3}
                      className="mt-1.5 w-full rounded-md border border-line bg-white px-2 py-1.5 text-[11px] text-ink outline-none focus:border-blue"
                      value={photos.join('\n')}
                      onChange={(e) =>
                        patchPhotos(
                          r.id,
                          e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                    <p className="mt-2 text-[10px] font-bold text-slate">推荐菜 / 菜单（逗号分隔）</p>
                    <input
                      className="mt-1.5 w-full rounded-md border border-line bg-white px-2 py-1.5 text-[11px] text-ink outline-none focus:border-blue"
                      value={(r.recommend || []).join('，')}
                      onChange={(e) =>
                        patchRecommend(
                          r.id,
                          e.target.value
                            .split(/[,，、]/)
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </div>
                )}

                <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-slate">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-sage" />
                  {r.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(r.recommend || []).map((item) => (
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
          )
        })}
      </section>

      <p className="flex items-center justify-center gap-1.5 px-4 pb-2 pt-4 text-center text-[11px] font-medium text-slate">
        <UtensilsCrossed size={12} />
        图片支持多张左右滑动；真实店铺照片可在编辑模式粘贴链接
      </p>
    </div>
  )
}
