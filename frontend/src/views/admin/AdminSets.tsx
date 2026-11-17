'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { CardSet } from '../../lib/types'
import { Modal } from '../../components/ui/Modal'
import { EmptyState, Skeleton, Spinner } from '../../components/ui/Common'
import { ConfirmDialog, PageHeader, SingleImageInput } from './AdminParts'
import { useAdminBrands } from './AdminProducts'
import { formatDate } from '../../lib/format'

function SetForm({ set, onClose }: { set: CardSet | 'new'; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: brands } = useAdminBrands()
  const init = set === 'new' ? null : set
  const [f, setF] = useState({
    brandId: init ? String(init.brandId) : '',
    code: init?.code ?? '',
    name: init?.name ?? '',
    alias: init?.alias ?? '',
    slug: init?.slug ?? '',
    releaseDate: init?.releaseDate ?? '',
    imageUrl: init?.imageUrl ?? '',
    description: init?.description ?? '',
  })
  const m = useMutation({
    mutationFn: () => {
      const body = { ...f, brandId: Number(f.brandId), releaseDate: f.releaseDate || null, slug: f.slug || null }
      return init ? api.put(`/admin/sets/${init.id}`, body) : api.post('/admin/sets', body)
    },
    onSuccess: () => {
      toast.success('Đã lưu set')
      ;['admin-sets', 'sets', 'set'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open onClose={onClose} title={init ? 'Sửa set' : 'Thêm set'} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.brandId) return toast.error('Vui lòng chọn thương hiệu')
          m.mutate()
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <div>
            <label className="label" htmlFor="s-brand">Thương hiệu *</label>
            <select id="s-brand" className="input" value={f.brandId} onChange={(e) => setF({ ...f, brandId: e.target.value })} required>
              <option value="">-- Chọn --</option>
              {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-code">Mã set</label>
            <input id="s-code" className="input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="OP-09, SV8..." />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-name">Tên set *</label>
          <input id="s-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="Emperors in the New World" />
        </div>
        <div>
          <label className="label" htmlFor="s-alias">Tên gọi khác (phân tách bằng dấu phẩy)</label>
          <input id="s-alias" className="input" value={f.alias} onChange={(e) => setF({ ...f, alias: e.target.value })} placeholder="Tứ Hoàng, Four Emperors" />
          <p className="mt-1 text-xs text-gray-500">Giúp khách tìm thấy set khi gõ tên tiếng Việt / tên Nhật / tên viết tắt.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-slug">Slug</label>
            <input id="s-slug" className="input" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="Tự tạo" />
          </div>
          <div>
            <label className="label" htmlFor="s-date">Ngày phát hành</label>
            <input id="s-date" type="date" className="input" value={f.releaseDate} onChange={(e) => setF({ ...f, releaseDate: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-desc">Mô tả</label>
          <textarea id="s-desc" className="input min-h-20" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <div>
          <span className="label">Ảnh set</span>
          <SingleImageInput value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={m.isPending}>{m.isPending && <Spinner />} Lưu</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminSets() {
  const qc = useQueryClient()
  const [brand, setBrand] = useState('')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<CardSet | 'new' | null>(null)
  const [del, setDel] = useState<CardSet | null>(null)
  const { data: brands } = useAdminBrands()
  const { data, isLoading } = useQuery({ queryKey: ['admin-sets', brand], queryFn: () => api.get<CardSet[]>('/admin/sets', { brand }) })
  const items = useMemo(() => {
    const k = q.trim().toLowerCase()
    return (data ?? []).filter((s) => !k || `${s.code ?? ''} ${s.name} ${s.alias ?? ''}`.toLowerCase().includes(k))
  }, [data, q])
  const delM = useMutation({
    mutationFn: () => api.del(`/admin/sets/${del!.id}`),
    onSuccess: () => {
      toast.success('Đã xóa set')
      qc.invalidateQueries({ queryKey: ['admin-sets'] })
      qc.invalidateQueries({ queryKey: ['sets'] })
      setDel(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader
        title="Set / Pack"
        description="Mỗi set gom các box, pack, thẻ lẻ cùng bộ – khách có thể tìm theo mã hoặc tên set."
        actions={<button className="btn-primary" onClick={() => setEdit('new')}><Plus size={18} /> Thêm set</button>}
      />
      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tìm mã / tên set..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Mọi thương hiệu</option>
          {brands?.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>
      </div>
      <div className="card divide-y divide-gray-100 overflow-hidden">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-3 h-12" />)}
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-3 md:px-4">
            <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white" style={{ background: s.brandColor ?? '#999' }}>
              {s.code ?? '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="truncate text-xs text-gray-500">
                {s.brandName}
                {s.releaseDate && ` · ${formatDate(s.releaseDate)}`} · {s.productCount} sản phẩm
                {s.alias && ` · ${s.alias}`}
              </p>
            </div>
            <Link to={`/set/${s.slug}`} target="_blank" className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:block" aria-label="Xem"><ExternalLink size={17} /></Link>
            <button onClick={() => setEdit(s)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={17} /></button>
            <button onClick={() => setDel(s)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={17} /></button>
          </div>
        ))}
        {!isLoading && items.length === 0 && <EmptyState title="Chưa có set" />}
      </div>
      {edit && <SetForm set={edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog
        open={!!del}
        danger
        title="Xóa set"
        confirmLabel="Xóa"
        loading={delM.isPending}
        message={<>Xóa set <b>{del?.code} {del?.name}</b>? Không thể xóa nếu còn sản phẩm thuộc set.</>}
        onConfirm={() => delM.mutate()}
        onClose={() => setDel(null)}
      />
    </div>
  )
}
