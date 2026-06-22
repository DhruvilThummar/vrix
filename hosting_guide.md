# VRIX Platform — Complete Hosting & Deployment Guide

> **Stack:** Next.js 14 (Frontend) · Node.js / Express (Backend) · Prisma ORM · PostgreSQL via Supabase · Cloudinary · Razorpay · Nodemailer

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Local Development Setup](#4-local-development-setup)
5. [Environment Variables — Complete Reference](#5-environment-variables--complete-reference)
6. [Database Setup (Supabase + Prisma)](#6-database-setup-supabase--prisma)
7. [Third-Party Services Setup](#7-third-party-services-setup)
8. [Deploying the Backend](#8-deploying-the-backend)
9. [Deploying the Frontend](#9-deploying-the-frontend)
10. [CORS Configuration](#10-cors-configuration)
11. [Admin Panel Reference](#11-admin-panel-reference)
12. [Delivery Portal Reference](#12-delivery-portal-reference)
13. [API Endpoints Reference](#13-api-endpoints-reference)
14. [Health Check & Smoke Tests](#14-health-check--smoke-tests)
15. [Going Live Checklist](#15-going-live-checklist)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│         FRONTEND (Next.js)      │────▶│         BACKEND (Express)        │
│   Vercel / Netlify / VPS        │◀────│   Railway / Render / VPS        │
│   Port 3000 (dev)               │     │   Port 5000 (dev)               │
└─────────────────────────────────┘     └────────────┬────────────────────┘
                                                      │
                    ┌─────────────────────────────────┼──────────────────────┐
                    │                                 │                      │
                    ▼                                 ▼                      ▼
          ┌─────────────────┐             ┌─────────────────┐    ┌─────────────────┐
          │ Supabase        │             │ Cloudinary      │    │ Razorpay        │
          │ (PostgreSQL DB) │             │ (Media Storage) │    │ (Payments)      │
          └─────────────────┘             └─────────────────┘    └─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ Nodemailer      │
          │ (SMTP / Gmail)  │
          └─────────────────┘
```

> **Zero-config fallback:** If `DATABASE_URL` is not set, the backend automatically uses `Backend/data/db.json` as the database. All features still work — products, CMS, promo codes, payments.

---

## 2. Prerequisites

| Tool | Minimum Version | Install |
|------|-----------------|---------|
| Node.js | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9.x | bundled with Node.js |
| Git | any | [git-scm.com](https://git-scm.com) |
| Prisma CLI | ≥ 5.x | `npm install -g prisma` |

---

## 3. Project Structure

```
e com jew/
├── Backend/                  ← Express API server
│   ├── data/
│   │   ├── db.json           ← Fallback local database
│   │   └── uploads/          ← Local file uploads (no Cloudinary)
│   ├── prisma/
│   │   └── schema.prisma     ← Database schema
│   ├── database.js           ← Unified DB access layer (Prisma ↔ db.json)
│   ├── server.js             ← Main Express server + all API routes
│   ├── .env                  ← Your secret keys (never commit)
│   └── package.json
│
├── Frontend/                 ← Next.js 14 storefront + admin
│   ├── src/
│   │   ├── app/
│   │   │   ├── (shop)/       ← Customer-facing pages
│   │   │   │   ├── page.tsx       ← Homepage
│   │   │   │   ├── cart/          ← Shopping cart
│   │   │   │   ├── checkout/      ← Shipping → Payment → Confirmation
│   │   │   │   ├── collections/   ← Browse collections
│   │   │   │   ├── product/       ← Product detail
│   │   │   │   ├── account/       ← OTP login / account
│   │   │   │   ├── delivery/      ← Delivery agent portal
│   │   │   │   └── search/        ← Search & filter
│   │   │   └── (admin)/      ← Admin panel pages
│   │   │       └── admin/
│   │   │           ├── page.tsx        ← Dashboard
│   │   │           ├── products/       ← Product CRUD + stock
│   │   │           ├── collections/    ← Collection manager
│   │   │           ├── orders/         ← Payment orders
│   │   │           ├── marketing/      ← Promo codes + payment logs
│   │   │           ├── cms/            ← Site content editor
│   │   │           └── security/       ← Security logs
│   │   ├── context/
│   │   │   └── CartContext.tsx   ← Global cart state (localStorage)
│   │   └── utils/
│   │       └── api.ts            ← All API client functions
│   ├── .env.local            ← Frontend env vars
│   └── package.json
│
└── hosting_guide.md          ← This file
```

---

## 4. Local Development Setup

### Step 1 — Clone & Install

```bash
# Install backend dependencies
cd "Backend"
npm install

# Install frontend dependencies
cd "../Frontend"
npm install
```

### Step 2 — Configure Environment Variables

```bash
# Backend — copy the template and fill in values
# (see Section 5 for all keys)
cd Backend
cp .env.example .env    # or create .env manually
```

```bash
# Frontend — create .env.local
cd Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXX" >> .env.local
```

### Step 3 — Start the Servers

**Terminal 1 — Backend:**
```bash
cd Backend
node server.js
# ✅ Backend running → http://localhost:5000
# ✅ DB Mode: Local db.json (or Prisma if DATABASE_URL is set)
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
# ✅ Frontend running → http://localhost:3000
```

### Step 4 — Verify

Open `http://localhost:3000` — the storefront should load.
Open `http://localhost:3000/admin` — the admin panel should load.
Open `http://localhost:5000/api/health` — should return `{"status":"ok"}`.

---

## 5. Environment Variables — Complete Reference

### Backend — `Backend/.env`

```env
# ─── Server ───────────────────────────────────────────────────────────────────
PORT=5000

# ─── Database (Supabase / PostgreSQL) ────────────────────────────────────────
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
# Leave BLANK to use local db.json fallback
DATABASE_URL=

# ─── Supabase (Optional — only needed if using supabase-js client directly) ──
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# ─── Cloudinary (Image & Video Uploads) ───────────────────────────────────────
# Leave BLANK to save files locally to Backend/data/uploads/
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Razorpay (Payment Gateway) ───────────────────────────────────────────────
# Leave BLANK to use dev-mode mock payments (order_dev_XXXXX)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# ─── SMTP / Nodemailer (OTP Email Auth) ───────────────────────────────────────
# Leave BLANK to print OTPs to console (dev mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Frontend — `Frontend/.env.local`

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Razorpay publishable key (safe to expose in browser)
# Get from: dashboard.razorpay.com → Settings → API Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
```

### What works without credentials?

| Feature | No credentials | With credentials |
|---------|---------------|-----------------|
| Products, CMS, Collections | ✅ (db.json) | ✅ (Supabase) |
| Image uploads | ✅ (local files) | ✅ (Cloudinary CDN) |
| Payments | ✅ (mock order_dev_XXX) | ✅ (real Razorpay) |
| OTP verification | ✅ (prints to console) | ✅ (email delivered) |

---

## 6. Database Setup (Supabase + Prisma)

### Option A — Supabase (Recommended for Production)

#### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to your users (Mumbai for India)
3. Set a strong database password

#### Step 2 — Get the Connection String

1. In Supabase → **Settings → Database**
2. Scroll to **Connection String** → select **URI** tab
3. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefgh.supabase.co:5432/postgres
   ```
4. Paste it as `DATABASE_URL` in `Backend/.env`

#### Step 3 — Push the Schema

```bash
cd Backend
npx prisma db push
```

This creates all tables from `prisma/schema.prisma`:

| Table | Purpose |
|-------|---------|
| `products` | Jewellery catalogue (stock, visibility) |
| `cms_settings` | Homepage, navigation, brand, features |
| `journal` | Blog posts |
| `payments` | Razorpay transaction log |
| `redeem_codes` | Promo / discount codes |
| `verification_otps` | Email OTP auth |
| `security_logs` | Admin audit trail |

#### Step 4 — Seed Data

On first start, the backend auto-migrates all data from `db.json` into Supabase:

```bash
node server.js
# ✅ Migration: Products seeded (6)
# ✅ Migration: CMS settings seeded
# ✅ Migration: Promo codes seeded (2)
```

#### Step 5 — View Data (Optional)

```bash
npx prisma studio
# → Visual DB browser at http://localhost:5555
```

### Option B — No Database (Quick Start)

Simply leave `DATABASE_URL` blank. The backend uses `Backend/data/db.json` as a file-based database. Perfect for local development and demos.

---

## 7. Third-Party Services Setup

### 7.1 Cloudinary (Media Uploads)

Used by: Admin → Products (product images), Admin → CMS (hero, story images), Admin → Collections (cover images)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. From the **Dashboard** copy:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Add to `Backend/.env`
4. All uploads go to the `vrix/` folder in your Cloudinary account

**Without Cloudinary:** Images are saved to `Backend/data/uploads/` and served at `http://localhost:5000/uploads/filename.jpg`

### 7.2 Razorpay (Payments)

Used by: Checkout → Payment page (`/checkout/payment`)

#### Backend keys

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys** → Generate Test Key
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `Backend/.env`

#### Frontend key

1. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `Frontend/.env.local`
2. This is the same as `RAZORPAY_KEY_ID` — it's safe to expose in the browser

#### Test card numbers

| Card | Number | Expiry | CVV |
|------|--------|--------|-----|
| Visa | 4111 1111 1111 1111 | Any future | Any |
| Mastercard | 5267 3181 8797 5449 | Any future | Any |
| UPI | `success@razorpay` | — | — |

#### Going live

1. Complete Razorpay KYC at `dashboard.razorpay.com`
2. Switch from `rzp_test_` keys to `rzp_live_` keys
3. Update both `Backend/.env` and `Frontend/.env.local`

### 7.3 Nodemailer / Gmail SMTP (OTP Emails)

Used by: Account login (`/account`), Delivery OTP portal (`/delivery`)

1. Enable **2-Step Verification** on your Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an **App Password** (select "Mail" + "Other")
4. Add to `Backend/.env`:
   ```env
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx   ← 16-char app password
   ```

**Without SMTP:** OTPs print to the backend console:
```
[DEV MODE] OTP for customer@email.com: 482931
```

---

## 8. Deploying the Backend

### Option A — Railway ⭐ (Recommended)

**Free tier available. Easiest setup.**

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo**
3. Select your repo → set **Root Directory** to `Backend`
4. Add all environment variables in the Railway **Variables** tab
5. Add a **PostgreSQL** service from the Railway marketplace (or use Supabase)
6. Railway auto-detects Node.js and runs `node server.js`
7. Copy the generated URL: `https://vrix-api.railway.app`

### Option B — Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Node Version:** 18
4. Add all environment variables in the Environment tab
5. Click **Create Web Service**

### Option C — VPS (Ubuntu / DigitalOcean / AWS)

```bash
# 1. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (process manager)
npm install -g pm2

# 3. Clone repository
git clone https://github.com/your-username/vrix.git
cd vrix/Backend

# 4. Install dependencies
npm install

# 5. Create and fill .env
cp .env.example .env
nano .env    # fill in all keys

# 6. Push Prisma schema to production DB
npx prisma db push

# 7. Start with PM2
pm2 start server.js --name vrix-api
pm2 save
pm2 startup    # auto-restart on server reboot

# 8. (Optional) Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/vrix-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vrix-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 9. Deploying the Frontend

### Option A — Vercel ⭐ (Recommended for Next.js)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Settings:
   - **Root Directory:** `Frontend`
   - **Framework Preset:** Next.js (auto-detected)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   ```
5. Click **Deploy**
6. Your site is live at `https://vrix.vercel.app`

### Option B — Netlify

1. Connect GitHub → set **Base directory:** `Frontend`
2. **Build command:** `npm run build`
3. **Publish directory:** `Frontend/.next`
4. Add environment variables in Site Settings → Environment Variables

### Option C — VPS (Self-hosted)

```bash
cd Frontend

# Build the production bundle
npm run build

# Install PM2 if not already installed
npm install -g pm2

# Start the Next.js production server
pm2 start npm --name "vrix-frontend" -- start
pm2 save
```

Configure Nginx to proxy port 3000 to your domain.

---

## 10. CORS Configuration

When frontend and backend are on **different domains**, update `Backend/server.js`:

```javascript
// Replace the existing `app.use(cors())` with:
app.use(cors({
  origin: [
    "https://vrix.vercel.app",          // your production frontend
    "https://your-custom-domain.com",   // custom domain if any
    "http://localhost:3000",            // local dev
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

---

## 11. Admin Panel Reference

Access the admin panel at:
```
https://your-site.vercel.app/admin
```

| Section | URL | Features |
|---------|-----|----------|
| Dashboard | `/admin` | Live stats: revenue, orders, stock, hidden items |
| Products | `/admin/products` | CRUD, Cloudinary upload, stock levels, show/hide |
| Collections | `/admin/collections` | Create/edit/delete, reorder, show/hide, image upload |
| Orders | `/admin/orders` | All Razorpay orders, status filter, detail panel |
| Marketing | `/admin/marketing` | Promo code CRUD + Razorpay payment logs |
| CMS | `/admin/cms` | Homepage, story, navigation, features toggles |
| Security | `/admin/security` | Admin audit log, OTP events, payment events |

### Promo Code Types

| Type | Example | Effect |
|------|---------|--------|
| `percentage` | `VRIX20` = 20 | 20% off subtotal |
| `fixed` | `WELCOME10` = 10 | ₹10 flat off |

---

## 12. Delivery Portal Reference

Access the delivery agent portal at:
```
https://your-site.vercel.app/delivery
```

### Delivery OTP Flow

```
Customer places order → payment SUCCESS
         │
         ▼
Delivery agent opens /delivery
         │
         ▼
Agent selects order → enters customer email
         │
         ▼
Backend sends 6-digit OTP to customer email
         │
         ▼
Customer reads OTP to agent
         │
         ▼
Agent enters OTP → backend verifies
         │
         ▼
Order status → DELIVERED ✅
```

### Portal Features

- 📱 Mobile-first design (optimized for agent smartphones)
- 🔍 Search orders by ID or status
- 📧 Send OTP to any email with one click
- ⌨️ 6-digit OTP entry with auto-focus between digits
- ✅ Real-time status update after delivery confirmation

---

## 13. API Endpoints Reference

### Base URL
```
Development:  http://localhost:5000/api
Production:   https://your-backend.railway.app/api
```

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status + service availability |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | All products |
| GET | `/products/:id` | Single product |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| PATCH | `/products/:id/stock` | Update stock level |
| PATCH | `/products/:id/visibility` | Show/hide on storefront |

### Payments (Razorpay)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment/order` | Create Razorpay order |
| POST | `/payment/verify` | Verify payment signature |
| GET | `/payment/logs` | All payment records (admin) |

### Promo Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/promo/verify` | Validate a promo code at checkout |
| GET | `/promo/codes` | All codes (admin) |
| POST | `/promo/codes` | Create new code (admin) |
| PUT | `/promo/codes/:code` | Enable/disable code (admin) |
| DELETE | `/promo/codes/:code` | Delete code (admin) |

### OTP / Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/otp/send` | Send OTP to email |
| POST | `/otp/verify` | Verify OTP code |

### Delivery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/delivery/orders` | Active orders for agent |
| POST | `/delivery/send-otp` | Send delivery OTP to customer |
| POST | `/delivery/verify-otp` | Confirm delivery with OTP |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/media/upload` | Upload image/video to Cloudinary |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| GET | `/config` | All CMS settings |
| POST | `/config/:key` | Save a CMS setting |

---

## 14. Health Check & Smoke Tests

After deploying, run these tests in order:

### 1. Backend Health
```
GET https://your-backend.railway.app/api/health
```
Expected:
```json
{
  "status": "ok",
  "dbMode": "prisma",
  "cloudinary": true,
  "razorpay": true,
  "nodemailer": true
}
```

### 2. Products API
```
GET https://your-backend.railway.app/api/products
```
Should return an array of 6+ products.

### 3. CMS Data
```
GET https://your-backend.railway.app/api/db
```
Should return full homepage/collections/brand data.

### 4. Payment Test (Dev Mode)
```bash
curl -X POST https://your-backend.railway.app/api/payment/order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR"}'
```
Should return `{ "success": true, "order": { "id": "order_dev_..." } }`.

### 5. Frontend Load
- Open `https://your-site.vercel.app` — homepage loads
- Open `https://your-site.vercel.app/admin` — admin dashboard loads with stats
- Open `https://your-site.vercel.app/delivery` — delivery portal loads

---

## 15. Going Live Checklist

### Database
- [ ] Supabase project created in nearest region
- [ ] `DATABASE_URL` set in Backend environment
- [ ] `npx prisma db push` executed successfully
- [ ] Data seeded (auto-runs on server start)
- [ ] `npx prisma studio` — confirm tables have data

### Cloudinary
- [ ] Account created at cloudinary.com
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` set
- [ ] Test upload: upload a product image from `/admin/products`

### Razorpay
- [ ] Test keys configured (`rzp_test_...`)
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` set in Frontend env
- [ ] Complete a test payment using card `4111 1111 1111 1111`
- [ ] Verify the payment appears in `/admin/marketing` Payment Logs tab
- [ ] KYC completed for live keys
- [ ] **Before launch:** swap `rzp_test_` → `rzp_live_` in both envs

### Email / OTP
- [ ] Gmail 2FA enabled
- [ ] App password generated and set as `SMTP_PASS`
- [ ] Test OTP: go to `/account`, enter an email, receive OTP in inbox
- [ ] Test delivery OTP: go to `/delivery`, select an order, send OTP

### Frontend → Backend Connection
- [ ] `NEXT_PUBLIC_API_URL` points to production backend URL
- [ ] CORS `origin` list in `server.js` includes your production frontend domain
- [ ] All admin pages load data (products, orders, promo codes)

### Security
- [ ] `.env` is in `.gitignore` — **never commit secrets**
- [ ] Razorpay webhook signature verification enabled
- [ ] Admin panel has access restrictions in place (add auth middleware)
- [ ] HTTPS enabled on both frontend and backend domains

### Final Verification
- [ ] `/api/health` returns all services as `true`
- [ ] Homepage loads with live CMS content
- [ ] Add to cart → checkout → Razorpay payment → confirmation page
- [ ] Delivery OTP flow works end-to-end
- [ ] Admin can create/edit/delete products
- [ ] Promo code applies discount at checkout
- [ ] Admin can create and disable promo codes

---

## 16. Troubleshooting

### Backend won't start

```bash
# Check Node.js version
node --version   # must be ≥ 18

# Check for missing packages
cd Backend && npm install

# Check .env exists
cat Backend/.env

# View server logs
node server.js   # errors will print here
```

### Database connection fails

```bash
# Test the connection string directly
cd Backend
npx prisma db push

# Common errors:
# "Can't reach database server" → check DATABASE_URL format
# "SSL required" → add ?sslmode=require to DATABASE_URL
# "Authentication failed" → wrong password in connection string
```

**Fix Supabase connection:**
```env
# Add ?pgbouncer=true&connection_limit=1 for serverless environments
DATABASE_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres?pgbouncer=true
```

### CORS errors in browser

```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:** Add your frontend URL to the `origin` array in `Backend/server.js` (see [Section 10](#10-cors-configuration)).

### Razorpay modal doesn't open

1. Check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set in `Frontend/.env.local`
2. Restart the Next.js dev server after adding env vars (`npm run dev`)
3. Open browser DevTools → Console for Razorpay errors
4. Ensure the Razorpay SDK loads: look for `<script src="https://checkout.razorpay.com/v1/checkout.js">` in page source

### OTP not received

1. Verify `SMTP_USER` and `SMTP_PASS` in `.env`
2. Check Gmail → Manage your Google Account → Security → App Passwords
3. Look in **Spam/Junk** folder
4. In dev mode, check backend console — OTP prints there

### Images not uploading

1. Verify all three Cloudinary keys are set in `.env`
2. Restart the backend after changing `.env`
3. Without Cloudinary, check `Backend/data/uploads/` for uploaded files

### Frontend shows stale data

```bash
# Clear Next.js cache and rebuild
cd Frontend
rm -rf .next
npm run build
npm run dev
```

---

*VRIX Platform · Built with Next.js, Express, Prisma, Razorpay, Cloudinary, and Nodemailer*
*Last updated: June 2026*
