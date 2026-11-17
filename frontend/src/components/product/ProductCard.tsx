'use client'

import { useRef, type ReactNode } from 'react'
import { Link } from '@/lib/router'
import { BellRing, CalendarClock, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { ProductArt } from './ProductArt'
import { useProductAction, type ActionProduct } from './ActionContext'
import { cn, daysUntil, discountPercent, formatDate, formatPrice } from '../../lib/format'
import type { ProductCard as Product } from '../../lib/types'
import { ProductCardSkeleton } from '../ui/Common'

export function toActionProduct(p: Product): ActionProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    price: p.price,
    depositPercent: p.depositPercent,
    remainingSlots: p.remainingSlots,
    releaseDate: p.releaseDate,
    thumbnail: p.thumbnail,
    brandName: p.brandName,
    brandColor: p.brandColor,
    setCode: p.setCode,
    categoryName: p.categoryName,
  }
}

export function ProductCard({ p }: { p: Product }) {
  const { open } = useProductAction()
  const discount = discountPercent(p.price, p.originalPrice)
  const days = p.status === 'PRE_ORDER' ? daysUntil(p.releaseDate) : null

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-2.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link to={`/san-pham/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-gray-50">
        <ProductArt
          src={p.thumbnail}
          name={p.name}
          brandName={p.brandName}
          brandColor={p.brandColor}
          setCode={p.setCode}
          categoryName={p.categoryName}
          className="transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
          {discount && <span className="rounded-md bg-primary-600 px-1.5 py-0.5 text-[11px] font-bold text-white">-{discount}%</span>}
          {p.status === 'PRE_ORDER' && <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-bold text-white">Đặt trước</span>}
          {p.isNew && p.status !== 'PRE_ORDER' && <span className="rounded-md bg-gold-400 px-1.5 py-0.5 text-[11px] font-bold text-gray-900">Mới</span>}
        </div>
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{p.language}</span>
        {p.status === 'OUT_OF_STOCK' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white">Hết hàng</span>
          </div>
        )}
      </Link>

      <div className="mt-2.5 flex flex-1 flex-col">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.brandColor ?? '#9ca3af' }} />
          <span className="truncate">{p.brandName}</span>
          {p.setCode && <span className="truncate font-medium normal-case text-gray-400">· {p.setCode}</span>}
        </p>
        <Link to={`/san-pham/${p.slug}`} className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-5 text-gray-900 hover:text-primary-700 sm:text-sm">
          {p.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-base font-extrabold', p.price === null ? 'text-primary-600' : 'text-primary-700')}>
            {formatPrice(p.price)}
          </span>
          {discount && <span className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</span>}
        </div>
        {p.status === 'PRE_ORDER' && (
          <p className="mt-1 text-[11px] text-indigo-700">
            <CalendarClock size={12} className="mr-1 inline" />
            {formatDate(p.releaseDate)}
            {days !== null && days > 0 && <span className="text-gray-500"> · còn {days} ngày</span>}
            {p.remainingSlots !== null && <span className="block text-gray-500">Còn {p.remainingSlots} suất · cọc {p.depositPercent ?? 0}%</span>}
          </p>
        )}
        <div className="mt-auto pt-2.5">
          <button
            onClick={() => open(toActionProduct(p))}
            className={cn(
              'btn w-full py-2 text-[13px]',
              p.status === 'PRE_ORDER'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : p.status === 'OUT_OF_STOCK'
                  ? 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  : 'border border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-700 hover:text-white',
            )}
          >
            {p.status === 'PRE_ORDER' ? <CalendarClock size={16} /> : p.status === 'OUT_OF_STOCK' ? <BellRing size={16} /> : <MessageCircle size={16} />}
            {p.status === 'PRE_ORDER' ? 'Đặt trước' : p.status === 'OUT_OF_STOCK' ? 'Báo khi có hàng' : 'Liên hệ'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductGrid({ items, loading, skeletons = 10, className }: { items?: Product[]; loading?: boolean; skeletons?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', className)}>
      {loading
        ? Array.from({ length: skeletons }).map((_, i) => <ProductCardSkeleton key={i} />)
        : items?.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  )
}

/** Dải sản phẩm cuộn ngang (trên điện thoại vuốt, trên máy tính có nút mũi tên) */
export function ProductRail({ items, loading, header }: { items?: Product[]; loading?: boolean; header?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="relative">
      {header}
      <div ref={ref} className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-2 sm:mx-0 sm:gap-3 sm:px-0">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]">
                <ProductCardSkeleton />
              </div>
            ))
          : items?.map((p) => (
              <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]">
                <ProductCard p={p} />
              </div>
            ))}
      </div>
      {!loading && (items?.length ?? 0) > 5 && (
        <>
          <button onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 lg:flex" aria-label="Trước">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll(1)} className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 lg:flex" aria-label="Sau">
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  )
}
