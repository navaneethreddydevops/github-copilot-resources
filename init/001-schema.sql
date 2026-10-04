-- Schema for sample-express-ts-api. TypeORM runs with synchronize: false,
-- so this file is the single source of truth for the database structure.

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    role          VARCHAR(16)  NOT NULL DEFAULT 'user'   CHECK (role IN ('admin', 'user')),
    status        VARCHAR(16)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ  NULL
);

CREATE INDEX idx_users_status ON users (status);

CREATE TABLE orders (
    id         UUID          PRIMARY KEY,
    user_id    BIGINT        NOT NULL REFERENCES users (id),
    status     VARCHAR(16)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
    amount     NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_status_created_at ON orders (status, created_at);
