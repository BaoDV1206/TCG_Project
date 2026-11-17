import PrivacyPage from '@/views/PrivacyPage'

export const metadata = {
  title: 'Chính sách bảo mật',
  description: 'Cách TCG Shop thu thập, sử dụng và bảo vệ thông tin cá nhân của khách hàng, bao gồm dữ liệu khi đăng nhập bằng Google.',
  alternates: { canonical: '/chinh-sach-bao-mat' },
}

export default function Page() {
  return <PrivacyPage />
}
