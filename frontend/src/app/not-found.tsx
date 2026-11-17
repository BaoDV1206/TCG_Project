import { SiteShell } from '@/components/layout/SiteShell'
import NotFoundPage from '@/views/NotFoundPage'

export const metadata = { title: 'Không tìm thấy trang', robots: { index: false } }

/** Đường dẫn không tồn tại (ngoài các trang đã định nghĩa) */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundPage />
    </SiteShell>
  )
}
