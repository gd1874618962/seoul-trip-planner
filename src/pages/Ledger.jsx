import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { getLedgerState, saveLedgerState } from '../data/store'
import PageHeader from '../components/PageHeader'

const CATEGORIES = ['餐饮', '交通', '购物', '住宿', '门票', '其他']

function today() {
  return new Date().toISOString().slice(0, 10)
}

const blankForm = { id: null, date: today(), type: 'expense', category: '餐饮', amount: '', note: '' }

const inputCls =
  'w-full rounded-md border border-line bg-white px-2.5 py-2 text-xs font-medium text-ink outline-none focus:border-blue'

export default function Ledger() {
  const [state, setState] = useState(() => getLedgerState())
  const [form, setForm] = useState(blankForm)
  const entries = Array.isArray(state.entries) ? state.entries : []
  const sorted = [...entries].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || 0) - (a.id || 0),
  )
  const expenseTotal = entries
    .filter((e) => e.type !== 'income')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const incomeTotal = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const catTotals = CATEGORIES.map((c) => ({
    category: c,
    total: entries
      .filter((e) => e.type !== 'income' && e.category === c)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0),
  })).filter((item) => item.total > 0)
  const maxCat = Math.max(1, ...catTotals.map((item) => item.total))

  const persist = (next) => {
    setState(next)
    saveLedgerState(next)
  }

  const save = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      window.alert('请填写正确的金额')
      return
    }
    const record = { ...form, amount }
    const next = form.id
      ? { entries: entries.map((x) => (x.id === form.id ? record : x)) }
      : { entries: [...entries, { ...record, id: Date.now() }] }
    persist(next)
    setForm(blankForm)
  }

  const edit = (entry) =>
    setForm({
      id: entry.id,
      date: entry.date,
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      note: entry.note || '',
    })

  const remove = (id) => {
    if (window.confirm('删除这笔记录？')) {
      persist({ entries: entries.filter((x) => x.id !== id) })
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Travel Ledger" title="旅行账本" subtitle="记下每一笔支出，分类自动汇总" />

      <section className="mt-4 px-4">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <Wallet size={15} className="mx-auto text-blue" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">累计支出</p>
            <p className="mt-0.5 text-sm font-black text-ink">{expenseTotal}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <TrendingUp size={15} className="mx-auto text-sage" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">累计收入</p>
            <p className="mt-0.5 text-sm font-black text-ink">{incomeTotal}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <CalendarDays size={15} className="mx-auto text-gold" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">记录笔数</p>
            <p className="mt-0.5 text-sm font-black text-ink">{entries.length}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <h2 className="text-[15px] font-black text-ink">
            {form.id ? '编辑这笔记录' : '记一笔'}
          </h2>
          <form onSubmit={save} className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">日期</span>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">类型</span>
                <select
                  className={inputCls}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">分类</span>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">金额（RMB）</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="0"
                  className={inputCls}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </label>
            </div>
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-bold text-slate">备注</span>
              <input
                className={inputCls}
                placeholder="比如：弘大烤肉两人份"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-ink py-2.5 text-xs font-bold text-white active:opacity-90"
              >
                {form.id ? <Check size={14} /> : <Plus size={14} />}
                {form.id ? '保存修改' : '记入账本'}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() => setForm(blankForm)}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-2.5 text-xs font-bold text-slate active:bg-cream"
                >
                  <X size={14} />
                  取消
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">分类支出</h2>
          <span className="text-[11px] font-bold text-slate">合计 {expenseTotal} RMB</span>
        </div>
        <div className="space-y-2.5 rounded-lg border border-line bg-white p-4 shadow-card">
          {catTotals.length === 0 && (
            <p className="text-xs font-medium text-slate">还没有支出记录，先记一笔吧。</p>
          )}
          {catTotals.map((item) => (
            <div key={item.category}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-ink">{item.category}</span>
                <span className="text-slate">{item.total} RMB</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue to-sage"
                  style={{ width: `${Math.round((item.total / maxCat) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">收支明细</h2>
          <span className="text-[11px] font-bold text-slate">{sorted.length} 笔</span>
        </div>
        <div className="space-y-2">
          {sorted.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-card">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                  entry.type === 'income' ? 'bg-sage' : 'bg-blue'
                }`}
              >
                {entry.type === 'income' ? '+' : '-'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-black text-ink">{entry.note || entry.category}</p>
                  <span className="shrink-0 rounded-md bg-cream px-1.5 py-0.5 text-[9px] font-bold text-gold">
                    {entry.category}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] font-medium text-slate">{entry.date}</p>
              </div>
              <p className={`text-sm font-black ${entry.type === 'income' ? 'text-sage' : 'text-ink'}`}>
                {entry.type === 'income' ? '+' : '-'}
                {entry.amount}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => edit(entry)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate active:bg-cream"
                  aria-label="编辑"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                  aria-label="删除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="rounded-lg border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-xs font-medium text-slate">
              账本是空的，去上面记第一笔吧。
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
