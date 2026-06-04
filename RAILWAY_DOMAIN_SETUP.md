# 🌐 Connect Your Custom Domain to Railway

Your app is already deployed at: `https://mkulimaseedling-production.up.railway.app`

## Step 1: Add Domain in Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Open your project: `mkulimaseedling-production`
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain (e.g., `mkulimaseedlings.co.ke`)
6. Click **Add**

## Step 2: Configure DNS Records

In your domain registrar's DNS settings, add these records:

### For Root Domain (example.com)
- **Type**: A
- **Name**: @
- **Value**: 76.76.21.21 (Railway's IP)

### For WWW Subdomain (www.example.com)
- **Type**: CNAME
- **Name**: www
- **Value**: cname.railway.app

### For Custom Subdomain (app.example.com)
- **Type**: CNAME
- **Name**: app (or your preferred subdomain)
- **Value**: cname.railway.app

## Step 3: Update mku.html (Optional)

If you want to update the canonical URLs in your HTML, replace:
```html
<link rel="canonical" href="https://mkulimaseedling-production.up.railway.app/">
```

With your custom domain:
```html
<link rel="canonical" href="https://yourdomain.com/">
```

## Step 4: Wait for DNS Propagation

DNS changes can take:
- **Instant** to a few minutes
- Up to 48 hours (rare)

## Step 5: Test Your Domain

Visit `https://yourdomain.com` to verify it's working.

## SSL Certificate

Railway automatically provisions SSL certificates for your custom domain. No manual setup required.