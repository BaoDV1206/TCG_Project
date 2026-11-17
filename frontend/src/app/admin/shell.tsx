'use client'

import type { ReactNode } from 'react'
import AdminLayout from '@/views/admin/AdminLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'

/** Chỉ admin mới vào được; mỗi trang admin được Next tách file JS riêng (chỉ tải khi mở) */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth admin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAuth>
  )
}
