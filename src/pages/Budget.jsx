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
import {
  getBudgetState,
  getDefaultBudgetState,
  getLedgerExpenseTotal,
  saveBudgetState,
} from '../data/store'
import PageHeader from '../components/PageHeader'

const iconMap = {
  plane: Ticket,
  ticket: Ticket,
  food: UtensilsCrossed,
  bus: Bus,
  bag: ShoppingBag,
  more: Cookie,
}

const inputCls = 'journal-input'

export default function Budget() {
  const [state, setState] = useState(() => getBudgetState())
  const [editing, setEditing] = useState(false)

  const totalSpent = state.spent.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const ledgerTotal = getLedgerExpenseTotal()
  const spentTotal = totalSpent + ledgerTotal
  const plannedTotal = state.planned.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const budgetPerPerson = Number(state.perPerson) || 0
  const remaining = budgetPerPerson - spentTotal
  const buffer = remaining - plannedTotal
  const pct = budgetPerPerson ? Math.min(100, Math.round((totalSpent / budgetPerPerson) * 100)) : 0
  const maxPlanned = Math.max(1, ...state.planned.map((item) => Number(item.amount || 0)))

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

      <div className="mx-5 flex items-center justify-between gap-2 pt-5 lg:mx-10">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="journal-button journal-button--primary"
            >
              <Check size={14} />
              完成编辑
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="journal-button journal-button--secondary"
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="journal-button journal-button--secondary"
          >
            <Pencil size={14} />
            编辑预算
          </button>
        )}
        <span className="type-caption text-muted">{editing ? '修改自动保存' : '实时计算剩余预算'}</span>
      </div>

      <section className="mx-5 mt-5 lg:mx-10">
        <div className="border-y border-line py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="journal-label text-accent">Remaining balance</p>
              <p className={`type-h1 mt-3 ${remaining >= 0 ? 'text-ink' : 'text-clay'}`}>
                ¥ {remaining}
                <span className="ml-2 type-caption font-semibold text-muted">RMB / 人</span>
              </p>
              <p className="type-small mt-3 max-w-xl text-muted">
                已消费 {spentTotal}，其中账本流水 {ledgerTotal}；计划分配 {plannedTotal}。
              </p>
            </div>
            <dl className="grid grid-cols-3 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6">
              <div className="journal-stat">
                <dt className="type-caption text-muted">预算使用</dt>
                <dd className="type-h3 text-ink">{pct}%</dd>
              </div>
              <div className="journal-stat">
                <dt className="type-caption text-muted">计划外余量</dt>
                <dd className={`type-h3 ${buffer >= 0 ? 'text-ink' : 'text-clay'}`}>{buffer}</dd>
              </div>
              <div className="journal-stat">
                <dt className="type-caption text-muted">人均总预算</dt>
                <dd className="type-h3 text-ink">{state.perPerson}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-10 lg:mx-10">
        <div className="flex items-center justify-between">
          <h2 className="type-h1 text-ink">已支出</h2>
          {editing && (
            <button
              type="button"
              onClick={() => persist({ ...state, spent: [...state.spent, { label: '新支出', amount: 0, icon: 'ticket' }] })}
              className="journal-button journal-button--quiet"
            >
              <Plus size={13} />
              添加
            </button>
          )}
        </div>
        <div className="mt-3 border-t border-line">
          {state.spent.map((item, index) => {
            const Icon = iconMap[item.icon] || Ticket
            return (
          <div key={`spent-${index}`} className="flex items-center gap-3 border-b border-line py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-accent">
                  <Icon size={14} strokeWidth={1.5} />
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-clay"
                      aria-label="删除这笔支出"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="type-body font-medium text-ink">{item.label}</p>
                      <p className="type-caption text-muted">已支付</p>
                    </div>
                    <p className="type-small font-semibold text-ink">
                      {item.amount} <span className="type-caption font-semibold text-muted">RMB</span>
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-5 mt-10 lg:mx-10">
        <div className="flex items-center justify-between">
          <h2 className="type-h1 text-ink">计划分配</h2>
          <span className="journal-label">合计 {plannedTotal} RMB</span>
        </div>
        <div className="mt-3 space-y-4 border-y border-line py-5">
          {state.planned.map((item, index) => {
            const Icon = iconMap[item.icon] || Cookie
            const width = Math.round((Number(item.amount || 0) / maxPlanned) * 100)
            return (
              <div key={`planned-${index}`}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-accent">
                    <Icon size={14} strokeWidth={1.5} />
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
                        <p className="type-body font-medium text-ink">{item.label}</p>
                        <p className="type-caption text-muted">{item.note}</p>
                      </div>
                      <p className="type-small font-semibold text-ink">
                        {item.amount} <span className="type-caption font-semibold text-muted">RMB</span>
                      </p>
                    </>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => persist({ ...state, planned: state.planned.filter((_, i) => i !== index) })}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-clay"
                      aria-label="删除这个分类"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {!editing && (
                  <div className="mt-2 h-px overflow-hidden bg-line">
                    <div
                      className="h-full bg-accent"
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
              className="journal-button journal-button--secondary w-full"
            >
              <Plus size={14} />
              添加预算分类
            </button>
          )}
        </div>
      </section>

      <section className="mx-5 mt-10 pb-12 lg:mx-10">
        <div className="border-y border-line py-6">
          <p className="flex items-center gap-1.5 type-caption font-semibold text-accent">
            <Info size={14} />
            记账小技巧
          </p>
          <ul className="type-small mt-3 space-y-1.5 text-muted">
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
