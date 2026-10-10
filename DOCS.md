# EduHMS — Operations, Deployment & Reference Guide

This document contains everything required to access, operate, maintain, and develop the **EduHMS (Edu Herbal Clinic)** hospital management system across its cloud services (**Vercel**, **Render**, and **Neon**).

---

## 1. Live Deployment URLs

| Service | Environment | URL | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Production (Vercel) | [https://edu-herbal-hms.vercel.app](https://edu-herbal-hms.vercel.app) | SPA with Vite + React |
| **Backend REST API** | Production (Render) | [https://eduhms-backend.onrender.com](https://eduhms-backend.onrender.com) | NestJS Enterprise Core |
| **API Documentation** | Swagger / OpenAPI | [https://eduhms-backend.onrender.com/api/docs](https://eduhms-backend.onrender.com/api/docs) | Interactive API Explorer |
| **Health Check** | Status Monitoring | [https://eduhms-backend.onrender.com/api/v1/health](https://eduhms-backend.onrender.com/api/v1/health) | Uptime & Service Health |
| **Source Code** | GitHub | [https://github.com/Tmax01/Edu-Herbal-hms](https://github.com/Tmax01/Edu-Herbal-hms) | `main` branch deploys automatically |

> **Note on Render Free Tier:** Render spins down inactive backend web services. If the app has been idle, the first request may take ~30–50 seconds to boot up (cold start).

---

## 2. Seeded Staff Login Credentials

All demonstration accounts use the same standard password:
- **Default Password:** `Password123!`

| Role | Email Address | Full Name | Branch Access | Department |
| :--- | :--- | :--- | :--- | :--- |
| **CTO** | `cto@eduhms.gh` | Kwame Asante | All Branches | Technology |
| **Hospital Admin** | `admin@eduhms.gh` | Abena Owusu | All Branches | Administration |
| **Doctor (General)** | `dr.mensah@eduhms.gh` | Dr. Kofi Mensah | Accra Central | General Medicine |
| **Doctor (Herbal)** | `dr.darko@eduhms.gh` | Dr. Ama Darko | Mankessim Herbal | Herbal Medicine |
| **Nurse** | `nurse.boateng@eduhms.gh` | Akosua Boateng | Accra Central | Ward A |
| **Pharmacist** | `pharmacist@eduhms.gh` | Emmanuel Tetteh | Accra Central | Pharmacy |
| **Lab Technician** | `lab@eduhms.gh` | Yaa Frimpong | Accra Central | Laboratory |
| **Receptionist** | `reception@eduhms.gh` | Kwabena Appiah | Accra Central | Front Desk / Triage |
| **Accountant** | `accounts@eduhms.gh` | Efua Asiedu | All Branches | Finance / Accounts |
| **Call Centre** | `callcentre@eduhms.gh` | Nana Agyei | Accra Central | Customer Relations |
| **Store Officer** | `store@eduhms.gh` | Kweku Ofori | Mankessim Herbal | Stores / Inventory |

---

## 3. Environment Variables Reference

### Backend (`Backend/.env` & Render Dashboard)

Configure these in the **Render Dashboard -> Environment**:

```env
# Application
NODE_ENV=production
PORT=4000
API_PREFIX=api/v1

# Cross-Origin Resource Sharing
# Comma-separated allowed frontend origins (*.vercel.app is dynamically allowed in main.ts)
CORS_ORIGIN=https://edu-herbal-hms.vercel.app,http://localhost:5173

# Database (Neon PostgreSQL connection pooler)
DATABASE_URL="postgresql://neondb_owner:npg_o5HAKDaV2ZpX@ep-wispy-morning-b4r00qgq-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Authentication & Security
JWT_SECRET=super_secret_jwt_key_eduhms_production_2026_xyz
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_eduhms_production_2026_abc
JWT_REFRESH_EXPIRATION=7d

# Storage (MinIO or S3)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=eduhms-attachments

# Optional External Integrations
ARKESEL_API_KEY=
ARKESEL_SENDER_ID=EduHMS
ARKESEL_API_URL=https://sms.arkesel.com/api/v2/sms/send
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```

### Frontend (`Frontend/vercel.json` & Environment)

The frontend automatically uses a **Vercel Reverse Proxy** configured in `Frontend/vercel.json`. 
* All requests to `/api/v1/:path*` are automatically forwarded to `https://eduhms-backend.onrender.com/api/v1/:path*` by Vercel edge routes.
* **No `VITE_API_BASE_URL` is required in the Vercel dashboard.**
* Eliminates cross-origin CORS blocks and browser network permissions.
* For local development, `vite.config.ts` proxies `/api/v1` to `http://localhost:4000/api/v1`.

---

## 4. Cloud Platform Configuration Settings

### Render (Backend Service)
- **Service Type:** Web Service
- **Root Directory:** `Backend`
- **Environment:** Node
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/api/v1/health`
- **Auto-Deploy:** Enabled on git push to `main` branch

### Vercel (Frontend Project)
- **Framework Preset:** Vite
- **Root Directory:** `Frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **SPA Routing:** Configured via `Frontend/vercel.json` rewrites (`{ "source": "/(.*)", "destination": "/index.html" }`)

### Neon (PostgreSQL Database)
- **Compute:** Serverless Postgres 16
- **Region:** US East 2 (Ohio)
- **Connection Type:** Use pooled connection URL for production backend to avoid exhaustion during serverless scaling.

---

## 5. Daily Operations & CLI Commands

### Database Migrations & Management
Run from the `Backend/` directory:

```bash
# Push schema updates to the Neon database
npx prisma db push

# Regenerate Prisma Client types after schema edit
npx prisma generate

# Re-seed demo branches, users, clinical records, and inventory
npm run prisma:seed

# Launch Prisma Studio Web GUI to inspect & edit data visually
npx prisma studio
```

### Running Locally
```bash
# Terminal 1: Backend API (runs on port 4000)
cd Backend
npm install
npm run start:dev

# Terminal 2: Frontend UI (runs on port 5173)
cd Frontend
npm install
npm run dev
```

### Running Test Suites
```bash
# Backend unit & integration tests (56/56 passing)
cd Backend
npm test

# Frontend unit & UI tests (66/66 passing)
cd Frontend
npm test
```

---

## 6. Maintenance & Troubleshooting

1. **Frontend says "Cannot reach server" or network error:**
   - Check if Render backend is in sleep mode. Open `https://eduhms-backend.onrender.com/api/v1/health` in your browser to trigger the wake-up sequence.
   - Verify that `VITE_API_BASE_URL` on Vercel is set to `https://eduhms-backend.onrender.com/api/v1`.
2. **Database connection timeout:**
   - Ensure the Neon project has not been paused (Neon free tier auto-pauses after inactivity; visiting or pinging the database wakes it within 1–2 seconds).
3. **Updating Production Code:**
   - Push your commits to `main` on GitHub:
     ```bash
     git add .
     git commit -m "your update description"
     git push origin main
     ```
   - Both Vercel and Render will automatically detect the push, rebuild, and deploy without downtime.
