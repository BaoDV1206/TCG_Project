import type { Metadata } from 'next'
import { HydrationBoundary } from '@tanstack/react-query'
import ProductsPage from '@/views/ProductsPage'
import { getProducts, paramGetter, prefetch } from '@/lib/server'
import { buildProductQuery } from '@/lib/product-query'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = paramGetter(await searchParams)('q')
  return {
    title: q ? `Tìm kiếm “${q}”` : 'Tìm kiếm',
    // trang kết quả tìm kiếm không nên lên Google, nhưng cho phép đi theo link sản phẩm
    robots: { index: false, follow: true },
  }
}

export default async function Page({ searchParams }: Props) {
  const query = buildProductQuery('search', paramGetter(await searchParams))
  const state = await prefetch([[['products', query], () => getProducts(query)]])
  return (
    <HydrationBoundary state={state}>
      <ProductsPage mode="search" />
    </HydrationBoundary>
  )
}
