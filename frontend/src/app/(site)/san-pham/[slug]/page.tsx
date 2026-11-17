import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HydrationBoundary } from '@tanstack/react-query'
import ProductDetailPage from '@/views/ProductDetailPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, absoluteUrl, excerpt, getProduct, getRelated, prefetch } from '@/lib/server'
import { formatPrice } from '@/lib/format'
import { PRODUCT_STATUS } from '@/lib/constants'
import type { ProductDetail } from '@/lib/types'

type Props = { params: Promise<{ slug: string }> }

function describe(p: ProductDetail): string {
  const parts = [
    p.name,
    p.setName ? `thuộc bộ ${p.setCode ? `${p.setCode} ` : ''}${p.setName}` : null,
    `Giá: ${formatPrice(p.price)}`,
    PRODUCT_STATUS[p.status]?.label,
  ].filter(Boolean)
  return excerpt(`${parts.join(' · ')}. ${p.description ?? ''}`) ?? p.name
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug).catch(() => null)
  // trả 404 ngay ở bước metadata -> Google nhận đúng mã 404 (không bị 200 do streaming)
  if (!p) notFound()
  const title = p.price ? `${p.name} – ${formatPrice(p.price)}` : p.name
  const description = describe(p)
  const images = p.images.slice(0, 4).map((src) => ({ url: absoluteUrl(src)!, alt: p.name }))
  return {
    title,
    description,
    alternates: { canonical: `/san-pham/${p.slug}` },
    keywords: [p.name, p.brandName, p.categoryName, p.setCode, p.setName].filter(Boolean) as string[],
    openGraph: { type: 'website', title, description, url: `/san-pham/${p.slug}`, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  }
}

const AVAILABILITY: Record<string, string> = {
  IN_STOCK: 'https://schema.org/InStock',
  PRE_ORDER: 'https://schema.org/PreOrder',
  OUT_OF_STOCK: 'https://schema.org/OutOfStock',
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) notFound()
  const state = await prefetch([
    [['product', slug], async () => p],
    [['related', slug], () => getRelated(slug)],
  ])
  const url = `${SITE_URL}/san-pham/${p.slug}`
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          image: p.images.map((i) => absoluteUrl(i)),
          description: p.description ?? describe(p),
          sku: String(p.id),
          category: p.categoryName,
          brand: { '@type': 'Brand', name: p.brandName },
          url,
          ...(p.price
            ? {
                offers: {
                  '@type': 'Offer',
                  url,
                  priceCurrency: 'VND',
                  price: p.price,
                  availability: AVAILABILITY[p.status] ?? 'https://schema.org/InStock',
                  itemCondition: 'https://schema.org/NewCondition',
                  ...(p.status === 'PRE_ORDER' && p.releaseDate ? { availabilityStarts: p.releaseDate } : {}),
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: p.brandName, item: `${SITE_URL}/san-pham?brand=${p.brandSlug}` },
            ...(p.setSlug ? [{ '@type': 'ListItem', position: 3, name: p.setCode ?? p.setName, item: `${SITE_URL}/set/${p.setSlug}` }] : []),
            { '@type': 'ListItem', position: p.setSlug ? 4 : 3, name: p.name, item: url },
          ],
        }}
      />
      <HydrationBoundary state={state}>
        <ProductDetailPage />
      </HydrationBoundary>
    </>
  )
}
