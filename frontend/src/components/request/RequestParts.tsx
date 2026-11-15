import { Link } from 'react-router-dom'
import { Check, ChevronRight, ExternalLink, X } from 'lucide-react'
import type { HistoryItem, RequestStatus, ServiceRequest } from '../../lib/types'
import { FLOW, PROXY_COUNTRIES, REQUEST_STATUS } from '../../lib/constants'
import { cn, formatDateTime, formatPrice, timeAgo } from '../../lib/format'
import { StatusBadge, TypeBadge } from '../ui/Common'
import { ProductArt } from '../product/ProductArt'

/** Thanh tiến trình các bước theo loại yêu cầu */
export function RequestStepper({ r }: { r: ServiceRequest }) {
  const flow = FLOW[r.type]
  const terminalBad = r.status === 'REJECTED' || r.status === 'CANCELLED'
  // bước đã đạt: lấy theo lịch sử
  const reached = new Set<RequestStatus>(r.history.map((h) => h.toStatus))
  reached.add(r.status)
  let currentIndex = flow.indexOf(r.status)
  if (currentIndex < 0) {
    currentIndex = Math.max(...flow.map((s, i) => (reached.has(s) ? i : -1)))
  }

  return (
    <div className="no-scrollbar overflow-x-auto">
      <ol className="flex min-w-max items-start">
        {flow.map((s, i) => {
          const done = i < currentIndex || (i === currentIndex && r.status === 'COMPLETED')
          const current = i === currentIndex && !terminalBad && r.status !== 'COMPLETED'
          return (
            <li key={s} className="flex items-start">
              <div className="flex w-20 flex-col items-center text-center sm:w-24">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4',
                    done && 'bg-emerald-500 text-white ring-emerald-100',
                    current && 'bg-primary-600 text-white ring-primary-100',
                    !done && !current && 'bg-gray-200 text-gray-500 ring-transparent',
                  )}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('mt-1.5 text-[11px] font-semibold leading-tight', done || current ? 'text-gray-900' : 'text-gray-400')}>
                  {REQUEST_STATUS[s].label}
                </span>
              </div>
              {i < flow.length - 1 && <div className={cn('mt-4 h-0.5 w-6 sm:w-10', i < currentIndex ? 'bg-emerald-400' : 'bg-gray-200')} />}
            </li>
          )
        })}
        {terminalBad && (
          <li className="flex items-start">
            <div className="mt-4 h-0.5 w-6 bg-red-200 sm:w-10" />
            <div className="flex w-20 flex-col items-center text-center sm:w-24">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-100">
                <X size={16} strokeWidth={3} />
              </span>
              <span className="mt-1.5 text-[11px] font-semibold text-red-600">{REQUEST_STATUS[r.status].label}</span>
            </div>
          </li>
        )}
      </ol>
    </div>
  )
}

export function HistoryList({ items }: { items: HistoryItem[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-gray-100 pl-5">
      {[...items].reverse().map((h, i) => (
        <li key={i} className="relative">
          <span className={cn('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white', REQUEST_STATUS[h.toStatus].dot)} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.toStatus} />
            <span className="text-xs text-gray-500">{formatDateTime(h.createdAt)}</span>
            {h.changedBy && <span className="text-xs text-gray-400">· bởi {h.changedBy}</span>}
          </div>
          {h.note && <p className="mt-1 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{h.note}</p>}
        </li>
      ))}
    </ol>
  )
}

export function RequestThumb({ r, className }: { r: ServiceRequest; className?: string }) {
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-xl bg-gray-100', className)}>
      <ProductArt src={r.thumbnail} name={r.productName ?? ''} brandName={r.brandName ?? (r.type === 'PROXY' ? 'Đặt hộ' : 'TCG')} brandColor={r.type === 'PROXY' ? '#a21caf' : undefined} setCode={r.type === 'PROXY' ? (r.proxyCountry ?? 'HỘ') : undefined} size="sm" />
    </div>
  )
}

