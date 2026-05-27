-- Usuarios y autenticación
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255),
    phone           VARCHAR(20),
    avatar_url      TEXT,
    provider        VARCHAR(50) NOT NULL, -- 'google', 'email', 'apple'
    provider_id     VARCHAR(255),
    google_id       VARCHAR(255), -- ID único de Google OAuth 2.0
    auth_method     VARCHAR(20) DEFAULT 'email', -- 'email', 'google'
    role            VARCHAR(50) DEFAULT 'customer', -- 'customer', 'provider', 'admin'
    eco_score       INTEGER DEFAULT 0,
    email_verified  BOOLEAN DEFAULT FALSE,
    phone_verified  BOOLEAN DEFAULT FALSE,
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    mfa_secret      VARCHAR(32), -- TOTP secret (AES-256 cifrado en reposo)
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ -- Soft delete
);

-- Proveedores (extensión de users)
CREATE TABLE providers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name   VARCHAR(255) NOT NULL,
    ruc             VARCHAR(11) UNIQUE NOT NULL,
    verified        BOOLEAN DEFAULT FALSE,
    eco_certified   BOOLEAN DEFAULT FALSE,
    certification   JSONB, -- { "body": "PerúEco", "expires": "2027-01-01" }
    bank_account    TEXT, -- AES-256 cifrado
    direccion_fiscal TEXT,
    telefono_corporativo VARCHAR(50),
    email_empresarial VARCHAR(255) UNIQUE,
    representante_legal VARCHAR(255),
    status          VARCHAR(50) DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id     UUID REFERENCES providers(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    stock           INTEGER DEFAULT 0,
    unit            VARCHAR(50),
    category        VARCHAR(100),
    eco_score       INTEGER CHECK (eco_score BETWEEN 0 AND 100),
    images          TEXT[], -- S3 URLs
    origin_lat      DECIMAL(9,6),
    origin_lng      DECIMAL(9,6),
    origin_name     VARCHAR(255),
    fecha_produccion DATE,
    origen_region   VARCHAR(255),
    fecha_vencimiento DATE,
    certificacion_pdf_url VARCHAR(512),
    status          VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    motivo_rechazo  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de auditorías de productos
CREATE TABLE product_audits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    auditor_id      UUID REFERENCES users(id),
    status          VARCHAR(50) NOT NULL, -- 'APPROVED', 'REJECTED'
    observaciones   TEXT,
    certificate_pdf_url VARCHAR(512),
    fecha_analisis  TIMESTAMPTZ DEFAULT NOW()
);


-- Ingredientes y auditoría (relación N:N)
CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    inci_name       VARCHAR(255),
    toxicity_level  VARCHAR(10) CHECK (toxicity_level IN ('green','yellow','red')),
    concerns        TEXT[],
    sources         TEXT[] -- referencias científicas
);

CREATE TABLE product_ingredients (
    product_id      UUID REFERENCES products(id),
    ingredient_id   UUID REFERENCES ingredients(id),
    percentage      DECIMAL(5,2),
    PRIMARY KEY (product_id, ingredient_id)
);

-- Órdenes
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES users(id),
    status          VARCHAR(50) DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL,
    platform_fee    DECIMAL(10,2) NOT NULL, -- 15%
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    paid_at         TIMESTAMPTZ
);

CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID REFERENCES orders(id),
    product_id  UUID REFERENCES products(id),
    provider_id UUID REFERENCES providers(id),
    quantity    INTEGER NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    subtotal    DECIMAL(10,2) NOT NULL
);

-- Pagos y split
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES orders(id),
    method              VARCHAR(50), -- 'yape', 'plin', 'tunki', 'card', 'cash'
    provider            VARCHAR(50), -- 'culqi', 'tupay'
    external_ref        VARCHAR(255), -- Culqi charge_id / Tupay CIP
    status              VARCHAR(50) DEFAULT 'pending',
    idempotency_key     UUID UNIQUE NOT NULL, -- Prevención de cobro doble
    amount              DECIMAL(10,2),
    currency            VARCHAR(3) DEFAULT 'PEN',
    webhook_signature   TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at        TIMESTAMPTZ
);

CREATE TABLE payment_splits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID REFERENCES payments(id),
    provider_id     UUID REFERENCES providers(id),
    amount          DECIMAL(10,2), -- 85% del subtotal del proveedor
    platform_cut    DECIMAL(10,2), -- 15%
    disbursed       BOOLEAN DEFAULT FALSE,
    disbursed_at    TIMESTAMPTZ
);

-- Seed Data

