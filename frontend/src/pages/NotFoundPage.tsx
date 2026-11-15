import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-8 h-44 w-72">
        {[-16, 0, 16].map((r, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-0 flex aspect-[5/7] h-44 -translate-x-1/2 items-center justify-center rounded-2xl border-4 border-white shadow-xl"
            style={{
              transform: `translateX(-50%) rotate(${r}deg) translateX(${(i - 1) * 50}px)`,
              background: i === 1 ? 'linear-gradient(160deg,#b91c1c,#7f1d1d)' : 'linear-gradient(160deg,#1f2937,#111827)',
            }}
          >
            <span className="text-3xl font-black text-white">{['4', '0', '4'][i]}</span>
          </div>
        ))}
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900">Lá bài này không tồn tại</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng.</p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn-primary">Về trang chủ</Link>
        <Link to="/san-pham" className="btn-outline">Xem sản phẩm</Link>
      </div>
    </div>
  )
}
