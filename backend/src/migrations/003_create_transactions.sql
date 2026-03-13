-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  payment_method VARCHAR(50) NOT NULL,
  -- methods: stripe | paypal | mpesa | visa | mastercard
  payment_provider_id VARCHAR(500),
  -- Stripe payment intent / PayPal order ID / MPesa receipt / card txn id
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- statuses: pending | completed | failed | refunded
  metadata JSONB,
  -- Store provider-specific response data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
