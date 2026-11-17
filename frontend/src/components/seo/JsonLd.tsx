/** Dữ liệu có cấu trúc (schema.org) cho Google: hiện giá, tình trạng hàng... ngay trên kết quả tìm kiếm */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // escape "<" để nội dung không thể đóng thẻ <script>
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
