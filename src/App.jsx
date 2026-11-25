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
  const [page, setPage] = useState('cities')
  const [activeTripId, setActiveTripIdState] = useState(() => getActiveTripId())
  const [tick, setTick] = useState(0)

  useEffect(() => {
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

  if (page === 'cities') {
    return (
      <div className="min-h-screen bg-[#EFECE4]">
        <div className="mx-auto min-h-screen w-full max-w-app bg-[#FCFBF8] shadow-float">
          <Cities onSelectTrip={selectTrip} />
        </div>
      </div>
    )
  }

  const trip = getTripMeta()

  return (
    <div className="min-h-screen bg-[#EFECE4]">
      <div className="relative mx-auto min-h-screen w-full max-w-app bg-[#FCFBF8] pb-24 shadow-float">
        <TripSwitcher trip={trip} onSwitch={() => navigate('cities')} />
        <main key={`${activeTripId}-${tick}-${page}`}>
          {page === 'home' && <HomePage onNavigate={navigate} />}
          {page === 'timeline' && <Timeline />}
          {page === 'map' && <MapPage />}
          {page === 'food' && <Restaurants />}
          {page === 'budget' && <Budget />}
          {page === 'reminders' && <Reminders />}
          {page === 'ledger' && <Ledger />}
          {page === 'editTrip' && <EditTrip onNavigate={navigate} />}
          {page === 'today' && <Today onNavigate={navigate} />}
          {page === 'shopping' && <ShoppingHub onNavigate={navigate} />}
          {page === 'shoppingDaisy' && <ShoppingPage owner="daisy" label="DAISY" onNavigate={navigate} />}
          {page === 'shoppingWutong' && <ShoppingPage owner="wutong" label="梧桐" onNavigate={navigate} />}
        </main>
        <BottomNav current={page} onNavigate={navigate} />
      </div>
    </div>
  )
}
