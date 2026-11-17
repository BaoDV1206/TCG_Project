'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate, useLocation } from '@/lib/router'
import { PageLoader } from '@/components/ui/Common'

/** Trang cần đăng nhập: chưa đăng nhập -> chuyển sang /dang-nhap rồi quay lại */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/dang-nhap?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
