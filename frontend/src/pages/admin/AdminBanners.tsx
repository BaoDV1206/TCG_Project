import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { Banner } from '../../lib/types'
import { Modal } from '../../components/ui/Modal'
import { Skeleton, Spinner } from '../../components/ui/Common'
import { BannerContent } from '../../components/product/BannerSlider'
import { ConfirmDialog, PageHeader, SingleImageInput, Toggle } from './AdminParts'
import { cn } from '../../lib/format'

const PRESETS = [
  'linear-gradient(135deg,#450a0a 0%,#b91c1c 55%,#f97316 100%)',
  'linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#facc15 100%)',
  'linear-gradient(135deg,#0f172a 0%,#4338ca 60%,#a855f7 100%)',
  'linear-gradient(135deg,#c2410c 0%,#f59e0b 100%)',
  'linear-gradient(135deg,#0f766e 0%,#06b6d4 100%)',
  'linear-gradient(135deg,#111827 0%,#374151 100%)',
]

function BannerForm({ banner, onClose }: { banner: Banner | 'new'; onClose: () => void }) {
  const qc = useQueryClient()
  const init = banner === 'new' ? null : banner
  const [f, setF] = useState({
    title: init?.title ?? '',
    subtitle: init?.subtitle ?? '',
    imageUrl: init?.imageUrl ?? '',
    link: init?.link ?? '',
    bgColor: init?.bgColor ?? PRESETS[0],
    position: init?.position ?? 'MAIN',
    sortOrder: String(init?.sortOrder ?? 0),
    active: init?.active ?? true,
  })
  const preview: Banner = { id: 0, ...f, title: f.title || null, subtitle: f.subtitle || null, imageUrl: f.imageUrl || null, link: f.link || null, sortOrder: 0 } as Banner
  const m = useMutation({
    mutationFn: () => {
      const body = { ...f, sortOrder: Number(f.sortOrder) || 0 }
      return init ? api.put(`/admin/banners/${init.id}`, body) : api.post('/admin/banners', body)
    },
    onSuccess: () => {
      toast.success('Đã lưu banner')
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      qc.invalidateQueries({ queryKey: ['home'] })
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open onClose={onClose} title={init ? 'Sửa banner' : 'Thêm banner'} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          m.mutate()
        }}
        className="space-y-4"
      >
        <div className={cn('overflow-hidden rounded-2xl', f.position === 'MAIN' ? 'aspect-[16/7]' : 'mx-auto aspect-[16/10] max-w-xs')}>
          <BannerContent b={preview} small={f.position === 'SIDE'} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bn-pos">Vị trí</label>
            <select id="bn-pos" className="input" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value as 'MAIN' | 'SIDE' })}>
              <option value="MAIN">Banner chính (slider)</option>
              <option value="SIDE">Banner phụ (bên phải)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bn-order">Thứ tự</label>
            <input id="bn-order" type="number" className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bn-title">Tiêu đề</label>
          <input id="bn-title" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="bn-sub">Mô tả ngắn</label>
          <input id="bn-sub" className="input" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="bn-link">Link khi bấm</label>
          <input id="bn-link" className="input" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/dat-truoc hoặc https://..." />
        </div>
        <div>
          <span className="label">Nền (khi không dùng ảnh)</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button type="button" key={p} onClick={() => setF({ ...f, bgColor: p })} className={cn('h-9 w-14 rounded-lg ring-offset-2', f.bgColor === p && 'ring-2 ring-primary-600')} style={{ background: p }} aria-label="Chọn nền" />
            ))}
          </div>
          <input className="input mt-2 font-mono text-xs" value={f.bgColor} onChange={(e) => setF({ ...f, bgColor: e.target.value })} />
        </div>
        <div>
          <span className="label">Ảnh banner (nếu có sẽ thay cho nền + chữ)</span>
          <SingleImageInput value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
        </div>
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Đang hiển thị" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={m.isPending}>{m.isPending && <Spinner />} Lưu</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminBanners() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: () => api.get<Banner[]>('/admin/banners') })
  const [edit, setEdit] = useState<Banner | 'new' | null>(null)
  const [del, setDel] = useState<Banner | null>(null)
  const delM = useMutation({
    mutationFn: () => api.del(`/admin/banners/${del!.id}`),
    onSuccess: () => {
      toast.success('Đã xóa banner')
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      qc.invalidateQueries({ queryKey: ['home'] })
      setDel(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const group = (pos: 'MAIN' | 'SIDE') => data?.filter((b) => b.position === pos) ?? []

  return (
    <div>
      <PageHeader title="Banner trang chủ" actions={<button className="btn-primary" onClick={() => setEdit('new')}><Plus size={18} /> Thêm banner</button>} />
      {isLoading && <Skeleton className="h-40 rounded-2xl" />}
      {(['MAIN', 'SIDE'] as const).map((pos) => (
        <section key={pos} className="mb-6">
          <h3 className="mb-2 text-sm font-bold uppercase text-gray-500">{pos === 'MAIN' ? 'Banner chính (slider)' : 'Banner phụ'}</h3>
          <div className={cn('grid gap-3', pos === 'MAIN' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
            {group(pos).map((b) => (
              <div key={b.id} className={cn('card overflow-hidden', !b.active && 'opacity-50')}>
                <div className={pos === 'MAIN' ? 'aspect-[16/7]' : 'aspect-[16/9]'}>
                  <BannerContent b={b} small />
                </div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                    #{b.sortOrder} · {b.link ?? 'không có link'} {!b.active && '· đang ẩn'}
                  </span>
                  <button onClick={() => setEdit(b)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={16} /></button>
                  <button onClick={() => setDel(b)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {data && group(pos).length === 0 && <p className="text-sm text-gray-400">Chưa có banner.</p>}
          </div>
        </section>
      ))}
      {edit && <BannerForm banner={edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} danger title="Xóa banner" confirmLabel="Xóa" loading={delM.isPending} message="Xóa banner này?" onConfirm={() => delM.mutate()} onClose={() => setDel(null)} />
    </div>
  )
}