-- 1. Usuarios
INSERT INTO users (id, email, full_name, provider, provider_id, role, eco_score) VALUES
('11111111-1111-1111-1111-111111111111', 'josep.garate@ecomarket.pe', 'Josep Garate', 'email', '$2a$10$X.xGq58H3Z8J0d2w9S9r6.j0h9u1R2E4S5U6I7O8P9A0D1F2G3H4J', 'admin', 900),
('22222222-2222-2222-2222-222222222222', 'proveedor.bio@ecomarket.pe', 'EcoShop', 'email', '$2a$10$X.xGq58H3Z8J0d2w9S9r6.j0h9u1R2E4S5U6I7O8P9A0D1F2G3H4J', 'provider', 500),
('99999999-9999-9999-9999-999999999999', 'admin', 'Administrador Principal', 'email', '$2a$10$X.xGq58H3Z8J0d2w9S9r6.j0h9u1R2E4S5U6I7O8P9A0D1F2G3H4J', 'admin', 999),
('88888888-8888-8888-8888-888888888888', 'admin@ecomarket.pe', 'Administrador Principal', 'email', '$2a$10$X.xGq58H3Z8J0d2w9S9r6.j0h9u1R2E4S5U6I7O8P9A0D1F2G3H4J', 'admin', 999);

-- 2. Proveedor
INSERT INTO providers (id, user_id, business_name, ruc, verified, eco_certified) VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'EcoShop', '20123456789', TRUE, TRUE);

-- 3. Productos (Matching the Mock Products with images)
INSERT INTO products (id, provider_id, name, description, price, stock, category, eco_score, images) VALUES
('00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Shampoo Sólido de Verbena', 'Fórmula 100% natural sin sulfatos ni parabenos.', 14.50, 50, 'Cuidado Personal', 98, ARRAY['/IMG/shampoo_solido.png']),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Proteína de Arveja Orgánica', 'Alta proteína vegetal certificada orgánica.', 32.00, 30, 'Alimentación', 95, ARRAY['/IMG/proteina_arveja.png']),
('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Detergente Biodegradable', 'Limpieza efectiva con fórmula biodegradable al 100%.', 18.90, 100, 'Limpieza Hogar', 92, ARRAY['/IMG/detergente_bio.png']),
('00000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Cepillo Bambú Moso', 'Cepillo de dientes de bambú certificado compostable.', 5.50, 200, 'Cuidado Personal', 99, ARRAY['/IMG/cepillo_bambu.png']),
('00000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Aceite de Coco Virgen', 'Extracción en frío, comercio justo certificado.', 22.00, 60, 'Alimentación', 96, ARRAY['/IMG/aceite_coco.png']),
('00000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'Jabón de Avena Natural', 'Hidratante y calmante para piel sensible.', 8.90, 150, 'Cuidado Personal', 91, ARRAY['/IMG/jabon_avena.png']),
('00000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 'Bolsas Reutilizables Orgánicas', 'Bolsas de algodón orgánico certificado GOTS.', 12.00, 80, 'Hogar Eco', 97, ARRAY['/IMG/aceite_coco.png']),
('00000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 'Té Verde Matcha Ceremonial', 'Grado ceremonial japonés, cultivo biológico.', 38.00, 40, 'Alimentación', 94, ARRAY['/IMG/proteina_arveja.png']),
('00000000-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 'Desodorante Natural en Barra', 'Desodorante orgánico libre de aluminio y plástico.', 16.90, 120, 'Cuidado Personal', 97, ARRAY['/IMG/desodorante_natural.png']),
('00000000-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 'Crema Facial Hidratante Aloe', 'Crema hidratante de aloe vera biológico para el rostro.', 28.50, 75, 'Cuidado Personal', 95, ARRAY['/IMG/jabon_avena.png']),
('00000000-0000-0000-0000-000000000011', '33333333-3333-3333-3333-333333333333', 'Harina de Almendras Orgánica', 'Harina fina de almendras orgánicas, ideal keto.', 24.00, 90, 'Alimentación', 93, ARRAY['/IMG/proteina_arveja.png']),
('00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333333', 'Esponja de Luffa Vegetal', 'Esponja exfoliante 100% biodegradable.', 7.90, 110, 'Hogar Eco', 100, ARRAY['/IMG/cepillo_bambu.png']);

-- Productos seed visibles en catálogo (APPROVED); pendientes se gestionan vía panel admin
UPDATE products SET status = 'APPROVED' WHERE status IS NULL OR status = 'PENDING';

-- Índices de rendimiento (consultas frecuentes del catálogo y auth)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category);
CREATE INDEX IF NOT EXISTS idx_products_status_eco_score ON products(status, eco_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

