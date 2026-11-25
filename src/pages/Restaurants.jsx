import { useRef, useState } from 'react'
import {
  Check,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import {
  getRestaurantEdits,
  getRestaurants,
  getPoints,
  getTripMeta,
  saveRestaurantEdits,
} from '../data/store'
import PageHeader from '../components/PageHeader'
import { searchRestaurantImages } from '../services/imageService'

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

function SeoulRestaurants() {
  const [editing, setEditing] = useState(false)
  const [tick, setTick] = useState(0)
  const [loadingId, setLoadingId] = useState(null)
  const tripMeta = getTripMeta()
  const restaurants = getRestaurants()
  const edits = getRestaurantEdits()

  const patchPhotos = (id, photos) => {
    saveRestaurantEdits({ ...edits, [id]: { ...(edits[id] || {}), photos } })
    setTick((v) => v + 1)
  }

  const patchRecommend = (id, recommend) => {
    saveRestaurantEdits({ ...edits, [id]: { ...(edits[id] || {}), recommend } })
    setTick((v) => v + 1)
  }

  const loadImages = async (restaurant) => {
    setLoadingId(restaurant.id)
    const urls = await searchRestaurantImages(
      restaurant.imageQuery || `${restaurant.name} ${restaurant.ko || ''}`,
    )
    if (urls.length) {
      patchPhotos(restaurant.id, urls)
    } else {
      window.alert('未找到可用图片，已保留现有图片')
    }
    setLoadingId(null)
  }

  return (
    <div>
      <PageHeader eyebrow={`${tripMeta.city} Food`} title="餐厅收藏" subtitle="照片 · 菜单 · 地址导航" />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white active:opacity-90"
          >
            <Check size={14} />
            完成编辑
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-semibold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑照片/菜单
          </button>
        )}
        <span className="text-sm font-medium text-slate">{editing ? '可粘贴真实照片链接' : '图片可左右滑动'}</span>
      </div>

      <section className="mt-5 grid gap-6 px-5 pb-10 md:grid-cols-2 lg:px-10">
        {restaurants.length === 0 && (
          <div className="rounded-lg border border-dashed border-line bg-cream/50 px-4 py-8 text-center">
            <UtensilsCrossed size={22} className="mx-auto text-gold" />
            <p className="mt-2 text-sm font-semibold text-ink">餐厅清单待建立</p>
            <p className="mt-1 text-sm font-medium text-slate">可以等行程和演唱会场馆确认后再补充。</p>
          </div>
        )}
        {restaurants.map((r) => {
          const direct = edits[r.id] || {}
          const photos = Array.isArray(direct.photos) && direct.photos.length ? direct.photos : r.photos || [r.image]
          return (
            <article key={r.id} className="overflow-hidden border border-line bg-paper">
              <PhotoCarousel photos={photos} />
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => loadImages(r)}
                  disabled={loadingId === r.id}
                  className="mb-2 inline-flex items-center gap-1 rounded-md bg-mist px-2.5 py-1.5 text-xs font-semibold text-blue active:opacity-90 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loadingId === r.id ? 'animate-spin' : ''} />
                  {loadingId === r.id ? '搜索中...' : '搜索真实图片'}
                </button>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold leading-tight text-ink">{r.name}</h2>
                    <p className="mt-0.5 text-sm font-semibold text-slate">{r.ko}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-sm font-semibold text-blue">{r.price}</span>
                </div>

                {editing && (
                  <div className="mt-3 rounded-md border border-blue/15 bg-mist/50 p-2.5">
                    <p className="text-xs font-semibold text-slate">照片链接（每行一张，可粘贴 Naver/Google 图片地址）</p>
                    <textarea
                      rows={3}
                      className="mt-1.5 w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-blue"
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
                    <p className="mt-2 text-xs font-semibold text-slate">推荐菜 / 菜单（逗号分隔）</p>
                    <input
                      className="mt-1.5 w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-blue"
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

                <p className="mt-3 flex items-start gap-1.5 text-sm font-normal leading-6 text-slate">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-sage" />
                  {r.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(r.recommend || []).map((item) => (
                    <span key={item} className="rounded-md border border-blue/15 bg-mist/70 px-2 py-1 text-sm font-semibold text-blue">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-3 border-l-2 border-line pl-3 text-sm font-normal leading-6 text-slate">
                  {r.note}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate">
                    <Wallet size={12} className="text-gold" />
                    {r.priceRange}
                  </span>
                  <a
                    href={
                      tripMeta.tripId === 'seoul-2026'
                        ? `https://map.naver.com/p/search/${encodeURIComponent(`${r.name} ${r.ko}`)}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.address || ''}`)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white active:opacity-90"
                  >
                    <ExternalLink size={12} />
                    打开地图
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <p className="flex items-center justify-center gap-1.5 px-4 pb-2 pt-4 text-center text-sm font-normal text-slate">
        <UtensilsCrossed size={12} />
        图片支持多张左右滑动；真实店铺照片可在编辑模式粘贴链接
      </p>
    </div>
  )
}

function KualaLumpurRestaurants({ onNavigate }) {
  const keyRestaurants = getPoints().filter((point) => point.keyRestaurant)

  return (
    <div>
      <PageHeader
        eyebrow="Kuala Lumpur / Key Tables"
        title="重点餐厅"
        subtitle="六家指定正餐，不锁定日期与连续用餐时间"
      />

      <section className="px-5 pt-5 lg:px-10">
        <div className="border-y border-ink/15 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                <Star size={13} />
                KEY TABLES · {keyRestaurants.length}
              </p>
              <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight text-ink">优先确认分店</h2>
              <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-slate">
                肥肥蟹和 De.Wan 1958 优先 Pavilion Elite 附近；兴记与 Talk Crab 同属甲洞；Grub 需与 Mid Valley 分开规划交通。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('map')}
              className="shrink-0 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white"
            >
              地点地图
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 px-5 pb-12 md:grid-cols-2 lg:px-10">
        {keyRestaurants.map((restaurant) => (
          <article key={restaurant.locationId} className="border-t border-ink/15 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                  {restaurant.area}
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-snug text-ink">
                  {restaurant.displayName}
                </h2>
              </div>
              <span className="shrink-0 border-b border-gold/40 pb-0.5 text-xs font-medium text-gold">
                重点正餐
              </span>
            </div>
            <p className="mt-3 text-sm font-normal leading-6 text-slate">{restaurant.note}</p>
            {restaurant.recommended?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {restaurant.recommended.map((item) => (
                  <span key={item} className="rounded-md bg-mist/70 px-2 py-1 text-xs font-semibold text-blue">
                    {item}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/70 pt-3">
              <p className="line-clamp-2 min-w-0 text-sm font-normal leading-6 text-slate">
                {restaurant.officialAddress}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  restaurant.mapQuery || `${restaurant.name} Kuala Lumpur`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slate"
              >
                核实地点
                <ExternalLink size={10} />
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default function Restaurants({ onNavigate }) {
  return getTripMeta().tripId === 'kuala-lumpur-2027-01'
    ? <KualaLumpurRestaurants onNavigate={onNavigate} />
    : <SeoulRestaurants />
}
