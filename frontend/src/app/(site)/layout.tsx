import type { ReactNode } from 'react'
import { HydrationBoundary } from '@tanstack/react-query'
import { SiteShell } from '@/components/layout/SiteShell'
import { getBrands, getCategories, getSettings, prefetch } from '@/lib/server'

/** Khung trang khách: tải trước thông tin shop, thương hiệu, danh mục (header, footer, menu dùng) */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const state = await prefetch([
    [['settings'], getSettings],
    [['brands'], getBrands],
    [['categories'], getCategories],
  ])
  return (
    <HydrationBoundary state={state}>
      <SiteShell>{children}</SiteShell>
    </HydrationBoundary>
  )
}
