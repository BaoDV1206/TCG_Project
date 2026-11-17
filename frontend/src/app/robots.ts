import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/server'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // trang riêng tư / không có nội dung cần lên Google
      disallow: ['/admin', '/tai-khoan', '/yeu-cau', '/dang-nhap', '/dang-ky', '/api/', '/oauth2/', '/login/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
