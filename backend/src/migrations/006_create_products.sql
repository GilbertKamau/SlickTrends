CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  images JSONB,
  brand VARCHAR(255),
  color VARCHAR(50),
  material VARCHAR(255),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  added_by VARCHAR(255) NOT NULL,
  tags JSONB,
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_added_by ON products(added_by);
