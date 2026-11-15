import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Clock, Mail, MapPin, MessageCircle, Phone, X } from 'lucide-react'
import { Logo } from './Logo'
import { useBrands, useSettings } from '../../hooks/queries'
import { ContactButtons } from '../product/ActionModal'

export function Footer() {
  const { data: s } = useSettings()
  const { data: brands } = useBrands()
  return (
    <footer className="mt-10 bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Chuyên box, pack, thẻ lẻ TCG chính hãng: Pokemon, One Piece, Naruto, Yu-Gi-Oh!... Nhận đặt trước và đặt hộ từ Nhật, Mỹ.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Liên hệ</h4>
          <ul className="space-y-2 text-sm">
            {s?.hotline && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-gold-400" /> {s.hotline}</li>}
            {s?.email && <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-gold-400" /> {s.email}</li>}
            {s?.address && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-400" /> {s.address}</li>}
            {s?.working_hours && <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-gold-400" /> {s.working_hours}</li>}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Thương hiệu</h4>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            {brands?.map((b) => (
              <li key={b.id}>
                <Link to={`/san-pham?brand=${b.slug}`} className="hover:text-gold-400">{b.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Hỗ trợ khách hàng</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/dat-truoc" className="hover:text-gold-400">Chính sách đặt trước</Link></li>
            <li><Link to="/dat-ho" className="hover:text-gold-400">Hướng dẫn đặt hộ</Link></li>
            <li><Link to="/yeu-cau" className="hover:text-gold-400">Theo dõi yêu cầu</Link></li>
          </ul>
          {s?.policy_general && <p className="mt-3 whitespace-pre-line text-xs leading-5 text-gray-400">{s.policy_general}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {s?.shop_name ?? 'TCG Shop'}. Các thương hiệu thuộc quyền sở hữu của chủ sở hữu tương ứng.
      </div>
    </footer>
  )
}

/** Nút liên hệ nổi ở góc phải dưới */
export function FloatingContact() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // Trang chi tiết sản phẩm có thanh hành động cố định ở đáy (điện thoại) -> đẩy nút lên cao hơn
  const onDetail = /^\/san-pham\/[^/]+/.test(pathname)
  return (
    <div className={`fixed right-3 z-30 md:bottom-6 md:right-6 ${onDetail ? 'bottom-[8.5rem]' : 'bottom-20'}`}>
      {open && (
        <div className="absolute bottom-16 right-0 w-72 animate-slide-up rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
          <p className="mb-3 text-sm font-bold text-gray-900">Cần tư vấn? Liên hệ ngay</p>
          <div className="[&_.grid]:grid-cols-1">
            <ContactButtons />
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-13 w-13 items-center justify-center rounded-full bg-primary-700 text-white shadow-xl transition hover:bg-primary-800"
        aria-label="Liên hệ"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-primary-500 opacity-30" />}
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}
