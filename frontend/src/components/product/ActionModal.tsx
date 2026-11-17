'use client'

import { useState } from 'react'
import { useLocation, useNavigate } from '@/lib/router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BellRing, CalendarClock, LogIn, MessageCircle, Minus, Phone, Plus, Send } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Common'
import { ProductArt } from './ProductArt'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../hooks/queries'
import { api, errorMessage } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'
import type { RequestType, ServiceRequest } from '../../lib/types'
import type { ActionProduct } from './ActionContext'

export function ContactButtons({ compact = false }: { compact?: boolean }) {
  const { data: s } = useSettings()
  const items = [
    { href: s?.zalo, label: 'Chat Zalo', icon: <span className="text-[11px] font-black">Zalo</span>, cls: 'bg-[#0068ff] text-white hover:bg-[#0057d6]' },
    { href: s?.messenger, label: 'Messenger', icon: <MessageCircle size={18} />, cls: 'bg-gradient-to-r from-[#00b2ff] to-[#a033ff] text-white hover:opacity-90' },
    {
      href: s?.hotline ? `tel:${s.hotline.replace(/\s/g, '')}` : undefined,
      label: s?.hotline ? `Gọi ${s.hotline}` : 'Hotline',
      icon: <Phone size={18} />,
      cls: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
  ].filter((i) => i.href)
  return (
    <div className={compact ? 'grid grid-cols-3 gap-2' : 'grid gap-2 sm:grid-cols-3'}>
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noreferrer" className={`btn ${i.cls} px-2`}>
          {i.icon}
          <span className="truncate">{i.label}</span>
        </a>
      ))}
    </div>
  )
}

interface Props {
  product: ActionProduct
  initialQuantity: number
  onClose: () => void
}

export function ActionModal({ product: p, initialQuantity, onClose }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const [quantity, setQuantity] = useState(initialQuantity)
  const [note, setNote] = useState('')

  const isPreorder = p.status === 'PRE_ORDER'
  const isOut = p.status === 'OUT_OF_STOCK'
  const type: RequestType = isPreorder ? 'PRE_ORDER' : 'PURCHASE'
  const maxQty = Math.max(
    1,
    Math.min(999, p.remainingSlots ?? 999, p.perUserLimit ?? 999),
  )
  const soldOut = isPreorder && p.remainingSlots === 0

  const mutation = useMutation({
    mutationFn: () => api.post<ServiceRequest>('/requests', { type, productId: p.id, quantity, note }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['request-summary'] })
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      qc.invalidateQueries({ queryKey: ['product', p.slug] })
      toast.success(`Đã gửi yêu cầu ${r.code}`, {
        description: 'Shop sẽ duyệt và liên hệ bạn sớm nhất.',
        action: { label: 'Xem yêu cầu', onClick: () => navigate(`/yeu-cau/${r.id}`) },
      })
      onClose()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const title = isPreorder ? 'Đặt trước sản phẩm' : isOut ? 'Báo khi có hàng' : 'Liên hệ mua hàng'
  const deposit = isPreorder && p.price && p.depositPercent ? Math.round((p.price * quantity * p.depositPercent) / 100) : null

  const goLogin = () => {
    onClose()
    navigate(`/dang-nhap?redirect=${encodeURIComponent(location.pathname + location.search)}`)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        user ? (
          <>
            <button className="btn-outline flex-1" onClick={onClose}>
              Đóng
            </button>
            <button className="btn-primary flex-[2]" disabled={mutation.isPending || soldOut} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Spinner /> : isPreorder ? <CalendarClock size={18} /> : isOut ? <BellRing size={18} /> : <Send size={18} />}
              {isPreorder ? 'Gửi yêu cầu đặt trước' : isOut ? 'Đăng ký nhận tin' : 'Gửi yêu cầu mua'}
            </button>
          </>
        ) : (
          <button className="btn-primary w-full" onClick={goLogin}>
            <LogIn size={18} /> Đăng nhập để gửi yêu cầu
          </button>
        )
      }
    >
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <ProductArt src={p.thumbnail} name={p.name} brandName={p.brandName} brandColor={p.brandColor} setCode={p.setCode} categoryName={p.categoryName} size="sm" />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900">{p.name}</p>
          <p className="mt-1 text-base font-extrabold text-primary-700">{formatPrice(p.price)}</p>
          {isPreorder && p.releaseDate && (
            <p className="text-xs text-gray-500">Phát hành: {formatDate(p.releaseDate)}</p>
          )}
        </div>
      </div>

      {!isPreorder && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Liên hệ nhanh với shop</p>
          <ContactButtons />
          <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" /> hoặc gửi yêu cầu để shop gọi lại <div className="h-px flex-1 bg-gray-200" />
          </div>
        </div>
      )}

      {isPreorder && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-indigo-50 p-3 text-center text-xs">
          <div>
            <p className="text-gray-500">Cọc</p>
            <p className="text-sm font-bold text-indigo-700">{p.depositPercent ?? 0}%</p>
          </div>
          <div>
            <p className="text-gray-500">Còn suất</p>
            <p className="text-sm font-bold text-indigo-700">{p.remainingSlots ?? '∞'}</p>
          </div>
          <div>
            <p className="text-gray-500">Tối đa/khách</p>
            <p className="text-sm font-bold text-indigo-700">{p.perUserLimit ?? '∞'}</p>
          </div>
        </div>
      )}

      {soldOut ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">Sản phẩm đã hết suất đặt trước.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Số lượng</span>
            <div className="flex items-center rounded-lg border border-gray-300">
              <button className="p-2 text-gray-600 disabled:opacity-30" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)} aria-label="Giảm">
                <Minus size={16} />
              </button>
              <input
                className="w-12 border-x border-gray-300 py-1.5 text-center text-sm font-semibold outline-none"
                value={quantity}
                inputMode="numeric"
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/\D/g, '') || '1', 10)
                  setQuantity(Math.min(maxQty, Math.max(1, v)))
                }}
              />
              <button className="p-2 text-gray-600 disabled:opacity-30" disabled={quantity >= maxQty} onClick={() => setQuantity((q) => q + 1)} aria-label="Tăng">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="req-note">
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="req-note"
              className="input min-h-20"
              placeholder={isPreorder ? 'VD: Mình muốn nhận tại shop...' : 'VD: Gọi cho mình sau 18h, ship về Hà Nội...'}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {deposit !== null && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-600">Tiền cọc dự kiến</span>
              <span className="font-bold text-primary-700">{formatPrice(deposit)}</span>
            </div>
          )}
          {!user && <p className="text-xs text-gray-500">Bạn cần đăng nhập để shop có thông tin liên hệ và để theo dõi trạng thái yêu cầu.</p>}
        </div>
      )}
    </Modal>
  )
}
