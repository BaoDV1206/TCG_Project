/**
 * Ảnh admin upload (/uploads/...) lấy từ backend.
 * Trình duyệt thường được nginx chuyển thẳng sang backend; route này dùng khi chạy dev
 * và cho bộ tối ưu ảnh của Next (next/image) đọc ảnh gốc để thu nhỏ, đổi sang WebP/AVIF.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  if (path.some((seg) => seg === '..' || seg === '.' || seg.includes('\\'))) {
    return new Response('Not found', { status: 404 })
  }
  const upstream = await fetch(`${BACKEND_URL}/uploads/${path.map(encodeURIComponent).join('/')}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null)
  const type = upstream?.headers.get('content-type') ?? ''
  // chỉ trả về ảnh
  if (!upstream || !upstream.ok || !type.startsWith('image/')) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=2592000, immutable',
    },
  })
}
