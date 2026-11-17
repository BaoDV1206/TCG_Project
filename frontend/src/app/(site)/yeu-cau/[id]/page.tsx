import RequestDetailPage from '@/views/RequestDetailPage'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const metadata = { title: 'Chi tiết yêu cầu', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <RequireAuth>
      <RequestDetailPage />
    </RequireAuth>
  )
}
