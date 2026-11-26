import { ArrowLeft, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'

export default function ShoppingHub({ onNavigate }) {
  return (
    <div>
      <PageHeader eyebrow="Korea Proxy" title="韩国代购" subtitle="DAISY 与 梧桐 各自独立管理订单" />

      <div className="mx-5 mt-5 lg:mx-10">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="journal-button journal-button--secondary"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
      </div>

      <section className="mx-5 mt-6 pb-12 lg:mx-10">
        <button
          type="button"
          onClick={() => onNavigate('shoppingDaisy')}
          className="flex w-full items-center gap-4 border-y border-line py-6 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-accent">
            <ShoppingBag size={17} strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <p className="type-h2 text-ink">DAISY 代购</p>
            <p className="type-small mt-1 text-muted">独立订单 · 独立统计</p>
          </div>
          <span className="journal-label text-accent">Open</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('shoppingWutong')}
          className="flex w-full items-center gap-4 border-b border-line py-6 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-accent">
            <ShoppingBag size={17} strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <p className="type-h2 text-ink">梧桐代购</p>
            <p className="type-small mt-1 text-muted">独立订单 · 独立统计</p>
          </div>
          <span className="journal-label text-accent">Open</span>
        </button>
      </section>
    </div>
  )
}
