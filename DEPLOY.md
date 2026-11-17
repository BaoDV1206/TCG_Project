# Triển khai trên mini PC Ubuntu + Cloudflare Tunnel

Hệ thống gồm 4 container, chạy bằng `docker compose`:

```
Internet ──► Cloudflare ──► cloudflared (tunnel) ──► http://localhost:8088
                                                        │
                                                  web (nginx) ── /api, /uploads, /oauth2 ──► backend (Spring Boot :8080) ──► db (PostgreSQL 18)
                                                        │                                        ▲
                                                        └── mọi trang khác ──► next (Next.js :3000) ┘ lấy dữ liệu để dựng HTML (SEO)
```

- Chỉ cổng **8088** được mở, và mặc định chỉ trên `127.0.0.1` (máy local). Database và backend không mở ra ngoài.
- Dữ liệu được giữ trong docker volume `tcgshop_db-data` (database) và `tcgshop_uploads` (ảnh admin upload). Gỡ container hay cập nhật code không làm mất dữ liệu.
- Web đang chạy sẵn ở `baodv3.io.vn` **không bị ảnh hưởng**. Web mới chạy ở cổng riêng và dùng tên miền con riêng.

## 1. Cài Docker trên Ubuntu (bỏ qua nếu đã có)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # đăng xuất rồi đăng nhập lại để dùng docker không cần sudo
docker compose version             # kiểm tra
```

## 2. Lấy code và cấu hình

```bash
git clone https://github.com/BaoDV1206/TCG_Project.git
cd TCG_Project
cp .env.example .env
nano .env
```

Trong `.env`, **bắt buộc** đổi các giá trị sau:

| Biến | Ý nghĩa |
|---|---|
| `PUBLIC_URL` | Địa chỉ web, ví dụ `https://tcg.baodv3.io.vn` |
| `DB_PASSWORD` | Mật khẩu database |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự. Tạo bằng lệnh `openssl rand -base64 48` |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản `admin` (chỉ áp dụng lần đầu tạo) |

Nếu cổng 8088 đã bị web khác dùng, đổi `WEB_PORT` sang cổng khác. Kiểm tra bằng `sudo ss -ltnp | grep 8088`.

## 3. Chạy

```bash
docker compose up -d --build       # lần đầu mất vài phút để build
docker compose ps                  # 4 container (db, backend, next, web) đều phải "Up"
docker compose logs -f backend     # xem log, Ctrl+C để thoát
curl -I http://localhost:8088      # phải trả về 200
```

## 4. Gắn tên miền qua Cloudflare Tunnel

Một tunnel có thể phục vụ **nhiều tên miền**. Bạn chỉ cần thêm một *Public Hostname* mới vào tunnel đang có, không cần tạo tunnel mới và không cần mở port trên router.

### Cách A: tunnel quản lý trên dashboard (thường gặp nhất)
1. Vào https://one.dash.cloudflare.com → **Networks → Tunnels**, chọn tunnel đang chạy cho `baodv3.io.vn` → **Edit**.
2. Mở tab **Public Hostname** → **Add a public hostname**:
   - **Subdomain**: `tcg` (hoặc tên bạn thích, ví dụ `shop`)
   - **Domain**: `baodv3.io.vn`
   - **Service**: Type `HTTP`, URL `localhost:8088`
3. Bấm **Save**. Cloudflare tự tạo bản ghi DNS. Sau khoảng 1 phút, mở `https://tcg.baodv3.io.vn`.

### Cách B: tunnel cấu hình bằng file `config.yml`
Mở file cấu hình của cloudflared (thường là `/etc/cloudflared/config.yml` hoặc `~/.cloudflared/config.yml`). Thêm dòng cho tên miền mới **phía trên** dòng `http_status:404` cuối cùng:

```yaml
ingress:
  - hostname: baodv3.io.vn          # web cũ, giữ nguyên
    service: http://localhost:xxxx
  - hostname: tcg.baodv3.io.vn      # web TCG mới
    service: http://localhost:8088
  - service: http_status:404
```

Sau đó tạo DNS và khởi động lại cloudflared:

```bash
cloudflared tunnel route dns <TÊN_TUNNEL> tcg.baodv3.io.vn
sudo systemctl restart cloudflared
```

### Nếu cloudflared chạy trong Docker
Container cloudflared không hiểu `localhost` là máy chủ. Có 2 cách:
- Đặt `WEB_BIND=0.0.0.0` trong `.env` rồi trỏ Service tới `http://<IP-LAN-của-mini-PC>:8088`, **hoặc**
- Cho cloudflared vào chung mạng `tcgshop_default` (`docker network connect tcgshop_default <container-cloudflared>`) rồi trỏ Service tới `http://tcgshop-web-1:80`.

## 5. Cập nhật code mới

```bash
cd TCG_Project
git pull
docker compose up -d --build
```

Khi khởi động, Flyway tự áp dụng các migration mới. Dữ liệu cũ được giữ nguyên.

## 6. Sao lưu và khôi phục

