import { useEffect, useState } from 'react'
import { Download, MoreVertical, Plus, Share, Smartphone, X } from 'lucide-react'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [open, setOpen] = useState(false)
  const [installed, setInstalled] = useState(() => isStandalone())

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setOpen(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 type-caption font-semibold text-muted">
        <Smartphone size={12} />
        已作为应用打开
      </span>
    )
  }

  const startInstall = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      setPromptEvent(null)
      return
    }
    setOpen(true)
  }

  const ios = isIos()
  const secureContext = window.isSecureContext

  return (
    <>
      <button
        type="button"
        onClick={startInstall}
        className="journal-button journal-button--secondary"
        title="添加到手机主屏幕"
      >
        <Download size={14} />
        安装到手机
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-3 pb-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="安装到手机主屏幕"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section className="w-full max-w-lg border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="journal-label text-accent">Install app</p>
                <h2 className="type-h2 mt-2 text-ink">添加到手机主屏幕</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-muted"
                aria-label="关闭安装说明"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {!secureContext && (
                <p className="border border-clay/40 bg-canvas p-3 type-caption font-semibold text-clay">
                  当前地址不是 HTTPS。手机浏览器只能从公网 HTTPS 地址安装 PWA，请先部署到 GitHub Pages 或使用自己的 HTTPS 域名。
                </p>
              )}
              {ios ? (
                <>
                  <div className="flex items-start gap-3 border-b border-line pb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-accent">
                      <Share size={15} />
                    </span>
                    <p className="type-small text-muted">
                      在 Safari 底部点击“分享”按钮。
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-line pb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-accent">
                      <Plus size={15} />
                    </span>
                    <p className="type-small text-muted">
                      在操作列表中选择“添加到主屏幕”，再点“添加”。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 border-b border-line pb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-accent">
                      <MoreVertical size={15} />
                    </span>
                    <p className="type-small text-muted">
                      在 Chrome 右上角打开菜单。
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-line pb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-accent">
                      <Download size={15} />
                    </span>
                    <p className="type-small text-muted">
                      选择“安装应用”或“添加到主屏幕”。
                    </p>
                  </div>
                </>
              )}
              <p className="type-caption text-muted">
                安装后可从主屏幕以独立窗口打开。攻略、提醒和已加载的地点信息可在离线时继续查看；地图底图需要至少联网加载过一次。
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
