# Triển khai trên mini PC Ubuntu + Cloudflare Tunnel

Hệ thống gồm 3 container, chạy bằng `docker compose`:

```
Internet ──► Cloudflare ──► cloudflared (tunnel) ──► http://localhost:8088
                                                        │
                                              ┌─────────┴─────────┐
                                              │ web (nginx)       │  giao diện React
                                              │  /api, /uploads ──┼──► backend (Spring Boot :8080)
                                              └───────────────────┘          │
                                                                             ▼
                                                                   db (PostgreSQL 18)
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
docker compose ps                  # 3 container đều phải "Up"
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

## Lệnh hay dùng

| Việc | Lệnh |
|---|---|
| Dừng web | `docker compose stop` |
| Chạy lại | `docker compose start` |
| Xem log | `docker compose logs -f --tail=100` |
| Xóa container (giữ dữ liệu) | `docker compose down` |
| Xóa **sạch cả dữ liệu** ⚠️ | `docker compose down -v` |

Các container được đặt `restart: unless-stopped`, nên khi mini PC khởi động lại, web tự chạy lại (miễn là dịch vụ Docker được bật lúc khởi động: `sudo systemctl enable docker`).
