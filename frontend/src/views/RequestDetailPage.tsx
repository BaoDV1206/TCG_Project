'use client'

import { useEffect, useState } from 'react'
import { Link, useParams } from '@/lib/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../lib/api'
import type { ServiceRequest } from '../lib/types'
import { formatDate, formatDateTime, formatPrice } from '../lib/format'
import { EmptyState, PageLoader, StatusBadge, TypeBadge } from '../components/ui/Common'
import { HistoryList, ProxyInfo, QuoteBox, RequestStepper, RequestThumb } from '../components/request/RequestParts'
import { ContactButtons } from '../components/product/ActionModal'
import { CancelRequestModal } from './MyRequestsPage'
import { Modal } from '../components/ui/Modal'

export default function RequestDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rejectQuote, setRejectQuote] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['my-request', id],
    queryFn: () => api.get<ServiceRequest>(`/requests/${id}`),
  })

  useEffect(() => {
    // đã xem -> cập nhật lại badge
    if (r) qc.invalidateQueries({ queryKey: ['request-summary'] })
  }, [r, qc])

  const respond = useMutation({
    mutationFn: (accept: boolean) => api.post<ServiceRequest>(`/requests/${id}/quote-response`, { accept, note: accept ? null : rejectNote }),
    onSuccess: (res, accept) => {
      qc.setQueryData(['my-request', id], res)
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['request-summary'] })
      toast.success(accept ? 'Đã xác nhận báo giá. Shop sẽ liên hệ hướng dẫn cọc.' : 'Đã từ chối báo giá')
      setRejectQuote(false)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (isError || !r) return <EmptyState title="Không tìm thấy yêu cầu" action={<Link to="/yeu-cau" className="btn-primary">Quay lại danh sách</Link>} />

  const deposit = r.type === 'PRE_ORDER' && r.unitPrice && r.depositPercent ? Math.round((r.unitPrice * r.quantity * r.depositPercent) / 100) : null

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/yeu-cau" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700">
        <ArrowLeft size={16} /> Yêu cầu của tôi
      </Link>

      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">#{r.code}</h1>
              <TypeBadge type={r.type} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">Gửi lúc {formatDateTime(r.createdAt)}</p>
          </div>
          <StatusBadge status={r.status} className="px-3 py-1.5 text-sm" />
        </div>
        <div className="mt-5">
          <RequestStepper r={r} />
        </div>
      </div>

      {r.status === 'QUOTED' && (
        <div className="card space-y-3 border-2 border-purple-300 p-4 md:p-5">
          <p className="text-sm font-semibold text-purple-800">Shop đã gửi báo giá. Vui lòng xác nhận để shop tiến hành mua hàng.</p>
          <QuoteBox r={r} />
          <div className="flex gap-2">
            <button className="btn-outline flex-1" onClick={() => setRejectQuote(true)} disabled={respond.isPending}>
              <XCircle size={18} /> Từ chối
            </button>
            <button className="btn-primary flex-[2]" onClick={() => respond.mutate(true)} disabled={respond.isPending}>
              <CheckCircle2 size={18} /> Đồng ý báo giá
            </button>
          </div>
        </div>
      )}

      {r.adminNote && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-700">Ghi chú từ shop</p>
          <p className="mt-1 whitespace-pre-line text-sm text-blue-900">{r.adminNote}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-4 md:p-5">
          <h2 className="mb-3 text-base font-bold">Thông tin yêu cầu</h2>
          <div className="flex gap-3">
            <RequestThumb r={r} className="h-20 w-20" />
            <div className="min-w-0">
              {r.productSlug ? (
                <Link to={`/san-pham/${r.productSlug}`} className="font-semibold text-gray-900 hover:text-primary-700">
                  {r.productName}
                </Link>
              ) : (
                <p className="break-words font-semibold text-gray-900">{r.productName}</p>
              )}
              <p className="mt-1 text-sm text-gray-600">
                Số lượng: <b>{r.quantity}</b>
              </p>
              {r.unitPrice !== null && <p className="text-sm text-gray-600">Đơn giá: <b className="text-primary-700">{formatPrice(r.unitPrice)}</b></p>}
              {r.type === 'PRE_ORDER' && r.releaseDate && <p className="text-sm text-gray-600">Phát hành: {formatDate(r.releaseDate)}</p>}
            </div>
          </div>
          {deposit !== null && (
            <div className="mt-3 flex justify-between rounded-xl bg-indigo-50 px-3 py-2 text-sm">
              <span>Tiền cọc dự kiến ({r.depositPercent}%)</span>
              <b className="text-indigo-700">{formatPrice(deposit)}</b>
            </div>
          )}
          {r.type === 'PROXY' && (
            <div className="mt-4">
              <ProxyInfo r={r} />
            </div>
          )}
          {r.status !== 'QUOTED' && r.quotedPrice !== null && (
            <div className="mt-4">
              <QuoteBox r={r} />
            </div>
          )}
          {r.note && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">Ghi chú của bạn</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm">{r.note}</p>
            </div>
          )}
          {r.status === 'PENDING' && (
            <button className="btn-danger mt-4 w-full" onClick={() => setCancelOpen(true)}>
              Hủy yêu cầu
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4 md:p-5">
            <h2 className="mb-3 text-base font-bold">Lịch sử xử lý</h2>
            <HistoryList items={r.history} />
          </div>
          <div className="card p-4 md:p-5">
            <h2 className="mb-3 text-base font-bold">Cần hỗ trợ?</h2>
            <div className="[&_.grid]:grid-cols-1">
              <ContactButtons />
            </div>
          </div>
        </div>
      </div>

      <CancelRequestModal request={cancelOpen ? r : null} onClose={() => setCancelOpen(false)} />
      <Modal
        open={rejectQuote}
        onClose={() => setRejectQuote(false)}
        title="Từ chối báo giá"
        size="sm"
        footer={
          <>
            <button className="btn-outline flex-1" onClick={() => setRejectQuote(false)}>
              Quay lại
            </button>
            <button className="btn-primary flex-1" disabled={respond.isPending} onClick={() => respond.mutate(false)}>
              Xác nhận từ chối
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-gray-600">Yêu cầu đặt hộ sẽ bị hủy. Bạn có thể cho shop biết lý do:</p>
        <textarea className="input min-h-20" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="VD: Giá cao hơn dự kiến..." />
      </Modal>
    </div>
  )
}
