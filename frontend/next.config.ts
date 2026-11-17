import type { NextConfig } from 'next'

// Địa chỉ backend Spring Boot (khi chạy Docker: http://backend:8080)
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

const config: NextConfig = {
  // build gọn để chạy trong Docker (chỉ copy những file cần thiết)
  output: 'standalone',
  poweredByHeader: false,
  images: {
    // ảnh demo trong /public và ảnh admin upload (/uploads/...) được tối ưu: đổi kích thước + WebP/AVIF
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600],
    imageSizes: [64, 96, 128, 200, 256, 384],
  },
  // Khi chạy dev (không có nginx) Next tự chuyển các đường dẫn này sang backend.
  // Trong Docker, nginx chuyển trực tiếp. (/uploads do route src/app/uploads xử lý để tối ưu được ảnh)
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/oauth2/:path*', destination: `${BACKEND_URL}/oauth2/:path*` },
      { source: '/login/oauth2/:path*', destination: `${BACKEND_URL}/login/oauth2/:path*` },
    ]
  },
}

export default config
