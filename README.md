# 🌙 Slick Trends

A full-stack e-commerce platform for second-hand sleepwear — robes, onesies, pajamas, night dresses, baby onesies, pre-teen robes, and baby robes.

---

## 🏗️ Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Recharts |
| Backend | Node.js, Express, TypeScript |
| Products DB | MongoDB Atlas |
| Transactions DB | PostgreSQL (Neon / Supabase / Railway) |
| Payments | MPesa, Stripe, PayPal, Visa/Mastercard |
| Auth | JWT with role-based access control |

---

## ⚙️ Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# → Fill in your MongoDB Atlas URI, PostgreSQL URL, payment keys
npm run dev        # Runs on http://localhost:5000
```

### 2. Run PostgreSQL Migrations

Connect to your PostgreSQL cloud instance and run:

```sql
-- Run in order:
backend/src/migrations/001_create_orders.sql
backend/src/migrations/002_create_order_items.sql
backend/src/migrations/003_create_transactions.sql
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local     # or edit .env.local
# → Fill in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_PAYPAL_CLIENT_ID
npm run dev        # Runs on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DATABASE_URL` | PostgreSQL cloud connection string |
| `JWT_SECRET` | Your JWT signing secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal app client secret |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja consumer key |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja consumer secret |
| `MPESA_SHORTCODE` | Business shortcode |
| `MPESA_PASSKEY` | Daraja passkey |
| `MPESA_CALLBACK_URL` | Your public callback URL |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID |

---

## 👤 User Roles

| Role | Capabilities |
|---|---|
| `customer` | Browse, cart, checkout, order tracking |
| `admin` | All customer + add/edit stock, manage orders (dispatch, close) |
| `superadmin` | All admin + full metrics, user management, transactions |

### Create First Super Admin

Use MongoDB compass or connect to Atlas and manually set `role: "superadmin"` on a user, or use the API after seeding:

```bash
POST /api/auth/register  # Create user
# Then manually update role in MongoDB: { role: "superadmin" }
```

Or add a seed script (optional).

---

## 📍 Routes Overview

### Customer
- `/` — Home
- `/products` — All products with filters
- `/products/[id]` — Product detail
- `/cart` — Shopping cart
- `/checkout` — 3-step checkout (address → payment → confirm)

### Admin (`/admin`)
- `/admin` — Dashboard with KPI cards
- `/admin/stock` — Add/edit/remove products
- `/admin/orders` — Manage order status lifecycle

### Super Admin (`/superadmin`)
- `/superadmin` — Revenue charts, order metrics, payment breakdown
- `/superadmin/users` — User management

---

## 💳 Payment Methods

| Method | How It Works |
|---|---|
| **M-Pesa** | STK Push via Safaricom Daraja API |
| **Stripe** | Payment Intent (card tokenization) |
| **PayPal** | PayPal Order API (sandbox/live) |
| **Visa/Mastercard** | Stripe with direct payment method ID |
