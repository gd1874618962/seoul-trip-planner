import { useRef, useState } from 'react'
import { CalendarDays, ImagePlus, MapPin, Plus, X } from 'lucide-react'
import { createTripPlan } from '../data/store'

const assetBase = import.meta.env?.BASE_URL || './'

const coverPresets = [
  { label: '首尔', src: `${assetBase}images/seoul-hero.jpg` },
  { label: '吉隆坡', src: `${assetBase}images/kuala-lumpur-hero.jpg` },
]

function readCompressedImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-failed'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('decode-failed'))
      image.onload = () => {
        const maxSide = 960
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function Field({ label, value, onChange, type = 'text', placeholder, required = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block type-caption font-semibold text-muted">{label}</span>
      <input
        type={type}
        className="journal-input"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export default function TripCreator({ onClose, onCreated }) {
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    title: '',
    cityCn: '',
    city: '',
    countryCn: '',
    country: '',
    startDate: '',
    endDate: '',
    theme: '',
    coverImage: '',
  })
  const [coverBusy, setCoverBusy] = useState(false)
  const [error, setError] = useState('')

  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const uploadCover = async (file) => {
    if (!file) return
    setCoverBusy(true)
    setError('')
    try {
      patch('coverImage', await readCompressedImage(file))
    } catch {
      setError('封面图片读取失败，请换一张图片。')
    } finally {
      setCoverBusy(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.cityCn.trim() && !form.city.trim()) {
      setError('请至少填写旅行城市。')
      return
    }
    if (!form.startDate || !form.endDate) {
      setError('请填写开始和结束日期。')
      return
    }
    if (form.endDate < form.startDate) {
      setError('结束日期不能早于开始日期。')
      return
    }
    const tripId = createTripPlan(form)
    onCreated(tripId)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-3 pb-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="创建旅行计划"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-line bg-paper"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="journal-label text-accent">New journey</p>
            <h2 className="type-h2 mt-2 text-ink">创建旅行计划</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-muted"
            aria-label="关闭创建旅行窗口"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field
                label="计划名称"
                value={form.title}
                placeholder="例如：东京春日旅行"
                onChange={(value) => patch('title', value)}
              />
            </div>
            <Field
              label="城市（中文）"
              value={form.cityCn}
              placeholder="东京"
              required
              onChange={(value) => patch('cityCn', value)}
            />
            <Field
              label="城市（英文）"
              value={form.city}
              placeholder="Tokyo"
              onChange={(value) => patch('city', value)}
            />
            <Field
              label="国家（中文）"
              value={form.countryCn}
              placeholder="日本"
              onChange={(value) => patch('countryCn', value)}
            />
            <Field
              label="国家（英文）"
              value={form.country}
              placeholder="Japan"
              onChange={(value) => patch('country', value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="开始日期"
              type="date"
              value={form.startDate}
              required
              onChange={(value) => patch('startDate', value)}
            />
            <Field
              label="结束日期"
              type="date"
              value={form.endDate}
              required
              onChange={(value) => patch('endDate', value)}
            />
          </div>

          <Field
            label="旅行主题"
            value={form.theme}
            placeholder="美食 · 城市散步 · 演出"
            onChange={(value) => patch('theme', value)}
          />

          <section className="border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="type-small font-semibold text-ink">旅行封面</p>
                <p className="type-caption mt-1 text-muted">可选预设，或从手机相册选择一张图片</p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="journal-button journal-button--secondary"
              >
                <ImagePlus size={13} />
                {coverBusy ? '处理中' : '选择图片'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => uploadCover(event.target.files?.[0])}
              />
            </div>
            {form.coverImage && (
              <div className="journal-media mt-3 aspect-[16/9]">
                <img src={form.coverImage} alt="旅行封面预览" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {coverPresets.map((cover) => (
                <button
                  key={cover.label}
                  type="button"
                  onClick={() => patch('coverImage', cover.src)}
                  className="journal-filter"
                  data-active={form.coverImage === cover.src}
                >
                  {cover.label}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-2 border-t border-line pt-4">
            <p className="flex items-center gap-2 type-caption text-muted">
              <MapPin size={12} className="text-accent" />
              新计划会从空白行程开始，可继续在地点搜索中添加路线。
            </p>
            <p className="flex items-center gap-2 type-caption text-muted">
              <CalendarDays size={12} className="text-accent" />
              日期会自动生成每天的时间线，后续可自由编辑。
            </p>
          </div>
          {error && <p className="type-small font-semibold text-clay">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-paper p-4">
          <button type="button" onClick={onClose} className="journal-button journal-button--secondary flex-1">
            取消
          </button>
          <button
            type="submit"
            disabled={coverBusy}
            className="journal-button journal-button--primary flex-1"
          >
            <Plus size={14} />
            创建并打开
          </button>
        </div>
      </form>
    </div>
  )
}
