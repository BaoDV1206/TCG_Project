import 'server-only'
import { cache } from 'react'
import { QueryClient, dehydrate, type QueryKey } from '@tanstack/react-query'
import { buildQuery } from './api'
import type { Brand, CardSet, Category, HomeData, PageResponse, ProductCard, ProductDetail, Settings } from './types'

/** Backend Spring Boot nhìn từ server Next (Docker: http://backend:8080) */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

/** Địa chỉ công khai của web, dùng cho link tuyệt đối (sitemap, Open Graph, canonical) */
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:5173').replace(/\/+$/, '')

export class NotFoundError extends Error {}

/** GET tới backend từ server. 404 -> NotFoundError, lỗi khác -> Error */
export async function serverGet<T>(path: string, query?: Record<string, string | number | null | undefined>): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api${path}${buildQuery(query)}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status === 404) throw new NotFoundError(path)
  if (!res.ok) throw new Error(`Backend ${res.status} ${path}`)
  return (await res.json()) as T
}

/** trả về null thay vì ném lỗi (dùng cho metadata: backend lỗi thì vẫn hiện trang) */
export async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch {
    return null
  }
}

// cache(): trong một lượt tải trang, generateMetadata và page dùng chung kết quả -> chỉ gọi backend 1 lần
// (quan trọng với chi tiết sản phẩm vì mỗi lần gọi backend tăng lượt xem)
export const getSettings = cache(() => serverGet<Settings>('/public/settings'))
export const getBrands = cache(() => serverGet<Brand[]>('/public/brands'))
export const getCategories = cache(() => serverGet<Category[]>('/public/categories'))
export const getHome = cache(() => serverGet<HomeData>('/public/home'))
export const getProduct = cache(async (slug: string) => {
  try {
    return await serverGet<ProductDetail>(`/public/products/${encodeURIComponent(slug)}`)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
})
export const getSet = cache(async (slug: string) => {
  try {
    return await serverGet<CardSet>(`/public/sets/${encodeURIComponent(slug)}`)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
})
export const getRelated = cache((slug: string) => serverGet<ProductCard[]>(`/public/products/${encodeURIComponent(slug)}/related`))
export const getProducts = (query: Record<string, string | number | null | undefined>) =>
  serverGet<PageResponse<ProductCard>>('/public/products', query)

/**
 * Tải trước dữ liệu trên server với đúng query key mà component dùng.
 * Trình duyệt nhận sẵn dữ liệu (không gọi lại API) và Google thấy nội dung đầy đủ trong HTML.
 * Query nào lỗi thì bỏ qua -> trình duyệt tự tải lại như bình thường.
 */
export async function prefetch(entries: [QueryKey, () => Promise<unknown>][]) {
  const qc = new QueryClient()
  await Promise.all(entries.map(([queryKey, queryFn]) => qc.prefetchQuery({ queryKey, queryFn })))
  return dehydrate(qc)
}

/** Lấy tham số đầu tiên từ searchParams của Next */
export function paramGetter(sp: Record<string, string | string[] | undefined>) {
  return (k: string) => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }
}

/** Đường dẫn ảnh tuyệt đối cho Open Graph / JSON-LD */
export function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Rút gọn mô tả cho thẻ meta description (~160 ký tự) */
export function excerpt(text: string | null | undefined, max = 160): string | undefined {
  if (!text) return undefined
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}
