import { useState } from 'react'
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import InstallPrompt from '../components/InstallPrompt'
import TripCreator from '../components/TripCreator'
import { deleteTripPlan, getTripCatalog } from '../data/store'

function CityCover({ trip }) {
  if (trip.coverImage) {
    return (
      <img
        src={trip.coverImage}
        alt={`${trip.cityCn}城市风景`}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col justify-between bg-surface p-6 text-ink">
      <p className="journal-label text-accent">Destination</p>
      <div>
        <p className="type-display-xl max-w-[7ch] text-ink">{trip.city}</p>
        <p className="type-small mt-4 text-muted">{trip.country} · {trip.theme}</p>
      </div>
    </div>
  )
}

export default function Cities({ onSelectTrip }) {
  const [trips, setTrips] = useState(() => getTripCatalog())
  const [creating, setCreating] = useState(false)

  const removeTrip = (tripId) => {
    if (!window.confirm('确定删除这份旅行计划吗？只有自定义计划可以删除，现有默认攻略不会受影响。')) {
      return
    }
    deleteTripPlan(tripId)
    setTrips(getTripCatalog())
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="journal-shell">
        <header>
          <div className="flex items-center justify-between border-b border-line pb-4">
            <p className="journal-label text-ink">Your travel collection</p>
            <div className="flex items-center gap-3">
              <InstallPrompt />
              <p className="hidden journal-label sm:block">{trips.length} journeys</p>
            </div>
          </div>

          <div className="grid gap-8 pb-12 pt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:pb-16 lg:pt-16">
            <div>
              <p className="journal-label text-accent">Personal travel index</p>
              <h1 className="type-display-xl mt-4 max-w-[9ch] text-ink">My Travel Journal</h1>
              <p className="type-h2 mt-3 text-muted">我的旅行手册</p>
            </div>
            <div className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-8">
              <p className="type-small max-w-sm text-muted">
                收藏每一座去过的城市，也为下一次出发留好位置。旅行资料、地点与现场记录都从这里开始。
              </p>
              <p className="journal-label mt-5 text-ink">{trips.length} journeys archived</p>
            </div>
          </div>
        </header>

        <main className="grid gap-12 pb-16 pt-4 lg:grid-cols-2 lg:gap-8">
          {trips.map((trip, index) => (
            <article
              key={trip.tripId}
              className="group min-w-0"
            >
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="journal-label text-accent">
                  {String(index + 1).padStart(2, '0')} / {trip.isCustom ? 'Personal plan' : 'City'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="journal-label">{trip.status}</span>
                  {trip.isCustom && (
                    <button
                      type="button"
                      onClick={() => removeTrip(trip.tripId)}
                      className="flex h-8 w-8 items-center justify-center text-muted hover:text-clay"
                      aria-label={`删除${trip.title || trip.cityCn}`}
                      title="删除自定义旅行"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTrip(trip.tripId)}
                className="block w-full text-left"
              >
                <div className="journal-media mt-4 aspect-[4/3]">
                  <CityCover trip={trip} />
                </div>

                <div className="pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="journal-label text-accent">{trip.country}</p>
                      <h2 className="type-h1 mt-2 text-ink">{trip.cityCn || trip.title}</h2>
                      <p className="type-small mt-1 text-muted">{trip.city || trip.title}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="type-small font-medium text-ink">{trip.dates}</span>
                    <span className="type-small text-muted">{trip.theme}</span>
                  </div>
                </div>
              </button>
            </article>
          ))}
        </main>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-between border-y border-line py-5 text-left type-small font-semibold text-muted transition-colors hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Plus size={16} />
            创建新的旅行计划
          </span>
          <span className="journal-label">Local first</span>
        </button>
      </div>

      {creating && (
        <TripCreator
          onClose={() => setCreating(false)}
          onCreated={(tripId) => {
            setCreating(false)
            onSelectTrip(tripId)
          }}
        />
      )}
    </div>
  )
}
