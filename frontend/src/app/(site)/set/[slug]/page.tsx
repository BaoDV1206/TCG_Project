import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HydrationBoundary } from '@tanstack/react-query'
import ProductsPage from '@/views/ProductsPage'
import { absoluteUrl, excerpt, getProducts, getSet, paramGetter, prefetch } from '@/lib/server'
import { buildProductQuery } from '@/lib/product-query'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const set = await getSet(slug).catch(() => null)
  if (!set) notFound()
  const name = `${set.code ? `${set.code} ` : ''}${set.name}`
  const description =
    excerpt(set.description) ??
    `${set.brandName} ${name}: booster box, booster pack, thẻ lẻ chính hãng. ${set.productCount} sản phẩm, nhận đặt trước và đặt hộ.`
  return {
    title: `${set.brandName} ${name}`,
    description,
    keywords: [set.code, set.name, set.alias, set.brandName].filter(Boolean) as string[],
    alternates: { canonical: `/set/${set.slug}` },
    openGraph: { title: `${set.brandName} ${name}`, description, images: set.imageUrl ? [absoluteUrl(set.imageUrl)!] : undefined },
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const set = await getSet(slug)
  if (!set) notFound()
  const query = buildProductQuery('set', paramGetter(await searchParams), slug)
  const state = await prefetch([
    [['set', slug], async () => set],
    [['products', query], () => getProducts(query)],
  ])
  return (
    <HydrationBoundary state={state}>
      <ProductsPage mode="set" />
    </HydrationBoundary>
  )
}
