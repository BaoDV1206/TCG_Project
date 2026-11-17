/**
 * Tham số lọc sản phẩm (dùng chung cho server và trình duyệt).
 * Server dùng để tải trước dữ liệu, trình duyệt dùng làm query key -> phải giống hệt nhau.
 */
export type ProductListMode = 'list' | 'search' | 'set'

export function buildProductQuery(mode: ProductListMode, get: (key: string) => string, slug?: string) {
  const page = parseInt(get('page') || '0', 10)
  return {
    q: mode === 'search' ? get('q') : undefined,
    brand: get('brand'),
    category: get('category'),
    set: mode === 'set' ? slug : get('set'),
    language: get('language'),
    status: get('status'),
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    isNew: get('isNew'),
    featured: get('featured'),
    sort: get('sort') || (mode === 'search' ? 'popular' : 'newest'),
    page: Number.isFinite(page) ? page : 0,
    size: 20,
  }
}

export const PREORDER_QUERY = { status: 'PRE_ORDER', brand: '', sort: 'release', size: 60 }
