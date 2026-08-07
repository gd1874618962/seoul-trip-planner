import { useEffect, useState } from 'react'
import { Home, CalendarDays, Map as MapIcon, UtensilsCrossed, Wallet, BellRing, Calculator } from 'lucide-react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/Home'
import Timeline from './pages/Timeline'
import MapPage from './pages/MapPage'
import Restaurants from './pages/Restaurants'
import Budget from './pages/Budget'
import Reminders from './pages/Reminders'
import Ledger from './pages/Ledger'
import EditTrip from './pages/EditTrip'
import { pollRemote } from './data/store'

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
  const [page, setPage] = useState('home')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(async () => {
      const changed = await pollRemote()
      if (changed) setTick((v) => v + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const navigate = (next) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#EFECE4]">
      <div className="relative mx-auto min-h-screen w-full max-w-app bg-[#FCFBF8] pb-24 shadow-float">
        <main key={tick}>
          {page === 'home' && <HomePage onNavigate={navigate} />}
          {page === 'timeline' && <Timeline />}
          {page === 'map' && <MapPage />}
          {page === 'food' && <Restaurants />}
          {page === 'budget' && <Budget />}
          {page === 'reminders' && <Reminders />}
          {page === 'ledger' && <Ledger />}
          {page === 'editTrip' && <EditTrip onNavigate={navigate} />}
        </main>
        <BottomNav current={page} onNavigate={navigate} />
      </div>
    </div>
  )
}
