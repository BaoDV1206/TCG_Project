-- Đăng nhập bằng Google: tài khoản Google có thể không có mật khẩu
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN google_id VARCHAR(64) UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
