import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { Brand, Category, PageResponse, ProductCard } from '../../lib/types'
import { PRODUCT_STATUS } from '../../lib/constants'
import { useDebounce } from '../../hooks/queries'
import { EmptyState, Pagination, Skeleton } from '../../components/ui/Common'
import { ProductArt } from '../../components/product/ProductArt'
import { ConfirmDialog, PageHeader, Toggle } from './AdminParts'
import { cn, formatDate, formatPrice } from '../../lib/format'

export function useAdminBrands() {
  return useQuery({ queryKey: ['admin-brands'], queryFn: () => api.get<Brand[]>('/admin/brands') })
}
export function useAdminCategories() {
  return useQuery({ queryKey: ['admin-categories'], queryFn: () => api.get<Category[]>('/admin/categories') })
}

export default function AdminProducts() {
  const [params, setParams] = useSearchParams()
  const qc = useQueryClient()
  const [q, setQ] = useState(params.get('q') ?? '')
  const dq = useDebounce(q, 350)
  const [toDelete, setToDelete] = useState<ProductCard | null>(null)
  const { data: brands } = useAdminBrands()
  const { data: categories } = useAdminCategories()

  const get = (k: string) => params.get(k) ?? ''
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }
  const query = { q: dq, brand: get('brand'), category: get('category'), status: get('status'), active: get('active'), sort: get('sort') || 'newest', page: Number(get('page') || 0), size: 20 }
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', query],
    queryFn: () => api.get<PageResponse<ProductCard>>('/admin/products', query),
    placeholderData: (prev) => prev,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    qc.invalidateQueries({ queryKey: ['home'] })
    qc.invalidateQueries({ queryKey: ['products'] })
  }
  const toggle = useMutation({
    mutationFn: (p: ProductCard) => api.patch(`/admin/products/${p.id}/active`, { value: !p.active }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const del = useMutation({
    mutationFn: (id: number) => api.del(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa sản phẩm')
      setToDelete(null)
      refresh()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        description={data ? `${data.totalElements} sản phẩm` : undefined}
        actions={
          <Link to="/admin/san-pham/moi" className="btn-primary">
            <Plus size={18} /> Thêm sản phẩm
          </Link>
        }
      />
      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tên, mã set..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={get('brand')} onChange={(e) => set('brand', e.target.value)}>
          <option value="">Mọi thương hiệu</option>
          {brands?.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>
        <select className="input" value={get('category')} onChange={(e) => set('category', e.target.value)}>
          <option value="">Mọi loại</option>
          {categories?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input" value={get('status')} onChange={(e) => set('status', e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(PRODUCT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" value={get('active')} onChange={(e) => set('active', e.target.value)}>
          <option value="">Hiển thị: tất cả</option>
          <option value="true">Đang hiển thị</option>
          <option value="false">Đang ẩn</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[64px_1fr_140px_130px_90px_110px] gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500 lg:grid">
          <span>Ảnh</span>
          <span>Sản phẩm</span>
          <span>Giá</span>
          <span>Trạng thái</span>
          <span>Hiển thị</span>
          <span className="text-right">Thao tác</span>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="m-3 h-14" />)}
          {data?.items.map((p) => (
            <div key={p.id} className={cn('grid grid-cols-[56px_1fr_auto] items-center gap-3 px-3 py-3 lg:grid-cols-[64px_1fr_140px_130px_90px_110px] lg:px-4', !p.active && 'opacity-60')}>
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100 lg:h-16 lg:w-16">
                <ProductArt src={p.thumbnail} name={p.name} brandName={p.brandName} brandColor={p.brandColor} setCode={p.setCode} categoryName={p.categoryName} size="sm" />
              </div>
              <div className="min-w-0">
                <Link to={`/admin/san-pham/${p.id}`} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary-700">{p.name}</Link>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.brandName} · {p.categoryName} · {p.language}
                  {p.setCode && ` · ${p.setCode}`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 lg:hidden">
                  <span className="text-sm font-bold text-primary-700">{formatPrice(p.price)}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold', PRODUCT_STATUS[p.status].className)}>{PRODUCT_STATUS[p.status].label}</span>
                </div>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-primary-700">{formatPrice(p.price)}</p>
                {p.originalPrice && <p className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</p>}
              </div>
              <div className="hidden lg:block">
                <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', PRODUCT_STATUS[p.status].className)}>{PRODUCT_STATUS[p.status].label}</span>
                {p.status === 'PRE_ORDER' && <p className="mt-1 text-[11px] text-gray-500">{formatDate(p.releaseDate)} · còn {p.remainingSlots ?? '∞'}</p>}
              </div>
              <div className="hidden lg:block">
                <Toggle checked={p.active} onChange={() => toggle.mutate(p)} />
              </div>
              <div className="flex items-center justify-end gap-0.5">
                <span className="lg:hidden"><Toggle checked={p.active} onChange={() => toggle.mutate(p)} /></span>
                <a href={`/san-pham/${p.slug}`} target="_blank" rel="noreferrer" className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:block" title="Xem trên web">
                  <ExternalLink size={17} />
                </a>
                <Link to={`/admin/san-pham/${p.id}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-700" title="Sửa">
                  <Pencil size={17} />
                </Link>
                <button onClick={() => setToDelete(p)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Xóa">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {data?.items.length === 0 && <EmptyState title="Không có sản phẩm" />}
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => set('page', p ? String(p) : '')} />}

      <ConfirmDialog
        open={!!toDelete}
        title="Xóa sản phẩm"
        danger
        loading={del.isPending}
        confirmLabel="Xóa"
        message={<>Xóa vĩnh viễn <b>{toDelete?.name}</b>? Các yêu cầu cũ vẫn được giữ lại. Nếu chỉ muốn tạm ngừng bán, hãy tắt <b>Hiển thị</b>.</>}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
