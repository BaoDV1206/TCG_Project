export type Role = 'USER' | 'ADMIN'
export type ProductStatus = 'IN_STOCK' | 'PRE_ORDER' | 'OUT_OF_STOCK'
export type RequestType = 'PURCHASE' | 'PRE_ORDER' | 'PROXY'
export type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'QUOTED'
  | 'CONFIRMED'
  | 'PURCHASING'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface User {
  id: number
  username: string
  fullName: string
  email: string | null
  phone: string | null
  address: string | null
  role: Role
  enabled: boolean
  createdAt: string
  requestCount: number | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Brand {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  color: string | null
  sortOrder: number
  active: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  sortOrder: number
}

export interface CardSet {
  id: number
  brandId: number
  brandName: string
  brandSlug: string
  brandColor: string | null
  code: string | null
  name: string
  alias: string | null
  slug: string
  releaseDate: string | null
  imageUrl: string | null
  description: string | null
  productCount: number
}

export interface Banner {
  id: number
  title: string | null
  subtitle: string | null
  imageUrl: string | null
  link: string | null
  bgColor: string | null
  position: 'MAIN' | 'SIDE'
  sortOrder: number
  active: boolean
}

export interface ProductCard {
  id: number
  name: string
  slug: string
  thumbnail: string | null
  brandName: string
  brandSlug: string
  brandColor: string | null
  categoryName: string
  categorySlug: string
  setCode: string | null
  language: string
  price: number | null
  originalPrice: number | null
  status: ProductStatus
  releaseDate: string | null
  depositPercent: number | null
  remainingSlots: number | null
  featured: boolean
  isNew: boolean
  active: boolean
}

export interface ProductDetail {
  id: number
  name: string
  slug: string
  images: string[]
  brandId: number
  brandName: string
  brandSlug: string
  brandColor: string | null
  categoryId: number
  categoryName: string
  categorySlug: string
  setId: number | null
  setCode: string | null
  setName: string | null
  setSlug: string | null
  language: string
  price: number | null
  originalPrice: number | null
  status: ProductStatus
  releaseDate: string | null
  depositPercent: number | null
  preorderLimit: number | null
  perUserLimit: number | null
  remainingSlots: number | null
  description: string | null
  specs: string | null
  featured: boolean
  isNew: boolean
  active: boolean
  viewCount: number
  createdAt: string
}

export interface HomeData {
  mainBanners: Banner[]
  sideBanners: Banner[]
  upcoming: ProductCard[]
  newArrivals: ProductCard[]
  featured: ProductCard[]
  brandSections: { brand: Brand; products: ProductCard[] }[]
}

export interface SuggestData {
  sets: CardSet[]
  products: ProductCard[]
  total: number
}

export interface HistoryItem {
  fromStatus: RequestStatus | null
  toStatus: RequestStatus
  note: string | null
  changedBy: string | null
  createdAt: string
}

export interface ServiceRequest {
  id: number
  code: string
  type: RequestType
  status: RequestStatus
  productId: number | null
  productSlug: string | null
  productName: string | null
  thumbnail: string | null
  brandName: string | null
  unitPrice: number | null
  depositPercent: number | null
  releaseDate: string | null
  quantity: number
  note: string | null
  proxyUrl: string | null
  proxyCountry: string | null
  proxyRefPrice: number | null
  proxyImageUrl: string | null
  quotedPrice: number | null
  serviceFee: number | null
  adminNote: string | null
  userSeen: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: number
    username: string
    fullName: string
    phone: string | null
    email: string | null
    address: string | null
  }
  history: HistoryItem[]
  allowedNext: RequestStatus[]
}

export interface RequestSummary {
  all: number
  pending: number
  processing: number
  completed: number
  closed: number
  unseen: number
}

export interface Dashboard {
  pendingCount: number
  todayCount: number
  activeProducts: number
  userCount: number
  pendingByType: Record<RequestType, number>
  daily: { date: string; purchase: number; preOrder: number; proxy: number }[]
  latest: ServiceRequest[]
  topPreorders: { productId: number; name: string; slug: string; quantity: number }[]
}

export type Settings = Record<string, string>
