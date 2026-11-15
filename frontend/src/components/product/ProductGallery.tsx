import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '../../lib/format'
import { Modal } from '../ui/Modal'

interface Props {
  images: string[]
  title: string
  /** vẽ một ảnh (hoặc ảnh minh họa khi src = null) */
  render: (src: string | null, size: 'sm' | 'lg') => ReactNode
  /** nhãn hiển thị góc trái ảnh chính (vd: % giảm giá) */
  badge?: ReactNode
  resetKey?: string
}

/** Gallery ảnh sản phẩm: ảnh lớn + nút chuyển, vuốt trên điện thoại, dải ảnh nhỏ, xem phóng to. */
export function ProductGallery({ images, title, render, badge, resetKey }: Props) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const total = images.length
  const many = total > 1

  useEffect(() => setActive(0), [resetKey])

  const go = (d: number) => setActive((i) => (i + d + total) % total)

  // bàn phím trong chế độ phóng to
  useEffect(() => {
    if (!zoom || !many) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + total) % total)
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom, many, total])

  // vuốt trái/phải
  const touchX = useRef<number | null>(null)
  const swiped = useRef(false)
  const swipe = {
    onTouchStart: (e: TouchEvent) => {
      touchX.current = e.touches[0].clientX
      swiped.current = false
    },
    onTouchEnd: (e: TouchEvent) => {
      if (touchX.current == null || !many) return
      const dx = e.changedTouches[0].clientX - touchX.current
      touchX.current = null
      if (Math.abs(dx) > 40) {
        swiped.current = true
        go(dx < 0 ? 1 : -1)
      }
    },
  }

  const current = images[active] ?? null

  const arrows = (big = false) =>
    many && (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
          aria-label="Ảnh trước"
          className={cn(
            'absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition hover:bg-white',
            big ? 'h-11 w-11' : 'h-9 w-9 md:opacity-0 md:group-hover:opacity-100',
          )}
        >
          <ChevronLeft size={big ? 24 : 20} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
          aria-label="Ảnh sau"
          className={cn(
            'absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition hover:bg-white',
            big ? 'h-11 w-11' : 'h-9 w-9 md:opacity-0 md:group-hover:opacity-100',
          )}
        >
          <ChevronRight size={big ? 24 : 20} />
        </button>
      </>
    )

  const thumbs = (onDark = false) =>
    many && (
      <div className={cn('mt-3 grid grid-cols-5 gap-2', onDark && 'mx-auto max-w-sm')}>
        {images.map((img, i) => (
          <button
            key={img + i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ảnh ${i + 1}`}
            aria-current={i === active}
            className={cn(
              'aspect-square overflow-hidden rounded-xl border-2 bg-white p-0.5 transition',
              i === active ? 'border-primary-600' : onDark ? 'border-gray-200 opacity-70 hover:opacity-100' : 'border-gray-100 opacity-80 hover:border-gray-300 hover:opacity-100',
            )}
          >
            {render(img, 'sm')}
          </button>
        ))}
      </div>
    )

  return (
    <div>
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50" {...swipe}>
        <button
          type="button"
          onClick={() => {
            if (!swiped.current) setZoom(true)
          }}
          className="block h-full w-full"
          aria-label="Phóng to ảnh"
        >
          {render(current, 'lg')}
        </button>
        {badge && <div className="pointer-events-none absolute left-3 top-3">{badge}</div>}
        {arrows()}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
          {many && (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
              {active + 1}/{total}
            </span>
          )}
          <span className="hidden items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 md:flex">
            <ZoomIn size={14} /> Phóng to
          </span>
        </div>
        {/* chấm chỉ vị trí trên điện thoại */}
        {many && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-4 bg-primary-600' : 'w-1.5 bg-gray-400/70')} />
            ))}
          </div>
        )}
      </div>
      {thumbs()}

      <Modal open={zoom} onClose={() => setZoom(false)} title={many ? `${title} (${active + 1}/${total})` : title} size="xl">
        <div className="relative mx-auto aspect-square w-full max-w-[62vh] overflow-hidden rounded-xl bg-white" {...swipe}>
          {render(current, 'lg')}
          {arrows(true)}
        </div>
        {thumbs(true)}
      </Modal>
    </div>
  )
}
