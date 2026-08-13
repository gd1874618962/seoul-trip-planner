import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import {
  shoppingCategories,
  shoppingProducts,
} from '../data/shoppingProducts'
import {
  COLOR_PALETTE,
  formatCNY,
  formatKRW,
  krwToRmb,
} from '../data/shoppingConfig'
import { getShoppingState, saveShoppingState } from '../data/store'
import PageHeader from '../components/PageHeader'

const productMap = Object.fromEntries(shoppingProducts.map((p) => [p.id, p]))

export default function ShoppingPage({ owner, label, onNavigate }) {
  const [state, setState] = useState(() => getShoppingState(owner))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const rate = Number(state.settings?.krwToRmb) || 0.00477
  const customers = Array.isArray(state.customers) ? state.customers : []

  const persist = (next) => {
    setState(next)
    saveShoppingState(owner, next)
  }

  const setRate = (value) => {
    const nextRate = Number(value) / 1000
    persist({ ...state, settings: { ...state.settings, krwToRmb: nextRate || 0.00477 } })
  }

  const addCustomer = () => {
    const used = new Set(customers.map((c) => c.colorId))
    const color = COLOR_PALETTE.find((c) => !used.has(c.id)) || COLOR_PALETTE[0]
    const customer = {
      id: `customer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      customerName: '新客户',
      colorId: color.id,
      orders: [],
      updatedAt: new Date().toISOString(),
    }
    persist({ ...state, customers: [...customers, customer] })
  }

  const patchCustomer = (id, patch) =>
    persist({
      ...state,
      customers: customers.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      ),
    })

  const addProduct = (customerId, productId) => {
    const product = productMap[productId]
    if (!product) return
    persist({
      ...state,
      customers: customers.map((c) => {
        if (c.id !== customerId) return c
        const existing = c.orders.find((o) => o.productId === productId)
        const orders = existing
          ? c.orders.map((o) =>
              o.productId === productId
                ? { ...o, quantity: Math.min(3, o.quantity + 1) }
                : o,
            )
          : [...c.orders, { productId, quantity: 1, unitPriceKRW: product.priceKRW }]
        return { ...c, orders, updatedAt: new Date().toISOString() }
      }),
    })
  }

  const setQty = (customerId, orderIndex, delta) =>
    persist({
      ...state,
      customers: customers.map((c) => {
        if (c.id !== customerId) return c
        const orders = c.orders
          .map((o, i) =>
            i === orderIndex
              ? { ...o, quantity: Math.max(0, Math.min(3, o.quantity + delta)) }
              : o,
          )
          .filter((o) => o.quantity > 0)
        return { ...c, orders, updatedAt: new Date().toISOString() }
      }),
    })

  const removeOrder = (customerId, orderIndex) =>
    persist({
      ...state,
      customers: customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              orders: c.orders.filter((_, i) => i !== orderIndex),
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    })

  const clearCustomer = (id) => {
    patchCustomer(id, { orders: [] })
  }

  const deleteCustomer = (id) => {
    if (!window.confirm('确定删除这个客户吗？')) return
    persist({ ...state, customers: customers.filter((c) => c.id !== id) })
  }

  const customerKRW = (c) =>
    c.orders.reduce((sum, o) => sum + Number(o.unitPriceKRW || 0) * o.quantity, 0)
  const totalItems = customers.reduce((sum, c) => sum + c.orders.reduce((s, o) => s + o.quantity, 0), 0)
  const totalKRW = customers.reduce((sum, c) => sum + customerKRW(c), 0)

  const filteredProducts = shoppingProducts.filter((p) => {
    const matchQuery =
      !query.trim() ||
      p.name.includes(query.trim()) ||
      p.id.includes(query.trim()) ||
      p.category.includes(query.trim())
    const matchCategory = category === '全部' || p.category === category
    return matchQuery && matchCategory
  })

  return (
    <div>
      <PageHeader eyebrow="Korea Proxy" title={`${label} 代购`} subtitle="客户颜色 · 限购 3 件 · 自动计算" />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('shopping')}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
        >
          <ArrowLeft size={14} />
          返回代购
        </button>
        <label className="inline-flex items-center gap-1.5 rounded-md bg-mist px-2.5 py-2 text-[11px] font-bold text-blue">
          汇率 1000 KRW =
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-16 rounded-md border border-line bg-white px-1.5 py-1 text-right text-xs font-black text-ink outline-none focus:border-blue"
            value={(rate * 1000).toFixed(2)}
            onChange={(e) => setRate(e.target.value)}
          />
          ¥
        </label>
      </div>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-ink/10 bg-ink p-4 text-white shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white/70">今日代购汇总</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white/80">
              <Users size={13} />
              {customers.length} 位客户
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-white/70">{totalItems} 件商品</p>
              <p className="mt-1 text-2xl font-black">{formatKRW(totalKRW)}</p>
              <p className="mt-1 text-sm font-bold text-white/80">{formatCNY(krwToRmb(totalKRW))}</p>
            </div>
            <button
              type="button"
              onClick={addCustomer}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-bold text-ink active:opacity-90"
            >
              <Plus size={14} />
              添加客户
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3 px-4">
        {customers.map((customer) => {
          const color = COLOR_PALETTE.find((c) => c.id === customer.colorId) || COLOR_PALETTE[0]
          const krw = customerKRW(customer)
          return (
            <div key={customer.id} className="rounded-lg border border-line bg-white p-3.5 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color.hex }} />
                <input
                  value={customer.customerName}
                  onChange={(e) => patchCustomer(customer.id, { customerName: e.target.value })}
                  className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm font-black text-ink outline-none focus:border-blue"
                />
                <button
                  type="button"
                  onClick={() => deleteCustomer(customer.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                  aria-label="删除客户"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patchCustomer(customer.id, { colorId: c.id })}
                    title={c.name}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      c.id === customer.colorId ? 'border-ink scale-110' : 'border-white'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {customer.orders.map((order, i) => {
                  const product = productMap[order.productId]
                  return (
                    <div key={`${order.productId}-${i}`} className="flex items-center gap-2 rounded-md bg-cream/60 px-2.5 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-black text-ink">
                          {product ? `${product.name} (${order.productId})` : '商品已下架'}
                        </p>
                        <p className="text-[10px] font-bold text-slate">
                          {formatKRW(order.unitPriceKRW)} × {order.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(customer.id, i, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-sm font-black text-slate active:bg-cream"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-black text-ink">{order.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQty(customer.id, i, 1)}
                          disabled={order.quantity >= 3}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-sm font-black text-slate active:bg-cream disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrder(customer.id, i)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                        aria-label="删除商品"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
                {customer.orders.length === 0 && (
                  <p className="rounded-md bg-cream/50 px-3 py-2 text-[11px] font-medium text-slate">
                    还没有商品，从下方选择添加
                  </p>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <select
                  className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-2 text-[11px] font-medium text-ink outline-none focus:border-blue"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addProduct(customer.id, e.target.value)
                  }}
                >
                  <option value="">＋ 添加商品...</option>
                  {shoppingProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id.replace('bb-', '')} {p.name} {formatKRW(p.priceKRW)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => clearCustomer(customer.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-white px-2.5 py-2 text-[10px] font-bold text-slate active:bg-cream"
                >
                  <RotateCcw size={12} />
                  清空
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between rounded-md bg-mist/60 px-3 py-2">
                <span className="text-[11px] font-bold text-slate">客户合计</span>
                <span className="text-sm font-black text-ink">
                  {formatKRW(krw)} <span className="text-[10px] text-slate">{formatCNY(krwToRmb(krw))}</span>
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="mt-6 px-4">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索商品..."
              className="w-full rounded-lg border border-line bg-white py-2 pl-8 pr-2 text-xs font-medium text-ink outline-none focus:border-blue"
            />
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {shoppingCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                category === c ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {filteredProducts.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <img src={p.image} alt={p.imageAlt} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-2.5">
                <p className="text-[9px] font-bold text-gold">{p.id.replace('bb-', '')}</p>
                <p className="mt-0.5 line-clamp-2 min-h-[2.2em] text-[11px] font-black leading-snug text-ink">{p.name}</p>
                <p className="mt-1 text-[11px] font-black text-blue">{formatKRW(p.priceKRW)}</p>
                <p className="text-[9px] font-bold text-slate">{formatCNY(krwToRmb(p.priceKRW))}</p>
                <p className="mt-1 text-[9px] font-bold text-slate">单人限购 3 件</p>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-2 rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs font-medium text-slate">
              没有匹配的商品
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
