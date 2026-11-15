import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, ChevronDown, Layers, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/api'
import type { CardSet, PageResponse, ProductCard } from '../lib/types'
import { useBrands, useCategories, useSets } from '../hooks/queries'
import { LANGUAGES, PRICE_RANGES, SORT_OPTIONS } from '../lib/constants'
import { ProductGrid } from '../components/product/ProductCard'
import { Breadcrumb, EmptyState, Pagination } from '../components/ui/Common'
import { Modal } from '../components/ui/Modal'
import { cn, formatDate, formatNumber } from '../lib/format'

const MULTI_KEYS = ['brand', 'category', 'set', 'language'] as const

function useFilterParams() {
  const [params, setParams] = useSearchParams()
  const get = (k: string) => params.get(k) ?? ''
  const list = (k: string) => get(k).split(',').filter(Boolean)

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    })
    if (resetPage) next.delete('page')
    setParams(next)
  }
  const toggle = (k: string, value: string) => {
    const cur = list(k)
    const nextList = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]
    update({ [k]: nextList.join(',') || null })
  }
  return { params, get, list, update, toggle }
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-bold text-gray-900">
        {title}
        <ChevronDown size={16} className={cn('text-gray-400 transition', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  )
}

function CheckItem({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-md py-1 text-left text-sm text-gray-700 hover:text-primary-700">
      <span className={cn('flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border', checked ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300')}>
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}

function FilterPanel({ lockedSet }: { lockedSet?: boolean }) {
  const f = useFilterParams()
  const { data: brands } = useBrands()
  const { data: categories } = useCategories()
  const { data: allSets } = useSets()
  const [setQuery, setSetQuery] = useState('')
  const selectedBrands = f.list('brand')
  const sets = useMemo(() => {
    const q = setQuery.trim().toLowerCase()
    return (allSets ?? [])
      .filter((s) => selectedBrands.length === 0 || selectedBrands.includes(s.brandSlug))
      .filter((s) => !q || `${s.code ?? ''} ${s.name} ${s.alias ?? ''}`.toLowerCase().includes(q))
  }, [allSets, selectedBrands, setQuery])
  const [minP, setMinP] = useState(f.get('minPrice'))
  const [maxP, setMaxP] = useState(f.get('maxPrice'))

  return (
    <div>
      <FilterSection title="Thương hiệu">
        <div className="space-y-0.5">
          {brands?.map((b) => (
            <CheckItem key={b.id} checked={selectedBrands.includes(b.slug)} onClick={() => f.toggle('brand', b.slug)}>
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.color ?? '#999' }} />
              {b.name}
            </CheckItem>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Loại sản phẩm">
        <div className="space-y-0.5">
          {categories?.map((c) => (
            <CheckItem key={c.id} checked={f.list('category').includes(c.slug)} onClick={() => f.toggle('category', c.slug)}>
              {c.name}
            </CheckItem>
          ))}
        </div>
      </FilterSection>

      {!lockedSet && (
        <FilterSection title="Set / Pack">
          <input className="input mb-2 py-1.5" placeholder="Tìm set (OP-09, SV8...)" value={setQuery} onChange={(e) => setSetQuery(e.target.value)} />
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {sets.map((s) => (
              <CheckItem key={s.id} checked={f.list('set').includes(s.slug)} onClick={() => f.toggle('set', s.slug)}>
                {s.code && <b className="mr-1">{s.code}</b>}
                {s.name}
              </CheckItem>
            ))}
            {sets.length === 0 && <p className="py-1 text-xs text-gray-400">Không có set phù hợp</p>}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Ngôn ngữ">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => {
            const on = f.list('language').includes(l.value)
            return (
              <button key={l.value} onClick={() => f.toggle('language', l.value)} className={cn('chip py-1 text-xs', on ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600')}>
                {l.flag} {l.value}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Tình trạng">
        <div className="space-y-0.5">
          {[
            { v: '', l: 'Tất cả' },
            { v: 'IN_STOCK', l: 'Còn hàng' },
            { v: 'PRE_ORDER', l: 'Sắp phát hành (đặt trước)' },
            { v: 'OUT_OF_STOCK', l: 'Hết hàng' },
          ].map((s) => (
            <button key={s.v} onClick={() => f.update({ status: s.v || null })} className="flex w-full items-center gap-2.5 py-1 text-left text-sm text-gray-700 hover:text-primary-700">
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', f.get('status') === s.v ? 'border-primary-600' : 'border-gray-300')}>
                {f.get('status') === s.v && <span className="h-2 w-2 rounded-full bg-primary-600" />}
              </span>
              {s.l}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Khoảng giá">
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_RANGES.map((r) => {
            const on = f.get('minPrice') === String(r.min ?? '') && f.get('maxPrice') === String(r.max ?? '')
            return (
              <button
                key={r.label}
                onClick={() => {
                  f.update({ minPrice: r.min ? String(r.min) : null, maxPrice: r.max ? String(r.max) : null })
                  setMinP(r.min ? String(r.min) : '')
                  setMaxP(r.max ? String(r.max) : '')
                }}
                className={cn('rounded-lg border px-2 py-1.5 text-xs font-medium', on ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600')}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <input className="input px-2 py-1.5 text-xs" inputMode="numeric" placeholder="Từ" value={minP} onChange={(e) => setMinP(e.target.value.replace(/\D/g, ''))} />
          <span className="text-gray-400">–</span>
          <input className="input px-2 py-1.5 text-xs" inputMode="numeric" placeholder="Đến" value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/\D/g, ''))} />
          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => f.update({ minPrice: minP || null, maxPrice: maxP || null })}>
            Áp dụng
          </button>
        </div>
      </FilterSection>
    </div>
  )
}

function ActiveChips({ lockedSet }: { lockedSet?: boolean }) {
  const f = useFilterParams()
  const { data: brands } = useBrands()
  const { data: categories } = useCategories()
  const { data: sets } = useSets()
  const chips: { key: string; label: string; onRemove: () => void }[] = []
  const name = (k: string, v: string) => {
    if (k === 'brand') return brands?.find((b) => b.slug === v)?.name ?? v
    if (k === 'category') return categories?.find((c) => c.slug === v)?.name ?? v
    if (k === 'set') {
      const s = sets?.find((x) => x.slug === v)
      return s ? `${s.code ?? ''} ${s.name}`.trim() : v
    }
    return v
  }
  MULTI_KEYS.forEach((k) => {
    if (k === 'set' && lockedSet) return
    f.list(k).forEach((v) => chips.push({ key: `${k}-${v}`, label: name(k, v), onRemove: () => f.toggle(k, v) }))
  })
  const status = f.get('status')
  if (status) chips.push({ key: 'status', label: { IN_STOCK: 'Còn hàng', PRE_ORDER: 'Đặt trước', OUT_OF_STOCK: 'Hết hàng' }[status] ?? status, onRemove: () => f.update({ status: null }) })
  if (f.get('minPrice') || f.get('maxPrice'))
    chips.push({
      key: 'price',
      label: `${f.get('minPrice') ? formatNumber(+f.get('minPrice')) : '0'} – ${f.get('maxPrice') ? formatNumber(+f.get('maxPrice')) : '∞'}₫`,
      onRemove: () => f.update({ minPrice: null, maxPrice: null }),
    })
  if (f.get('isNew')) chips.push({ key: 'isNew', label: 'Hàng mới', onRemove: () => f.update({ isNew: null }) })
  if (f.get('featured')) chips.push({ key: 'featured', label: 'Nổi bật', onRemove: () => f.update({ featured: null }) })

  if (chips.length === 0) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button key={c.key} onClick={c.onRemove} className="chip border-primary-200 bg-primary-50 py-1 text-xs text-primary-700 hover:bg-primary-100">
          {c.label} <X size={13} />
        </button>
      ))}
      <button
        onClick={() => f.update(Object.fromEntries(['brand', 'category', 'language', 'status', 'minPrice', 'maxPrice', 'isNew', 'featured', ...(lockedSet ? [] : ['set'])].map((k) => [k, null])))}
        className="text-xs font-semibold text-gray-500 underline hover:text-primary-700"
      >
        Xóa tất cả
      </button>
    </div>
  )
}

function SetHeader({ set }: { set: CardSet }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white md:p-7" style={{ background: `linear-gradient(135deg, #111827, ${set.brandColor ?? '#b91c1c'})` }}>
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
          <Layers size={30} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{set.brandName} · Set / Pack</p>
          <h1 className="mt-1 text-2xl font-black md:text-3xl">
            {set.code && <span className="text-gold-300">{set.code} </span>}
            {set.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
            {set.releaseDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} /> Phát hành {formatDate(set.releaseDate)}
              </span>
            )}
            <span>{set.productCount} sản phẩm</span>
          </div>
          {set.description && <p className="mt-2 max-w-2xl text-sm text-white/80">{set.description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage({ mode = 'list' }: { mode?: 'list' | 'search' | 'set' }) {
  const { slug } = useParams()
  const f = useFilterParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: brands } = useBrands()
  const page = parseInt(f.get('page') || '0', 10)
  const q = f.get('q')

  const { data: set, isError: setError } = useQuery({
    queryKey: ['set', slug],
    queryFn: () => api.get<CardSet>(`/public/sets/${slug}`),
    enabled: mode === 'set' && !!slug,
  })

  const query = {
    q: mode === 'search' ? q : undefined,
    brand: f.get('brand'),
    category: f.get('category'),
    set: mode === 'set' ? slug : f.get('set'),
    language: f.get('language'),
    status: f.get('status'),
    minPrice: f.get('minPrice'),
    maxPrice: f.get('maxPrice'),
    isNew: f.get('isNew'),
    featured: f.get('featured'),
    sort: f.get('sort') || (mode === 'search' ? 'popular' : 'newest'),
    page,
    size: 20,
  }
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', query],
    queryFn: () => api.get<PageResponse<ProductCard>>('/public/products', query),
    placeholderData: (prev) => prev,
  })

  const brandList = f.list('brand')
  const singleBrand = brandList.length === 1 ? brands?.find((b) => b.slug === brandList[0]) : undefined
  const title =
    mode === 'search' ? `Kết quả cho “${q}”` : mode === 'set' ? (set ? `${set.code ?? ''} ${set.name}` : 'Set') : singleBrand ? singleBrand.name : 'Tất cả sản phẩm'

  if (mode === 'set' && setError) {
    return <EmptyState title="Không tìm thấy set" action={<Link to="/san-pham" className="btn-primary">Xem tất cả sản phẩm</Link>} />
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: 'Sản phẩm', to: mode === 'list' && !singleBrand ? undefined : '/san-pham' },
          ...(mode === 'set' && set ? [{ label: set.brandName, to: `/san-pham?brand=${set.brandSlug}` }, { label: set.code ?? set.name }] : []),
          ...(mode === 'list' && singleBrand ? [{ label: singleBrand.name }] : []),
          ...(mode === 'search' ? [{ label: 'Tìm kiếm' }] : []),
        ]}
      />

      {mode === 'set' && set && <SetHeader set={set} />}

      {mode !== 'set' && (
        <div className="no-scrollbar -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 md:mx-0 md:px-0">
          <button
            onClick={() => f.update({ brand: null })}
            className={cn('chip shrink-0 bg-white', brandList.length === 0 ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-700')}
          >
            Tất cả
          </button>
          {brands?.map((b) => (
            <button
              key={b.id}
              onClick={() => f.update({ brand: brandList.length === 1 && brandList[0] === b.slug ? null : b.slug, set: null })}
              className={cn('chip shrink-0 bg-white', brandList.includes(b.slug) ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-700')}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color ?? '#999' }} />
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-1">
            <FilterPanel lockedSet={mode === 'set'} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 md:text-xl">{mode === 'set' ? 'Sản phẩm thuộc set' : title}</h1>
              <p className="text-sm text-gray-500">{data ? `${data.totalElements} sản phẩm` : 'Đang tải...'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterOpen(true)} className="btn-outline px-3 py-2 lg:hidden">
                <SlidersHorizontal size={16} /> Lọc
              </button>
              <select
                className="input w-auto py-2 pr-8"
                value={query.sort}
                onChange={(e) => f.update({ sort: e.target.value })}
                aria-label="Sắp xếp"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ActiveChips lockedSet={mode === 'set'} />

          {!isLoading && data?.items.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Không tìm thấy sản phẩm phù hợp"
                description={mode === 'search' ? 'Thử từ khóa khác, mã set (VD: OP-09, SV8) hoặc gửi yêu cầu đặt hộ.' : 'Thử bỏ bớt bộ lọc để xem thêm sản phẩm.'}
                action={
                  <Link to={`/dat-ho${q ? `?name=${encodeURIComponent(q)}` : ''}`} className="btn-primary">
                    Đặt hộ sản phẩm này
                  </Link>
                }
              />
            </div>
          ) : (
            <div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
              <ProductGrid items={data?.items} loading={isLoading} className="lg:grid-cols-3 xl:grid-cols-4" />
            </div>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(p) => {
                f.update({ page: p ? String(p) : null }, false)
              }}
            />
          )}
        </div>
      </div>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Bộ lọc"
        footer={
          <button className="btn-primary w-full" onClick={() => setFilterOpen(false)}>
            Xem {data?.totalElements ?? ''} sản phẩm
          </button>
        }
      >
        <FilterPanel lockedSet={mode === 'set'} />
      </Modal>
    </div>
  )
}
