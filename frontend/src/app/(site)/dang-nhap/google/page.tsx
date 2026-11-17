import { GoogleCallbackPage } from '@/views/AuthPages'

export const metadata = { title: 'Đang đăng nhập…', robots: { index: false, follow: false } }

/** Google chuyển về đây sau khi đăng nhập: /dang-nhap/google#token=... */
export default function Page() {
  return <GoogleCallbackPage />
}
