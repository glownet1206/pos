# Railway Deployment Guide

## Prerequisites
- Railway account: https://railway.app
- GitHub repo connected to Railway

---

## Step 1: Create Railway Project

1. Go to https://railway.app → New Project
2. Select **Deploy from GitHub repo**
3. Select your repository

---

## Step 2: Add PostgreSQL Database

1. In your Railway project → Click **+ New**
2. Select **Database → PostgreSQL**
3. Railway will auto-create a PostgreSQL instance
4. Click on the PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value

---

## Step 3: Configure Backend Service

In your Railway backend service → **Variables** tab, add:

```
DATABASE_URL=<paste from PostgreSQL service>
JWT_SECRET=your_strong_secret_key_here
NODE_ENV=production
PORT=5000
```

---

## Step 4: Build Settings

In Railway backend service → **Settings**:

- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

---

## Step 5: Frontend Build

In Railway frontend service (or serve via backend):

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`

The backend already serves the frontend `dist` folder via Express static files.

---

## Step 6: Deploy

Push to your GitHub main branch — Railway will auto-deploy.

---

## User Delete — Now Works Properly

With PostgreSQL, when admin deletes a user:
- All user data is deleted from the database via `DELETE WHERE user_id=`
- No file system dependency — works perfectly on Railway
- Data is permanently and instantly removed

---

## Local Development

1. Install PostgreSQL locally or use a free cloud DB (Neon, Supabase)
2. Create `.env` in `backend/` folder:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/posdb
   JWT_SECRET=tt_secret_key_2025
   NODE_ENV=development
   PORT=5000
   ```
3. Run: `cd backend && npm start`
