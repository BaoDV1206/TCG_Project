CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(120) UNIQUE,
    phone       VARCHAR(20),
    address     VARCHAR(255),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE brands (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    logo_url    VARCHAR(255),
    color       VARCHAR(20),
    sort_order  INT          NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    sort_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE card_sets (
    id           BIGSERIAL PRIMARY KEY,
    brand_id     BIGINT       NOT NULL REFERENCES brands(id),
    code         VARCHAR(30),
    name         VARCHAR(150) NOT NULL,
    alias        VARCHAR(255),
    slug         VARCHAR(160) NOT NULL UNIQUE,
    release_date DATE,
    image_url    VARCHAR(255),
    description  TEXT
);

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) NOT NULL UNIQUE,
    brand_id        BIGINT       NOT NULL REFERENCES brands(id),
    category_id     BIGINT       NOT NULL REFERENCES categories(id),
    set_id          BIGINT       REFERENCES card_sets(id),
    language        VARCHAR(10)  NOT NULL DEFAULT 'EN',
    price           NUMERIC(14,0),
    original_price  NUMERIC(14,0),
    status          VARCHAR(20)  NOT NULL DEFAULT 'IN_STOCK',
    release_date    DATE,
    deposit_percent INT,
    preorder_limit  INT,
    per_user_limit  INT,
    description     TEXT,
    specs           TEXT,
    featured        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_new          BOOLEAN      NOT NULL DEFAULT FALSE,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    view_count      BIGINT       NOT NULL DEFAULT 0,
    search_text     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_search ON products USING gin (search_text gin_trgm_ops);

CREATE TABLE product_images (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         VARCHAR(255) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE requests (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES users(id),
    type                VARCHAR(20)  NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    product_id          BIGINT       REFERENCES products(id) ON DELETE SET NULL,
    product_name        VARCHAR(255),
    quantity            INT          NOT NULL DEFAULT 1,
    note                TEXT,
    proxy_url           VARCHAR(1000),
    proxy_country       VARCHAR(30),
    proxy_ref_price     NUMERIC(14,0),
    proxy_image_url     VARCHAR(255),
    quoted_price        NUMERIC(14,0),
    service_fee         NUMERIC(14,0),
    admin_note          TEXT,
    user_seen           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(type);

CREATE TABLE request_history (
    id           BIGSERIAL PRIMARY KEY,
    request_id   BIGINT      NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    from_status  VARCHAR(20),
    to_status    VARCHAR(20) NOT NULL,
    note         TEXT,
    changed_by   VARCHAR(50),
    created_at   TIMESTAMP   NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_request ON request_history(request_id);

CREATE TABLE banners (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(150),
    subtitle    VARCHAR(255),
    image_url   VARCHAR(255),
    link        VARCHAR(255),
    bg_color    VARCHAR(100),
    position    VARCHAR(10) NOT NULL DEFAULT 'MAIN',
    sort_order  INT         NOT NULL DEFAULT 0,
    active      BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE settings (
    setting_key   VARCHAR(60) PRIMARY KEY,
    setting_value TEXT
);
