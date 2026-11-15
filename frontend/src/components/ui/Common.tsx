import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2, PackageOpen } from 'lucide-react'
import { cn } from '../../lib/format'
import { REQUEST_STATUS, REQUEST_TYPE } from '../../lib/constants'
import type { RequestStatus, RequestType } from '../../lib/types'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} size={18} />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
      <Spinner className="mr-2" /> Đang tải...
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white p-2.5 shadow-card">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <Skeleton className="mt-3 h-9 w-full" />
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        {icon ?? <PackageOpen size={36} />}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages: (number | '...')[] = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition'
  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <button
        className={cn(btn, 'bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40')}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(btn, p === page ? 'bg-primary-700 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50')}
          >
            {p + 1}
          </button>
        ),
      )}
      <button
        className={cn(btn, 'bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40')}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  )
}

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const s = REQUEST_STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', s.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function TypeBadge({ type }: { type: RequestType }) {
  const t = REQUEST_TYPE[type]
  return <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1', t.className)}>{t.label}</span>
}

export function SectionTitle({ title, action, icon }: { title: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-gray-900 md:text-xl">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  )
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="no-scrollbar mb-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm text-gray-500">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-primary-700">
              {it.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-800">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
