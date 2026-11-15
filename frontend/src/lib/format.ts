const vnd = new Intl.NumberFormat('vi-VN')

export function formatPrice(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'Liên hệ'
  return `${vnd.format(v)}₫`
}

export function formatNumber(v: number | null | undefined): string {
  return v === null || v === undefined ? '' : vnd.format(v)
}

export function discountPercent(price: number | null, original: number | null): number | null {
  if (!price || !original || original <= price) return null
  return Math.round(((original - price) / original) * 100)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`
  return formatDate(iso)
}

export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null
  const target = new Date(`${isoDate}T00:00:00`).getTime()
  return Math.ceil((target - Date.now()) / 86400000)
}

/** "Số pack/box: 24\nSố thẻ/pack: 6" -> [["Số pack/box","24"], ...] */
export function parseSpecs(specs: string | null): [string, string][] {
  if (!specs) return []
  return specs
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(':')
      return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['', l]
    }) as [string, string][]
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