export function countryLabel(c: string | null) {
  return PROXY_COUNTRIES.find((x) => x.value === c)?.label ?? c ?? ''
}

export function QuoteBox({ r }: { r: ServiceRequest }) {
  if (r.quotedPrice === null) return null
  const fee = r.serviceFee ?? 0
  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
      <p className="text-sm font-bold text-purple-800">Báo giá từ shop</p>
      <div className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Giá sản phẩm (x{r.quantity})</span>
          <span className="font-semibold">{formatPrice(r.quotedPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Phí dịch vụ</span>
          <span className="font-semibold">{formatPrice(fee)}</span>
        </div>
        <div className="flex justify-between border-t border-purple-200 pt-2 text-base">
          <span className="font-bold">Tổng cộng</span>
          <span className="font-black text-primary-700">{formatPrice(r.quotedPrice + fee)}</span>
        </div>
      </div>
    </div>
  )
}

export function RequestCard({ r, onCancel }: { r: ServiceRequest; onCancel?: () => void }) {
  return (
    <div className={cn('card overflow-hidden', !r.userSeen && 'ring-2 ring-gold-400')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">#{r.code}</span>
          <TypeBadge type={r.type} />
          {!r.userSeen && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-gray-900">Cập nhật mới</span>}
        </div>
        <StatusBadge status={r.status} />
      </div>
      <Link to={`/yeu-cau/${r.id}`} className="flex gap-3 px-4 py-3 hover:bg-gray-50/60">
        <RequestThumb r={r} className="h-16 w-16 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900">{r.productName}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Số lượng: <b className="text-gray-800">{r.quantity}</b>
            {r.type === 'PROXY' && r.proxyCountry && <> · {countryLabel(r.proxyCountry)}</>}
            {r.unitPrice !== null && r.type !== 'PROXY' && <> · {formatPrice(r.unitPrice)}</>}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">Cập nhật {timeAgo(r.updatedAt)}</p>
          {r.adminNote && <p className="mt-1.5 line-clamp-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-blue-800">💬 Shop: {r.adminNote}</p>}
        </div>
        <ChevronRight className="hidden shrink-0 self-center text-gray-300 sm:block" />
      </Link>
      {(r.status === 'PENDING' || r.status === 'QUOTED') && (
        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-2.5">
          {r.status === 'PENDING' && onCancel && (
            <button onClick={onCancel} className="btn-ghost px-3 py-1.5 text-xs text-gray-600">
              Hủy yêu cầu
            </button>
          )}
          {r.status === 'QUOTED' && (
            <Link to={`/yeu-cau/${r.id}`} className="btn-primary px-3 py-1.5 text-xs">
              Xem & xác nhận báo giá
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function ProxyInfo({ r }: { r: ServiceRequest }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
      {r.proxyUrl && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-500">Link sản phẩm</dt>
          <dd>
            <a href={r.proxyUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all font-medium text-primary-700 hover:underline">
              {r.proxyUrl} <ExternalLink size={13} className="shrink-0" />
            </a>
          </dd>
        </div>
      )}
      <div>
        <dt className="text-xs text-gray-500">Nước mua</dt>
        <dd className="font-medium">{countryLabel(r.proxyCountry)}</dd>
      </div>
      {r.proxyRefPrice !== null && (
        <div>
          <dt className="text-xs text-gray-500">Giá tham khảo khách đưa</dt>
          <dd className="font-medium">{formatPrice(r.proxyRefPrice)}</dd>
        </div>
      )}
      {r.proxyImageUrl && (
        <div className="sm:col-span-2">
          <dt className="mb-1 text-xs text-gray-500">Ảnh minh họa</dt>
          <dd>
            <a href={r.proxyImageUrl} target="_blank" rel="noreferrer">
              <img src={r.proxyImageUrl} alt="Ảnh minh họa" className="h-32 rounded-xl border border-gray-200 object-cover" />
            </a>
          </dd>
        </div>
      )}
    </dl>
  )
}
