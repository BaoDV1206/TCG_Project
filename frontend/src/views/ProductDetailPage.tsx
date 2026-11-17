'use client'

import { useEffect, useState } from 'react'
import { Link, useParams } from '@/lib/router'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  BellRing,
  CalendarClock,
  Eye,
  Layers,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { api } from '../lib/api'
import type { ProductCard, ProductDetail } from '../lib/types'
import { useSettings } from '../hooks/queries'
import { LANGUAGES, PRODUCT_STATUS } from '../lib/constants'
import { cn, daysUntil, discountPercent, formatDate, formatPrice, parseSpecs } from '../lib/format'
import { ProductArt } from '../components/product/ProductArt'
import { ProductRail } from '../components/product/ProductCard'
import { useProductAction, type ActionProduct } from '../components/product/ActionContext'
import { ContactButtons } from '../components/product/ActionModal'
import { Breadcrumb, EmptyState, SectionTitle, Skeleton } from '../components/ui/Common'
import { ProductGallery } from '../components/product/ProductGallery'

function Countdown({ date }: { date: string }) {
  // null khi server dựng trang -> chỉ đếm giờ ở trình duyệt, tránh lệch giây giữa server và trình duyệt
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (now === null) return <div className="h-[52px]" aria-hidden />

  const diff = Math.max(0, new Date(`${date}T00:00:00`).getTime() - now)
  const parts = [
    { v: Math.floor(diff / 86400000), l: 'Ngày' },
    { v: Math.floor((diff / 3600000) % 24), l: 'Giờ' },
    { v: Math.floor((diff / 60000) % 60), l: 'Phút' },
    { v: Math.floor((diff / 1000) % 60), l: 'Giây' },
  ]
  if (diff === 0) return <p className="text-sm font-semibold text-indigo-700">Đã đến ngày phát hành</p>
  return (
    <div className="flex gap-1.5">
      {parts.map((p) => (
        <div key={p.l} className="w-14 rounded-lg bg-indigo-900 py-1.5 text-center text-white">
          <p className="text-lg font-black leading-none tabular-nums">{String(p.v).padStart(2, '0')}</p>
          <p className="mt-0.5 text-[10px] text-indigo-200">{p.l}</p>
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug = '' } = useParams()
  const { open } = useProductAction()
  const { data: settings } = useSettings()
  const [tab, setTab] = useState<'desc' | 'specs' | 'policy'>('desc')
  const [qty, setQty] = useState(1)

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get<ProductDetail>(`/public/products/${slug}`),
  })
  const { data: related, isLoading: relatedLoading } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => api.get<ProductCard[]>(`/public/products/${slug}/related`),
    enabled: !!p,
  })

  useEffect(() => {
    setQty(1)
    setTab('desc')
  }, [slug])

  if (isLoading) return <DetailSkeleton />
  if (isError || !p)
    return (
      <EmptyState
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm có thể đã ngừng kinh doanh."
        action={<Link to="/san-pham" className="btn-primary">Xem sản phẩm khác</Link>}
      />
    )

  const discount = discountPercent(p.price, p.originalPrice)
  const isPre = p.status === 'PRE_ORDER'
  const isOut = p.status === 'OUT_OF_STOCK'
  const days = isPre ? daysUntil(p.releaseDate) : null
  const lang = LANGUAGES.find((l) => l.value === p.language)
  const specs = parseSpecs(p.specs)
  const maxQty = Math.max(1, Math.min(99, p.remainingSlots ?? 99, p.perUserLimit ?? 99))
  const soldOut = isPre && p.remainingSlots === 0

  const action: ActionProduct = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    price: p.price,
    depositPercent: p.depositPercent,
    remainingSlots: p.remainingSlots,
    perUserLimit: p.perUserLimit,
    releaseDate: p.releaseDate,
    thumbnail: p.images[0] ?? null,
    brandName: p.brandName,
    brandColor: p.brandColor,
    setCode: p.setCode,
    categoryName: p.categoryName,
  }
  const art = (src: string | null, size: 'sm' | 'lg' = 'lg') => (
    <ProductArt src={src} name={p.name} brandName={p.brandName} brandColor={p.brandColor} setCode={p.setCode} categoryName={p.categoryName} size={size} preload={size === 'lg' && src === p.images[0]} />
  )
  const ctaLabel = isPre ? 'Đặt trước ngay' : isOut ? 'Báo khi có hàng' : 'Liên hệ mua hàng'
  const CtaIcon = isPre ? CalendarClock : isOut ? BellRing : MessageCircle

  return (
    <div className="pb-20 md:pb-0">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: p.brandName, to: `/san-pham?brand=${p.brandSlug}` },
          ...(p.setSlug ? [{ label: p.setCode ?? p.setName ?? '', to: `/set/${p.setSlug}` }] : []),
          { label: p.name },
        ]}
      />

      <div className="card grid gap-5 p-3 md:p-5 lg:grid-cols-[5fr_7fr] lg:gap-8">
        {/* Gallery */}
        <ProductGallery
          images={p.images}
          title={p.name}
          render={art}
          resetKey={slug}
          badge={discount ? <span className="rounded-lg bg-primary-600 px-2 py-1 text-sm font-bold text-white">-{discount}%</span> : undefined}
        />

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to={`/san-pham?brand=${p.brandSlug}`} className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: p.brandColor ?? '#b91c1c' }}>
              {p.brandName}
            </Link>
            {p.setSlug && (
              <Link to={`/set/${p.setSlug}`} className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                <Layers size={12} /> {p.setCode} {p.setName}
              </Link>
            )}
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {lang?.flag} {lang?.label ?? p.language}
            </span>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', PRODUCT_STATUS[p.status].className)}>{PRODUCT_STATUS[p.status].label}</span>
          </div>

          <h1 className="mt-2 text-xl font-extrabold leading-snug text-gray-900 md:text-2xl">{p.name}</h1>
          <p className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>{p.categoryName}</span>
            <span className="flex items-center gap-1">
              <Eye size={13} /> {p.viewCount} lượt xem
            </span>
          </p>

          <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary-50 to-orange-50 p-4">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-3xl font-black text-primary-700">{formatPrice(p.price)}</span>
              {discount && (
                <>
                  <span className="pb-1 text-base text-gray-400 line-through">{formatPrice(p.originalPrice)}</span>
                  <span className="mb-1 rounded bg-primary-600 px-1.5 text-xs font-bold text-white">-{discount}%</span>
                </>
              )}
            </div>
            {p.price === null && <p className="mt-1 text-sm text-gray-600">Giá biến động theo thị trường – liên hệ để nhận giá tốt nhất hôm nay.</p>}
          </div>

          {isPre && (
            <div className="mt-4 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-indigo-700">Ngày phát hành dự kiến</p>
                  <p className="text-lg font-extrabold text-gray-900">{formatDate(p.releaseDate)}</p>
                </div>
                {p.releaseDate && days !== null && days > 0 && <Countdown date={p.releaseDate} />}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-2">
                  <p className="text-[11px] text-gray-500">Cọc</p>
                  <p className="font-bold text-indigo-700">{p.depositPercent ?? 0}%</p>
                </div>
                <div className="rounded-xl bg-white p-2">
                  <p className="text-[11px] text-gray-500">Còn suất</p>
                  <p className={cn('font-bold', soldOut ? 'text-red-600' : 'text-indigo-700')}>
                    {p.remainingSlots ?? '∞'}
                    {p.preorderLimit ? <span className="text-xs font-normal text-gray-400">/{p.preorderLimit}</span> : null}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-2">
                  <p className="text-[11px] text-gray-500">Tối đa/khách</p>
                  <p className="font-bold text-indigo-700">{p.perUserLimit ?? '∞'}</p>
                </div>
              </div>
              {p.preorderLimit && p.remainingSlots !== null && (
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${((p.preorderLimit - p.remainingSlots) / p.preorderLimit) * 100}%` }} />
                </div>
              )}
            </div>
          )}

          {!soldOut && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Số lượng</span>
              <div className="flex items-center rounded-xl border border-gray-300">
                <button className="p-2.5 disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} aria-label="Giảm">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
                <button className="p-2.5 disabled:opacity-30" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)} aria-label="Tăng">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 hidden gap-2 md:flex">
            <button
              disabled={soldOut}
              onClick={() => open(action, qty)}
              className={cn('btn flex-1 py-3.5 text-base', isPre ? 'bg-indigo-600 text-white hover:bg-indigo-700' : isOut ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-primary-700 text-white hover:bg-primary-800')}
            >
              <CtaIcon size={20} />
              <span className="flex flex-col items-start leading-tight">
                {soldOut ? 'Đã hết suất đặt trước' : ctaLabel}
                <span className="text-[11px] font-normal opacity-80">{isPre ? 'Shop duyệt & liên hệ hướng dẫn cọc' : 'Shop sẽ liên hệ lại trong ít phút'}</span>
              </span>
            </button>
          </div>

          {!isPre && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Hoặc liên hệ trực tiếp:</p>
              <ContactButtons compact />
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            {[
              { icon: BadgeCheck, t: 'Chính hãng 100%' },
              { icon: PackageCheck, t: 'Nguyên seal' },
              { icon: Truck, t: 'Giao toàn quốc' },
              { icon: RefreshCcw, t: 'Đổi trả nếu lỗi' },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-gray-700">
                <x.icon size={17} className="text-emerald-600" /> {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mt-4 p-3 md:p-5">
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-100">
          {[
            { k: 'desc', l: 'Mô tả' },
            { k: 'specs', l: 'Thông số' },
            { k: 'policy', l: 'Chính sách' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={cn('-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold', tab === t.k ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800')}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div className="pt-4 text-sm leading-7 text-gray-700">
          {tab === 'desc' && <p className="whitespace-pre-line">{p.description || 'Đang cập nhật mô tả.'}</p>}
          {tab === 'specs' && (
            <table className="w-full max-w-2xl overflow-hidden rounded-xl text-sm">
              <tbody>
                {[
                  ['Thương hiệu', p.brandName],
                  ['Loại sản phẩm', p.categoryName],
                  ...(p.setName ? [['Set', `${p.setCode ?? ''} ${p.setName}`]] : []),
                  ['Ngôn ngữ', lang?.label ?? p.language],
                  ...(p.releaseDate ? [['Ngày phát hành', formatDate(p.releaseDate)]] : []),
                  ...specs,
                ].map(([k, v], i) => (
                  <tr key={i} className="odd:bg-gray-50">
                    <td className="w-44 px-3 py-2 font-medium text-gray-500">{k}</td>
                    <td className="px-3 py-2 text-gray-900">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'policy' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <ShieldCheck className="mt-1 shrink-0 text-emerald-600" size={18} />
                <p className="whitespace-pre-line">{settings?.policy_general}</p>
              </div>
              {isPre && (
                <div className="flex gap-2">
                  <CalendarClock className="mt-1 shrink-0 text-indigo-600" size={18} />
                  <p className="whitespace-pre-line">{settings?.policy_preorder}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(relatedLoading || (related?.length ?? 0) > 0) && (
        <section className="mt-6">
          <SectionTitle title={`Sản phẩm ${p.brandName} khác`} action={<Link to={`/san-pham?brand=${p.brandSlug}`} className="text-sm font-semibold text-primary-700">Xem tất cả</Link>} />
          <ProductRail items={related} loading={relatedLoading} />
        </section>
      )}

      {/* thanh hành động cố định trên điện thoại */}
      <div className="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-gray-200 bg-white px-3 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-gray-500">{p.name}</p>
          <p className="text-lg font-black text-primary-700">{formatPrice(p.price)}</p>
        </div>
        <button
          disabled={soldOut}
          onClick={() => open(action, qty)}
          className={cn('btn shrink-0 px-5 py-3', isPre ? 'bg-indigo-600 text-white' : isOut ? 'bg-gray-800 text-white' : 'bg-primary-700 text-white')}
        >
          <CtaIcon size={18} /> {soldOut ? 'Hết suất' : isPre ? 'Đặt trước' : isOut ? 'Báo tin' : 'Liên hệ'}
        </button>
      </div>
    </div>
  )
}
