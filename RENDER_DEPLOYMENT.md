# 🚀 Render Deployment Guide — MKULIMA Seedlings Ltd

## After Buying Your Domain - Complete Setup Guide

### Step 1: Code Already Pushed to GitHub
Your code is now at: https://github.com/Aubrey359/mkulimaseedling

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `Aubrey359/mkulimaseedling`
3. Settings:
   - **Name**: mkulima-seedlings
   - **Region**: Oregon (or closest)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### Step 4: Add PostgreSQL Database
1. Click "New +" → "Database"
2. Settings:
   - **Name**: mkulima-db
   - **Database**: PostgreSQL
   - **Plan**: Free

### Step 5: Set Environment Variables
In your Web Service → "Environment":
- `DATABASE_URL` = (auto-set from database)
- `ADMIN_PASSWORD` = your_secure_password
- `NODE_ENV` = production

### Step 6: Configure DNS
In your domain registrar's DNS settings:
- **CNAME Record**:
  - Name: `www`
  - Value: `your-app.onrender.com`
- **ALIAS/ANAME Record** (for root domain):
  - Name: `@`
  - Value: `your-app.onrender.com`

### Step 7: Update Frontend API URL
In `mku.html`, update the API base URL:
```javascript
const API_BASE = 'https://your-app.onrender.com';
```

### Step 8: Test Your Site
Visit `https://yourdomain.com` and test all features.

## Quick Commands Reference
```bash
# View logs
# In Render dashboard → Logs tab

# Manual database access
# In Render dashboard → Database → Connect