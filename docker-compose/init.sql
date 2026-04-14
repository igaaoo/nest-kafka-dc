-- =========================
-- SCHEMAS
-- =========================
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS cd;

-- =========================
-- AUTH SERVICE
-- =========================
CREATE TABLE auth.users (
  user_id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ATIVO', 'DESATIVADO')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CD SERVICE
-- =========================
CREATE TABLE cd.vehicles (
  chassi TEXT PRIMARY KEY,
  modelo TEXT NOT NULL,
  patio TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cd.transactions (
  id SERIAL PRIMARY KEY,
  chassi TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ABERTA', 'EXECUTADA', 'ENCERRADA')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_vehicle
    FOREIGN KEY (chassi)
    REFERENCES cd.vehicles(chassi)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(user_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);