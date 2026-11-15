import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MapPin, MessageSquare, Phone, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { PageResponse, RequestStatus, ServiceRequest } from '../../lib/types'
import { ADMIN_ACTION_LABEL, REQUEST_STATUS, REQUEST_TYPE } from '../../lib/constants'
import { useDebounce } from '../../hooks/queries'
import { Drawer } from '../../components/ui/Modal'
import { EmptyState, PageLoader, Pagination, Skeleton, Spinner, StatusBadge, TypeBadge } from '../../components/ui/Common'
import { HistoryList, ProxyInfo, QuoteBox, RequestStepper, RequestThumb } from '../../components/request/RequestParts'
import { cn, formatDate, formatDateTime, formatPrice, timeAgo } from '../../lib/format'

function ActionPanel({ r, onDone }: { r: ServiceRequest; onDone: (r: ServiceRequest) => void }) {
  const qc = useQueryClient()
  const [target, setTarget] = useState<RequestStatus | null>(null)
  const [note, setNote] = useState('')
  const [price, setPrice] = useState(r.quotedPrice ? String(r.quotedPrice) : '')
  const [fee, setFee] = useState(r.serviceFee ? String(r.serviceFee) : '')

  useEffect(() => {
    setTarget(null)
    setNote('')
    setPrice(r.quotedPrice ? String(r.quotedPrice) : '')
    setFee(r.serviceFee ? String(r.serviceFee) : '')
  }, [r.id, r.status, r.quotedPrice, r.serviceFee])

  const m = useMutation({
    mutationFn: (status: RequestStatus) =>
      api.post<ServiceRequest>(`/admin/requests/${r.id}/transition`, {
        status,
        note: note.trim() || null,
        quotedPrice: status === 'QUOTED' ? Number(price) : null,
        serviceFee: status === 'QUOTED' ? Number(fee || 0) : null,
      }),
    onSuccess: (res) => {
      toast.success(`#${res.code} → ${REQUEST_STATUS[res.status].label}`)
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      onDone(res)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (r.allowedNext.length === 0) {
    return <p className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-500">Yêu cầu đã kết thúc – không còn thao tác.</p>
  }

  const submit = (s: RequestStatus) => {
    if (s === 'REJECTED' && !note.trim()) {
      setTarget('REJECTED')
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    if (s === 'QUOTED' && (!price || Number(price) <= 0)) {
      setTarget('QUOTED')
      toast.error('Vui lòng nhập giá báo')
      return
    }
    m.mutate(s)
  }

  const needsQuote = r.allowedNext.includes('QUOTED')

  return (
    <div className="space-y-3">
      {needsQuote && (
        <div className={cn('grid grid-cols-2 gap-2 rounded-xl border p-3', target === 'QUOTED' ? 'border-purple-400 bg-purple-50' : 'border-gray-200')}>
          <div>
            <label className="label text-xs" htmlFor="q-price">Giá sản phẩm (₫) *</label>
            <input id="q-price" className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="Tổng cho cả số lượng" />
          </div>
          <div>
            <label className="label text-xs" htmlFor="q-fee">Phí dịch vụ (₫)</label>
            <input id="q-fee" className="input" inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </div>
          {price && <p className="col-span-2 text-right text-sm">Tổng: <b className="text-primary-700">{formatPrice(Number(price) + Number(fee || 0))}</b></p>}
        </div>
      )}
      <div>
        <label className="label text-xs" htmlFor="adm-note">
          Ghi chú gửi khách {target === 'REJECTED' && <span className="text-red-600">(bắt buộc khi từ chối)</span>}
        </label>
        <textarea id="adm-note" className={cn('input min-h-20', target === 'REJECTED' && !note && 'border-red-400')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Shop đã nhận, sẽ gọi bạn trong hôm nay..." />
      </div>
      <div className="flex flex-wrap gap-2">
        {r.allowedNext
          .filter((s) => s !== 'REJECTED')
          .map((s) => (
            <button key={s} className="btn-primary flex-1" disabled={m.isPending} onClick={() => submit(s)}>
              {m.isPending && m.variables === s && <Spinner />}
              {s === 'QUOTED' && r.status === 'QUOTED' ? 'Cập nhật báo giá' : ADMIN_ACTION_LABEL[s]}
            </button>
          ))}
        <button className="btn-danger" disabled={m.isPending} onClick={() => submit('REJECTED')}>
          {m.isPending && m.variables === 'REJECTED' && <Spinner />}
          Từ chối
        </button>
      </div>
      {r.status === 'QUOTED' && <p className="text-xs text-purple-700">Đang chờ khách xác nhận báo giá.</p>}
    </div>
  )
}

function RequestDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: r, isLoading } = useQuery({
    queryKey: ['admin-request', id],
    queryFn: () => api.get<ServiceRequest>(`/admin/requests/${id}`),
    enabled: id !== null,
  })
  const phone = r?.user.phone?.replace(/\s/g, '')

  return (
    <Drawer open={id !== null} onClose={onClose} title={r ? `Yêu cầu #${r.code}` : 'Yêu cầu'} width="max-w-xl">
      {isLoading || !r ? (
        <PageLoader />
      ) : (
        <div className="space-y-5 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TypeBadge type={r.type} />
              <span className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</span>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <RequestStepper r={r} />

          <section className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-500">Khách hàng</p>
            <p className="mt-1 font-bold text-gray-900">
              {r.user.fullName} <span className="font-normal text-gray-500">@{r.user.username}</span>
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              {r.user.phone && <p className="flex items-center gap-2"><Phone size={14} /> {r.user.phone}</p>}
              {r.user.email && <p className="flex items-center gap-2"><Mail size={14} /> {r.user.email}</p>}
              {r.user.address && <p className="flex items-center gap-2"><MapPin size={14} /> {r.user.address}</p>}
            </div>
            {phone && (
              <div className="mt-3 flex gap-2">
                <a href={`tel:${phone}`} className="btn-outline flex-1 py-2 text-xs"><Phone size={14} /> Gọi</a>
                <a href={`https://zalo.me/${phone}`} target="_blank" rel="noreferrer" className="btn flex-1 bg-[#0068ff] py-2 text-xs text-white">Zalo</a>
              </div>
            )}
          </section>

          <section>
            <p className="mb-2 text-xs font-bold uppercase text-gray-500">Nội dung yêu cầu</p>
            <div className="flex gap-3">
              <RequestThumb r={r} className="h-16 w-16" />
              <div className="min-w-0 text-sm">
                {r.productSlug ? (
                  <Link to={`/san-pham/${r.productSlug}`} target="_blank" className="font-semibold text-gray-900 hover:text-primary-700">{r.productName}</Link>
                ) : (
                  <p className="break-words font-semibold">{r.productName}</p>
                )}
                <p className="text-gray-600">Số lượng: <b>{r.quantity}</b>{r.unitPrice !== null && <> · Đơn giá {formatPrice(r.unitPrice)}</>}</p>
                {r.type === 'PRE_ORDER' && r.releaseDate && <p className="text-gray-600">Phát hành {formatDate(r.releaseDate)} · cọc {r.depositPercent ?? 0}%</p>}
              </div>
            </div>
            {r.type === 'PROXY' && <div className="mt-3"><ProxyInfo r={r} /></div>}
            {r.note && (
              <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <MessageSquare size={16} className="mt-0.5 shrink-0" /> <span className="whitespace-pre-line">{r.note}</span>
              </p>
            )}
            {r.quotedPrice !== null && <div className="mt-3"><QuoteBox r={r} /></div>}
          </section>

          <section className="rounded-2xl border border-gray-200 p-4">
            <p className="mb-3 text-xs font-bold uppercase text-gray-500">Xử lý</p>
            <ActionPanel r={r} onDone={(res) => qc.setQueryData(['admin-request', id], res)} />
          </section>

          <section>
            <p className="mb-3 text-xs font-bold uppercase text-gray-500">Lịch sử</p>
            <HistoryList items={r.history} />
          </section>
        </div>
      )}
    </Drawer>
  )
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CLOSED', ...Object.keys(REQUEST_STATUS).filter((s) => !['PENDING', 'COMPLETED'].includes(s))]
const STATUS_FILTER_LABEL: Record<string, string> = {
  ALL: 'Tất cả trạng thái',
  PROCESSING: 'Đang xử lý (tất cả)',
  CLOSED: 'Từ chối / Hủy',
  ...Object.fromEntries(Object.entries(REQUEST_STATUS).map(([k, v]) => [k, v.label])),
}

export default function AdminRequests() {
  const [params, setParams] = useSearchParams()
  const type = params.get('type') ?? ''
  const status = params.get('status') ?? 'ALL'
  const page = parseInt(params.get('page') ?? '0', 10)
  const userId = params.get('userId') ?? ''
  const openId = params.get('open')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const dq = useDebounce(q, 350)

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes) && !('open' in changes)) next.delete('page')
    setParams(next, { replace: 'open' in changes })
  }

  useEffect(() => {
    if ((params.get('q') ?? '') !== dq) set({ q: dq || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq])

  const query = { type, status, q: params.get('q') ?? '', from, to, userId, page, size: 20 }
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-requests', query],
    queryFn: () => api.get<PageResponse<ServiceRequest>>('/admin/requests', query),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  })

  return (
    <div>
      <div className="card mb-4 space-y-3 p-3 md:p-4">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {[{ k: '', l: 'Tất cả loại' }, ...Object.entries(REQUEST_TYPE).map(([k, v]) => ({ k, l: v.label }))].map((t) => (
            <button key={t.k} onClick={() => set({ type: t.k || null })} className={cn('chip shrink-0', type === t.k ? 'border-primary-600 bg-primary-700 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>
              {t.l}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_auto_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Mã YC, tên, SĐT khách, sản phẩm..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input" value={status} onChange={(e) => set({ status: e.target.value === 'ALL' ? null : e.target.value })}>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{STATUS_FILTER_LABEL[s]}</option>
            ))}
          </select>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ ngày" />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Đến ngày" />
        </div>
        {userId && (
          <button onClick={() => set({ userId: null })} className="chip border-primary-200 bg-primary-50 text-xs text-primary-700">
            Đang lọc theo khách hàng #{userId} <X size={13} />
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
        <span>{data ? `${data.totalElements} yêu cầu` : ''}</span>
        {isFetching && <Spinner />}
      </div>

      {/* Bảng (máy tính) */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 text-center">SL</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày gửi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3"><Skeleton className="h-6" /></td>
                </tr>
              ))}
            {data?.items.map((r) => (
              <tr key={r.id} onClick={() => set({ open: String(r.id) })} className={cn('cursor-pointer hover:bg-primary-50/40', r.status === 'PENDING' && 'bg-amber-50/40')}>
                <td className="px-4 py-3 font-bold">#{r.code}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.user.fullName}</p>
                  <p className="text-xs text-gray-500">{r.user.phone}</p>
                </td>
                <td className="px-4 py-3"><TypeBadge type={r.type} /></td>
                <td className="max-w-xs px-4 py-3"><p className="line-clamp-2">{r.productName}</p></td>
                <td className="px-4 py-3 text-center font-semibold">{r.quantity}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{timeAgo(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <EmptyState title="Không có yêu cầu phù hợp" />}
      </div>

      {/* Thẻ (điện thoại) */}
      <div className="space-y-2 md:hidden">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        {data?.items.map((r) => (
          <button key={r.id} onClick={() => set({ open: String(r.id) })} className={cn('card block w-full p-3 text-left', r.status === 'PENDING' && 'ring-1 ring-amber-300')}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-bold">#{r.code} <TypeBadge type={r.type} /></span>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 line-clamp-1 text-sm font-medium">{r.productName} <span className="text-gray-500">x{r.quantity}</span></p>
            <p className="mt-1 text-xs text-gray-500">{r.user.fullName} · {r.user.phone} · {timeAgo(r.createdAt)}</p>
          </button>
        ))}
        {data?.items.length === 0 && <div className="card"><EmptyState title="Không có yêu cầu phù hợp" /></div>}
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => set({ page: p ? String(p) : null })} />}
      <RequestDrawer id={openId ? Number(openId) : null} onClose={() => set({ open: null })} />
    </div>
  )
}
