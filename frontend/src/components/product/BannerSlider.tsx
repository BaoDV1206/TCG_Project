'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@/lib/router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Banner } from '../../lib/types'
import { cn } from '../../lib/format'

export function BannerContent({ b, small = false }: { b: Banner; small?: boolean }) {
  if (b.imageUrl) {
    return <img src={b.imageUrl} alt={b.title ?? 'Banner'} className="h-full w-full object-cover" />
  }
  return (
    <div className="relative flex h-full w-full items-center overflow-hidden" style={{ background: b.bgColor ?? 'linear-gradient(135deg,#7f1d1d,#dc2626)' }}>
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      {/* các lá bài trang trí */}
      {!small && (
        <div className="pointer-events-none absolute -right-6 bottom-0 top-0 hidden w-1/2 items-center justify-center sm:flex">
          {[-18, -4, 10].map((r, i) => (
            <div
              key={i}
              className="absolute aspect-[5/7] h-[70%] rounded-xl border-4 border-white/70 shadow-2xl"
              style={{
                transform: `rotate(${r}deg) translateX(${(i - 1) * 38}px)`,
                background: `linear-gradient(160deg, rgba(255,255,255,${0.35 - i * 0.08}), rgba(255,255,255,0.05))`,
                backdropFilter: 'blur(2px)',
              }}
            />
          ))}
          <span className="absolute text-6xl font-black text-white/90 drop-shadow-xl lg:text-7xl">TCG</span>
        </div>
      )}
      <div className={cn('relative z-10', small ? 'p-4' : 'max-w-[60%] p-5 sm:p-8 lg:p-10')}>
        {b.title && (
          <h3 className={cn('font-black leading-tight text-white drop-shadow', small ? 'text-base' : 'text-xl sm:text-3xl lg:text-4xl')}>{b.title}</h3>
        )}
        {b.subtitle && <p className={cn('mt-1.5 text-white/85', small ? 'text-xs' : 'text-sm sm:text-base')}>{b.subtitle}</p>}
        {!small && b.link && (
          <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow-lg sm:text-sm">Xem ngay →</span>
        )}
      </div>
    </div>
  )
}

function BannerLink({ b, children, className }: { b: Banner; children: ReactNode; className?: string }) {
  if (!b.link) return <div className={className}>{children}</div>
  if (/^https?:\/\//.test(b.link)) {
    return (
      <a href={b.link} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link to={b.link} className={className}>
      {children}
    </Link>
  )
}

export { BannerLink }

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const count = banners.length

  useEffect(() => {
    if (count <= 1 || paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count, paused])

  if (count === 0) return <div className="skeleton h-full w-full rounded-2xl" />

  const go = (d: number) => setIndex((i) => (i + d + count) % count)

  return (
    <div
      className="group relative h-full w-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((b) => (
          <BannerLink key={b.id} b={b} className="block h-full w-full shrink-0">
            <BannerContent b={b} />
          </BannerLink>
        ))}
      </div>
      {count > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow transition group-hover:opacity-100 md:flex" aria-label="Banner trước">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(1)} className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 shadow transition group-hover:opacity-100 md:flex" aria-label="Banner sau">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button key={b.id} onClick={() => setIndex(i)} className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-2 bg-white/50')} aria-label={`Banner ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
