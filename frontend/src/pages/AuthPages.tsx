import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { api, errorMessage } from '../lib/api'
import { Logo } from '../components/layout/Logo'
import { PageLoader, Spinner } from '../components/ui/Common'

const OAUTH_REDIRECT_KEY = 'tcg_oauth_redirect'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

/** Nút "Tiếp tục với Google" – chỉ hiện khi server đã cấu hình Google */
function GoogleLogin({ redirect }: { redirect: string | null }) {
  const { data } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: () => api.get<{ google: boolean }>('/auth/providers'),
    staleTime: 5 * 60_000,
  })
  if (!data?.google) return null
  const start = () => {
    try {
      sessionStorage.setItem(OAUTH_REDIRECT_KEY, redirect ?? '')
    } catch {
      /* trình duyệt chặn storage: vẫn đăng nhập được, chỉ không quay lại đúng trang */
    }
    window.location.href = '/oauth2/authorization/google'
  }
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> hoặc <span className="h-px flex-1 bg-gray-200" />
      </div>
      <button type="button" onClick={start} className="btn w-full border border-gray-300 bg-white py-3 font-semibold text-gray-700 hover:bg-gray-50">
        <GoogleIcon /> Tiếp tục với Google
      </button>
      <p className="mt-2 text-center text-[11px] text-gray-400">
        Khi tiếp tục, bạn đồng ý với{' '}
        <Link to="/chinh-sach-bao-mat" className="underline hover:text-gray-600">Chính sách bảo mật</Link>
      </p>
    </>
  )
}

/** Hiện lỗi do backend gửi về qua ?loi=... (vd: tài khoản bị khóa) */
function useOAuthError() {
  const [params, setParams] = useSearchParams()
  const error = params.get('loi')
  useEffect(() => {
    if (!error) return
    toast.error(error)
    params.delete('loi')
    setParams(params, { replace: true })
  }, [error, params, setParams])
}

/** Trang Google chuyển về sau khi đăng nhập: /dang-nhap/google#token=... */
export function GoogleCallbackPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    // xóa token khỏi thanh địa chỉ / lịch sử trình duyệt
    window.history.replaceState(null, '', window.location.pathname)
    let redirect: string | null = null
    try {
      redirect = safeRedirect(sessionStorage.getItem(OAUTH_REDIRECT_KEY))
      sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
    } catch {
      /* bỏ qua */
    }
    if (!token) {
      navigate('/dang-nhap?loi=' + encodeURIComponent('Đăng nhập bằng Google không thành công'), { replace: true })
      return
    }
    loginWithToken(token)
      .then((u) => {
        toast.success(`Xin chào, ${u.fullName}!`)
        navigate(redirect ?? (u.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
      })
      .catch((err) => navigate('/dang-nhap?loi=' + encodeURIComponent(errorMessage(err)), { replace: true }))
  }, [loginWithToken, navigate])

  return <PageLoader />
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-card md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-orange-600 p-8 text-white md:flex">
        <Logo />
        <div className="relative z-10">
          <h2 className="text-3xl font-black leading-tight">Thế giới thẻ bài TCG chính hãng</h2>
          <p className="mt-2 text-white/80">Pokemon · One Piece · Naruto · Yu-Gi-Oh! · Dragon Ball và nhiều hơn nữa.</p>
          <ul className="mt-5 space-y-2 text-sm text-white/90">
            <li>✓ Theo dõi yêu cầu mua / đặt trước / đặt hộ</li>
            <li>✓ Nhận thông báo khi shop cập nhật trạng thái</li>
            <li>✓ Giữ suất đặt trước các bộ mới</li>
          </ul>
        </div>
        {[-14, 6].map((r, i) => (
          <div key={i} className="absolute -right-10 bottom-10 aspect-[5/7] w-40 rounded-2xl border-4 border-white/40 bg-white/10" style={{ transform: `rotate(${r}deg) translateX(${i * -60}px)` }} />
        ))}
      </div>
      <div className="p-6 sm:p-10">
        <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

function safeRedirect(r: string | null) {
  return r && r.startsWith('/') && !r.startsWith('//') ? r : null
}

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  useOAuthError()

  if (user) return <Navigate to={redirect ?? (user.role === 'ADMIN' ? '/admin' : '/')} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const u = await login(username, password)
      toast.success(`Xin chào, ${u.fullName}!`)
      navigate(redirect ?? (u.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng bạn quay lại TCG Shop">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Tên đăng nhập</label>
          <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">Mật khẩu</label>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>
          {loading ? <Spinner /> : <LogIn size={18} />} Đăng nhập
        </button>
      </form>
      <GoogleLogin redirect={redirect} />
      <p className="mt-5 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to={`/dang-ky${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-primary-700 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
      {/* chỉ hiện khi chạy dev trên máy, không hiện trên web thật */}
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-700">Tài khoản demo:</p>
          <p>Admin: <code>admin / admin</code> · Khách: <code>user / user123</code></p>
        </div>
      )}
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  if (user) return <Navigate to={redirect ?? '/'} replace />

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên'
    if (!/^[a-zA-Z0-9_.]{4,30}$/.test(form.username)) e.username = '4–30 ký tự, chỉ gồm chữ, số, _ và .'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ'
    if (!/^(\+84|0)[0-9]{9,10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ'
    if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự'
    if (form.password !== form.confirm) e.confirm = 'Mật khẩu nhập lại không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
      })
      toast.success('Đăng ký thành công!')
      navigate(redirect ?? '/', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const field = (k: keyof typeof form, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`r-${k}`}>{label}</label>
      {k === 'password' || k === 'confirm' ? (
        <PasswordInput id={`r-${k}`} value={form[k]} onChange={(v) => set(k, v)} autoComplete="new-password" />
      ) : (
        <input id={`r-${k}`} className="input" value={form[k]} onChange={(e) => set(k, e.target.value)} {...props} />
      )}
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
    </div>
  )

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Đăng ký để gửi yêu cầu mua, đặt trước và đặt hộ">
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        {field('fullName', 'Họ và tên *', { autoComplete: 'name' })}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {field('username', 'Tên đăng nhập *', { autoComplete: 'username' })}
          {field('phone', 'Số điện thoại *', { autoComplete: 'tel', inputMode: 'tel' })}
        </div>
        {field('email', 'Email', { autoComplete: 'email', type: 'email' })}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {field('password', 'Mật khẩu *')}
          {field('confirm', 'Nhập lại mật khẩu *')}
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>
          {loading ? <Spinner /> : <UserPlus size={18} />} Đăng ký
        </button>
      </form>
      <GoogleLogin redirect={redirect} />
      <p className="mt-5 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to={`/dang-nhap${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-primary-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  )
}
