# TCG Shop

Website bán box, pack và thẻ lẻ TCG (Pokemon, One Piece, Naruto, Yu-Gi-Oh!, Dragon Ball...). Web **không có giỏ hàng / thanh toán online**. Thay vào đó, khách gửi **yêu cầu** (Mua, Đặt trước, Đặt hộ), admin duyệt và cập nhật trạng thái, còn khách theo dõi ở mục **Yêu cầu của tôi**.

| Phần | Công nghệ |
|---|---|
| Backend | Spring Boot 4.1 · Java 21 · Spring Security (JWT) · Spring Data JPA · Flyway · PostgreSQL |
| Frontend | React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router · TanStack Query |

## Chạy dự án

### 1. Database
PostgreSQL chạy ở `localhost:5432`, database `tcgshopdb`, user/password `postgres/postgres`.
Khi backend khởi động, Flyway tự tạo bảng và nạp dữ liệu mẫu.

Muốn đổi thông tin kết nối thì đặt biến môi trường: `DB_URL`, `DB_USER`, `DB_PASSWORD`.

### 2. Backend (cổng 8080)
```bash
cd backend
mvn spring-boot:run
```

### 3. Frontend (cổng 5173)
```bash
cd frontend
npm install
npm run dev
```
Mở http://localhost:5173. Vite tự chuyển tiếp `/api` và `/uploads` sang backend.

### Tài khoản mặc định
| Vai trò | Tài khoản |
|---|---|
| Admin | `admin` / `admin` |
| Khách demo | `user` / `user123` |

> Khi đưa lên môi trường thật, hãy đặt `ADMIN_PASSWORD` và `JWT_SECRET` (tối thiểu 32 ký tự) bằng biến môi trường.

## Đăng nhập bằng Google
Có nút "Tiếp tục với Google" (OAuth 2.0 / OpenID Connect). Nút này chỉ bật khi đặt biến môi trường `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`. Cách tạo Client ID xem [DEPLOY.md mục 7](DEPLOY.md#7-bật-đăng-nhập-bằng-google-oauth-20).
Khi chạy dev trên máy: đặt 2 biến này trước khi chạy `mvn spring-boot:run`, rồi mở web ở http://localhost:5173.

## Triển khai bằng Docker
Chạy cả web, backend và database chỉ với một lệnh: `cp .env.example .env` (sửa mật khẩu trong file), rồi `docker compose up -d --build`. Web mở ở http://localhost:8088.
Hướng dẫn đầy đủ cho mini PC Ubuntu và Cloudflare Tunnel nằm ở [DEPLOY.md](DEPLOY.md).

## Các trang

**Phía người dùng**: Trang chủ · Sản phẩm (lọc theo thương hiệu, loại, set, ngôn ngữ, giá) · Chi tiết sản phẩm · Tìm kiếm · Trang Set (`/set/:slug`) · Đặt trước · Đặt hộ · Yêu cầu của tôi · Chi tiết yêu cầu · Đăng nhập / Đăng ký · Tài khoản

**Phía admin** (`/admin`): Dashboard · Quản lý yêu cầu · Sản phẩm · Set / Pack · Thương hiệu & Loại · Banner · Người dùng · Cài đặt

## Luồng trạng thái yêu cầu
| Loại | Luồng |
|---|---|
| Mua (Liên hệ) | Chờ duyệt → Đã nhận → Hoàn thành |
| Đặt trước | Chờ duyệt → Đã nhận → Hàng đã về → Hoàn thành |
| Đặt hộ | Chờ duyệt → Đã báo giá → *(khách đồng ý)* → Đang mua → Hàng đã về → Hoàn thành |

- Admin có thể **Từ chối** ở bất kỳ bước nào chưa kết thúc (bắt buộc ghi lý do).
- Khách chỉ được tự **hủy** khi yêu cầu còn ở trạng thái Chờ duyệt.

## Tìm kiếm
- Tìm theo tên sản phẩm, mã set (`op09`, `OP-09`, `op 09` đều ra), tên set, tên gọi khác (alias) của set và thương hiệu.
- Không cần gõ dấu, không phân biệt hoa thường.
- Gõ sai chính tả vẫn tìm được nhờ extension `pg_trgm` của PostgreSQL (ví dụ "surgng" ra "Surging Sparks").

## Cấu trúc thư mục
```
backend/src/main/java/com/tcgshop
├── config/      Security, JWT, CORS, upload, khởi tạo admin
├── entity/      JPA entities + enum trạng thái
├── repository/
├── service/     Logic nghiệp vụ (sản phẩm, yêu cầu, danh mục, người dùng)
└── web/         REST controllers (public, user, admin)
backend/src/main/resources/db/migration   Flyway (schema + dữ liệu mẫu)

frontend/src
├── components/  layout (header, footer, menu), product, request, ui
├── pages/       trang người dùng + pages/admin
├── context/     AuthContext
└── lib/         api client, types, hằng số, format
```
