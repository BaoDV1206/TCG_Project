import ProxyOrderPage from '@/views/ProxyOrderPage'

export const metadata = {
  title: 'Đặt hộ thẻ bài từ Nhật, Mỹ',
  description: 'Gửi link sản phẩm TCG từ Nhật Bản, Mỹ… shop báo giá trọn gói trong 24h, mua hộ và giao tận tay. Hỗ trợ Mercari, Yahoo Auction, TCGplayer, eBay.',
  alternates: { canonical: '/dat-ho' },
}

export default function Page() {
  return <ProxyOrderPage />
}
