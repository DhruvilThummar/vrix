# VRIX Platform — Hosting Guide

> **Stack:** Next.js 14 (Frontend) · Node.js / Express (Backend) · Prisma (PostgreSQL via Supabase) · Cloudinary · Razorpay · Nodemailer

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Git | any |

---

## 2. Local Development Setup

### Backend

```bash
cd Backend
npm install
# fill in .env (see .env.example for all keys)
node server.js
# → Runs on http://localhost:5000
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
# → Runs on http://localhost:3000
```

> **No DB?** If `DATABASE_URL` is blank in `.env`, the backend automatically falls back to `Backend/data/db.json`. All features still work.

---

## 3. Environment Variables

Copy `Backend/.env.example` to `Backend/.env` and fill in the values.

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (URI mode) |
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `RAZORPAY_KEY_ID` | [Razorpay Dashboard](https://dashboard.razorpay.com/) → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `SMTP_HOST` | `smtp.gmail.com` (Gmail) or your SMTP provider |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | [Gmail App Password](https://myaccount.google.com/apppasswords) (not your login password) |

For Frontend, create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## 4. Database Setup (Supabase + Prisma)

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the **Connection String** (URI format) from **Settings → Database**
3. Paste it as `DATABASE_URL` in `Backend/.env`

### Step 2 — Push the Schema

```bash
cd Backend
npx prisma db push
```

This creates all tables from `prisma/schema.prisma`. The server will auto-seed data from `db.json` on first start.

### Step 3 — (Optional) View Data

```bash
npx prisma studio
# → Opens a visual DB browser at http://localhost:5555
```

---

## 5. Deploying the Backend

### Option A — Railway (Recommended, Free Tier Available)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → set **Root Directory** to `Backend`
3. Add all environment variables in the Railway dashboard
4. Railway auto-detects the `start` script and deploys

### Option B — Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. **Root Directory:** `Backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. Add all environment variables

### Option C — VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/your/vrix.git
cd vrix/Backend
npm install

# Set environment variables
cp .env.example .env
nano .env  # fill in values

# Run with PM2
npm install -g pm2
pm2 start server.js --name vrix-api
pm2 save
pm2 startup
```

---

## 6. Deploying the Frontend

### Option A — Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. **Root Directory:** `Frontend`
3. **Framework Preset:** Next.js (auto-detected)
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.com/api`
5. Click Deploy

### Option B — Netlify

1. Connect GitHub → set **Base directory:** `Frontend`
2. **Build command:** `npm run build`
3. **Publish directory:** `Frontend/.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

---

## 7. CORS Configuration

If your frontend and backend are on different domains, update `Backend/server.js`:

```js
app.use(cors({
  origin: ["https://your-frontend.vercel.app", "http://localhost:3000"],
  credentials: true,
}));
```

---

## 8. Delivery Portal Access

The delivery agent panel is available at:

```
https://your-frontend.vercel.app/delivery
```

Delivery agents:
1. See all active orders
2. Enter the customer's email → send OTP
3. Customer reads out OTP → agent enters it → order marked **DELIVERED**

---

## 9. Admin Panel Access

```
https://your-frontend.vercel.app/admin
```

- **Products** → `/admin/products` — Add/edit/delete products with Cloudinary image upload
- **CMS** → `/admin/cms` — Edit homepage, story, journal, navigation
- **Marketing** → `/admin/marketing` — Manage promo codes + view payment logs
- **Orders** → `/admin/orders` — View all orders
- **Security** → `/admin/security` — View login and payment security logs

---

## 10. Health Check

Once deployed, verify everything is working:

```
GET https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "dbMode": "prisma",
  "cloudinary": true,
  "razorpay": true,
  "nodemailer": true
}
```

---

## 11. Checklist Before Going Live

- [ ] Set `DATABASE_URL` → run `npx prisma db push`
- [ ] Configure Cloudinary credentials
- [ ] Configure Razorpay credentials (switch to live keys in production)
- [ ] Set up Gmail App Password for Nodemailer
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- [ ] Update CORS `origin` list in `server.js`
- [ ] Test the `/api/health` endpoint
- [ ] Test OTP flow (send + verify)
- [ ] Test a Razorpay test payment
- [ ] Test the delivery portal OTP flow
