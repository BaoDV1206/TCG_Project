import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Be_Vietnam_Pro } from 'next/font/google'
import { Providers } from './providers'
import { SITE_URL, getSettings, safe } from '@/lib/server'
import '../app.css'

// Font tự host (next/font): không phải tải từ Google Fonts lúc mở trang, không nhảy chữ
const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-be-vietnam',
})

// Mọi trang lấy dữ liệu mới nhất từ backend mỗi lần mở (giá, tồn kho, đặt trước thay đổi liên tục)
export const dynamic = 'force-dynamic'

const DEFAULT_DESCRIPTION =
  'Box, pack, thẻ lẻ Pokemon, One Piece, Naruto, Yu-Gi-Oh!, Dragon Ball chính hãng. Nhận đặt trước bộ mới và đặt hộ từ Nhật, Mỹ.'

export async function generateMetadata(): Promise<Metadata> {
  const shop = (await safe(getSettings()))?.shop_name || 'TCG Shop'
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${shop} – Thẻ bài TCG chính hãng`, template: `%s | ${shop}` },
    description: DEFAULT_DESCRIPTION,
    applicationName: shop,
    openGraph: { type: 'website', locale: 'vi_VN', siteName: shop, title: `${shop} – Thẻ bài TCG chính hãng`, description: DEFAULT_DESCRIPTION },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.svg' },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#991b1b',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
