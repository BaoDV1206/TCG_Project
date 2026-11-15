import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { Logo } from '../components/layout/Logo'
import { Spinner } from '../components/ui/Common'

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
      <p className="mt-5 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to={`/dang-ky${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-primary-700 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
      <div className="mt-6 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
        <p className="font-semibold text-gray-700">Tài khoản demo:</p>
        <p>Admin: <code>admin / admin</code> · Khách: <code>user / user123</code></p>
      </div>
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
      <p className="mt-5 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to={`/dang-nhap${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-primary-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  )
}
