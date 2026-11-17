'use client'

import { useState } from 'react'
import { Link } from '@/lib/router'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronRight, Flame, Globe2, Headphones, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { api } from '../lib/api'
import type { Brand, HomeData, PageResponse, ProductCard as Product } from '../lib/types'
import { useBrands, useCategories, useSets } from '../hooks/queries'
import { BannerContent, BannerLink, BannerSlider } from '../components/product/BannerSlider'
import { ProductGrid, ProductRail } from '../components/product/ProductCard'
import { SectionTitle, Skeleton } from '../components/ui/Common'
import { cn } from '../lib/format'

/** Cột danh mục bên trái + bảng con khi rê chuột (máy tính) */
function CategorySidebar() {
  const { data: brands } = useBrands()
  const { data: categories } = useCategories()
  const [hover, setHover] = useState<Brand | null>(null)
  const { data: sets } = useSets(hover?.slug)

  return (
    <div className="relative hidden lg:block" onMouseLeave={() => setHover(null)}>
      <div className="card h-full overflow-hidden py-1.5">
        {brands?.map((b) => (
          <Link
            key={b.id}
            to={`/san-pham?brand=${b.slug}`}
            onMouseEnter={() => setHover(b)}
            className={cn('flex items-center gap-2.5 px-3.5 py-[7px] text-sm font-medium transition', hover?.id === b.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700')}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white" style={{ background: b.color ?? '#999' }}>
              {b.name.charAt(0)}
            </span>
            <span className="flex-1 truncate">{b.name}</span>
            <ChevronRight size={15} className="text-gray-400" />
          </Link>
        ))}
        {!brands && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="mx-3 my-2 h-6" />)}
      </div>
      {hover && (
        <div className="absolute left-full top-0 z-30 ml-2 h-full w-[640px] animate-fade-in overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold" style={{ color: hover.color ?? undefined }}>
              <span className="text-gray-900">{hover.name}</span>
            </h3>
            <Link to={`/san-pham?brand=${hover.slug}`} className="text-sm font-semibold text-primary-700">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-500">Loại sản phẩm</p>
              <ul className="space-y-1.5">
                {categories?.map((c) => (
                  <li key={c.id}>
                    <Link to={`/san-pham?brand=${hover.slug}&category=${c.slug}`} className="text-sm text-gray-700 hover:text-primary-700">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-500">Set / Pack</p>
              <ul className="space-y-1.5">
                {sets?.slice(0, 10).map((s) => (
                  <li key={s.id}>
                    <Link to={`/set/${s.slug}`} className="text-sm text-gray-700 hover:text-primary-700">
                      {s.code && <b className="mr-1">{s.code}</b>}
                      {s.name}
                    </Link>
                  </li>
                ))}
                {sets?.length === 0 && <li className="text-sm text-gray-400">Chưa có set</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Hàng biểu tượng thương hiệu cuộn ngang (điện thoại / iPad) */
function BrandStrip() {
  const { data: brands } = useBrands()
  return (
    <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 lg:hidden">
      {brands?.map((b) => (
        <Link key={b.id} to={`/san-pham?brand=${b.slug}`} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-white p-2 shadow-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white shadow-inner" style={{ background: b.color ?? '#999' }}>
            {b.name.charAt(0)}
          </span>
          <span className="w-full truncate text-center text-[11px] font-semibold text-gray-700">{b.name}</span>
        </Link>
      ))}
    </div>
  )
}

const SERVICES = [
  { icon: ShieldCheck, title: 'Chính hãng 100%', desc: 'Nguyên seal, rõ nguồn gốc' },
  { icon: CalendarClock, title: 'Đặt trước giữ suất', desc: 'Cọc nhẹ, nhận hàng sớm' },
  { icon: Globe2, title: 'Đặt hộ Nhật – Mỹ', desc: 'Báo giá trong 24h' },
  { icon: Headphones, title: 'Hỗ trợ tận tâm', desc: 'Tư vấn qua Zalo / hotline' },
]

function BrandSection({ brand, initial }: { brand: Brand; initial: Product[] }) {
  const [tab, setTab] = useState('')
  const tabs = [
    { slug: '', label: 'Tất cả' },
    { slug: 'booster-box', label: 'Box' },
    { slug: 'booster-pack', label: 'Pack' },
    { slug: 'the-le', label: 'Thẻ lẻ' },
  ]
  const { data, isLoading } = useQuery({
    queryKey: ['brand-tab', brand.slug, tab],
    queryFn: () => api.get<PageResponse<Product>>('/public/products', { brand: brand.slug, category: tab, size: 10 }),
    enabled: tab !== '',
  })
  const items = tab === '' ? initial : data?.items

  return (
    <section className="rounded-2xl bg-white p-3 shadow-card md:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase md:text-xl">
          <span className="h-6 w-1.5 rounded-full" style={{ background: brand.color ?? '#b91c1c' }} />
          {brand.name}
        </h2>
        <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
          {tabs.map((t) => (
            <button
              key={t.slug}
              onClick={() => setTab(t.slug)}
              className={cn('chip shrink-0 py-1', tab === t.slug ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}
            >
              {t.label}
            </button>
          ))}
          <Link to={`/san-pham?brand=${brand.slug}`} className="ml-1 shrink-0 text-sm font-semibold text-primary-700 hover:underline">
            Xem tất cả
          </Link>
        </div>
      </div>
      {tab !== '' && !isLoading && items?.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Chưa có sản phẩm trong mục này.</p>
      ) : (
        <ProductRail items={items} loading={tab !== '' && isLoading} />
      )}
    </section>
  )
}

export default function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: ['home'], queryFn: () => api.get<HomeData>('/public/home') })

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero */}
      <section className="grid gap-3 lg:h-[380px] lg:grid-cols-[230px_1fr_260px]">
        <CategorySidebar />
        <div className="aspect-[16/8] sm:aspect-[16/7] lg:aspect-auto">
          <BannerSlider banners={data?.mainBanners ?? []} />
        </div>
        <div className="hidden grid-rows-2 gap-3 lg:grid">
          {(data?.sideBanners ?? []).slice(0, 2).map((b) => (
            <BannerLink key={b.id} b={b} className="block overflow-hidden rounded-2xl transition hover:brightness-110">
              <BannerContent b={b} small />
            </BannerLink>
          ))}
          {isLoading && (
            <>
              <Skeleton className="h-full rounded-2xl" />
              <Skeleton className="h-full rounded-2xl" />
            </>
          )}
        </div>
      </section>

      <BrandStrip />

      {/* dịch vụ */}
      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {SERVICES.map((s) => (
          <div key={s.title} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <s.icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-gray-900 sm:text-sm">{s.title}</p>
              <p className="truncate text-[11px] text-gray-500 sm:text-xs">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Sắp phát hành */}
      {(isLoading || (data?.upcoming.length ?? 0) > 0) && (
        <section className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase text-white md:text-xl">
              <CalendarClock className="text-gold-400" /> Sắp phát hành – Nhận đặt trước
            </h2>
            <Link to="/dat-truoc" className="shrink-0 text-sm font-semibold text-gold-300 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <ProductRail items={data?.upcoming} loading={isLoading} />
        </section>
      )}

      <section>
        <SectionTitle
          icon={<Sparkles className="text-gold-500" />}
          title="Hàng mới về"
          action={<Link to="/san-pham?isNew=true" className="text-sm font-semibold text-primary-700 hover:underline">Xem tất cả</Link>}
        />
        <ProductRail items={data?.newArrivals} loading={isLoading} />
      </section>

      <section>
        <SectionTitle
          icon={<Flame className="text-primary-600" />}
          title="Nổi bật"
          action={<Link to="/san-pham?featured=true" className="text-sm font-semibold text-primary-700 hover:underline">Xem tất cả</Link>}
        />
        <ProductGrid items={data?.featured.slice(0, 10)} loading={isLoading} />
      </section>

      {data?.brandSections.map((s) => <BrandSection key={s.brand.id} brand={s.brand} initial={s.products} />)}

      <section className="flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-primary-900 p-6 text-white md:flex-row md:p-8">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-extrabold md:text-2xl">
            <Star className="text-gold-400" /> Không tìm thấy sản phẩm bạn cần?
          </h3>
          <p className="mt-1 text-sm text-white/80">Gửi yêu cầu đặt hộ – shop báo giá trong 24h, mua tận nơi từ Nhật, Mỹ, Hàn.</p>
        </div>
        <Link to="/dat-ho" className="btn-gold shrink-0 px-6">
          Gửi yêu cầu đặt hộ
        </Link>
      </section>
    </div>
  )
}
