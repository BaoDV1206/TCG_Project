import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ClipboardList, Hourglass, Package, Users } from 'lucide-react'
import { api } from '../../lib/api'
import type { Dashboard } from '../../lib/types'
import { PageLoader, StatusBadge, TypeBadge } from '../../components/ui/Common'
import { StatCard } from './AdminParts'
import { cn, formatDate, timeAgo } from '../../lib/format'

const SERIES = [
  { key: 'purchase', label: 'Mua', color: '#0ea5e9' },
  { key: 'preOrder', label: 'Đặt trước', color: '#6366f1' },
  { key: 'proxy', label: 'Đặt hộ', color: '#c026d3' },
] as const

function DailyChart({ data }: { data: Dashboard['daily'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const totals = data.map((d) => d.purchase + d.preOrder + d.proxy)
  const max = Math.max(4, ...totals)
  const sum = totals.reduce((a, b) => a + b, 0)
  const h = hover !== null ? data[hover] : null

  return (
    <div className="card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900">Yêu cầu 30 ngày gần nhất</h3>
          <p className="text-sm text-gray-500">
            Tổng <b className="text-gray-900">{sum}</b> yêu cầu
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-gray-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[max, Math.round(max / 2), 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-right text-[10px] text-gray-400 tabular-nums">{v}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="relative ml-7 flex h-48 items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div
              key={d.date}
              className="flex h-full flex-1 cursor-default flex-col justify-end"
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(i)}
            >
              <div className={cn('flex flex-col-reverse overflow-hidden rounded-t-[3px] transition-opacity', hover !== null && hover !== i && 'opacity-50')} style={{ height: `${(totals[i] / max) * 100}%` }}>
                {SERIES.map((s) =>
                  d[s.key] > 0 ? <div key={s.key} style={{ background: s.color, height: `${(d[s.key] / totals[i]) * 100}%` }} className="border-t border-white first:border-t-0" /> : null,
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="ml-7 mt-1.5 flex justify-between text-[10px] text-gray-400">
          <span>{formatDate(data[0]?.date).slice(0, 5)}</span>
          <span>{formatDate(data[15]?.date).slice(0, 5)}</span>
          <span>{formatDate(data[data.length - 1]?.date).slice(0, 5)}</span>
        </div>
        {h && (
          <div className="absolute right-0 top-0 rounded-xl bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
            <p className="font-bold">{formatDate(h.date)}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex justify-between gap-4">
                <span className="text-gray-300">{s.label}</span> <span className="font-semibold tabular-nums">{h[s.key]}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get<Dashboard>('/admin/dashboard') })
  if (isLoading || !data) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin/yeu-cau?status=PENDING">
          <StatCard
            label="Yêu cầu chờ duyệt"
            value={data.pendingCount}
            icon={<Hourglass size={22} />}
            tone="bg-amber-100 text-amber-700"
            hint={`Mua ${data.pendingByType.PURCHASE} · Đặt trước ${data.pendingByType.PRE_ORDER} · Đặt hộ ${data.pendingByType.PROXY}`}
          />
        </Link>
        <StatCard label="Yêu cầu mới hôm nay" value={data.todayCount} icon={<ClipboardList size={22} />} tone="bg-blue-100 text-blue-700" />
        <Link to="/admin/san-pham">
          <StatCard label="Sản phẩm đang bán" value={data.activeProducts} icon={<Package size={22} />} tone="bg-emerald-100 text-emerald-700" />
        </Link>
        <Link to="/admin/nguoi-dung">
          <StatCard label="Người dùng" value={data.userCount} icon={<Users size={22} />} tone="bg-purple-100 text-purple-700" />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <DailyChart data={data.daily} />
        <div className="card p-4 md:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
            <CalendarClock size={18} className="text-indigo-600" /> Đặt trước nhiều nhất
          </h3>
          {data.topPreorders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Chưa có dữ liệu</p>
          ) : (
            <ol className="space-y-3">
              {data.topPreorders.map((t, i) => {
                const max = data.topPreorders[0].quantity
                return (
                  <li key={t.productId}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">{i + 1}</span>
                        <span className="truncate">{t.name}</span>
                      </span>
                      <b className="shrink-0 tabular-nums">{t.quantity}</b>
                    </div>
                    <div className="ml-7 mt-1 h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(t.quantity / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 md:px-5">
          <h3 className="font-bold text-gray-900">Yêu cầu mới nhất</h3>
          <Link to="/admin/yeu-cau" className="text-sm font-semibold text-primary-700 hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {data.latest.map((r) => (
            <Link key={r.id} to={`/admin/yeu-cau?open=${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-gray-50 md:px-5">
              <span className="w-24 text-sm font-bold">#{r.code}</span>
              <TypeBadge type={r.type} />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                <b>{r.user.fullName}</b> · {r.productName}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
              <StatusBadge status={r.status} />
            </Link>
          ))}
          {data.latest.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">Chưa có yêu cầu nào</p>}
        </div>
      </div>
    </div>
  )
}
