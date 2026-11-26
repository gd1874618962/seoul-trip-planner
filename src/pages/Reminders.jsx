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
import {
  getReminderCheckKey,
  getReminderOverrides,
  getReminders,
  isDefaultReminderGroup,
  saveReminderOverrides,
} from '../data/store'
import PageHeader from '../components/PageHeader'

const iconMap = {
  receipt: ReceiptText,
  plane: Plane,
  music: Music4,
  bag: ShoppingBag,
  sun: SunMedium,
}

function useChecks(id, count) {
  const key = getReminderCheckKey(id)
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

function ReminderCard({
  group,
  editing,
  onChange,
  onReset,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
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
    <section className="border-b border-line py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-accent">
            <Icon size={15} strokeWidth={1.5} />
          </span>
          {editing ? (
            <input
              value={group.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="journal-input w-48"
            />
          ) : (
            <div>
              <h2 className="type-h2 text-ink">{group.title}</h2>
              <p className="type-caption font-semibold text-muted">
                {done} / {group.items.length} 已完成
              </p>
            </div>
          )}
        </div>
        {editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center border border-line text-clay"
              aria-label="删除整个提醒块"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
              aria-label="整组上移"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
              aria-label="整组下移"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}
        {!editing && (
          <div className="h-px w-16 overflow-hidden bg-line">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${group.items.length ? (done / group.items.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
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
                className="journal-input min-w-0 flex-1"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
                  aria-label="上移"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === group.items.length - 1}
                  className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-muted disabled:opacity-30"
                  aria-label="下移"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ items: group.items.filter((_, i) => i !== index) })}
                  className="flex h-8 w-8 items-center justify-center border border-line text-clay"
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
              className="flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-b-0"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  checks[index] ? 'border-accent bg-accent text-paper' : 'border-line bg-paper text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              <span className={`type-small flex-1 ${checks[index] ? 'text-muted/60 line-through' : 'text-ink'}`}>
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
            className="journal-button journal-button--quiet"
          >
            <Plus size={13} />
            添加一条
          </button>
          <button
            type="button"
            onClick={onReset}
            className="journal-button journal-button--quiet"
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

  const addGroup = () => {
    const id = `reminder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const order = Array.isArray(overrides.__order)
      ? overrides.__order
      : groups.map((g) => g.id)
    persist({
      ...overrides,
      [id]: { title: '新提醒块', items: ['新提醒内容'] },
      __order: [...order, id],
    })
  }

  const deleteGroup = (id) => {
    const group = groups.find((g) => g.id === id)
    if (!window.confirm(`确定删除“${group?.title || '这个提醒块'}”吗？`)) return
    const next = { ...overrides }
    if (isDefaultReminderGroup(id)) {
      next[id] = { _deleted: true }
    } else {
      delete next[id]
    }
    if (Array.isArray(next.__order)) {
      next.__order = next.__order.filter((gid) => gid !== id)
    }
    persist(next)
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
              全部恢复默认
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="journal-button journal-button--secondary"
          >
            <Pencil size={14} />
            编辑提醒
          </button>
        )}
        <span className="type-caption text-muted">
          {editing ? '改完自动保存到本机' : '勾选状态会保存在本机'}
        </span>
      </div>

      <section className="mx-5 mt-5 pb-12 lg:mx-10">
        {groups.length === 0 && !editing && (
          <div className="journal-empty">
            <ClipboardList size={22} className="mx-auto text-accent" />
            <p className="type-small mt-3 font-semibold text-ink">还没有提醒清单</p>
            <p className="type-small mt-1 text-muted">进入编辑模式后可以新增机场、演唱会和行李提醒。</p>
          </div>
        )}
        {groups.map((group, index) => (
          <ReminderCard
            key={group.id}
            group={group}
            editing={editing}
            onChange={(patch) => updateGroup(group.id, patch)}
            onReset={() => resetGroup(group.id)}
            onMoveUp={() => moveGroup(index, -1)}
            onMoveDown={() => moveGroup(index, 1)}
            onDelete={() => deleteGroup(group.id)}
            isFirst={index === 0}
            isLast={index === groups.length - 1}
          />
        ))}
        {editing && (
          <button
            type="button"
            onClick={addGroup}
            className="journal-button journal-button--secondary mt-4 w-full"
          >
            <Plus size={15} />
            新增提醒块
          </button>
        )}
      </section>
    </div>
  )
}
