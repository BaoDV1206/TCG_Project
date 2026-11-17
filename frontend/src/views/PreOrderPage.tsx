'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronDown, ClipboardCheck, PackageCheck, Send, Truck } from 'lucide-react'
import { api } from '../lib/api'
import { PREORDER_QUERY } from '../lib/product-query'
import type { PageResponse, ProductCard } from '../lib/types'
import { useBrands, useSettings } from '../hooks/queries'
import { ProductGrid } from '../components/product/ProductCard'
import { Breadcrumb, EmptyState } from '../components/ui/Common'
import { cn } from '../lib/format'

const STEPS = [
  { icon: Send, t: 'Gửi yêu cầu', d: 'Chọn sản phẩm & số lượng' },
  { icon: ClipboardCheck, t: 'Shop duyệt', d: 'Liên hệ hướng dẫn cọc' },
  { icon: PackageCheck, t: 'Hàng về', d: 'Thông báo khi có hàng' },
  { icon: Truck, t: 'Nhận hàng', d: 'Thanh toán phần còn lại' },
]

const FAQ = [
  { q: 'Cọc bao nhiêu?', a: 'Mức cọc hiển thị trên từng sản phẩm (thường 30–50%). Shop chỉ yêu cầu cọc sau khi đã duyệt yêu cầu của bạn.' },
  { q: 'Tôi có thể hủy không?', a: 'Bạn có thể tự hủy khi yêu cầu còn ở trạng thái "Chờ duyệt". Sau khi đã cọc, vui lòng liên hệ shop để được hỗ trợ.' },
  { q: 'Khi nào hàng về?', a: 'Thường trong vòng 1–7 ngày sau ngày phát hành chính thức. Trạng thái yêu cầu sẽ chuyển sang "Hàng đã về" và shop sẽ liên hệ bạn.' },
  { q: 'Nếu shop không về đủ hàng?', a: 'Bạn được hoàn cọc 100% hoặc chuyển sang sản phẩm khác tùy chọn.' },
]

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-gray-100">
      {items.map((f, i) => (
        <div key={f.q}>
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold text-gray-900">
            {f.q}
            <ChevronDown size={18} className={cn('shrink-0 text-gray-400 transition', open === i && 'rotate-180')} />
          </button>
          {open === i && <p className="pb-3 text-sm leading-6 text-gray-600">{f.a}</p>}
        </div>
      ))}
    </div>
  )
}

export default function PreOrderPage() {
  const [brand, setBrand] = useState('')
  const [month, setMonth] = useState('')
  const { data: brands } = useBrands()
  const { data: settings } = useSettings()
  const { data, isLoading } = useQuery({
    queryKey: ['preorders', brand],
    queryFn: () => api.get<PageResponse<ProductCard>>('/public/products', { ...PREORDER_QUERY, brand }),
  })

  const months = useMemo(() => {
    const set = new Set<string>()
    data?.items.forEach((p) => p.releaseDate && set.add(p.releaseDate.slice(0, 7)))
    return [...set].sort()
  }, [data])
  const items = data?.items.filter((p) => !month || p.releaseDate?.startsWith(month))

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Đặt trước' }]} />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-purple-700 p-5 text-white md:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <CalendarClock size={14} /> Pre-order
          </p>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">Đặt trước – Giữ suất sớm, không lo cháy hàng</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
            Các bộ mới sắp phát hành của Pokemon, One Piece, Naruto... Gửi yêu cầu đặt trước, shop duyệt và giữ suất cho bạn.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {STEPS.map((s, i) => (
              <div key={s.t} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-xs font-black text-gray-900">{i + 1}</span>
                  <s.icon size={18} className="text-gold-300" />
                </div>
                <p className="mt-2 text-sm font-bold">{s.t}</p>
                <p className="text-xs text-white/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="card space-y-3 p-3 md:p-4">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          <button onClick={() => setBrand('')} className={cn('chip shrink-0', !brand ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700')}>
            Tất cả thương hiệu
          </button>
          {brands?.map((b) => (
            <button key={b.id} onClick={() => setBrand(b.slug)} className={cn('chip shrink-0', brand === b.slug ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700')}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color ?? '#999' }} />
              {b.name}
            </button>
          ))}
        </div>
        {months.length > 1 && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            <button onClick={() => setMonth('')} className={cn('chip shrink-0 py-1 text-xs', !month ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600')}>
              Mọi thời điểm
            </button>
            {months.map((m) => (
              <button key={m} onClick={() => setMonth(m)} className={cn('chip shrink-0 py-1 text-xs', month === m ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600')}>
                Tháng {m.slice(5)}/{m.slice(0, 4)}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isLoading && items?.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CalendarClock size={36} />} title="Chưa có sản phẩm nhận đặt trước" description="Hãy quay lại sau hoặc liên hệ shop để được báo khi có bộ mới." />
        </div>
      ) : (
        <ProductGrid items={items} loading={isLoading} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4 md:p-5">
          <h2 className="mb-2 text-base font-bold">Chính sách đặt trước</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{settings?.policy_preorder}</p>
        </div>
        <div className="card p-4 md:p-5">
          <h2 className="mb-1 text-base font-bold">Câu hỏi thường gặp</h2>
          <Faq items={FAQ} />
        </div>
      </div>
    </div>
  )
}
