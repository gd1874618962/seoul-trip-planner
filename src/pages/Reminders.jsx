import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardList,
  Music4,
  Pencil,
  Plane,
  Plus,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  SunMedium,
  Trash2,
} from 'lucide-react'
import { getReminderOverrides, getReminders, saveReminderOverrides } from '../data/store'
import PageHeader from '../components/PageHeader'

const iconMap = {
  receipt: ReceiptText,
  plane: Plane,
  music: Music4,
  bag: ShoppingBag,
  sun: SunMedium,
}

function useChecks(id, count) {
  const key = `seoul-reminders-${id}`
  const [checks, setChecks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(saved) && saved.length === count) return saved
    } catch {
      /* ignore */
    }
    return Array(count).fill(false)
  })

  const toggle = (index) => {
    setChecks((prev) => {
      const base = prev.length === count ? prev : Array(count).fill(false)
      const next = [...base]
      next[index] = !next[index]
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return [checks, toggle]
}

function ReminderCard({ group, editing, onChange, onReset, onMoveUp, onMoveDown, isFirst, isLast }) {
  const Icon = iconMap[group.icon] || ClipboardList
  const [checks, toggle] = useChecks(group.id, group.items.length)
  const done = checks.filter(Boolean).length

  const moveItem = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= group.items.length) return
    const next = [...group.items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ items: next })
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-blue">
            <Icon size={18} />
          </span>
          {editing ? (
            <input
              value={group.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-40 rounded-md border border-line bg-white px-2 py-1.5 text-sm font-black text-ink outline-none focus:border-blue"
            />
          ) : (
            <div>
              <h2 className="text-[15px] font-black text-ink">{group.title}</h2>
              <p className="text-[10px] font-bold text-slate">
                {done} / {group.items.length} 已完成
              </p>
            </div>
          )}
        </div>
        {editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
              aria-label="整组上移"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
              aria-label="整组下移"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}
        {!editing && (
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-blue transition-all"
              style={{ width: `${(done / group.items.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-1">
        {group.items.map((item, index) =>
          editing ? (
            <div key={`${group.id}-${index}`} className="flex items-center gap-1.5">
              <input
                value={item}
                onChange={(e) => {
                  const next = [...group.items]
                  next[index] = e.target.value
                  onChange({ items: next })
                }}
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-2.5 py-2 text-[13px] font-medium text-ink outline-none focus:border-blue"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
                  aria-label="上移"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === group.items.length - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate disabled:opacity-30 active:bg-cream"
                  aria-label="下移"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ items: group.items.filter((_, i) => i !== index) })}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-coral active:bg-cream"
                  aria-label="删除这条提醒"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              key={`${group.id}-${index}`}
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left active:bg-cream/60"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  checks[index] ? 'border-blue bg-blue text-white' : 'border-sand bg-white text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              <span className={`flex-1 text-[13px] font-medium leading-relaxed ${checks[index] ? 'text-slate/60 line-through' : 'text-ink'}`}>
                {item}
              </span>
            </button>
          ),
        )}
      </div>

      {editing && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onChange({ items: [...group.items, '新提醒'] })}
            className="inline-flex items-center gap-1 rounded-md bg-mist px-2.5 py-1.5 text-[11px] font-bold text-blue active:opacity-90"
          >
            <Plus size={13} />
            添加一条
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-bold text-slate active:bg-cream"
          >
            <RotateCcw size={13} />
            恢复默认
          </button>
        </div>
      )}
    </section>
  )
}

export default function Reminders() {
  const [editing, setEditing] = useState(false)
  const [overrides, setOverrides] = useState(() => getReminderOverrides())
  const groups = getReminders(overrides)

  const persist = (next) => {
    setOverrides(next)
    saveReminderOverrides(next)
  }

  const updateGroup = (id, patch) => {
    const current = overrides[id] || {}
    persist({ ...overrides, [id]: { ...current, ...patch } })
  }

  const moveGroup = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= groups.length) return
    const ids = groups.map((g) => g.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    persist({ ...overrides, __order: ids })
  }

  const resetGroup = (id) => {
    if (!window.confirm(`确定恢复“${groups.find((g) => g.id === id)?.title}”为默认内容吗？`)) return
    const next = { ...overrides }
    delete next[id]
    persist(next)
  }

  const resetAll = () => {
    if (!window.confirm('确定把全部提醒恢复成默认内容吗？')) return
    persist({})
  }

  return (
    <div>
      <PageHeader eyebrow="Checklist" title="旅行提醒" subtitle="逐项打勾，出发前过一遍" />

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
              全部恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-mist px-3 py-2 text-xs font-bold text-blue active:opacity-90"
          >
            <Pencil size={14} />
            编辑提醒
          </button>
        )}
        <span className="text-[11px] font-medium text-slate">
          {editing ? '改完自动保存到本机' : '勾选状态会保存在本机'}
        </span>
      </div>

      <section className="mt-3.5 space-y-3.5 px-4">
        {groups.map((group, index) => (
          <ReminderCard
            key={group.id}
            group={group}
            editing={editing}
            onChange={(patch) => updateGroup(group.id, patch)}
            onReset={() => resetGroup(group.id)}
            onMoveUp={() => moveGroup(index, -1)}
            onMoveDown={() => moveGroup(index, 1)}
            isFirst={index === 0}
            isLast={index === groups.length - 1}
          />
        ))}
      </section>
    </div>
  )
}
