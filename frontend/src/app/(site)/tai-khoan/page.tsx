import AccountPage from '@/views/AccountPage'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const metadata = { title: 'Tài khoản', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  )
}
