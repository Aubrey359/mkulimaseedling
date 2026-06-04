# 🌐 Connecting Railway App to Namecheap Domain

This guide explains how to point your Namecheap domain to your Railway-deployed application.

---

## 📋 Prerequisites

- ✅ Railway app already deployed (see `BACKEND_DEPLOYMENT_GUIDE.md`)
- ✅ Domain purchased from Namecheap: **mkulimaseedlings.com**
- ✅ Railway project URL (e.g., `https://your-app.up.railway.app`)

---

## 🔧 Step 1: Get Your Railway Domain

1. Go to [railway.app](https://railway.app) and open your project
2. Click on your deployed service
3. In the **Settings** tab, find the **Domains** section
4. You'll see your Railway domain: `https://your-app.up.railway.app`
5. Copy this URL for reference

---

## 🌍 Step 2: Configure DNS in Namecheap

### For mkulimaseedlings.com - DNS Configuration

1. **Log in** to your [Namecheap account](https://namecheap.com)
2. Go to **Domain List** → **Manage** next to `mkulimaseedlings.com`
3. Navigate to the **Advanced DNS** tab
4. Add the following records:

#### Option A: Using CNAME for www subdomain (Recommended)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `your-app.up.railway.app` | Automatic |

#### Option B: Using ALIAS/ANAME for root domain (if available)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| ALIAS or ANAME | `@` | `your-app.up.railway.app` | Automatic |

> **Note:** If ALIAS/ANAME is not available, use the CNAME for `www` and set up a redirect from the root domain.

#### Option C: Using URL Redirect for root domain

If you can't use ALIAS/ANAME, set up a redirect:

| Type | Host | Value |
|------|------|-------|
| URL Redirect | `@` | `https://www.mkulimaseedlings.com` |

---

## ⚙️ Step 3: Add Custom Domain in Railway

1. In your Railway project, go to **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter your domain: `mkulimaseedlings.com` (and/or `www.mkulimaseedlings.com`)
4. Railway will provide DNS verification records if needed

### Add Verification Records in Namecheap (if required)

Railway may require verification. Add these records in Namecheap's **Advanced DNS**:

| Type | Host | Value |
|------|------|-------|
| TXT | `@` | `verification-string-from-railway` |

---

## 🔁 Step 4: Set Up Redirects (Optional)

To redirect `mkulimaseedlings.com` to `www.mkulimaseedlings.com`:

1. In Namecheap, go to **Domain List** → **Manage**
2. Find **Redirect Domain** section
3. Enable redirect from `mkulimaseedlings.com` to `https://www.mkulimaseedlings.com`

---

## 🔒 Step 5: Enable HTTPS

Railway automatically provisions SSL certificates for custom domains:

1. After DNS propagation (5-60 minutes), Railway will show **HTTPS Enabled**
2. If not automatic, click **Generate Certificate** in Railway domain settings

---

## 🛠️ Step 6: Update Your Application

Your `server.js` already has the correct configuration for custom domains. The app uses relative paths, so no changes needed.

### If you need to update any hardcoded URLs:

In `mku.html` or frontend code, ensure you're using relative paths:

```javascript
// Keep this for same-origin requests (recommended)
const API_BASE = '';

// Or use your custom domain
const API_BASE = 'https://www.mkulimaseedlings.com';
```

---

## 🧪 Step 7: Verify the Setup

1. **Check DNS propagation:**
   ```bash
   nslookup www.mkulimaseedlings.com
   # or
   dig www.mkulimaseedlings.com
   ```

2. **Test in browser:**
   - Visit `https://www.mkulimaseedlings.com`
   - Check that the site loads correctly
   - Verify all API calls work

3. **Check Railway logs:**
   - In Railway dashboard, view deployment logs
   - Look for any errors related to the domain

---

## 🚨 Troubleshooting

### DNS Not Propagating

- Wait up to 48 hours (usually 5-60 minutes)
- Double-check record values in Namecheap
- Clear browser cache and DNS cache:
  ```bash
  # Windows
  ipconfig /flushdns
  # macOS
  sudo dscacheutil -flushcache
  ```

### SSL Certificate Issues

- Ensure DNS is fully propagated
- In Railway, click **Regenerate Certificate**
- Check that domain is verified in Namecheap

### Mixed Content Warnings

- Ensure all resources use HTTPS
- Update any hardcoded `http://` URLs to `https://`

---

## 📝 Summary Checklist

- [ ] Get Railway app URL
- [ ] Add CNAME record for `www.mkulimaseedlings.com` in Namecheap
- [ ] Add custom domain in Railway dashboard
- [ ] Set up redirect from root domain to www (optional)
- [ ] Wait for DNS propagation
- [ ] Verify HTTPS is enabled
- [ ] Test the live site at `https://www.mkulimaseedlings.com`

---

## 🔗 Useful Links

- [Railway Domains Documentation](https://docs.railway.app/guides/custom-domains)
- [Namecheap DNS Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9334/2237/how-to-set-up-dns-records-for-a-domain)
- [DNS Propagation Checker](https://dnschecker.org)