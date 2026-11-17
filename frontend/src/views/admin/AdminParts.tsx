'use client'

import { useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Common'
import { cn } from '../../lib/format'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-outline flex-1" onClick={onClose}>
            Hủy
          </button>
          <button className={cn('btn flex-1 text-white', danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-700 hover:bg-primary-800')} disabled={loading} onClick={onConfirm}>
            {loading && <Spinner />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-gray-600">{message}</div>
    </Modal>
  )
}

/** Upload / nhập URL ảnh, hỗ trợ nhiều ảnh và sắp xếp thứ tự */
export function ImageListInput({ value, onChange, max = 5 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  // mặc định 5 ảnh, khớp với giới hạn ở backend (ProductService.MAX_IMAGES)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      const room = max - value.length
      if (files.length > room) toast.warning(`Chỉ được tối đa ${max} ảnh, đã lấy ${room} ảnh đầu tiên`)
      for (const f of Array.from(files).slice(0, room)) urls.push(await api.upload(f))
      onChange([...value, ...urls])
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  const move = (i: number, d: number) => {
    const next = [...value]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={src + i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary-700 px-1.5 text-[10px] font-bold text-white">Ảnh chính</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 py-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded p-0.5 text-white hover:bg-white/20" aria-label="Lên">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="rounded p-0.5 text-white hover:bg-white/20" aria-label="Xuống">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, x) => x !== i))} className="rounded p-0.5 text-red-300 hover:bg-white/20" aria-label="Xóa">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-700">
            {uploading ? <Spinner /> : <ImagePlus size={22} />}
            Tải ảnh
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => upload(e.target.files)} />
      {max > 1 && (
        <p className="mt-2 text-xs text-gray-500">
          {value.length}/{max} ảnh · Ảnh đầu tiên là ảnh chính, dùng mũi tên để đổi thứ tự.
        </p>
      )}
      {value.length < max && (
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Hoặc dán URL ảnh..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              if (url.trim()) {
                onChange([...value, url.trim()])
                setUrl('')
              }
            }}
          >
            Thêm
          </button>
        </div>
      )}
    </div>
  )
}

export function SingleImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ImageListInput value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? '')} max={1} />
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-emerald-500' : 'bg-gray-300')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
      {label && <span className="text-gray-700">{label}</span>}
    </label>
  )
}

export function StatCard({ label, value, icon, tone, hint }: { label: string; value: ReactNode; icon: ReactNode; tone: string; hint?: ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900 tabular-nums">{value}</p>
        {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  )
}
