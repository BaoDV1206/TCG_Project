'use client'

import { useState } from 'react'
import { Link, useSearchParams } from '@/lib/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../lib/api'
import type { PageResponse, ServiceRequest } from '../lib/types'
import { REQUEST_TABS, REQUEST_TYPE } from '../lib/constants'
import { useRequestSummary } from '../hooks/queries'
import { RequestCard } from '../components/request/RequestParts'
import { EmptyState, Pagination, Skeleton } from '../components/ui/Common'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/format'

export function CancelRequestModal({ request, onClose }: { request: ServiceRequest | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const m = useMutation({
    mutationFn: () => api.post<ServiceRequest>(`/requests/${request!.id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Đã hủy yêu cầu')
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['request-summary'] })
      qc.invalidateQueries({ queryKey: ['my-request'] })
      setReason('')
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={`Hủy yêu cầu #${request?.code ?? ''}`}
      size="sm"
      footer={
        <>
          <button className="btn-outline flex-1" onClick={onClose}>
            Không
          </button>
          <button className="btn-primary flex-1" disabled={m.isPending} onClick={() => m.mutate()}>
            Xác nhận hủy
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-gray-600">Bạn chắc chắn muốn hủy yêu cầu này?</p>
      <textarea className="input min-h-20" placeholder="Lý do hủy (không bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  )
}

export default function MyRequestsPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'ALL'
  const type = params.get('type') ?? ''
  const page = parseInt(params.get('page') ?? '0', 10)
  const [cancelTarget, setCancelTarget] = useState<ServiceRequest | null>(null)
  const { data: summary } = useRequestSummary()

  const { data, isLoading } = useQuery({
    queryKey: ['my-requests', status, type, page],
    queryFn: () => api.get<PageResponse<ServiceRequest>>('/requests', { status, type, page, size: 10 }),
    placeholderData: (prev) => prev,
  })

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white">
          <ClipboardList size={22} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">Yêu cầu của tôi</h1>
          <p className="text-sm text-gray-500">Theo dõi trạng thái các yêu cầu Mua, Đặt trước, Đặt hộ</p>
        </div>
      </div>

      <div className="card sticky top-14 z-20 mb-4 md:top-16 lg:top-24">
        <div className="no-scrollbar flex overflow-x-auto border-b border-gray-100 px-2">
          {REQUEST_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => set({ status: t.key === 'ALL' ? null : t.key })}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold',
                status === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800',
              )}
            >
              {t.label}
              {summary && (
                <span className={cn('rounded-full px-1.5 text-xs', status === t.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500')}>
                  {summary[t.summaryKey]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2.5">
          {[{ k: '', l: 'Tất cả loại' }, ...Object.entries(REQUEST_TYPE).map(([k, v]) => ({ k, l: v.label }))].map((t) => (
            <button
              key={t.k}
              onClick={() => set({ type: t.k || null })}
              className={cn('chip shrink-0 py-1 text-xs', type === t.k ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600')}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        {data?.items.map((r) => (
          <RequestCard key={r.id} r={r} onCancel={() => setCancelTarget(r)} />
        ))}
        {data && data.items.length === 0 && (
          <div className="card">
            <EmptyState
              title="Chưa có yêu cầu nào"
              description="Khi bạn bấm Liên hệ, Đặt trước hoặc gửi Đặt hộ, yêu cầu sẽ xuất hiện ở đây để bạn theo dõi."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/san-pham" className="btn-primary">Khám phá sản phẩm</Link>
                  <Link to="/dat-ho" className="btn-outline">Gửi đặt hộ</Link>
                </div>
              }
            />
          </div>
        )}
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => set({ page: p ? String(p) : null })} />}
      <CancelRequestModal request={cancelTarget} onClose={() => setCancelTarget(null)} />
    </div>
  )
}
