import { Link } from 'react-router-dom'
import { cn } from '../../lib/format'

export function Logo({ className, light = true }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center gap-2', className)} aria-label="TCG Shop – Trang chủ">
      <svg viewBox="0 0 48 48" className="h-9 w-9 drop-shadow" aria-hidden>
        <rect x="6" y="5" width="24" height="34" rx="4" fill="#fbbf24" transform="rotate(-12 18 22)" />
        <rect x="16" y="8" width="24" height="34" rx="4" fill="#fff" />
        <rect x="19" y="11" width="18" height="28" rx="2.5" fill="#b91c1c" />
        <path d="M28 16l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fbbf24" />
      </svg>
      <div className="leading-none">
        <span className={cn('block text-xl font-black tracking-tight', light ? 'text-white' : 'text-primary-700')}>
          TCG<span className="text-gold-400">.</span>
        </span>
        <span className={cn('block text-[10px] font-bold uppercase tracking-[0.25em]', light ? 'text-white/75' : 'text-gray-500')}>
          Card Shop
        </span>
      </div>
    </Link>
  )
}
