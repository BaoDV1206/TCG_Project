'use client'

import { NavLink } from '@/lib/router'
import { CalendarClock, ClipboardList, Home, LayoutGrid, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useRequestSummary } from '../../hooks/queries'
import { cn } from '../../lib/format'

/** Thanh điều hướng cố định ở đáy màn hình – chỉ hiện trên điện thoại */
export function MobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth()
  const { data } = useRequestSummary()
  const active = (data?.pending ?? 0) + (data?.processing ?? 0)
  const cls = ({ isActive }: { isActive: boolean }) =>
    cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-primary-700' : 'text-gray-500')

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden" aria-label="Điều hướng">
      <div className="flex">
        <NavLink to="/" end className={cls}>
          <Home size={22} /> Trang chủ
        </NavLink>
        <button onClick={onOpenMenu} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-500">
          <LayoutGrid size={22} /> Danh mục
        </button>
        <NavLink to="/dat-truoc" className={cls}>
          <CalendarClock size={22} /> Đặt trước
        </NavLink>
        <NavLink to={user ? '/yeu-cau' : '/dang-nhap?redirect=/yeu-cau'} className={cls}>
          <span className="relative">
            <ClipboardList size={22} />
            {active > 0 && (
              <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-primary-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{active}</span>
            )}
            {data && data.unseen > 0 && active === 0 && <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary-600" />}
          </span>
          Yêu cầu
        </NavLink>
        <NavLink to={user ? '/tai-khoan' : '/dang-nhap'} className={cls}>
          <User size={22} /> Tài khoản
        </NavLink>
      </div>
    </nav>
  )
}
