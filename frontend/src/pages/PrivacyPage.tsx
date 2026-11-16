import { useEffect, type ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useSettings } from '../hooks/queries'
import { Breadcrumb } from '../components/ui/Common'

const UPDATED = '17/11/2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-6 text-gray-700">{children}</div>
    </section>
  )
}

/** Chính sách bảo mật – Google yêu cầu khi bật "Đăng nhập bằng Google" ở chế độ production */
export default function PrivacyPage() {
  const { data: s } = useSettings()
  const shop = s?.shop_name || 'TCG Shop'

  useEffect(() => {
    document.title = `Chính sách bảo mật | ${shop}`
  }, [shop])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Chính sách bảo mật' }]} />
      <article className="card mx-auto max-w-3xl space-y-6 p-5 md:p-8">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <ShieldCheck className="text-primary-700" /> Chính sách bảo mật
          </h1>
          <p className="mt-1 text-xs text-gray-500">Cập nhật lần cuối: {UPDATED}</p>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            {shop} tôn trọng quyền riêng tư của khách hàng. Trang này giải thích chúng tôi thu thập thông tin gì, dùng vào việc gì
            và bạn có những quyền gì đối với dữ liệu của mình.
          </p>
        </header>

        <Section title="1. Thông tin chúng tôi thu thập">
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Khi đăng ký tài khoản:</b> họ tên, tên đăng nhập, số điện thoại, email (không bắt buộc) và mật khẩu (được mã hóa, chúng tôi không xem được).</li>
            <li>
              <b>Khi đăng nhập bằng Google:</b> chúng tôi chỉ nhận <b>tên, địa chỉ email và ảnh đại diện</b> từ tài khoản Google của bạn,
              cùng một mã định danh để nhận ra bạn ở lần đăng nhập sau. Chúng tôi <b>không</b> nhận mật khẩu Google và không truy cập
              Gmail, danh bạ, Drive hay bất kỳ dữ liệu nào khác.
            </li>
            <li><b>Khi gửi yêu cầu Mua / Đặt trước / Đặt hộ:</b> sản phẩm, số lượng, địa chỉ nhận hàng, ghi chú và đường link sản phẩm bạn cung cấp.</li>
          </ul>
        </Section>

        <Section title="2. Mục đích sử dụng">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tạo và quản lý tài khoản, cho phép bạn đăng nhập.</li>
            <li>Xử lý, báo giá và liên hệ với bạn về các yêu cầu mua, đặt trước, đặt hộ.</li>
            <li>Giao hàng và chăm sóc khách hàng.</li>
          </ul>
          <p>Chúng tôi không dùng thông tin của bạn cho quảng cáo và <b>không bán hay chia sẻ</b> cho bên thứ ba, trừ khi pháp luật yêu cầu hoặc cần thiết để giao hàng (ví dụ: tên, số điện thoại, địa chỉ cho đơn vị vận chuyển).</p>
        </Section>

        <Section title="3. Lưu trữ và bảo vệ">
          <p>
            Dữ liệu được lưu trên máy chủ của shop, truyền qua kết nối mã hóa HTTPS. Mật khẩu được mã hóa một chiều (BCrypt).
            Chỉ quản trị viên của shop mới xem được thông tin yêu cầu của khách. Dữ liệu được giữ trong thời gian tài khoản còn hoạt động.
          </p>
        </Section>

        <Section title="4. Cookie và lưu trữ trên trình duyệt">
          <p>
            Website lưu mã đăng nhập (token) trong bộ nhớ trình duyệt để giữ trạng thái đăng nhập. Chúng tôi không dùng cookie
            quảng cáo hay theo dõi của bên thứ ba.
          </p>
        </Section>

        <Section title="5. Quyền của bạn">
          <ul className="list-disc space-y-1 pl-5">
            <li>Xem và sửa thông tin cá nhân tại trang <b>Tài khoản</b>.</li>
            <li>Yêu cầu <b>xóa tài khoản và dữ liệu</b> bằng cách liên hệ shop theo thông tin bên dưới; chúng tôi xử lý trong vòng 7 ngày làm việc.</li>
            <li>
              Ngắt kết nối với Google bất cứ lúc nào tại{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="font-semibold text-primary-700 hover:underline">
                myaccount.google.com/permissions
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="6. Liên hệ">
          <ul className="space-y-1">
            {s?.hotline && <li>Hotline: <b>{s.hotline}</b></li>}
            {s?.email && <li>Email: <b>{s.email}</b></li>}
            {s?.address && <li>Địa chỉ: {s.address}</li>}
          </ul>
          <p>Chính sách có thể được cập nhật; ngày cập nhật mới nhất luôn ghi ở đầu trang.</p>
        </Section>
      </article>
    </div>
  )
}
