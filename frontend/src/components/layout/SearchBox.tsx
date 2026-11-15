import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, Layers, Search, TrendingUp, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { SuggestData } from '../../lib/types'
import { useDebounce, useSettings } from '../../hooks/queries'
import { formatPrice, cn } from '../../lib/format'
import { ProductArt } from '../product/ProductArt'
import { Spinner } from '../ui/Common'

const RECENT_KEY = 'tcg_recent_searches'

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}
function saveRecent(q: string) {
  try {
    const list = [q, ...loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

interface Props {
  /** full: dùng cho overlay toàn màn hình trên điện thoại */
  variant?: 'header' | 'full'
  onDone?: () => void
  autoFocus?: boolean
}

export function SearchBox({ variant = 'header', onDone, autoFocus }: Props) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const debounced = useDebounce(q.trim(), 250)
  const { data: settings } = useSettings()
  const popular = (settings?.popular_searches ?? '').split(',').map((s) => s.trim()).filter(Boolean)

  const { data, isFetching } = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () => api.get<SuggestData>('/public/search/suggest', { q: debounced }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (variant !== 'header') return
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [variant])

  const finish = () => {
    setFocused(false)
    onDone?.()
  }

  const submit = (text: string) => {
    const t = text.trim()
    if (!t) return
    saveRecent(t)
    setRecent(loadRecent())
    setQ(t)
    finish()
    navigate(`/tim-kiem?q=${encodeURIComponent(t)}`)
  }

  const showPanel = variant === 'full' || focused
  const hasQuery = debounced.length >= 2

  const panel = (
    <div className={cn('overflow-y-auto bg-white text-gray-900', variant === 'header' ? 'absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] rounded-2xl shadow-2xl ring-1 ring-black/5' : 'flex-1')}>
      {!hasQuery ? (
        <div className="space-y-5 p-4">
          {recent.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-gray-500">Tìm kiếm gần đây</p>
                <button
                  className="text-xs text-gray-400 hover:text-primary-700"
                  onClick={() => {
                    localStorage.removeItem(RECENT_KEY)
                    setRecent([])
                  }}
                >
                  Xóa
                </button>
              </div>
              <div className="space-y-1">
                {recent.map((r) => (
                  <button key={r} onClick={() => submit(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50">
                    <Clock size={15} className="text-gray-400" /> {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {popular.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-gray-500">Tìm kiếm phổ biến</p>
              <div className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <button key={p} onClick={() => submit(p)} className="chip border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300 hover:text-primary-700">
                    <TrendingUp size={14} /> {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-2">
          {data && data.sets.length > 0 && (
            <div className="px-2 pb-2">
              <p className="px-2 py-1 text-xs font-bold uppercase text-gray-500">Set / Pack</p>
              {data.sets.map((s) => (
                <Link key={s.id} to={`/set/${s.slug}`} onClick={finish} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: s.brandColor ?? '#b91c1c' }}>
                    <Layers size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {s.code && <span className="text-primary-700">{s.code} </span>}
                      {s.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {s.brandName} · {s.productCount} sản phẩm
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          {data && data.products.length > 0 && (
            <div className="border-t border-gray-100 px-2 pt-2">
              <p className="px-2 py-1 text-xs font-bold uppercase text-gray-500">Sản phẩm</p>
              {data.products.map((p) => (
                <Link key={p.id} to={`/san-pham/${p.slug}`} onClick={() => { saveRecent(q.trim()); finish() }} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <ProductArt src={p.thumbnail} name={p.name} brandName={p.brandName} brandColor={p.brandColor} setCode={p.setCode} categoryName={p.categoryName} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                    <span className="text-sm font-bold text-primary-700">{formatPrice(p.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          {data && data.total > 0 && (
            <button onClick={() => submit(q)} className="mx-4 mb-2 mt-1 w-[calc(100%-2rem)] rounded-lg bg-primary-50 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100">
              Xem tất cả {data.total} kết quả →
            </button>
          )}
          {data && data.total === 0 && data.sets.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Không tìm thấy “{debounced}”.{' '}
              <Link to={`/dat-ho?name=${encodeURIComponent(debounced)}`} onClick={finish} className="font-semibold text-primary-700">
                Đặt hộ sản phẩm này?
              </Link>
            </div>
          )}
          {!data && isFetching && (
            <div className="flex justify-center py-6 text-gray-400">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  )

  const input = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(q)
      }}
      className="relative flex flex-1 items-center"
      role="search"
    >
      <Search size={18} className="pointer-events-none absolute left-3 text-gray-400" />
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Tìm box, pack, mã set (OP-09, SV8)..."
        className="h-10 w-full rounded-xl border-0 bg-white pl-10 pr-9 text-sm text-gray-900 outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-gold-400"
        aria-label="Tìm kiếm"
      />
      {q && (
        <button type="button" onClick={() => setQ('')} className="absolute right-2 rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Xóa">
          <X size={16} />
        </button>
      )}
    </form>
  )

  if (variant === 'full') {
    return (
      <div className="fixed inset-0 z-[90] flex animate-fade-in flex-col bg-white">
        <div className="flex items-center gap-2 bg-primary-800 px-3 py-2.5">
          <button onClick={finish} className="rounded-full p-1.5 text-white" aria-label="Quay lại">
            <ArrowLeft size={22} />
          </button>
          {input}
        </div>
        {panel}
      </div>
    )
  }

  return (
    <div ref={boxRef} className="relative w-full">
      {input}
      {showPanel && panel}
    </div>
  )
}
