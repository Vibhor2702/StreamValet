
# StreamValet

Welcome, Evaluator! 👋

Thank you for taking the time to review StreamValet—a production-grade B2B video management platform built for multi-tenant teams. This project is designed to showcase robust video upload, processing, streaming, and role-based access control, all with a clean, modern UI and a focus on real-world deployment.

## 🚀 Quick Demo Access

**No setup required!**

1. Visit the deployed app: [https://streamvalet.pages.dev](https://streamvalet.pages.dev)
2. Use the one-click login buttons (Admin, Editor, Viewer) for instant access to demo accounts:
  - **Admin:** `admin@pulsegen.io` / `admin123`
  - **Editor:** `editor@pulsegen.io` / `editor123`
  - **Viewer:** `viewer@pulsegen.io` / `viewer123`

You can upload, process, and stream videos, view analytics, and explore all features without any registration.

---


## ⚡ Local Quick Start (for developers)
1. `docker-compose up -d mongo`
2. `npm run install-all` (from repo root)
3. `npm run dev` (from repo root)
4. Open http://localhost:5173 and use the Quick Login buttons.

### One-click smoke test
```sh
cd server
npm run smoke
```
This logs in as admin, lists videos, and fetches comments to confirm the stack is healthy.


## 🔐 Security & Access
- Demo users are always available (see above).
- Public registration is disabled for security. Admins can provision new users via API.
- Auth endpoints are rate-limited; CORS and Socket.io are restricted to trusted origins.


## 🏗️ Architecture Decision Record (ADR)
- **Stack split (Express + Vite):** Independent deployability and faster frontend iteration.
- **Mongoose + strict schema:** Tenant isolation and state machine for video lifecycle.
- **Services layer:** FFmpeg, sensitivity rules, job queue, storage helpers keep routes thin.
- **Socket.io for progress:** Real-time status/processing updates without polling.
- **Multer disk storage (MVP):** Simple local storage; swappable for S3/Blob later.
- **Rule-based sensitivity:** Deterministic, pluggable for future models.
- **Retryable pipeline:** FAILED → PROCESSING allowed for manual retries.
- **RBAC middleware:** `auth` + `checkRole` enforce tenant/role constraints at the edge.


## 🗂️ Project Structure
- `server/` Express API, Socket.io, Mongo models, services, seed, and smoke scripts.
- `client/` Vite + React + Tailwind dashboard with Auth and Socket contexts.
- `docker-compose.yml` Local Mongo with auth + healthcheck.


## 🧪 Testing
- Quick smoke: `npm run smoke` (server) logs in, lists videos/comments.
- Manual: upload mp4/mkv, observe pipeline states and heatmap; retry failed uploads.
- Admin metrics: `/api/v1/admin/metrics` as admin.



## 🌐 Deployment (Render + Cloudflare Pages)

### Backend (Render)
- Deploy the `server/` folder as a web service on Render.
- Set environment variables in Render dashboard:
  - `MONGO_URI` (MongoDB Atlas connection string)
  - `JWT_SECRET` (your secret)
  - `CLIENT_ORIGIN` (comma-separated, e.g. `https://streamvalet.pages.dev,http://localhost:5173`)
  - `UPLOADS_DIR` and `THUMBNAILS_DIR` (default: `uploads`, `thumbnails`)
- **Persistent Storage:** Enable Persistent Disk on Render for uploads and thumbnails, or use a cloud storage service for production reliability.
- The backend serves `/uploads` and `/thumbnails` as static files.

### Frontend (Cloudflare Pages)
- Deploy the `client/` folder to Cloudflare Pages.
- Set environment variable `VITE_API_URL` to your Render backend URL (e.g. `https://your-backend.onrender.com`).
- All API, video, and thumbnail requests are routed to the backend using this URL.

### CORS & Static Files
- CORS is restricted to origins in `CLIENT_ORIGIN`.
- Thumbnails and video streams must use the full backend URL in production.

### Local Development
- Copy `server/.env.example` to `server/.env` and set variables as above.
- Frontend proxies `/api`, `/uploads`, `/thumbnails` to backend in dev.

### Known Limitations
- **Uploads and thumbnails are not persistent on free Render plans.** Use Persistent Disk or cloud storage for production.
- If thumbnails or videos do not load, check backend logs and ensure static file serving is working and URLs are correct.
