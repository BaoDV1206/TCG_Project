'use client'

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@/lib/router'
import { ClipboardList, KeyRound, LogOut, Save, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useRequestSummary } from '../hooks/queries'
import { api, errorMessage } from '../lib/api'
import type { User } from '../lib/types'
import { formatDate } from '../lib/format'
import { Spinner } from '../components/ui/Common'

export default function AccountPage() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const { data: summary } = useRequestSummary()
  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changing, setChanging] = useState(false)

  if (!user) return null

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const u = await api.put<User>('/account/me', { ...profile, email: profile.email || null })
      setUser(u)
      toast.success('Đã cập nhật thông tin')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }
    setChanging(true)
    try {
      await api.post('/account/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      toast.success(user.hasPassword ? 'Đổi mật khẩu thành công' : 'Đã đặt mật khẩu. Giờ bạn có thể đăng nhập bằng tên đăng nhập và mật khẩu.')
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      if (!user.hasPassword) setUser({ ...user, hasPassword: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="card p-5 text-center">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="mx-auto h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-orange-500 text-2xl font-black text-white">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <p className="mt-3 font-bold text-gray-900">{user.fullName}</p>
          <p className="text-sm text-gray-500">@{user.username}</p>
          {user.googleLinked && (
            <p className="mx-auto mt-2 w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Đã liên kết Google</p>
          )}
          <p className="mt-1 text-xs text-gray-400">Thành viên từ {formatDate(user.createdAt)}</p>
        </div>
        <div className="card grid grid-cols-3 divide-x divide-gray-100 py-3 text-center">
          <div>
            <p className="text-lg font-black text-amber-600">{summary?.pending ?? 0}</p>
            <p className="text-[11px] text-gray-500">Chờ duyệt</p>
          </div>
          <div>
            <p className="text-lg font-black text-blue-600">{summary?.processing ?? 0}</p>
            <p className="text-[11px] text-gray-500">Đang xử lý</p>
          </div>
          <div>
            <p className="text-lg font-black text-emerald-600">{summary?.completed ?? 0}</p>
            <p className="text-[11px] text-gray-500">Hoàn thành</p>
          </div>
        </div>
        <div className="card p-2">
          <Link to="/yeu-cau" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ClipboardList size={18} /> Yêu cầu của tôi
          </Link>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="space-y-4">
        <form onSubmit={saveProfile} className="card space-y-4 p-4 md:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <UserRound size={20} className="text-primary-700" /> Thông tin cá nhân
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="a-name">Họ và tên</label>
              <input id="a-name" className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="a-phone">Số điện thoại</label>
              <input id="a-phone" className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="a-email">Email</label>
              <input id="a-email" type="email" className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="a-addr">Địa chỉ nhận hàng</label>
              <textarea id="a-addr" className="input min-h-20" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" disabled={saving}>
            {saving ? <Spinner /> : <Save size={18} />} Lưu thay đổi
          </button>
        </form>

        <form onSubmit={changePassword} className="card space-y-4 p-4 md:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <KeyRound size={20} className="text-primary-700" /> {user.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </h2>
          {!user.hasPassword && (
            <p className="text-sm text-gray-500">
              Bạn đang đăng nhập bằng Google. Đặt mật khẩu nếu muốn đăng nhập thêm bằng tên đăng nhập <b>@{user.username}</b>.
            </p>
          )}
          <div className={user.hasPassword ? 'grid gap-4 sm:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'}>
            {user.hasPassword && (
              <div>
                <label className="label" htmlFor="pw-cur">Mật khẩu hiện tại</label>
                <input id="pw-cur" type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" required />
              </div>
            )}
            <div>
              <label className="label" htmlFor="pw-new">Mật khẩu mới</label>
              <input id="pw-new" type="password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" minLength={6} required />
            </div>
            <div>
              <label className="label" htmlFor="pw-cf">Nhập lại</label>
              <input id="pw-cf" type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required />
            </div>
          </div>
          <button className="btn-outline" disabled={changing}>
            {changing ? <Spinner /> : <KeyRound size={18} />} {user.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
