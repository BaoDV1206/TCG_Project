'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from '@/lib/router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { CardSet, ProductDetail, ProductStatus } from '../../lib/types'
import { LANGUAGES, PRODUCT_STATUS } from '../../lib/constants'
import { PageLoader, Spinner } from '../../components/ui/Common'
import { ImageListInput, Toggle } from './AdminParts'
import { useAdminBrands, useAdminCategories } from './AdminProducts'
import { cn, formatPrice } from '../../lib/format'

interface FormState {
  name: string
  slug: string
  brandId: string
  categoryId: string
  setId: string
  language: string
  price: string
  originalPrice: string
  status: ProductStatus
  releaseDate: string
  depositPercent: string
  preorderLimit: string
  perUserLimit: string
  description: string
  specs: string
  featured: boolean
  isNew: boolean
  active: boolean
  images: string[]
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  brandId: '',
  categoryId: '',
  setId: '',
  language: 'EN',
  price: '',
  originalPrice: '',
  status: 'IN_STOCK',
  releaseDate: '',
  depositPercent: '30',
  preorderLimit: '',
  perUserLimit: '',
  description: '',
  specs: 'Số pack/box: \nSố thẻ/pack: ',
  featured: false,
  isNew: true,
  active: true,
  images: [],
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-4 p-4 md:p-5">
      <h3 className="font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  )
}

const num = (v: string) => (v === '' ? null : Number(v))

