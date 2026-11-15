import { Link, NavLink } from 'react-router-dom'
import { X, ChevronRight } from 'lucide-react'
import { Drawer } from '../ui/Modal'
import { Logo } from './Logo'
import { NAV_LINKS } from './Header'
import { useBrands, useCategories } from '../../hooks/queries'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/format'

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: brands } = useBrands()
  const { data: categories } = useCategories()
  const { user, isAdmin } = useAuth()

  return (
    <Drawer open={open} onClose={onClose} side="left" width="max-w-[85vw] sm:max-w-sm">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary-900 to-primary-700 px-4 py-3">
        <Logo />
        <button onClick={onClose} className="rounded-full p-1.5 text-white hover:bg-white/10" aria-label="Đóng menu">
          <X size={22} />
        </button>
      </div>
      <div onClick={onClose}>
        <nav className="border-b border-gray-100 p-2">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold', isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-800 hover:bg-gray-50')}
            >
              {l.label}
              <ChevronRight size={18} className="text-gray-400" />
            </NavLink>
          ))}
          <NavLink to="/yeu-cau" className={({ isActive }) => cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold', isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-800 hover:bg-gray-50')}>
            Yêu cầu của tôi <ChevronRight size={18} className="text-gray-400" />
          </NavLink>
          {isAdmin && (
            <Link to="/admin" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold text-primary-700 hover:bg-gray-50">
              Trang quản trị <ChevronRight size={18} />
            </Link>
          )}
          {!user && (
            <div className="mt-2 grid grid-cols-2 gap-2 px-1">
              <Link to="/dang-nhap" className="btn-primary">Đăng nhập</Link>
              <Link to="/dang-ky" className="btn-outline">Đăng ký</Link>
            </div>
          )}
        </nav>

        <div className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Thương hiệu</p>
          <div className="grid grid-cols-2 gap-2">
            {brands?.map((b) => (
              <Link key={b.id} to={`/san-pham?brand=${b.slug}`} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-800 hover:border-primary-200 hover:bg-primary-50">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.color ?? '#999' }} />
                <span className="truncate">{b.name}</span>
              </Link>
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Loại sản phẩm</p>
          <div className="flex flex-wrap gap-2">
            {categories?.map((c) => (
              <Link key={c.id} to={`/san-pham?category=${c.slug}`} className="chip border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  )
}
