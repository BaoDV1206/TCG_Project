'use client'

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from '@/lib/router'
import {
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Truck,
  User as UserIcon,
  CalendarClock,
  Globe2,
  Phone,
} from 'lucide-react'
import { Logo } from './Logo'
import { SearchBox } from './SearchBox'
import { useAuth } from '../../context/AuthContext'
import { useRequestSummary, useSettings } from '../../hooks/queries'
import { cn } from '../../lib/format'

export const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/san-pham', label: 'Sản phẩm' },
  { to: '/dat-truoc', label: 'Đặt trước' },
  { to: '/dat-ho', label: 'Đặt hộ' },
]

function AccountMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <Link to="/dang-nhap" className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 text-sm font-semibold text-white hover:bg-white/20">
        <UserIcon size={20} />
        <span className="hidden lg:inline">Đăng nhập</span>
      </Link>
    )
  }

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1.5 text-sm font-semibold text-white hover:bg-white/20" aria-haspopup="menu" aria-expanded={open}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-xs font-black text-gray-900">
          {user.fullName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate lg:inline">{user.fullName}</span>
        <ChevronDown size={16} className="hidden lg:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 animate-fade-in rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5" role="menu">
          <div className="border-b border-gray-100 px-3 pb-2 pt-1">
            <p className="truncate text-sm font-bold text-gray-900">{user.fullName}</p>
            <p className="truncate text-xs text-gray-500">@{user.username}</p>
          </div>
          <div className="pt-1" onClick={() => setOpen(false)}>
            <Link to="/tai-khoan" className={item}>
              <UserIcon size={17} /> Tài khoản
            </Link>
            <Link to="/yeu-cau" className={item}>
              <ClipboardList size={17} /> Yêu cầu của tôi
            </Link>
            {isAdmin && (
              <Link to="/admin" className={cn(item, 'text-primary-700')}>
                <LayoutDashboard size={17} /> Trang quản trị
              </Link>
            )}
            <button
              className={item}
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              <LogOut size={17} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function RequestsButton({ className }: { className?: string }) {
  const { user } = useAuth()
  const { data } = useRequestSummary()
  const active = (data?.pending ?? 0) + (data?.processing ?? 0)
  return (
    <Link to={user ? '/yeu-cau' : '/dang-nhap?redirect=/yeu-cau'} className={cn('relative flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 text-sm font-semibold text-white hover:bg-white/20', className)}>
      <span className="relative">
        <ClipboardList size={20} />
        {data && data.unseen > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-primary-800" />}
      </span>
      <span className="hidden xl:inline">Yêu cầu</span>
      {active > 0 && <span className="rounded-full bg-gold-400 px-1.5 text-xs font-bold text-gray-900">{active}</span>}
    </Link>
  )
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [mobileSearch, setMobileSearch] = useState(false)
  const { data: s } = useSettings()

  return (
    <header className="sticky top-0 z-40 shadow-lg">
      {/* thanh trên cùng (máy tính) */}
      <div className="hidden bg-gray-900 text-xs text-gray-300 lg:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-gold-400" /> Hàng chính hãng 100%</span>
            <span className="flex items-center gap-1.5"><CalendarClock size={14} className="text-gold-400" /> Nhận đặt trước giữ suất</span>
            <span className="flex items-center gap-1.5"><Globe2 size={14} className="text-gold-400" /> Đặt hộ Nhật – Mỹ</span>
            <span className="flex items-center gap-1.5"><Truck size={14} className="text-gold-400" /> Giao hàng toàn quốc</span>
          </div>
          {s?.hotline && (
            <a href={`tel:${s.hotline.replace(/\s/g, '')}`} className="flex items-center gap-1.5 font-semibold text-white hover:text-gold-400">
              <Phone size={13} /> Hotline: {s.hotline}
            </a>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-900 via-primary-700 to-primary-800">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 md:h-16 md:gap-3 md:px-4">
          <button onClick={onOpenMenu} className="rounded-lg p-1.5 text-white hover:bg-white/10 lg:hidden" aria-label="Mở menu">
            <Menu size={24} />
          </button>
          <Logo />

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-white/15 text-gold-300' : 'text-white/90 hover:bg-white/10 hover:text-white')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-2 hidden flex-1 md:block lg:ml-4">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0 md:gap-2">
            <button onClick={() => setMobileSearch(true)} className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden" aria-label="Tìm kiếm">
              <Search size={22} />
            </button>
            <RequestsButton className="hidden md:flex" />
            <AccountMenu />
          </div>
        </div>
      </div>
      {mobileSearch && <SearchBox variant="full" autoFocus onDone={() => setMobileSearch(false)} />}
    </header>
  )
}