export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id || id === 'moi'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const { data: brands } = useAdminBrands()
  const { data: categories } = useAdminCategories()
  const brandSlug = brands?.find((b) => String(b.id) === form.brandId)?.slug
  const { data: sets } = useQuery({
    queryKey: ['admin-sets', brandSlug ?? ''],
    queryFn: () => api.get<CardSet[]>('/admin/sets', { brand: brandSlug }),
    enabled: !!brandSlug,
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get<ProductDetail>(`/admin/products/${id}`),
    enabled: !isNew,
  })

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name,
      slug: product.slug,
      brandId: String(product.brandId),
      categoryId: String(product.categoryId),
      setId: product.setId ? String(product.setId) : '',
      language: product.language,
      price: product.price !== null ? String(product.price) : '',
      originalPrice: product.originalPrice !== null ? String(product.originalPrice) : '',
      status: product.status,
      releaseDate: product.releaseDate ?? '',
      depositPercent: product.depositPercent !== null ? String(product.depositPercent) : '',
      preorderLimit: product.preorderLimit !== null ? String(product.preorderLimit) : '',
      perUserLimit: product.perUserLimit !== null ? String(product.perUserLimit) : '',
      description: product.description ?? '',
      specs: product.specs ?? '',
      featured: product.featured,
      isNew: product.isNew,
      active: product.active,
      images: product.images,
    })
  }, [product])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const digits = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/\D/g, '') as never)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.brandId || !form.categoryId) {
      toast.error('Vui lòng chọn thương hiệu và loại sản phẩm')
      return
    }
    if (form.status === 'PRE_ORDER' && !form.releaseDate) {
      toast.error('Sản phẩm đặt trước cần có ngày phát hành')
      return
    }
    setSaving(true)
    const body = {
      name: form.name,
      slug: form.slug || null,
      brandId: Number(form.brandId),
      categoryId: Number(form.categoryId),
      setId: form.setId ? Number(form.setId) : null,
      language: form.language,
      price: num(form.price),
      originalPrice: num(form.originalPrice),
      status: form.status,
      releaseDate: form.releaseDate || null,
      depositPercent: form.status === 'PRE_ORDER' ? num(form.depositPercent) : null,
      preorderLimit: form.status === 'PRE_ORDER' ? num(form.preorderLimit) : null,
      perUserLimit: form.status === 'PRE_ORDER' ? num(form.perUserLimit) : null,
      description: form.description,
      specs: form.specs,
      featured: form.featured,
      isNew: form.isNew,
      active: form.active,
      images: form.images,
    }
    try {
      const saved = isNew ? await api.post<ProductDetail>('/admin/products', body) : await api.put<ProductDetail>(`/admin/products/${id}`, body)
      toast.success(isNew ? 'Đã thêm sản phẩm' : 'Đã lưu thay đổi')
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['home'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.setQueryData(['admin-product', String(saved.id)], saved)
      if (isNew) navigate(`/admin/san-pham/${saved.id}`, { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <PageLoader />

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/admin/san-pham" className="rounded-lg p-2 text-gray-500 hover:bg-white" aria-label="Quay lại">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-extrabold">{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
        </div>
        {!isNew && product && (
          <a href={`/san-pham/${product.slug}`} target="_blank" rel="noreferrer" className="btn-outline">
            Xem trên web
          </a>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Section title="Thông tin cơ bản">
            <div>
              <label className="label" htmlFor="f-name">Tên sản phẩm *</label>
              <input id="f-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={200} placeholder="VD: One Piece OP-09 Booster Box (JP)" />
            </div>
            <div>
              <label className="label" htmlFor="f-slug">Đường dẫn (slug)</label>
              <input id="f-slug" className="input" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="Để trống để tự tạo từ tên" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="f-brand">Thương hiệu *</label>
                <select id="f-brand" className="input" value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value, setId: '' }))} required>
                  <option value="">-- Chọn --</option>
                  {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-cat">Loại sản phẩm *</label>
                <select id="f-cat" className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
                  <option value="">-- Chọn --</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-set">Set / Pack</label>
                <select id="f-set" className="input" value={form.setId} onChange={(e) => set('setId', e.target.value)} disabled={!brandSlug}>
                  <option value="">{brandSlug ? '-- Không thuộc set --' : 'Chọn thương hiệu trước'}</option>
                  {sets?.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} – ` : ''}{s.name}</option>)}
                </select>
                <Link to="/admin/set" className="mt-1 inline-block text-xs text-primary-700 hover:underline">+ Quản lý set</Link>
              </div>
              <div>
                <label className="label" htmlFor="f-lang">Ngôn ngữ *</label>
                <select id="f-lang" className="input" value={form.language} onChange={(e) => set('language', e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.flag} {l.label}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Hình ảnh">
            <ImageListInput value={form.images} onChange={(v) => set('images', v)} />
            <p className="text-xs text-gray-500">Ảnh đầu tiên là ảnh chính. Nếu chưa có ảnh, web sẽ tự hiển thị hình minh họa theo màu thương hiệu.</p>
          </Section>

          <Section title="Mô tả & thông số">
            <div>
              <label className="label" htmlFor="f-desc">Mô tả</label>
              <textarea id="f-desc" className="input min-h-32" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="f-specs">Thông số (mỗi dòng: Tên: Giá trị)</label>
              <textarea id="f-specs" className="input min-h-28 font-mono text-xs" value={form.specs} onChange={(e) => set('specs', e.target.value)} placeholder={'Số pack/box: 24\nSố thẻ/pack: 6\nĐộ hiếm: SAR\nTình trạng: Near Mint'} />
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Giá bán">
            <div>
              <label className="label" htmlFor="f-price">Giá bán (₫)</label>
              <input id="f-price" className="input" inputMode="numeric" value={form.price} onChange={digits('price')} placeholder="Để trống = hiển thị “Liên hệ”" />
              {form.price && <p className="mt-1 text-xs text-gray-500">{formatPrice(Number(form.price))}</p>}
            </div>
            <div>
              <label className="label" htmlFor="f-orig">Giá gốc (₫)</label>
              <input id="f-orig" className="input" inputMode="numeric" value={form.originalPrice} onChange={digits('originalPrice')} placeholder="Để hiện % giảm giá" />
            </div>
          </Section>

          <Section title="Trạng thái bán">
            <div className="grid gap-2">
              {(Object.keys(PRODUCT_STATUS) as ProductStatus[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => set('status', s)}
                  className={cn('flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold', form.status === s ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700')}
                >
                  {PRODUCT_STATUS[s].label}
                  <span className="text-xs font-normal text-gray-500">{s === 'IN_STOCK' ? 'Nút “Liên hệ”' : s === 'PRE_ORDER' ? 'Nút “Đặt trước”' : 'Nút “Báo khi có hàng”'}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="f-release">Ngày phát hành {form.status === 'PRE_ORDER' && '*'}</label>
              <input id="f-release" type="date" className="input" value={form.releaseDate} onChange={(e) => set('releaseDate', e.target.value)} />
            </div>
            {form.status === 'PRE_ORDER' && (
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-indigo-50 p-3">
                <div>
                  <label className="label text-xs" htmlFor="f-dep">% cọc</label>
                  <input id="f-dep" className="input" inputMode="numeric" value={form.depositPercent} onChange={digits('depositPercent')} />
                </div>
                <div>
                  <label className="label text-xs" htmlFor="f-lim">Tổng suất</label>
                  <input id="f-lim" className="input" inputMode="numeric" value={form.preorderLimit} onChange={digits('preorderLimit')} placeholder="∞" />
                </div>
                <div>
                  <label className="label text-xs" htmlFor="f-per">Tối đa/khách</label>
                  <input id="f-per" className="input" inputMode="numeric" value={form.perUserLimit} onChange={digits('perUserLimit')} placeholder="∞" />
                </div>
                {product?.remainingSlots !== null && product?.remainingSlots !== undefined && (
                  <p className="col-span-3 text-xs text-indigo-700">Hiện còn {product.remainingSlots} suất</p>
                )}
              </div>
            )}
          </Section>

          <Section title="Hiển thị">
            <div className="space-y-3">
              <Toggle checked={form.active} onChange={(v) => set('active', v)} label="Hiển thị trên website" />
              <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Sản phẩm nổi bật" />
              <Toggle checked={form.isNew} onChange={(v) => set('isNew', v)} label="Hàng mới về" />
            </div>
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-3 mt-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-4 md:mx-0 md:rounded-2xl md:border md:shadow-xl">
        <div className="flex justify-end gap-2">
          <Link to="/admin/san-pham" className="btn-outline">Hủy</Link>
          <button type="submit" className="btn-primary min-w-36" disabled={saving}>
            {saving ? <Spinner /> : <Save size={18} />} {isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  )
}
