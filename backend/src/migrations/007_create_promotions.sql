CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  image_url TEXT NOT NULL,
  link VARCHAR(255) DEFAULT '#',
  is_active BOOLEAN DEFAULT true,
  type VARCHAR(50) DEFAULT 'holiday',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
