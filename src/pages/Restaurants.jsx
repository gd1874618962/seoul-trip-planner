import { useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Coffee,
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
  getFoodGuide,
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
    return <div className="aspect-[4/3] w-full bg-surface" />
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
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 bg-ink/35 px-2 py-1">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-px transition-all ${i === index ? 'w-4 bg-paper' : 'w-1.5 bg-paper/60'}`}
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

      <div className="mx-5 mt-5 flex items-center justify-between gap-2 lg:mx-10">
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="journal-button journal-button--primary"
          >
            <Check size={14} />
            完成编辑
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="journal-button journal-button--secondary"
          >
            <Pencil size={14} />
            编辑照片/菜单
          </button>
        )}
        <span className="type-caption text-muted">{editing ? '可粘贴真实照片链接' : '图片可左右滑动'}</span>
      </div>

      <section className="mx-5 mt-6 grid gap-10 pb-12 md:grid-cols-2 lg:mx-10">
        {restaurants.length === 0 && (
          <div className="journal-empty md:col-span-2">
            <UtensilsCrossed size={22} className="mx-auto text-accent" />
            <p className="type-small mt-3 font-semibold text-ink">餐厅清单待建立</p>
            <p className="type-small mt-1 text-muted">可以等行程和演唱会场馆确认后再补充。</p>
          </div>
        )}
        {restaurants.map((r) => {
          const direct = edits[r.id] || {}
          const photos = Array.isArray(direct.photos) && direct.photos.length ? direct.photos : r.photos || [r.image]
          return (
            <article key={r.id} className="border-b border-line pb-8">
              <div className="journal-media">
                <PhotoCarousel photos={photos} />
              </div>
              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => loadImages(r)}
                  disabled={loadingId === r.id}
                  className="journal-button journal-button--quiet mb-3 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={loadingId === r.id ? 'animate-spin' : ''} />
                  {loadingId === r.id ? '搜索中...' : '搜索真实图片'}
                </button>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="type-h2 text-ink">{r.name}</h2>
                    <p className="type-small mt-1 font-medium text-muted">{r.ko}</p>
                  </div>
                  <span className="shrink-0 type-small font-semibold text-accent">{r.price}</span>
                </div>

                {editing && (
                  <div className="mt-4 border-y border-line py-3">
                    <p className="type-caption font-semibold text-muted">照片链接（每行一张，可粘贴 Naver/Google 图片地址）</p>
                    <textarea
                      rows={3}
                      className="journal-input mt-2"
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
                    <p className="mt-3 type-caption font-semibold text-muted">推荐菜 / 菜单（逗号分隔）</p>
                    <input
                      className="journal-input mt-2"
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

                <p className="mt-3 flex items-start gap-1.5 type-small text-muted">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-accent" />
                  {r.address}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {(r.recommend || []).map((item) => (
                    <span key={item} className="border-b border-line pb-0.5 type-caption font-semibold text-muted">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="type-small mt-3 border-l border-line pl-3 text-muted">
                  {r.note}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 type-small font-semibold text-muted">
                    <Wallet size={12} className="text-accent" />
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
                    className="journal-button journal-button--primary"
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

      <p className="type-caption flex items-center justify-center gap-1.5 px-5 pb-8 pt-4 text-center text-muted">
        <UtensilsCrossed size={12} /> 图片支持多张左右滑动；真实店铺照片可在编辑模式粘贴链接
      </p>
    </div>
  )
}

function KualaLumpurRestaurants({ onNavigate }) {
  const tripMeta = getTripMeta()
  const guide = getFoodGuide()
  const pointMap = Object.fromEntries(getPoints().map((point) => [point.locationId, point]))
  const scheduledMeals = guide.meals.filter((meal) => meal.status === 'scheduled')
  const flexibleMeals = guide.meals.filter((meal) => meal.status === 'flexible')

  const searchHref = (locationId, fallback) => {
    const point = pointMap[locationId]
    const query = point?.mapQuery || fallback
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kuala Lumpur / Food & Coffee"
        title="美食与咖啡"
        subtitle="7 顿已安排正餐 · 2 家待落实 · 每日咖啡、特色小吃与甜品完整收录"
      />

      <section className="mx-5 pb-12 pt-6 lg:mx-10">
        <div className="grid gap-8 border-y border-ink/15 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 type-caption font-semibold text-accent">
              <Star size={13} />
              KEY TABLES · {guide.meals.length}
            </p>
            <h2 className="type-h1 mt-2 max-w-2xl text-ink">先吃已定正餐，再处理待落实餐厅</h2>
            <p className="type-small mt-3 max-w-2xl text-muted">
              肥肥蟹与 De.Wan 1958 同日安排在 Pavilion Elite 一带；兴记肉骨茶、Talk Crab、Bakehouse / LOKL 和 Muduera
              等尚待确认分店或地址的信息，均保留并明确标注。
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('map')}
              className="journal-button journal-button--primary mt-5"
            >
              打开地点图谱
              <ExternalLink size={11} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line">
            {[
              ['已安排正餐', scheduledMeals.length],
              ['弹性安排', flexibleMeals.length],
              ['待落实正餐', guide.pendingMeals.length],
              ['咖啡日', guide.coffee.length],
            ].map(([label, value]) => (
              <div key={label} className="bg-paper px-4 py-3">
                <p className="numeric type-h1 text-ink">{value}</p>
                <p className="type-caption text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[120px_minmax(0,1fr)] md:gap-6">
            <p className="journal-label text-accent">01 / Scheduled</p>
            <div>
              <h2 className="type-h1 text-ink">已安排进路线的正餐</h2>
              <p className="type-small mt-2 text-muted">
                餐次、日期与区域按既定行程展示；海脚人为机场候机期间的弹性安排。
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-8 md:grid-cols-2">
            {guide.meals.map((meal) => {
              const point = pointMap[meal.locationId]
              return (
                <article key={meal.id} className="border-t border-ink/15 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="journal-label text-accent">{meal.dayLabel} · {meal.meal}</p>
                      <h3 className="type-h2 mt-1 text-ink">{meal.name}</h3>
                      {meal.en && <p className="type-small mt-1 text-muted">{meal.en}</p>}
                    </div>
                    <span
                      className={`shrink-0 border-b pb-0.5 type-caption font-semibold ${
                        meal.status === 'flexible'
                          ? 'border-clay/50 text-clay'
                          : 'border-accent/40 text-accent'
                      }`}
                    >
                      {meal.statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2 border-y border-line/70 py-3 type-small">
                    <span className="text-muted">区域</span>
                    <span className="font-medium text-ink">{meal.area}</span>
                    <span className="text-muted">安排</span>
                    <span className="text-ink">{meal.note}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 type-caption text-muted">
                      {point?.officialAddress || '地址或分店待确认'}
                    </p>
                    <a
                      href={searchHref(meal.locationId, `${meal.name} ${meal.en || ''} Kuala Lumpur`)}
                      target="_blank"
                      rel="noreferrer"
                      className="journal-button journal-button--quiet shrink-0"
                    >
                      地图核实
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-14 bg-ink px-5 py-7 text-paper md:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-10">
            <div>
              <p className="journal-label text-accent">02 / Pending tables</p>
              <h2 className="type-h1 mt-3 text-paper">还需要后续落实的正餐</h2>
              <p className="type-small mt-3 max-w-md text-paper/70">
                这两家没有从清单中消失，仍需结合营业时间和其他餐厅的用餐安排再确定日期。
              </p>
            </div>
            <div className="border-y border-paper/15">
              {guide.pendingMeals.map((meal) => (
                <article key={meal.id} className="border-b border-paper/15 py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="type-h2 text-paper">{meal.name}</h3>
                      {meal.en && <p className="type-small mt-1 text-paper/65">{meal.en}</p>}
                    </div>
                    <span className="shrink-0 type-caption font-semibold text-clay">{meal.statusLabel}</span>
                  </div>
                  <p className="type-small mt-2 text-paper/70">{meal.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[120px_minmax(0,1fr)] md:gap-6">
            <p className="journal-label text-accent">03 / Coffee</p>
            <div>
              <h2 className="type-h1 text-ink">每天一杯咖啡</h2>
              <p className="type-small mt-2 text-muted">
                DAY 2 不专门绕路；DAY 3 两家择一；所有未确认分店均保留提醒。
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-px bg-line md:grid-cols-2">
            {guide.coffee.map((coffee) => (
              <article key={coffee.id} className="bg-paper p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="journal-label text-accent">{coffee.dayLabel}</p>
                    <h3 className="type-h3 mt-2 text-ink">{coffee.plan}</h3>
                  </div>
                  <Coffee size={16} className="shrink-0 text-accent" strokeWidth={1.5} />
                </div>
                <p className="type-small mt-3 text-muted">{coffee.note}</p>
                {coffee.locationId && (
                  <a
                    href={searchHref(coffee.locationId, `${coffee.plan} Kuala Lumpur`)}
                    target="_blank"
                    rel="noreferrer"
                    className="journal-button journal-button--quiet mt-4"
                  >
                    地图核实
                    <ExternalLink size={10} />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[120px_minmax(0,1fr)] md:gap-6">
            <p className="journal-label text-accent">04 / Snacks</p>
            <div>
              <h2 className="type-h1 text-ink">特色小吃与甜品</h2>
              <p className="type-small mt-2 text-muted">
                小吃以分享和体验为主，不替代已确定的正餐。
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-x-8 gap-y-0 md:grid-cols-2">
            {guide.snacks.map((snack) => (
              <article key={snack.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-t border-line py-4">
                <div>
                  <p className="journal-label text-accent">{snack.schedule}</p>
                  <h3 className="type-h3 mt-1 text-ink">{snack.name}</h3>
                  <p className="type-small mt-1 text-muted">{snack.note}</p>
                </div>
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" strokeWidth={1.5} />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 border-y border-line py-5">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] md:items-start">
            <div>
              <p className="inline-flex items-center gap-1.5 journal-label text-clay">
                <CircleAlert size={13} />
                地点状态
              </p>
              <h2 className="type-h2 mt-3 text-ink">未被伪装的确定信息</h2>
              <p className="type-small mt-2 max-w-2xl text-muted">
                {tripMeta.cityCn}目前仍有多家餐厅和打卡点需要核准分店或地址。页面保留它们在攻略中的位置，
                不用推测坐标或无关店铺照片补空。
              </p>
            </div>
            <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-2 type-small text-muted">
              <CalendarDays size={14} className="mt-1 text-accent" />
              <span>已确认日期与餐次的餐厅照常显示在时间线中。</span>
              <MapPin size={14} className="mt-1 text-accent" />
              <span>分店或地址未确认时，在地点图谱中标记为待核实。</span>
              <UtensilsCrossed size={14} className="mt-1 text-accent" />
              <span>品一鲜 Morrus Seafood 和名人轩继续保留在待落实正餐中。</span>
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}

export default function Restaurants({ onNavigate }) {
  return getTripMeta().tripId === 'kuala-lumpur-2027-01'
    ? <KualaLumpurRestaurants onNavigate={onNavigate} />
    : <SeoulRestaurants />
}
