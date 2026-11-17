import type { Metadata } from 'next'
import { HydrationBoundary } from '@tanstack/react-query'
import ProductsPage from '@/views/ProductsPage'
import { getBrands, getProducts, paramGetter, prefetch, safe } from '@/lib/server'
import { buildProductQuery } from '@/lib/product-query'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** chỉ lọc đúng 1 thương hiệu (và không lọc gì khác) -> trang thương hiệu, nên cho Google index riêng */
function singleBrand(sp: Record<string, string | string[] | undefined>) {
  const get = paramGetter(sp)
  const brands = get('brand').split(',').filter(Boolean)
  const others = Object.keys(sp).filter((k) => k !== 'brand')
  return brands.length === 1 && others.length === 0 ? brands[0] : null
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const brandSlug = singleBrand(sp)
  const brand = brandSlug ? (await safe(getBrands()))?.find((b) => b.slug === brandSlug) : undefined
  if (brand) {
    return {
      title: `${brand.name} – Box, pack, thẻ lẻ chính hãng`,
      description: `Mua box, booster pack, thẻ lẻ ${brand.name} chính hãng. Nhận đặt trước bộ mới, giá tốt, giao toàn quốc.`,
      alternates: { canonical: `/san-pham?brand=${brand.slug}` },
    }
  }
  const filtered = Object.keys(sp).length > 0
  return {
    title: 'Tất cả sản phẩm TCG',
    description: 'Box, booster pack, thẻ lẻ, phụ kiện Pokemon, One Piece, Naruto, Yu-Gi-Oh!, Dragon Ball… Lọc theo thương hiệu, set, ngôn ngữ, giá.',
    alternates: { canonical: '/san-pham' },
    // trang đã lọc nhiều điều kiện: không index (tránh trùng lặp), vẫn cho Google đi theo link sản phẩm
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  const query = buildProductQuery('list', paramGetter(sp))
  const state = await prefetch([[['products', query], () => getProducts(query)]])
  return (
    <HydrationBoundary state={state}>
      <ProductsPage mode="list" />
    </HydrationBoundary>
  )
}
