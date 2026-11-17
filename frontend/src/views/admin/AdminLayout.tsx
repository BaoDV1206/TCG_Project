'use client'

import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from '@/lib/router'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ClipboardList,
  ExternalLink,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Tags,
  Users,
} from 'lucide-react'
import { api } from '../../lib/api'
import type { Dashboard } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import { Drawer } from '../../components/ui/Modal'
import { Logo } from '../../components/layout/Logo'
import { cn } from '../../lib/format'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/yeu-cau', label: 'Yêu cầu', icon: ClipboardList, badge: true },
  { to: '/admin/san-pham', label: 'Sản phẩm', icon: Package },
  { to: '/admin/set', label: 'Set / Pack', icon: Layers },
  { to: '/admin/danh-muc', label: 'Thương hiệu & Loại', icon: Tags },
  { to: '/admin/banner', label: 'Banner', icon: Image },
  { to: '/admin/nguoi-dung', label: 'Người dùng', icon: Users },
  { to: '/admin/cai-dat', label: 'Cài đặt', icon: Settings },
]

export function usePendingCount() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<Dashboard>('/admin/dashboard'),
    refetchInterval: 60_000,
    select: (d) => d.pendingCount,
  })
}

function NavItems({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { data: pending } = usePendingCount()
  return (
    <nav className="space-y-1 p-3">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onNavigate}
          title={collapsed ? n.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-primary-700 text-white shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white',
              collapsed && 'justify-center px-0',
            )
          }
        >
          <span className="relative">
            <n.icon size={20} />
            {collapsed && n.badge && !!pending && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-gold-400" />}
          </span>
          {!collapsed && <span className="flex-1">{n.label}</span>}
          {!collapsed && n.badge && !!pending && <span className="rounded-full bg-gold-400 px-2 text-xs font-bold text-gray-900">{pending}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: pending } = usePendingCount()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = [...NAV].reverse().find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col bg-gray-900 transition-all lg:flex', collapsed ? 'w-[76px]' : 'w-64')}>
        <div className={cn('flex h-16 items-center border-b border-white/10', collapsed ? 'justify-center' : 'justify-between px-4')}>
          {!collapsed && <Logo />}
          <button onClick={() => setCollapsed((c) => !c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Thu gọn menu">
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavItems collapsed={collapsed} />
        </div>
        {!collapsed && <p className="border-t border-white/10 p-4 text-xs text-gray-500">TCG Shop Admin</p>}
      </aside>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" width="max-w-[80vw] sm:max-w-xs">
        <div className="flex h-full flex-col bg-gray-900">
          <div className="flex h-16 items-center border-b border-white/10 px-4">
            <Logo />
          </div>
          <NavItems onNavigate={() => setMobileOpen(false)} />
        </div>
      </Drawer>

      <div className={cn('transition-all', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-3 backdrop-blur md:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Mở menu">
            <Menu size={22} />
          </button>
          <h1 className="truncate text-base font-bold text-gray-900 md:text-lg">{current?.label ?? 'Quản trị'}</h1>
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <Link to="/admin/yeu-cau?status=PENDING" className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Yêu cầu chờ duyệt">
              <Bell size={20} />
              {!!pending && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-primary-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{pending}</span>}
            </Link>
            <Link to="/" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:flex">
              <ExternalLink size={16} /> Xem website
            </Link>
            <div className="hidden items-center gap-2 border-l border-gray-200 pl-3 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">{user?.fullName.charAt(0)}</span>
              <span className="text-sm font-semibold text-gray-800">{user?.fullName}</span>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/dang-nhap')
              }}
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
