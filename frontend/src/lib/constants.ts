import type { ProductStatus, RequestStatus, RequestType } from './types'

export const LANGUAGES: { value: string; label: string; flag: string }[] = [
  { value: 'EN', label: 'Tiếng Anh', flag: '🇺🇸' },
  { value: 'JP', label: 'Tiếng Nhật', flag: '🇯🇵' },
  { value: 'VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'CN', label: 'Tiếng Trung', flag: '🇨🇳' },
  { value: 'KR', label: 'Tiếng Hàn', flag: '🇰🇷' },
]

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; className: string }> = {
  IN_STOCK: { label: 'Còn hàng', className: 'bg-emerald-50 text-emerald-700' },
  PRE_ORDER: { label: 'Sắp phát hành', className: 'bg-indigo-50 text-indigo-700' },
  OUT_OF_STOCK: { label: 'Hết hàng', className: 'bg-gray-100 text-gray-600' },
}

export const REQUEST_TYPE: Record<RequestType, { label: string; className: string }> = {
  PURCHASE: { label: 'Mua', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  PRE_ORDER: { label: 'Đặt trước', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  PROXY: { label: 'Đặt hộ', className: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
}

export const REQUEST_STATUS: Record<RequestStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  APPROVED: { label: 'Đã nhận', className: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  QUOTED: { label: 'Đã báo giá', className: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
  CONFIRMED: { label: 'Khách đã xác nhận', className: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  PURCHASING: { label: 'Đang mua', className: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  ARRIVED: { label: 'Hàng đã về', className: 'bg-cyan-50 text-cyan-700 ring-cyan-200', dot: 'bg-cyan-500' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Từ chối', className: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-600 ring-gray-200', dot: 'bg-gray-400' },
}

/** Tên nút hành động khi admin chuyển sang trạng thái */
export const ADMIN_ACTION_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Duyệt / Nhận yêu cầu',
  QUOTED: 'Báo giá',
  CONFIRMED: 'Xác nhận',
  PURCHASING: 'Bắt đầu mua',
  ARRIVED: 'Hàng đã về',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CANCELLED: 'Hủy',
}

/** Các bước hiển thị trên timeline theo loại yêu cầu */
export const FLOW: Record<RequestType, RequestStatus[]> = {
  PURCHASE: ['PENDING', 'APPROVED', 'COMPLETED'],
  PRE_ORDER: ['PENDING', 'APPROVED', 'ARRIVED', 'COMPLETED'],
  PROXY: ['PENDING', 'QUOTED', 'CONFIRMED', 'PURCHASING', 'ARRIVED', 'COMPLETED'],
}

export const REQUEST_TABS: { key: string; label: string; summaryKey: 'all' | 'pending' | 'processing' | 'completed' | 'closed' }[] = [
  { key: 'ALL', label: 'Tất cả', summaryKey: 'all' },
  { key: 'PENDING', label: 'Chờ duyệt', summaryKey: 'pending' },
  { key: 'PROCESSING', label: 'Đang xử lý', summaryKey: 'processing' },
  { key: 'COMPLETED', label: 'Hoàn thành', summaryKey: 'completed' },
  { key: 'CLOSED', label: 'Từ chối / Hủy', summaryKey: 'closed' },
]

export const PROXY_COUNTRIES = [
  { value: 'JP', label: '🇯🇵 Nhật Bản' },
  { value: 'US', label: '🇺🇸 Mỹ' },
  { value: 'KR', label: '🇰🇷 Hàn Quốc' },
  { value: 'CN', label: '🇨🇳 Trung Quốc' },
  { value: 'OTHER', label: '🌏 Khác' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'release', label: 'Ngày phát hành' },
]

export const PRICE_RANGES = [
  { label: 'Dưới 500K', min: undefined, max: 500000 },
  { label: '500K – 1 triệu', min: 500000, max: 1000000 },
  { label: '1 – 3 triệu', min: 1000000, max: 3000000 },
  { label: 'Trên 3 triệu', min: 3000000, max: undefined },
]
