'use client'

import { useState } from 'react'
import { Link } from '@/lib/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Lock, Search, Shield, ShieldOff, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { PageResponse, User } from '../../lib/types'
import { useDebounce } from '../../hooks/queries'
import { useAuth } from '../../context/AuthContext'
import { EmptyState, Pagination, Skeleton } from '../../components/ui/Common'
import { ConfirmDialog, PageHeader } from './AdminParts'
import { cn, formatDate } from '../../lib/format'

type Action = { user: User; kind: 'lock' | 'unlock' | 'admin' | 'user' }

export default function AdminUsers() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(0)
  const [action, setAction] = useState<Action | null>(null)
  const dq = useDebounce(q, 350)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', dq, role, page],
    queryFn: () => api.get<PageResponse<User>>('/admin/users', { q: dq, role, page, size: 20 }),
    placeholderData: (prev) => prev,
  })

  const m = useMutation({
    mutationFn: (a: Action) =>
      a.kind === 'lock' || a.kind === 'unlock'
        ? api.patch(`/admin/users/${a.user.id}/enabled`, { value: a.kind === 'unlock' })
        : api.patch(`/admin/users/${a.user.id}/role`, { value: a.kind === 'admin' ? 'ADMIN' : 'USER' }),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setAction(null)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const labels: Record<Action['kind'], string> = {
    lock: 'Khóa tài khoản',
    unlock: 'Mở khóa tài khoản',
    admin: 'Cấp quyền quản trị',
    user: 'Thu hồi quyền quản trị',
  }

  return (
    <div>
      <PageHeader title="Người dùng" description={data ? `${data.totalElements} tài khoản` : undefined} />
      <div className="card mb-4 grid gap-2 p-3 sm:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tên, username, email, SĐT..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        </div>
        <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }}>
          <option value="">Mọi vai trò</option>
          <option value="USER">Khách hàng</option>
          <option value="ADMIN">Quản trị</option>
        </select>
      </div>

      <div className="card divide-y divide-gray-100 overflow-hidden">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-3 h-12" />)}
        {data?.items.map((u) => {
          const self = u.id === me?.id
          return (
            <div key={u.id} className={cn('flex flex-wrap items-center gap-3 px-3 py-3 md:px-4', !u.enabled && 'bg-red-50/50')}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white', u.role === 'ADMIN' ? 'bg-primary-700' : 'bg-gray-400')}>
                {u.fullName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                  {u.fullName}
                  {u.role === 'ADMIN' && <span className="rounded bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">ADMIN</span>}
                  {!u.enabled && <span className="rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-700">ĐÃ KHÓA</span>}
                  {self && <span className="text-xs font-normal text-gray-400">(bạn)</span>}
                </p>
                <p className="truncate text-xs text-gray-500">
                  @{u.username} · {u.phone ?? 'chưa có SĐT'} {u.email && `· ${u.email}`} · tham gia {formatDate(u.createdAt)}
                </p>
              </div>
              <Link to={`/admin/yeu-cau?userId=${u.id}`} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                <ClipboardList size={15} /> {u.requestCount ?? 0} yêu cầu
              </Link>
              {!self && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setAction({ user: u, kind: u.role === 'ADMIN' ? 'user' : 'admin' })}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    title={u.role === 'ADMIN' ? 'Thu hồi quyền admin' : 'Cấp quyền admin'}
                  >
                    {u.role === 'ADMIN' ? <ShieldOff size={17} /> : <Shield size={17} />}
                  </button>
                  <button
                    onClick={() => setAction({ user: u, kind: u.enabled ? 'lock' : 'unlock' })}
                    className={cn('rounded-lg p-2', u.enabled ? 'text-gray-500 hover:bg-red-50 hover:text-red-600' : 'text-emerald-600 hover:bg-emerald-50')}
                    title={u.enabled ? 'Khóa' : 'Mở khóa'}
                  >
                    {u.enabled ? <Lock size={17} /> : <Unlock size={17} />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {data?.items.length === 0 && <EmptyState title="Không tìm thấy người dùng" />}
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      <ConfirmDialog
        open={!!action}
        danger={action?.kind === 'lock'}
        title={action ? labels[action.kind] : ''}
        loading={m.isPending}
        message={<>{action && labels[action.kind]} cho <b>{action?.user.fullName}</b> (@{action?.user.username})?</>}
        onConfirm={() => action && m.mutate(action)}
        onClose={() => setAction(null)}
      />
    </div>
  )
}
