-- Migration: abandoned_carts table for n8n automation
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT,
  user_email  TEXT UNIQUE NOT NULL,
  user_name   TEXT NOT NULL DEFAULT 'Customer',
  items       JSONB NOT NULL DEFAULT '[]',
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  email_sent  BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(user_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_updated ON abandoned_carts(updated_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_unsent ON abandoned_carts(email_sent) WHERE email_sent = false;
