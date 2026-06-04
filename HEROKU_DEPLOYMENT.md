# 🚀 Heroku Deployment Guide — MKULIMA Seedlings Ltd

## After Buying Your Domain - Complete Setup Guide

### Step 1: Install Heroku CLI
Download from https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
heroku create your-app-name
```

### Step 4: Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 5: Set Environment Variables
```bash
heroku config:set ADMIN_PASSWORD=your_secure_password
heroku config:set NODE_ENV=production
```

### Step 6: Deploy Your Code
```bash
git add .
git commit -m "Ready for deployment"
git push heroku main
```

### Step 7: Configure DNS
In your domain registrar's DNS settings:
- **CNAME Record**: 
  - Name: `www`
  - Value: `your-app.herokuapp.com`
- **ALIAS/ANAME Record** (for root domain):
  - Name: `@`
  - Value: `your-app.herokuapp.com`

### Step 8: Update Frontend API URL
In `mku.html`, update the API base URL:
```javascript
const API_BASE = 'https://your-app.herokuapp.com';
```

### Step 9: Test Your Site
Visit `https://yourdomain.com` and test all features.

## Quick Commands Reference
```bash
heroku logs --tail          # View logs
heroku ps                   # Check dyno status
heroku open                 # Open your app
heroku run bash             # Access console
