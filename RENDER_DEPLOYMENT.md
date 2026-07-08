# 🚀 Render Deployment Guide — MKULIMA Seedlings Ltd

Deploys the Node/Express app to Render's **free** tier, backed by your existing
**MongoDB Atlas** database. No Railway, no PostgreSQL.

Repo: https://github.com/Aubrey359/mkulimaseedling

---

## Option A — One-click Blueprint (recommended)

The repo includes `render.yaml`, so Render can configure everything for you.

1. Go to [render.com](https://render.com) → sign up / log in **with GitHub**.
2. **New +** → **Blueprint**.
3. Select the repo **`Aubrey359/mkulimaseedling`** → Render reads `render.yaml`.
4. Render will prompt for the 4 secret values (they are NOT stored in git):
   - **`MONGODB_URL`** — your Atlas string:
     `mongodb+srv://<user>:<pass>@cluster0.85uxmuq.mongodb.net/mkulima?retryWrites=true&w=majority&appName=Cluster0`
   - **`SESSION_SECRET`** — the random value from your `.env`
   - **`ADMIN_PASSWORD`** — e.g. `mkulima2026!`
   - **`EMAIL_PASS`** — your PrivateEmail password (rotate it first — see note)
5. Click **Apply** → Render builds and deploys. You get a URL like
   `https://mkulima-seedlings.onrender.com`.

---

## Option B — Manual Web Service

1. **New +** → **Web Service** → connect `Aubrey359/mkulimaseedling`.
2. Settings:
   - **Runtime**: Node
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
3. **Environment** tab → add these variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URL` | your Atlas connection string |
   | `SESSION_SECRET` | your random secret |
   | `ADMIN_PASSWORD` | your admin password |
   | `EMAIL_HOST` | `mail.privateemail.com` |
   | `EMAIL_PORT` | `465` |
   | `EMAIL_SECURE` | `true` |
   | `EMAIL_USER` | `info@mkulimaseedlings.com` |
   | `EMAIL_PASS` | your email password |
   | `EMAIL_TO` | `info@mkulimaseedlings.com` |

4. **Create Web Service** → wait for the build to finish.

---

## Verify

- Open `https://<your-app>.onrender.com/` → storefront loads.
- Open `/admin` → log in with `ADMIN_PASSWORD` → dashboard shows products.
- `/api/products` → returns JSON (81 products).

## Custom domain (mkulimaseedlings.com)

1. Render → your service → **Settings → Custom Domains** → add
   `mkulimaseedlings.com` and `www.mkulimaseedlings.com`.
2. At your domain registrar (Namecheap), set the DNS records Render shows you
   (a `CNAME` for `www` → `<app>.onrender.com`, and Render's instructions for the
   root domain). SSL is issued automatically.

## Notes & gotchas

- **Atlas Network Access**: allow `0.0.0.0/0` (Atlas → Network Access) so Render's
  changing IPs can connect. The user/password still protects the DB.
- **Free tier sleeps** after ~15 min idle; the first request then takes ~30–50s to
  wake. Fine for a small store.
- **Uploads are ephemeral** on the free plan: files saved to `./uploads` (seedling
  images) are wiped on each redeploy/restart. For permanent image storage use a
  service like Cloudinary or an S3 bucket later.
- **No code changes needed** — the frontend uses relative API paths, and the server
  already reads `process.env.PORT`, `MONGODB_URL`, etc.

## Security reminder

`EMAIL_PASS` and the old Mongo password appear in this repo's **git history**.
Rotate the email password in PrivateEmail before/after deploying, and set the new
value in Render. The Mongo password no longer matters (you're on Atlas now).
