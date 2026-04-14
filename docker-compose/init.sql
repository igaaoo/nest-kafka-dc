-- ============================================================
-- DATABASE: auth_db  (owned by auth-microservice)
-- ============================================================
CREATE DATABASE auth_db;

\connect auth_db;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
  user_id    SERIAL PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  status     TEXT NOT NULL CHECK (status IN ('ATIVO', 'DESATIVADO')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATABASE: dc_db  (owned by dc-microservice)
-- No FK to auth_db — user identity is validated via Kafka.
-- ============================================================
CREATE DATABASE dc_db;

\connect dc_db;

CREATE SCHEMA IF NOT EXISTS cd;

CREATE TABLE cd.vehicles (
  chassi     TEXT PRIMARY KEY,
  modelo     TEXT NOT NULL,
  patio      TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cd.transactions (
  id          SERIAL PRIMARY KEY,
  chassi      TEXT NOT NULL,
  username    TEXT NOT NULL,
  destination TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('ABERTA', 'EXECUTADA', 'ENCERRADA')),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_vehicle
    FOREIGN KEY (chassi)
    REFERENCES cd.vehicles(chassi)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);