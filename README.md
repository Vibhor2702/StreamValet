
# StreamValet

**Enterprise Video Collaboration Platform with AI-Powered Content Intelligence**

Welcome, Evaluator! 👋

Thank you for taking the time to review StreamValet—a production-grade B2B video management platform built for multi-tenant teams. This project showcases:

- ✅ **Secure Video Upload & Streaming** with HTTP range requests
- ✅ **Automated Sensitivity Analysis** for content moderation
- ✅ **Real-Time Processing Updates** via Socket.io
- ✅ **Role-Based Access Control (RBAC)** with multi-tenant isolation
- ✅ **Professional Analytics Dashboard** with live metrics
- ✅ **Responsive Dark Mode UI** built with React + Tailwind

## 🚀 Quick Demo Access
> **Note:** This application uses a Render free-tier backend, which may occasionally cold start. If the login page feels slow, please wake the backend by visiting:
>
> https://streamvalet.onrender.com/health

1. Visit the deployed app: [https://streamvalet.pages.dev](https://streamvalet.pages.dev)
2. Use the one-click login buttons (Admin, Editor, Viewer) for instant access to demo accounts:
  - **Admin:** `admin@pulsegen.io` / `admin123` - Full system access + analytics
  - **Editor:** `editor@pulsegen.io` / `editor123` - Upload & manage own videos
  - **Viewer:** `viewer@pulsegen.io` / `viewer123` - Read-only access

You can upload, process, and stream videos, view analytics, and explore all features without any registration.

---

## 🎯 Core Features

### 1. Video Management
- **Upload Interface:** Drag-and-drop with real-time progress tracking
- **Secure Storage:** Multer-based file handling with validation
- **Adaptive Streaming:** HTTP range requests for smooth playback
- **Format Support:** MP4 and MKV files up to 2GB

### 2. Content Intelligence (Sensitivity Analysis)
- **Automated Screening:** Every uploaded video is analyzed for policy compliance
- **Status Classification:** Videos marked as SAFE or FLAGGED
- **Segment Detection:** Identifies specific timestamps of sensitive content
- **Visual Warnings:** Clear alerts displayed for flagged material
- **Confidence Scoring:** AI-powered analysis with confidence metrics

### 3. Real-Time Updates
- **Socket.io Integration:** Live upload progress and processing status
- **Pipeline Tracking:** PENDING → PROCESSING → ANALYZED → READY/FLAGGED
- **Instant Notifications:** Toast messages for completed uploads
- **Live Analytics:** Dashboard metrics update in real-time

### 4. Role-Based Access Control (RBAC)
- **Multi-Tenant Architecture:** Complete data isolation per tenant
- **Three Role Levels:**
  - **Viewer:** Watch videos, add comments (read-only)
  - **Editor:** Upload, manage own content, retry failed uploads
  - **Admin:** Full access + analytics dashboard + user management
- **JWT Authentication:** Secure token-based auth with expiration
- **Permission Enforcement:** UI elements hidden based on role

### 5. Analytics Dashboard (Admin Only)
- **Storage Hub:** Visual progress bar showing usage vs 500MB limit
- **Content Health:** Safety score with safe/flagged breakdown
- **Total Watch Time:** Combined duration of all videos
- **Video Library:** Total count with status indicators

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
