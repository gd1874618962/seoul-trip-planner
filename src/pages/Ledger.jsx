import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { getLedgerState, getTravelers, getTripId, saveLedgerState } from '../data/store'
import PageHeader from '../components/PageHeader'

const CATEGORIES = ['餐饮', '购物', '交通', '住宿', '娱乐', '门票', '其他']

function today() {
  return new Date().toISOString().slice(0, 10)
}

const inputCls =
  'w-full rounded-md border border-line bg-white px-2.5 py-2 text-xs font-medium text-ink outline-none focus:border-blue'

function blankForm(rate) {
  return {
    id: null,
    date: today(),
    merchant: '',
    category: '餐饮',
    amountKRW: '',
    amountRMB: '',
    payer: '',
    participants: [],
    note: '',
  }
}

export default function Ledger() {
  const [state, setState] = useState(() => getLedgerState())
  const [form, setForm] = useState(() => blankForm(state.exchangeRate))
  const travelers = getTravelers()
  const rate = Number(state.exchangeRate) || 187.5
  const entries = Array.isArray(state.entries) ? state.entries : []
  const sorted = [...entries].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || String(b.id || '').localeCompare(String(a.id || '')),
  )

  const expenseTotal = entries
    .filter((e) => e.type !== 'income')
    .reduce((sum, e) => sum + Number(e.amountRMB || 0), 0)
  const incomeTotal = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amountRMB || 0), 0)

  const persist = (next) => {
    setState(next)
    saveLedgerState(next)
  }

  const setRate = (value) => {
    const nextRate = Number(value) || 0
    persist({ exchangeRate: nextRate, entries })
  }

  const save = (event) => {
    event.preventDefault()
    const amountRMB = Number(form.amountRMB)
    const amountKRW = Number(form.amountKRW)
    if (!form.merchant && !amountRMB && !amountKRW) {
      window.alert('请填写店名或金额')
      return
    }
    const now = new Date().toISOString()
    const record = {
      id: form.id || `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      tripId: getTripId(),
      date: form.date,
      merchant: form.merchant,
      category: form.category,
      amountKRW: amountKRW || '',
      amountRMB: amountRMB || 0,
      exchangeRate: rate,
      payer: form.payer,
      participants: form.participants,
      note: form.note,
      type: 'expense',
      createdAt: form.createdAt || now,
      updatedAt: now,
    }
    const nextEntries = form.id
      ? entries.map((x) => (x.id === form.id ? record : x))
      : [...entries, record]
    persist({ exchangeRate: rate, entries: nextEntries })
    setForm(blankForm(rate))
  }

  const edit = (entry) =>
    setForm({
      id: entry.id,
      date: entry.date || today(),
      merchant: entry.merchant || '',
      category: entry.category || '其他',
      amountKRW: entry.amountKRW || '',
      amountRMB: entry.amountRMB || '',
      payer: entry.payer || '',
      participants: Array.isArray(entry.participants) ? entry.participants : [],
      note: entry.note || '',
      createdAt: entry.createdAt,
    })

  const remove = (id) => {
    if (window.confirm('删除这笔记录？')) {
      persist({ exchangeRate: rate, entries: entries.filter((x) => x.id !== id) })
    }
  }

  const handleKRW = (value) =>
    setForm({
      ...form,
      amountKRW: value,
      amountRMB: value ? Math.round(Number(value) / rate) : '',
    })

  const handleRMB = (value) =>
    setForm({
      ...form,
      amountRMB: value,
      amountKRW: value ? Math.round(Number(value) * rate) : '',
    })

  const toggleParticipant = (id) => {
    const next = form.participants.includes(id)
      ? form.participants.filter((p) => p !== id)
      : [...form.participants, id]
    setForm({ ...form, participants: next })
  }

  const aa = travelers.map((t) => {
    const share = entries
      .filter((e) => e.type !== 'income')
      .reduce((sum, e) => {
        const count = e.participants && e.participants.length ? e.participants.length : travelers.length
        return sum + (e.participants && e.participants.length && !e.participants.includes(t.id) ? 0 : Number(e.amountRMB || 0) / count)
      }, 0)
    const paid = entries
      .filter((e) => e.type !== 'income' && e.payer === t.id)
      .reduce((sum, e) => sum + Number(e.amountRMB || 0), 0)
    return { traveler: t, share, paid, diff: paid - share }
  })

  const catTotals = CATEGORIES.map((category) => ({
    category,
    total: entries
      .filter((e) => e.type !== 'income' && e.category === category)
      .reduce((sum, e) => sum + Number(e.amountRMB || 0), 0),
  })).filter((item) => item.total > 0)
  const maxCat = Math.max(1, ...catTotals.map((item) => item.total))

  return (
    <div>
      <PageHeader eyebrow="Travel Ledger" title="旅行账本" subtitle="汇率换算 · AA 结算 · 分类统计" />

      <section className="mt-4 px-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white p-3 shadow-card">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue">
            <RefreshCw size={13} />
            汇率：1 RMB ≈
          </span>
          <input
            type="number"
            min="1"
            className="w-20 rounded-md border border-line bg-white px-2 py-1.5 text-right text-sm font-black text-ink outline-none focus:border-blue"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <span className="text-[11px] font-bold text-slate">KRW</span>
        </div>
      </section>

      <section className="mt-3 px-4">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <Wallet size={15} className="mx-auto text-blue" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">累计支出</p>
            <p className="mt-0.5 text-sm font-black text-ink">{Math.round(expenseTotal)}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <TrendingUp size={15} className="mx-auto text-sage" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">累计收入</p>
            <p className="mt-0.5 text-sm font-black text-ink">{Math.round(incomeTotal)}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-3 text-center shadow-card">
            <CalendarDays size={15} className="mx-auto text-gold" />
            <p className="mt-1.5 text-[10px] font-bold text-slate">记录笔数</p>
            <p className="mt-0.5 text-sm font-black text-ink">{entries.length}</p>
          </div>
        </div>
      </section>

      {travelers.length > 0 && (
        <section className="mt-3 px-4">
          <div className="rounded-lg border border-blue/15 bg-gradient-to-br from-mist via-white to-cream p-4 shadow-card">
            <h2 className="flex items-center gap-1.5 text-[14px] font-black text-ink">
              <Users size={15} className="text-blue" />
              AA 结算
            </h2>
            <div className="mt-2.5 space-y-2">
              {aa.map((row) => (
                <div key={row.traveler.id} className="rounded-md border border-line bg-white p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-ink">{row.traveler.name}</p>
                    <p className={`text-xs font-black ${row.diff >= 0 ? 'text-sage' : 'text-coral'}`}>
                      {row.diff >= 0 ? '应收回' : '应补出'} {Math.round(Math.abs(row.diff))} RMB
                    </p>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate">应承担</p>
                      <p className="text-[11px] font-bold text-ink">{Math.round(row.share)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate">实际支付</p>
                      <p className="text-[11px] font-bold text-ink">{Math.round(row.paid)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate">补差</p>
                      <p className="text-[11px] font-black text-ink">{Math.round(row.diff)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mt-4 px-4">
        <div className="rounded-lg border border-line bg-white p-4 shadow-card">
          <h2 className="text-[15px] font-black text-ink">{form.id ? '编辑这笔消费' : '记一笔'}</h2>
          <form onSubmit={save} className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">日期</span>
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">分类</span>
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-bold text-slate">店名 / 商家</span>
              <input className={inputCls} placeholder="店名/商家" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">韩元金额</span>
                <input type="number" min="0" inputMode="decimal" placeholder="韩元金额" className={inputCls} value={form.amountKRW} onChange={(e) => handleKRW(e.target.value)} />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">人民币金额 ≈</span>
                <input type="number" min="0" inputMode="decimal" placeholder="人民币金额" className={inputCls} value={form.amountRMB} onChange={(e) => handleRMB(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">支付人</span>
                <select className={inputCls} value={form.payer} onChange={(e) => setForm({ ...form, payer: e.target.value })}>
                  <option value="">未选择</option>
                  {travelers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-bold text-slate">备注</span>
                <input className={inputCls} placeholder="备注" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </label>
            </div>
            {travelers.length > 0 && (
              <div>
                <span className="mb-1 block text-[10px] font-bold text-slate">参与人</span>
                <div className="flex flex-wrap gap-2">
                  {travelers.map((t) => {
                    const active = form.participants.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleParticipant(t.id)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                          active ? 'border-blue bg-blue text-white' : 'border-line bg-white text-slate'
                        }`}
                      >
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
                  onClick={() => setForm(blankForm(rate))}
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
          <h2 className="font-display text-base font-bold text-ink">分类统计</h2>
          <span className="text-[11px] font-bold text-slate">合计 {Math.round(expenseTotal)} RMB</span>
        </div>
        <div className="space-y-2.5 rounded-lg border border-line bg-white p-4 shadow-card">
          {catTotals.length === 0 && <p className="text-xs font-medium text-slate">还没有支出记录，先记一笔吧。</p>}
          {catTotals.map((item) => (
            <div key={item.category}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-ink">{item.category}</span>
                <span className="text-slate">
                  {Math.round(item.total)} RMB · {expenseTotal ? Math.round((item.total / expenseTotal) * 100) : 0}%
                </span>
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
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${entry.type === 'income' ? 'bg-sage' : 'bg-blue'}`}>
                {entry.type === 'income' ? '+' : '-'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-black text-ink">{entry.merchant || entry.note || entry.category}</p>
                  <span className="shrink-0 rounded-md bg-cream px-1.5 py-0.5 text-[9px] font-bold text-gold">{entry.category}</span>
                </div>
                <p className="mt-0.5 text-[10px] font-medium text-slate">
                  {entry.date}
                  {entry.amountKRW ? ` · ${entry.amountKRW} KRW ≈ ${Math.round(entry.amountRMB)} RMB` : ''}
                </p>
              </div>
              <p className={`text-sm font-black ${entry.type === 'income' ? 'text-sage' : 'text-ink'}`}>
                {entry.type === 'income' ? '+' : '-'}
                {Math.round(entry.amountRMB || 0)}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => edit(entry)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate active:bg-cream" aria-label="编辑">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={() => remove(entry.id)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-coral active:bg-cream" aria-label="删除">
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
