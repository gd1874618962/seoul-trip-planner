import { ArrowLeft, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'

export default function ShoppingHub({ onNavigate }) {
  return (
    <div>
      <PageHeader eyebrow="Korea Proxy" title="韩国代购" subtitle="DAISY 与 梧桐 各自独立管理订单" />

      <div className="mx-4 mt-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate active:bg-cream"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
      </div>

      <section className="mt-5 space-y-3 px-4">
        <button
          type="button"
          onClick={() => onNavigate('shoppingDaisy')}
          className="flex w-full items-center gap-3 border-y border-line bg-mist/30 p-4 text-left active:opacity-90"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue text-white">
            <ShoppingBag size={20} />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">DAISY 代购</p>
            <p className="mt-0.5 text-sm font-medium text-slate">独立订单 · 独立统计</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('shoppingWutong')}
          className="flex w-full items-center gap-3 border-y border-line bg-cream/35 p-4 text-left active:opacity-90"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-white">
            <ShoppingBag size={20} />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">梧桐代购</p>
            <p className="mt-0.5 text-sm font-medium text-slate">独立订单 · 独立统计</p>
          </div>
        </button>
      </section>
    </div>
  )
}
