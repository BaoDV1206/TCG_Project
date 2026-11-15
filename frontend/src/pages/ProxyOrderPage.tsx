import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Calculator, CheckCircle2, Globe2, ImagePlus, LogIn, PackageCheck, PlaneLanding, Send, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import type { ServiceRequest } from '../lib/types'
import { PROXY_COUNTRIES } from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../hooks/queries'
import { Breadcrumb, Spinner } from '../components/ui/Common'
import { Faq } from './PreOrderPage'
import { cn } from '../lib/format'

const STEPS = [
  { icon: Send, t: 'Gửi yêu cầu' },
  { icon: Calculator, t: 'Shop báo giá' },
  { icon: CheckCircle2, t: 'Bạn xác nhận' },
  { icon: ShoppingBag, t: 'Shop mua hàng' },
  { icon: PlaneLanding, t: 'Về kho VN' },
  { icon: Truck, t: 'Giao hàng' },
]

const FAQ = [
  { q: 'Phí dịch vụ tính thế nào?', a: 'Phí dịch vụ 5–10% tùy giá trị đơn, đã bao gồm vận chuyển quốc tế về Việt Nam. Shop sẽ ghi rõ trong báo giá.' },
  { q: 'Bao lâu thì có báo giá?', a: 'Trong vòng 24h làm việc. Trạng thái yêu cầu sẽ chuyển sang "Đã báo giá" và bạn xác nhận ngay trên web.' },
  { q: 'Mua được từ những trang nào?', a: 'Amazon JP/US, Mercari, Yahoo Auction, Pokemon Center, Bandai, TCGplayer, eBay... và cửa hàng tại Nhật/Mỹ.' },
  { q: 'Có cần đặt cọc không?', a: 'Sau khi bạn đồng ý báo giá, shop sẽ hướng dẫn cọc 50% để tiến hành mua.' },
]

export default function ProxyOrderPage() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const { data: settings } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    productUrl: '',
    productName: params.get('name') ?? '',
    country: 'JP',
    quantity: 1,
    refPrice: '',
    imageUrl: '',
    note: '',
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const m = useMutation({
    mutationFn: () =>
      api.post<ServiceRequest>('/requests/proxy', {
        ...form,
        refPrice: form.refPrice ? Number(form.refPrice) : null,
        imageUrl: form.imageUrl || null,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['request-summary'] })
      qc.invalidateQueries({ queryKey: ['my-requests'] })
      toast.success(`Đã gửi yêu cầu đặt hộ ${r.code}`, { description: 'Shop sẽ báo giá trong 24h.' })
      navigate(`/yeu-cau/${r.id}`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onUpload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      set('imageUrl', await api.upload(file))
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      navigate(`/dang-nhap?redirect=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    if (!form.productUrl.trim() && !form.productName.trim()) {
      toast.error('Vui lòng nhập link hoặc tên sản phẩm')
      return
    }
    m.mutate()
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Đặt hộ' }]} />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-fuchsia-950 to-primary-800 p-5 text-white md:p-8">
        <div className="absolute -right-10 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Globe2 size={14} /> Dịch vụ đặt hộ
          </p>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">Mua hộ TCG từ Nhật, Mỹ, Hàn...</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">Không tìm thấy sản phẩm trên shop? Gửi link hoặc tên – shop báo giá trọn gói trong 24h.</p>
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.t} className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-black text-gray-900">{i + 1}</span>
                  <s.icon size={16} className="text-gold-300" />
                  <span className="text-sm font-semibold">{s.t}</span>
                </div>
                {i < STEPS.length - 1 && <span className="text-white/40">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={submit} className="card space-y-4 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <PackageCheck className="text-primary-700" />
            <h2 className="text-lg font-extrabold">Gửi yêu cầu đặt hộ</h2>
          </div>
          {!user && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Bạn cần đăng nhập để gửi yêu cầu và theo dõi báo giá.
              <Link to={`/dang-nhap?redirect=${encodeURIComponent('/dat-ho')}`} className="btn-gold px-3 py-1.5 text-xs">
                <LogIn size={14} /> Đăng nhập
              </Link>
            </div>
          )}
          <div>
            <label className="label" htmlFor="p-url">Link sản phẩm</label>
            <input id="p-url" className="input" placeholder="https://www.amazon.co.jp/..." value={form.productUrl} onChange={(e) => set('productUrl', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="p-name">Tên sản phẩm</label>
            <input id="p-name" className="input" placeholder="VD: Pokemon 151 Booster Box (JP)" value={form.productName} onChange={(e) => set('productName', e.target.value)} />
            <p className="mt-1 text-xs text-gray-500">Nhập link hoặc tên (ít nhất một trong hai).</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="p-country">Nước mua</label>
              <select id="p-country" className="input" value={form.country} onChange={(e) => set('country', e.target.value)}>
                {PROXY_COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-qty">Số lượng</label>
              <input id="p-qty" type="number" min={1} max={999} className="input" value={form.quantity} onChange={(e) => set('quantity', Math.max(1, Math.min(999, Number(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label" htmlFor="p-price">Giá tham khảo (₫)</label>
              <input id="p-price" inputMode="numeric" className="input" placeholder="Không bắt buộc" value={form.refPrice} onChange={(e) => set('refPrice', e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
          <div>
            <span className="label">Ảnh minh họa (không bắt buộc)</span>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img src={form.imageUrl} alt="Ảnh minh họa" className="h-28 rounded-xl border border-gray-200 object-cover" />
                <button type="button" onClick={() => set('imageUrl', '')} className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-600 shadow" aria-label="Xóa ảnh">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!user || uploading}
                onClick={() => fileRef.current?.click()}
                className={cn('flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 sm:w-56')}
              >
                {uploading ? <Spinner /> : <ImagePlus size={24} />}
                {user ? 'Tải ảnh lên (tối đa 5MB)' : 'Đăng nhập để tải ảnh'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
          </div>
          <div>
            <label className="label" htmlFor="p-note">Ghi chú</label>
            <textarea id="p-note" className="input min-h-24" placeholder="Phiên bản, tình trạng mong muốn, thời gian cần hàng..." value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={m.isPending}>
            {m.isPending ? <Spinner /> : <Send size={18} />}
            {user ? 'Gửi yêu cầu đặt hộ' : 'Đăng nhập & gửi yêu cầu'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="card p-4 md:p-5">
            <h2 className="mb-2 text-base font-bold">Chính sách đặt hộ</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{settings?.policy_proxy}</p>
          </div>
          <div className="card p-4 md:p-5">
            <h2 className="mb-1 text-base font-bold">Câu hỏi thường gặp</h2>
            <Faq items={FAQ} />
          </div>
        </div>
      </div>
    </div>
  )
}
