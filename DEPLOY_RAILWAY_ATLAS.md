# Payment Manager Deployment (Railway + MongoDB Atlas)

This setup uses:
- Backend: Railway (`/server`)
- Database: MongoDB Atlas
- Frontend: Vercel (`/client`) or Railway static service

## 1. Prepare repo

1. Push current branch to GitHub.
2. Ensure these files exist:
- `server/.env.example`
- `client/.env.example`

## 2. Create MongoDB Atlas database

1. Create a cluster in Atlas.
2. Create a DB user (`username/password`).
3. In Network Access, allow Railway egress (for fast setup: `0.0.0.0/0`, then tighten later).
4. Copy connection string:
`mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`

## 3. Deploy backend to Railway

1. Railway dashboard -> New Project -> Deploy from GitHub.
2. Select repo and set **Root Directory** to `server`.
3. In service settings:
- Build Command: `npm run build`
- Start Command: `npm run start`
4. Add environment variables from `server/.env.example`:
- `MONGO_URI` (Atlas URL)
- `CORS_ORIGIN` (your frontend URL)
- `PORT` (leave empty or Railway default)
- Add processor keys only if needed (`NMI_*`, `VPOS_*`, `ONRAMPER_*`)
5. Deploy and verify:
- `GET /health` returns `{ ok: true }`
- `GET /docs` opens Swagger

## 4. Deploy frontend to Vercel (recommended)

1. Vercel dashboard -> New Project -> import same repo.
2. Set **Root Directory** to `client`.
3. Build settings:
- Build Command: `npm run build`
- Output Directory: `dist`
4. Add env:
- `VITE_API_BASE_URL=https://<your-railway-domain>`
5. Deploy.

## 5. Connect frontend/backend

1. Update Railway backend env:
- `CORS_ORIGIN=https://<your-vercel-domain>`
2. Redeploy backend.
3. Test login and master data forms.

## 6. Production checklist

- Do not keep real secrets in repo (`.env` files local only).
- Rotate test keys before production.
- Enable Atlas backups and alerts.
- Restrict Atlas network allow-list after first successful deployment.
- Add Railway health check path: `/health`.

## Local quick run

Backend:
```bash
cd server
npm install
npm run dev
```

Frontend:
```bash
cd client
npm install
npm run dev
```

