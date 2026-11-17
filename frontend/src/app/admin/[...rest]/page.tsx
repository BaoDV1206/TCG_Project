import { redirect } from 'next/navigation'

/** Đường dẫn admin không tồn tại -> về Dashboard */
export default function Page() {
  redirect('/admin')
}
