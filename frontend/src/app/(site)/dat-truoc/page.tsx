import { HydrationBoundary } from '@tanstack/react-query'
import PreOrderPage from '@/views/PreOrderPage'
import { getProducts, prefetch } from '@/lib/server'
import { PREORDER_QUERY } from '@/lib/product-query'

export const metadata = {
  title: 'Đặt trước bộ mới – Giữ suất sớm',
  description: 'Đặt trước booster box, pack các bộ TCG sắp phát hành: Pokemon, One Piece, Yu-Gi-Oh!… Cọc nhẹ, giữ suất chắc chắn, báo ngay khi hàng về.',
  alternates: { canonical: '/dat-truoc' },
}

export default async function Page() {
  const state = await prefetch([[['preorders', PREORDER_QUERY.brand], () => getProducts(PREORDER_QUERY)]])
  return (
    <HydrationBoundary state={state}>
      <PreOrderPage />
    </HydrationBoundary>
  )
}
