import { useState } from 'react'
import {
  Bus,
  Check,
  Cookie,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBag,
  Ticket,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { getBudgetState, getDefaultBudgetState, saveBudgetState } from '../data/store'
import PageHeader from '../components/PageHeader'

const iconMap = {
  plane: Ticket,
  ticket: Ticket,
  food: UtensilsCrossed,
  bus: Bus,
  bag: ShoppingBag,
  more: Cookie,
}

const inputCls =
  'w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-blue'

export default function Budget() {
  const [state, setState] = useState(() => getBudgetState())
  const [editing, setEditing] = useState(false)

  const totalSpent = state.spent.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const plannedTotal = state.planned.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const remaining = state.perPerson - totalSpent
  const buffer = remaining - plannedTotal
  const pct = Math.min(100, Math.round((totalSpent / state.perPerson) * 100))
  const maxPlanned = Math.max(1, ...state.planned.map((item) => Number(item.amount || 0)))
  const radius = 52
  const circumference = 2 * Math.PI * radius

  const persist = (next) => {
    setState(next)
    saveBudgetState(next)
  }

  const patchSpent = (index, patch) =>
    persist({ ...state, spent: state.spent.map((item, i) => (i === index ? { ...item, ...patch } : item)) })

  const patchPlanned = (index, patch) =>
    persist({ ...state, planned: state.planned.map((item, i) => (i === index ? { ...item, ...patch } : item)) })

  const resetAll = () => {
    if (!window.confirm('确定把预算恢复成默认分配吗？')) return
    persist(getDefaultBudgetState())
  }

  return (
    <div>
      <PageHeader eyebrow="Budget" title="预算统计" subtitle={`${state.perPerson} RMB / 人 · 可编辑记账`} />

      <div className="mx-4 mt-3 flex items-center justify-between gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-bold text-white active:opacity-90"
            >
              <Check size={14} />
              完成编辑
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-slate active:bg-cream"
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑预算
          </button>
        )}
        <span className="text-[11px] font-medium text-slate">{editing ? '修改自动保存' : '实时计算剩余预算'}</span>
      </div>

      <section className="mt-3 px-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-5">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="#EAE2D2" strokeWidth="12" />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="#4B7B9C"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate">已消费</span>
                <span className="text-xl font-black text-ink">{pct}%</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate">剩余可用</p>
              <p className={`mt-1 text-3xl font-black leading-none ${remaining >= 0 ? 'text-ink' : 'text-coral'}`}>
                ≈ {remaining}
                <span className="text-xs font-bold text-slate"> RMB / 人</span>
              </p>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate">
                已消费 {totalSpent} + 计划 {plannedTotal}
              </p>
              <p className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${buffer >= 0 ? 'bg-mist text-blue' : 'bg-cream text-coral'}`}>
                计划外余量 {buffer} RMB
              </p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[10px] font-bold text-gold">
                <Wallet size={11} />
                人均总预算 {state.perPerson} RMB
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">已支出</h2>
          {editing && (
            <button
              type="button"
              onClick={() => persist({ ...state, spent: [...state.spent, { label: '新支出', amount: 0, icon: 'ticket' }] })}
              className="inline-flex items-center gap-1 rounded-md bg-mist px-2.5 py-1.5 text-[11px] font-bold text-blue active:opacity-90"
            >
              <Plus size={13} />
              添加
            </button>
          )}
        </div>
        <div className="mt-2.5 space-y-2">
          {state.spent.map((item, index) => {
            const Icon = iconMap[item.icon] || Ticket
            return (
              <div key={`spent-${index}`} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-card">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-gold">
                  <Icon size={16} />
                </span>
                {editing ? (
                  <>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        className={inputCls}
                        value={item.label}
                        onChange={(e) => patchSpent(index, { label: e.target.value })}
                      />
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={item.amount}
                        onChange={(e) => patchSpent(index, { amount: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => persist({ ...state, spent: state.spent.filter((_, i) => i !== index) })}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                      aria-label="删除这笔支出"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-ink">{item.label}</p>
                      <p className="text-[10px] font-medium text-slate">已支付</p>
                    </div>
                    <p className="text-sm font-black text-ink">
                      {item.amount} <span className="text-[10px] font-bold text-slate">RMB</span>
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">计划分配</h2>
          <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-black text-blue">合计 {plannedTotal} RMB</span>
        </div>
        <div className="mt-2.5 space-y-3 rounded-lg border border-line bg-white p-4 shadow-card">
          {state.planned.map((item, index) => {
            const Icon = iconMap[item.icon] || Cookie
            const width = Math.round((Number(item.amount || 0) / maxPlanned) * 100)
            return (
              <div key={`planned-${index}`}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-blue">
                    <Icon size={14} />
                  </span>
                  {editing ? (
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          className={inputCls}
                          value={item.label}
                          onChange={(e) => patchPlanned(index, { label: e.target.value })}
                        />
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => patchPlanned(index, { amount: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <input
                        className={inputCls}
                        value={item.note || ''}
                        onChange={(e) => patchPlanned(index, { note: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-ink">{item.label}</p>
                        <p className="text-[10px] font-medium text-slate">{item.note}</p>
                      </div>
                      <p className="text-sm font-black text-ink">
                        {item.amount} <span className="text-[10px] font-bold text-slate">RMB</span>
                      </p>
                    </>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => persist({ ...state, planned: state.planned.filter((_, i) => i !== index) })}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                      aria-label="删除这个分类"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {!editing && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue to-sage"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
          {editing && (
            <button
              type="button"
              onClick={() => persist({ ...state, planned: [...state.planned, { label: '新项目', amount: 0, note: '' }] })}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-blue/40 bg-mist/50 py-2.5 text-xs font-bold text-blue active:bg-mist"
            >
              <Plus size={14} />
              添加预算分类
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="rounded-lg border border-blue/15 bg-gradient-to-br from-mist via-white to-cream p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-bold text-blue">
            <Info size={14} />
            记账小技巧
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[12px] font-medium leading-relaxed text-slate">
            <li>· 每花一笔就进预算页记一笔，剩余会自动更新</li>
            <li>· 地铁优先，准备 T-money 卡</li>
            <li>· 购物先列清单，留应急额度</li>
            <li>· 同一个 Wi-Fi 下，多人编辑会自动同步</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
