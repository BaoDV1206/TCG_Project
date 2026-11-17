import MyRequestsPage from '@/views/MyRequestsPage'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const metadata = { title: 'Yêu cầu của tôi', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <RequireAuth>
      <MyRequestsPage />
    </RequireAuth>
  )
}
