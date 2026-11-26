import { useRef, useState } from 'react'
import { Check, Copy, Share2, ShieldAlert, X } from 'lucide-react'

export default function ShareSheet({ title, url, onClose }) {
  const inputRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      inputRef.current?.focus()
      inputRef.current?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const share = async () => {
    try {
      await navigator.share({
        title: `${title} · 小韩之旅`,
        text: '这是一份只读旅行计划分享链接。',
        url,
      })
    } catch {
      /* User cancelled the native share sheet. */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-3 pb-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="分享旅行计划"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="journal-panel w-full max-w-xl border border-line bg-paper">
        <div className="flex items-center justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="journal-label text-accent">Share this journey</p>
            <h2 className="type-h2 mt-2 text-ink">分享「{title}」</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-muted"
            aria-label="关闭分享窗口"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="flex items-start gap-2 border-b border-line pb-4 type-small text-muted">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-clay" />
            这是公开访问的只读链接，任何拿到链接的人都能查看。它只包含这一份旅行计划的攻略快照，不会自动更新，也不会公开其他旅行。
          </p>
          <label className="mt-4 block">
            <span className="mb-1 block type-caption font-semibold text-muted">分享链接</span>
            <textarea
              ref={inputRef}
              className="journal-input min-h-24 resize-none"
              value={url}
              readOnly
              onFocus={(event) => event.target.select()}
            />
          </label>
          <p className="mt-2 type-caption text-muted">
            链接长度约 {Math.ceil(url.length / 1024)} KB。发送时请确保完整复制，不要截断后半段。
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copy}
              className="journal-button journal-button--secondary"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制链接'}
            </button>
            {canNativeShare ? (
              <button
                type="button"
                onClick={share}
                className="journal-button journal-button--primary"
              >
                <Share2 size={14} />
                系统分享
              </button>
            ) : (
              <button
                type="button"
                onClick={copy}
                className="journal-button journal-button--primary"
              >
                <Share2 size={14} />
                分享 / 复制
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
