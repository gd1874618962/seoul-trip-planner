import { useEffect, useState } from 'react'
import { Home, CalendarDays, Map as MapIcon, UtensilsCrossed, Wallet, BellRing, Calculator } from 'lucide-react'
import BottomNav from './components/BottomNav'
import TripSwitcher from './components/TripSwitcher'
import Cities from './pages/Cities'
import HomePage from './pages/Home'
import Timeline from './pages/Timeline'
import MapPage from './pages/MapPage'
import Restaurants from './pages/Restaurants'
import Budget from './pages/Budget'
import Reminders from './pages/Reminders'
import Ledger from './pages/Ledger'
import EditTrip from './pages/EditTrip'
import Today from './pages/Today'
import ShoppingHub from './pages/ShoppingHub'
import ShoppingPage from './pages/ShoppingPage'
import SharedTrip from './pages/SharedTrip'
import { decodeShareSnapshot, getShareTokenFromLocation } from './data/share'
import {
  getActiveTripId,
  getTripMeta,
  initCloudSync,
  initRemoteSync,
  migrateItineraryOnce,
  pollCloud,
  pollRemote,
  switchActiveTrip,
} from './data/store'

export const tabs = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'timeline', label: '行程', icon: CalendarDays },
  { id: 'map', label: '地图', icon: MapIcon },
  { id: 'food', label: '餐厅', icon: UtensilsCrossed },
  { id: 'budget', label: '预算', icon: Wallet },
  { id: 'reminders', label: '提醒', icon: BellRing },
  { id: 'ledger', label: '账本', icon: Calculator },
]

export default function App() {
  const [sharedPlan, setSharedPlan] = useState(() =>
    getShareTokenFromLocation() ? { status: 'loading', snapshot: null, error: '' } : null,
  )
  const [page, setPage] = useState('cities')
  const [activeTripId, setActiveTripIdState] = useState(() => getActiveTripId())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let generation = 0
    const loadShare = () => {
      const currentGeneration = ++generation
      const token = getShareTokenFromLocation()
      if (!token) {
        setSharedPlan(null)
        return
      }
      setSharedPlan({ status: 'loading', snapshot: null, error: '' })
      decodeShareSnapshot(token)
        .then((snapshot) => {
          if (currentGeneration !== generation) return
          document.title = `${snapshot.trip.meta.title || '旅行计划'} · 小韩之旅`
          setSharedPlan({ status: 'ready', snapshot, error: '' })
        })
        .catch(() => {
          if (currentGeneration !== generation) return
          setSharedPlan({
            status: 'error',
            snapshot: null,
            error: '分享链接不完整，或当前浏览器版本不支持解压。请让分享者重新发送完整链接。',
          })
        })
    }
    loadShare()
    window.addEventListener('hashchange', loadShare)
    return () => {
      generation += 1
      window.removeEventListener('hashchange', loadShare)
    }
  }, [])

  useEffect(() => {
    if (getShareTokenFromLocation()) return undefined
    let cancelled = false
    Promise.all([initRemoteSync(), initCloudSync()]).finally(() => {
      if (cancelled) return
      migrateItineraryOnce()
      setTick((v) => v + 1)
    })
    const timer = setInterval(async () => {
      const results = await Promise.all([pollRemote(), pollCloud()])
      if (results.some(Boolean)) setTick((v) => v + 1)
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const navigate = (next) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectTrip = async (tripId) => {
    if (!(await switchActiveTrip(tripId))) return
    setActiveTripIdState(tripId)
    setPage('home')
    setTick((v) => v + 1)
    window.scrollTo({ top: 0 })
    await initCloudSync()
    migrateItineraryOnce()
    setTick((v) => v + 1)
  }

  if (sharedPlan) {
    if (sharedPlan.status === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-6">
          <div className="text-center">
            <p className="journal-label text-accent">Shared travel plan</p>
            <p className="type-h2 mt-3 text-ink">正在打开旅行计划</p>
            <p className="type-small mt-2 text-muted">正在读取只读分享快照…</p>
          </div>
        </div>
      )
    }
    if (sharedPlan.status === 'error') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-6">
          <div className="max-w-md text-center">
            <p className="journal-label text-accent">Share link</p>
            <p className="type-h1 mt-3 text-ink">无法打开分享</p>
            <p className="type-small mt-3 text-muted">{sharedPlan.error}</p>
            <a href="./" className="journal-button journal-button--primary mt-6">
              打开完整应用
            </a>
          </div>
        </div>
      )
    }
    return <SharedTrip snapshot={sharedPlan.snapshot} />
  }

  if (page === 'cities') {
    return <Cities onSelectTrip={selectTrip} />
  }

  const trip = getTripMeta()

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto min-h-screen w-full max-w-[1440px] bg-paper lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
        <BottomNav
          current={page}
          trip={trip}
          onNavigate={navigate}
          onSwitch={() => navigate('cities')}
        />
        <div className="app-content min-w-0">
          <TripSwitcher trip={trip} onSwitch={() => navigate('cities')} />
          <main key={`${activeTripId}-${tick}-${page}`} className="mx-auto w-full max-w-[1180px]">
            {page === 'home' && <HomePage onNavigate={navigate} />}
            {page === 'timeline' && <Timeline />}
            {page === 'map' && <MapPage />}
            {page === 'food' && <Restaurants onNavigate={navigate} />}
            {page === 'budget' && <Budget />}
            {page === 'reminders' && <Reminders />}
            {page === 'ledger' && <Ledger />}
            {page === 'editTrip' && <EditTrip onNavigate={navigate} />}
            {page === 'today' && <Today onNavigate={navigate} />}
            {page === 'shopping' && <ShoppingHub onNavigate={navigate} />}
            {page === 'shoppingDaisy' && <ShoppingPage owner="daisy" label="DAISY" onNavigate={navigate} />}
            {page === 'shoppingWutong' && <ShoppingPage owner="wutong" label="梧桐" onNavigate={navigate} />}
          </main>
        </div>
      </div>
    </div>
  )
}
