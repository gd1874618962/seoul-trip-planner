import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Download,
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
} from '../data/shoppingConfig'
import { getShoppingState, saveShoppingState } from '../data/store'
import PageHeader from '../components/PageHeader'
import { canAdd, remaining, soldQuantity } from '../utils/shoppingLogic'

const productMap = Object.fromEntries(shoppingProducts.map((p) => [p.id, p]))

export default function ShoppingPage({ owner, label, onNavigate }) {
  const [state, setState] = useState(() => getShoppingState(owner))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const rate = Number(state.settings?.krwToRmb) || 0.00477
  const customers = Array.isArray(state.customers) ? state.customers : []
  const toRMB = (krw) => Math.round(krw * rate * 100) / 100
  const globalQty = (productId) => soldQuantity(customers, productId)
  const buyersOf = (productId) =>
    customers
      .filter((c) => c.orders.some((o) => o.productId === productId))
      .map((c) => {
        const qty = c.orders.reduce(
          (sum, o) => sum + (o.productId === productId ? o.quantity : 0),
          0,
        )
        const color = COLOR_PALETTE.find((x) => x.id === c.colorId) || COLOR_PALETTE[0]
        return { name: c.customerName, hex: color.hex, qty }
      })

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
    if (!canAdd(customers, productId)) {
      window.alert('该商品全站总量已达 3 件上限，无法继续添加')
      return
    }
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
        const order = c.orders[orderIndex]
        if (delta > 0 && order && !canAdd(customers, order.productId)) return c
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

  const exportOrders = () => {
    const rows = [
      ['客户姓名', '颜色', '商品编号', '商品名称', '数量', '单价 KRW', '小计 KRW', '客户总计 KRW', '客户总计 RMB'],
    ]
    customers.forEach((customer) => {
      const color = COLOR_PALETTE.find((c) => c.id === customer.colorId)?.name || ''
      const krwTotal = customerKRW(customer)
      if (!customer.orders.length) {
        rows.push([customer.customerName, color, '', '', 0, 0, 0, krwTotal, toRMB(krwTotal).toFixed(2)])
      }
      customer.orders.forEach((order) => {
        const product = productMap[order.productId]
        rows.push([
          customer.customerName,
          color,
          order.productId,
          product?.name || '—',
          order.quantity,
          order.unitPriceKRW,
          order.unitPriceKRW * order.quantity,
          krwTotal,
          toRMB(krwTotal).toFixed(2),
        ])
      })
    })
    const csv =
      '\uFEFF' +
      rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label}-orders.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredProducts = shoppingProducts.filter((p) => {
    const q = query.trim()
    const qCore = q.endsWith('子') ? q.slice(0, -1) : q
    const matchQuery =
      !q ||
      p.name.includes(q) ||
      p.id.includes(q) ||
      p.category.includes(q) ||
      p.name.includes(qCore)
    const matchCategory = category === '全部' || p.category === category
    return matchQuery && matchCategory
  })

  return (
    <div>
      <PageHeader eyebrow="Korea Proxy" title={`${label} 代购`} subtitle="客户颜色 · 限购 3 件 · 自动计算" />

      <div className="mx-5 mt-5 flex items-center justify-between gap-2 lg:mx-10">
        <button
          type="button"
          onClick={() => onNavigate('shopping')}
          className="journal-button journal-button--secondary"
        >
          <ArrowLeft size={14} />
          返回代购
        </button>
        <label className="inline-flex items-center gap-1.5 type-caption font-semibold text-muted">
          汇率 1000 KRW =
          <input
            type="number"
            step="0.01"
            min="0"
            className="journal-input w-20 text-right"
            value={(rate * 1000).toFixed(2)}
            onChange={(e) => setRate(e.target.value)}
          />
          ¥
        </label>
      </div>

      <section className="mx-5 mt-6 lg:mx-10">
        <div className="border-y border-line bg-surface px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="journal-label text-accent">今日代购汇总</p>
            <span className="inline-flex items-center gap-1 type-caption font-semibold text-muted">
              <Users size={13} />
              {customers.length} 位客户
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="type-small font-semibold text-muted">{totalItems} 件商品</p>
              <p className="type-h1 mt-1 text-ink">{formatKRW(totalKRW)}</p>
              <p className="type-small mt-1 font-semibold text-muted">{formatCNY(toRMB(totalKRW))}</p>
            </div>
            <button
              type="button"
              onClick={addCustomer}
              className="journal-button journal-button--primary"
            >
              <Plus size={14} />
              添加客户
            </button>
          </div>
          <button
            type="button"
            onClick={exportOrders}
            className="journal-button journal-button--secondary mt-4 w-full"
          >
            <Download size={14} />
            导出订单
          </button>
        </div>
      </section>

      <section className="mx-5 mt-6 space-y-5 lg:mx-10">
        {customers.map((customer) => {
          const color = COLOR_PALETTE.find((c) => c.id === customer.colorId) || COLOR_PALETTE[0]
          const krw = customerKRW(customer)
          return (
            <div key={customer.id} className="journal-card p-4">
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color.hex }} />
                <input
                  value={customer.customerName}
                  onChange={(e) => patchCustomer(customer.id, { customerName: e.target.value })}
                  className="journal-input min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => deleteCustomer(customer.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-clay"
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
                    <div key={`${order.productId}-${i}`} className="flex items-center gap-2 border-b border-line py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-small font-semibold text-ink">
                          {product ? `${product.name} (${order.productId})` : '商品已下架'}
                        </p>
                        <p className="type-caption font-semibold text-muted">
                          {formatKRW(order.unitPriceKRW)} × {order.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(customer.id, i, -1)}
                          className="flex h-8 w-8 items-center justify-center border border-line bg-paper type-small font-semibold text-muted"
                        >
                          −
                        </button>
                        <span className="w-6 text-center type-small font-semibold text-ink">{order.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQty(customer.id, i, 1)}
                          disabled={remaining(customers, order.productId) <= 0}
                          className="flex h-8 w-8 items-center justify-center border border-line bg-paper type-small font-semibold text-muted disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrder(customer.id, i)}
                        className="flex h-8 w-8 items-center justify-center border border-line text-clay"
                        aria-label="删除商品"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
                {customer.orders.length === 0 && (
                  <p className="border-b border-line py-3 type-small text-muted">
                    还没有商品，从下方选择添加
                  </p>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <select
                  className="journal-input min-w-0 flex-1"
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
                  className="journal-button journal-button--quiet shrink-0"
                >
                  <RotateCcw size={12} />
                  清空
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="type-small font-semibold text-muted">客户合计</span>
                <span className="type-small font-semibold text-ink">
                  {formatKRW(krw)} <span className="type-caption text-muted">{formatCNY(toRMB(krw))}</span>
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="mx-5 mt-10 pb-12 lg:mx-10">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索商品..."
              className="journal-input pl-9"
            />
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {shoppingCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="journal-filter"
              data-active={category === c}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <div key={p.id} data-product={p.id} className="relative">
                  {remaining(customers, p.id) <= 0 && (
                <span className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink type-caption font-semibold text-paper">
                  ✕
                </span>
              )}
              <div className="journal-media">
                <img src={p.image} alt={p.imageAlt} className="aspect-square w-full object-cover" loading="lazy" />
              </div>
              <div className="pt-3">
                <p className="journal-label text-accent">{p.id.replace('bb-', '')}</p>
                <p className="mt-1 line-clamp-2 min-h-[2.8em] type-small font-semibold text-ink">{p.name}</p>
                <p className="mt-1 type-small font-semibold text-ink">{formatKRW(p.priceKRW)}</p>
                <p className="type-caption text-muted">{formatCNY(toRMB(p.priceKRW))}</p>
                <p className="mt-1 type-caption text-muted">
                  已购：{globalQty(p.id)} / 3 · 剩余：{Math.max(0, 3 - globalQty(p.id))}
                </p>
                {globalQty(p.id) >= 3 && (
                  <p className="mt-0.5 type-caption font-semibold text-clay">已售罄</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {buyersOf(p.id).map((b) => (
                    <span
                      key={b.name}
                      className="inline-flex items-center gap-1 border-b border-line pb-0.5 type-caption font-semibold text-muted"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.hex }} />
                      {b.name} ×{b.qty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p className="journal-empty col-span-2 type-small md:col-span-3 lg:col-span-4">
              没有匹配的商品
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
