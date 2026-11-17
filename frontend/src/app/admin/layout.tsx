import type { ReactNode } from 'react'
import { AdminShell } from './shell'

export const metadata = {
  title: { default: 'Quản trị', template: '%s | Quản trị TCG Shop' },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