```bash
# sao lưu database
docker compose exec -T db pg_dump -U postgres tcgshopdb | gzip > backup-$(date +%F).sql.gz
# sao lưu ảnh upload
docker run --rm -v tcgshop_uploads:/data -v "$PWD":/out alpine tar czf /out/uploads-$(date +%F).tgz -C /data .

# khôi phục database (vào DB trống)
gunzip -c backup-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U postgres tcgshopdb
```

## 7. Bật đăng nhập bằng Google (OAuth 2.0)

Nút **"Tiếp tục với Google"** chỉ hiện khi đã điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env`. Nếu chưa điền, web vẫn chạy bình thường với đăng nhập bằng mật khẩu.

### 7.1 Tạo OAuth Client trên Google Cloud (miễn phí)
1. Vào https://console.cloud.google.com, đăng nhập Gmail. Bấm chọn project ở góc trên → **New project** → đặt tên `TCG Shop` → **Create**.
2. Mở menu ☰ → **APIs & Services → OAuth consent screen** (có thể hiện là **Google Auth Platform**) → **Get started**:
   - **App name**: `TCG Shop` · **User support email**: Gmail của bạn
   - **Audience**: chọn **External**
   - **Contact information**: Gmail của bạn → đồng ý điều khoản → **Create**
3. Vào mục **Clients** → **Create client**:
   - **Application type**: `Web application` · **Name**: `TCG Shop Web`
   - **Authorized JavaScript origins**: thêm 2 dòng
     ```
     https://tcg.baodv3.io.vn
     http://localhost:5173
     ```
   - **Authorized redirect URIs**: thêm 2 dòng (phải gõ **chính xác**, kể cả `https` và đường dẫn)
     ```
     https://tcg.baodv3.io.vn/login/oauth2/code/google
     http://localhost:5173/login/oauth2/code/google
     ```
   - Bấm **Create**. Google hiện **Client ID** và **Client secret**: copy cả hai và lưu lại ngay, vì Client secret có thể chỉ hiện **một lần**.
4. Vào **Branding** và điền (bắt buộc trước khi Publish):
   - **App home page**: `https://tcg.baodv3.io.vn`
   - **Application privacy policy link**: `https://tcg.baodv3.io.vn/chinh-sach-bao-mat`
   - **Authorized domains** → **Add domain**: `baodv3.io.vn`
   - Bấm **Save**.
5. Vào **Audience** → **Publish app** → **Confirm**, để chuyển sang *In production*. Nếu bỏ qua bước này, chỉ những Gmail có trong danh sách *Test users* mới đăng nhập được. Web chỉ xin quyền tên, email và ảnh đại diện (không phải quyền nhạy cảm), nên Google không yêu cầu xét duyệt.

### 7.2 Điền vào mini PC
```bash
cd ~/project/TCG_Project
git pull
nano .env
```
Thêm hoặc sửa 2 dòng:
```
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```
Sau đó build và chạy lại:
```bash
docker compose up -d --build
```

### 7.3 Kiểm tra
- `curl http://localhost:8088/api/auth/providers` phải trả về `{"google":true}`.
- Mở `https://tcg.baodv3.io.vn/dang-nhap`, sẽ thấy nút **Tiếp tục với Google** dưới form đăng nhập.

| Lỗi | Cách sửa |
|---|---|
| Google báo **`redirect_uri_mismatch`** | Địa chỉ ở bước 3 gõ sai. Thông báo lỗi của Google có ghi địa chỉ web gửi lên; copy đúng địa chỉ đó vào *Authorized redirect URIs* |
| **"Access blocked: app has not completed verification"** / chỉ vài Gmail vào được | Chưa làm bước 5 (Publish app) |
| Nút Google không hiện | `.env` chưa có 2 biến trên, hoặc chưa chạy lại `docker compose up -d` |

### Cách hệ thống xử lý tài khoản Google
- **Lần đầu đăng nhập Google**: web tự tạo tài khoản. Tên đăng nhập lấy từ email, chưa có mật khẩu. Khách có thể vào **Tài khoản → Đặt mật khẩu** để đăng nhập thêm bằng mật khẩu.
- **Email Google trùng email của tài khoản đã đăng ký**: web tự liên kết vào tài khoản đó (chỉ khi Google xác nhận email đã được xác minh), nên lịch sử yêu cầu được giữ nguyên.
- **Tài khoản bị admin khóa**: đăng nhập bằng Google cũng bị chặn.

## Lệnh hay dùng

| Việc | Lệnh |
|---|---|
| Dừng web | `docker compose stop` |
| Chạy lại | `docker compose start` |
| Xem log | `docker compose logs -f --tail=100` |
| Xóa container (giữ dữ liệu) | `docker compose down` |
| Xóa **sạch cả dữ liệu** ⚠️ | `docker compose down -v` |

Các container được đặt `restart: unless-stopped`, nên khi mini PC khởi động lại, web tự chạy lại (miễn là dịch vụ Docker được bật lúc khởi động: `sudo systemctl enable docker`).
