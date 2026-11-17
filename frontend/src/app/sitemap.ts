import type { MetadataRoute } from 'next'
import { SITE_URL, getBrands, getProducts, safe, serverGet } from '@/lib/server'
import type { CardSet, ProductCard } from '@/lib/types'

// tạo lại mỗi lần Google đọc -> luôn có sản phẩm mới nhất
export const dynamic = 'force-dynamic'

const MAX_PAGES = 50 // 50 x 60 = 3000 sản phẩm

async function allProducts(): Promise<ProductCard[]> {
  const out: ProductCard[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await safe(getProducts({ page, size: 60, sort: 'newest' }))
    if (!res) break
    out.push(...res.items)
    if (page + 1 >= res.totalPages) break
  }
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [products, sets, brands] = await Promise.all([
    allProducts(),
    safe(serverGet<CardSet[]>('/public/sets')),
    safe(getBrands()),
  ])

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/san-pham`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/dat-truoc`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/dat-ho`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/chinh-sach-bao-mat`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  for (const b of brands ?? []) {
    pages.push({ url: `${SITE_URL}/san-pham?brand=${encodeURIComponent(b.slug)}`, changeFrequency: 'daily', priority: 0.7 })
  }
  for (const s of sets ?? []) {
    pages.push({ url: `${SITE_URL}/set/${s.slug}`, changeFrequency: 'weekly', priority: 0.7 })
  }
  for (const p of products) {
    pages.push({
      url: `${SITE_URL}/san-pham/${p.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: p.thumbnail ? [p.thumbnail.startsWith('http') ? p.thumbnail : `${SITE_URL}${p.thumbnail}`] : undefined,
    })
  }
  return pages
}
