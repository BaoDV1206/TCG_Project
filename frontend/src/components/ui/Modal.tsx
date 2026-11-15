import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/format'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/** Modal: dạng hộp giữa màn hình trên máy tính, dạng bottom-sheet trên điện thoại */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size]

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
          width,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex gap-2 border-t border-gray-100 px-5 py-3 pb-safe">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  side?: 'left' | 'right'
  width?: string
}

export function Drawer({ open, onClose, title, children, side = 'right', width = 'max-w-md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'absolute top-0 flex h-full w-full flex-col bg-white shadow-2xl',
          width,
          side === 'right' ? 'right-0 animate-slide-left' : 'left-0 animate-slide-right',
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="text-base font-bold">{title}</div>
            <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
