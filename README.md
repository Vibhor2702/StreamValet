# StreamValet

Production-grade B2B video management platform for multi-tenant teams.

## ⚡ Quick Start (under 60s)
1) `docker-compose up -d mongo`
2) `npm run install-all` (from repo root)
3) `npm run dev` (from repo root)
4) Open http://localhost:5173 and click a Quick Login button (Admin/Editor/Viewer).

### One-click smoke
```
cd server
npm run smoke
```
This logs in as admin, lists videos, and fetches comments to confirm the stack is healthy.

## 🔐 Security & Access
- Seeded users (idempotent on boot):
  - Admin: admin@pulsegen.io / admin123
  - Editor: editor@pulsegen.io / editor123
  - Viewer: viewer@pulsegen.io / viewer123
- Public registration is disabled. Admins provision via `POST /api/v1/users` and adjust roles with `PATCH /api/v1/users/:id/role`.
- Auth endpoints are rate-limited (5 req/hour); CORS and Socket.io restricted to `CLIENT_ORIGIN` (default http://localhost:5173).

## Architecture Decision Record (ADR)
- **Stack split (Express + Vite):** Independent deployability and faster frontend iteration.
- **Mongoose + strict schema:** Tenant isolation and state machine for video lifecycle.
- **Services layer:** FFmpeg, sensitivity rules, job queue, storage helpers keep routes thin.
- **Socket.io for progress:** Real-time status/processing updates without polling.
- **Multer disk storage (MVP):** Simple local storage; swappable for S3/Blob later.
- **Rule-based sensitivity:** Deterministic, pluggable for future models.
- **Retryable pipeline:** FAILED → PROCESSING allowed for manual retries.
- **RBAC middleware:** `auth` + `checkRole` enforce tenant/role constraints at the edge.

## Project Structure
- `server/` Express API, Socket.io, Mongo models, services, seed, and smoke scripts.
- `client/` Vite + React + Tailwind dashboard with Auth and Socket contexts.
- `docker-compose.yml` Local Mongo with auth + healthcheck.

## Testing
- Quick smoke: `npm run smoke` (server) logs in, lists videos/comments.
- Manual: upload mp4/mkv, observe pipeline states and heatmap; retry failed uploads.
- Admin metrics: `/api/v1/admin/metrics` as admin.

## Environment
- Copy `server/.env.example` to `server/.env`; set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, paths.
- Frontend proxies `/api`, `/uploads`, `/thumbnails` to backend in dev.
