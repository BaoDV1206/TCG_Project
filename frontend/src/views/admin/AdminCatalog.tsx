'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { Brand, Category } from '../../lib/types'
import { Modal } from '../../components/ui/Modal'
import { Skeleton, Spinner } from '../../components/ui/Common'
import { ConfirmDialog, PageHeader, SingleImageInput, Toggle } from './AdminParts'
import { useAdminBrands, useAdminCategories } from './AdminProducts'
import { cn } from '../../lib/format'

function useInvalidateCatalog() {
  const qc = useQueryClient()
  return () => {
    ;['admin-brands', 'admin-categories', 'brands', 'categories', 'home', 'admin-sets', 'sets'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
  }
}

function BrandForm({ brand, onClose }: { brand: Brand | 'new'; onClose: () => void }) {
  const invalidate = useInvalidateCatalog()
  const init = brand === 'new' ? null : brand
  const [f, setF] = useState({
    name: init?.name ?? '',
    slug: init?.slug ?? '',
    color: init?.color ?? '#b91c1c',
    logoUrl: init?.logoUrl ?? '',
    sortOrder: String(init?.sortOrder ?? 0),
    active: init?.active ?? true,
  })
  const m = useMutation({
    mutationFn: () => {
      const body = { ...f, sortOrder: Number(f.sortOrder) || 0 }
      return init ? api.put(`/admin/brands/${init.id}`, body) : api.post('/admin/brands', body)
    },
    onSuccess: () => {
      toast.success('Đã lưu thương hiệu')
      invalidate()
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    m.mutate()
  }
  return (
    <Modal open onClose={onClose} title={init ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}>
      <form id="brand-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="b-name">Tên *</label>
          <input id="b-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="b-slug">Slug</label>
            <input id="b-slug" className="input" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="Tự tạo" />
          </div>
          <div>
            <label className="label" htmlFor="b-order">Thứ tự</label>
            <input id="b-order" type="number" className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="b-color">Màu đại diện</label>
          <div className="flex items-center gap-2">
            <input id="b-color" type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
            <input className="input" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
          </div>
        </div>
        <div>
          <span className="label">Logo</span>
          <SingleImageInput value={f.logoUrl} onChange={(v) => setF({ ...f, logoUrl: v })} />
        </div>
        <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Hiển thị trên website" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={m.isPending}>{m.isPending && <Spinner />} Lưu</button>
        </div>
      </form>
    </Modal>
  )
}

function CategoryForm({ category, onClose }: { category: Category | 'new'; onClose: () => void }) {
  const invalidate = useInvalidateCatalog()
  const init = category === 'new' ? null : category
  const [f, setF] = useState({ name: init?.name ?? '', slug: init?.slug ?? '', sortOrder: String(init?.sortOrder ?? 0) })
  const m = useMutation({
    mutationFn: () => {
      const body = { ...f, sortOrder: Number(f.sortOrder) || 0 }
      return init ? api.put(`/admin/categories/${init.id}`, body) : api.post('/admin/categories', body)
    },
    onSuccess: () => {
      toast.success('Đã lưu loại sản phẩm')
      invalidate()
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open onClose={onClose} title={init ? 'Sửa loại sản phẩm' : 'Thêm loại sản phẩm'} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          m.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="label" htmlFor="c-name">Tên *</label>
          <input id="c-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="c-slug">Slug</label>
            <input id="c-slug" className="input" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="Tự tạo" />
          </div>
          <div>
            <label className="label" htmlFor="c-order">Thứ tự</label>
            <input id="c-order" type="number" className="input" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={m.isPending}>{m.isPending && <Spinner />} Lưu</button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminCatalog() {
  const [tab, setTab] = useState<'brands' | 'categories'>('brands')
  const { data: brands, isLoading: lb } = useAdminBrands()
  const { data: categories, isLoading: lc } = useAdminCategories()
  const [editBrand, setEditBrand] = useState<Brand | 'new' | null>(null)
  const [editCat, setEditCat] = useState<Category | 'new' | null>(null)
  const [del, setDel] = useState<{ kind: 'brands' | 'categories'; id: number; name: string } | null>(null)
  const invalidate = useInvalidateCatalog()
  const delM = useMutation({
    mutationFn: () => api.del(`/admin/${del!.kind}/${del!.id}`),
    onSuccess: () => {
      toast.success('Đã xóa')
      invalidate()
      setDel(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader
        title="Thương hiệu & Loại sản phẩm"
        actions={
          <button className="btn-primary" onClick={() => (tab === 'brands' ? setEditBrand('new') : setEditCat('new'))}>
            <Plus size={18} /> {tab === 'brands' ? 'Thêm thương hiệu' : 'Thêm loại'}
          </button>
        }
      />
      <div className="mb-4 inline-flex rounded-xl bg-white p-1 shadow-card">
        {(['brands', 'categories'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-lg px-4 py-2 text-sm font-semibold', tab === t ? 'bg-primary-700 text-white' : 'text-gray-600')}>
            {t === 'brands' ? `Thương hiệu (${brands?.length ?? 0})` : `Loại sản phẩm (${categories?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === 'brands' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lb && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          {brands?.map((b) => (
            <div key={b.id} className={cn('card flex items-center gap-3 p-4', !b.active && 'opacity-60')}>
              {b.logoUrl ? (
                <img src={b.logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white" style={{ background: b.color ?? '#999' }}>
                  {b.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{b.name}</p>
                <p className="text-xs text-gray-500">/{b.slug} · thứ tự {b.sortOrder}{!b.active && ' · đang ẩn'}</p>
              </div>
              <button onClick={() => setEditBrand(b)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={17} /></button>
              <button onClick={() => setDel({ kind: 'brands', id: b.id, name: b.name })} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {lc && <Skeleton className="m-4 h-10" />}
          {categories?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 text-center text-sm text-gray-400">{c.sortOrder}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500">/{c.slug}</p>
              </div>
              <button onClick={() => setEditCat(c)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={17} /></button>
              <button onClick={() => setDel({ kind: 'categories', id: c.id, name: c.name })} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      )}

      {editBrand && <BrandForm brand={editBrand} onClose={() => setEditBrand(null)} />}
      {editCat && <CategoryForm category={editCat} onClose={() => setEditCat(null)} />}
      <ConfirmDialog
        open={!!del}
        danger
        title="Xác nhận xóa"
        confirmLabel="Xóa"
        loading={delM.isPending}
        message={<>Xóa <b>{del?.name}</b>? Không thể xóa nếu đang có sản phẩm/set sử dụng.</>}
        onConfirm={() => delM.mutate()}
        onClose={() => setDel(null)}
      />
    </div>
  )
}
