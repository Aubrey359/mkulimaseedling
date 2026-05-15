# 🚀 Backend Deployment Guide — MKULIMA Seedlings Ltd

> **Project:** `mku.html` — Static HTML seedling e-commerce site  
> **Goal:** Deploy the frontend + add a persistent backend for orders, contact messages, and admin product management.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decision](#2-architecture-decision)
3. [Option A — Supabase (Recommended, Fastest)](#3-option-a--supabase-recommended-fastest)
4. [Option B — Node.js + Express + SQLite](#4-option-b--nodejs--express--sqlite)
5. [Option C — Firebase](#5-option-c--firebase)
6. [Frontend Deployment](#6-frontend-deployment)
7. [Environment Variables & Security](#7-environment-variables--security)
8. [Post-Deployment Checklist](#8-post-deployment-checklist)

---

## 1. Project Overview

| Feature | Current State | Needs Backend? |
|---|---|---|
| Product catalog | Hardcoded JS array | ✅ Yes — persistent storage |
| Admin panel (stock toggle) | In-memory only | ✅ Yes — persist changes |
| Contact form | `handleContactSubmit()` shows toast | ✅ Yes — save to DB / email |
| Order form | `handleOrderSubmit()` shows toast | ✅ Yes — save to DB / notify |
| Admin login | Hardcoded password check | ⚠️ Optional — secure auth |

**Current data flow (no backend):**

```
User → mku.html (JS in-memory) → Toast notification (lost on refresh)
```

**Target data flow (with backend):**

```
User → mku.html → Backend API → Database → Persistent storage
```

---

## 2. Architecture Decision

Choose one of the three options below based on your timeline and technical comfort:

| | Supabase | Node.js + Express | Firebase |
|---|---|---|---|
| **Setup time** | ~30 min | ~2–3 hrs | ~45 min |
| **Database** | PostgreSQL (managed) | SQLite / PostgreSQL | Firestore (NoSQL) |
| **Auth** | Built-in | Custom / JWT | Built-in |
| **Hosting** | Separate (Netlify/Vercel) | Same server | Separate |
| **Cost** | Free tier generous | Free (self-hosted) | Free tier generous |
| **Best for** | Quick launch, SQL familiarity | Full control, learning | Real-time, Google ecosystem |

---

## 3. Option A — Supabase (Recommended, Fastest)

Supabase gives you a **PostgreSQL database + REST API + Auth** in minutes. No backend code to write.

### Step 1 — Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** → Sign up (free)
2. Click **New Project**
3. Name: `mkulima-seedlings`
4. Choose a strong **Database Password** — save it
5. Wait ~2 minutes for provisioning

### Step 2 — Create Database Tables

Open the Supabase dashboard → **SQL Editor** → **New Query** → paste and run:

```sql
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price       INTEGER NOT NULL,
  unit        TEXT DEFAULT 'seedling',
  icon        TEXT DEFAULT 'fa-seedling',
  description TEXT,
  in_stock    BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER REFERENCES products(id),
  product_name    TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  quantity        INTEGER NOT NULL,
  delivery        TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contacts (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  interest    TEXT,
  message     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Seed initial products
INSERT INTO products (name, category, price, unit, icon, description, in_stock) VALUES
  ('Maize (Hybrid)',        'grain',      5,  'seedling', 'fa-corn',       'High-yield hybrid maize. Drought tolerant.', true),
  ('Tomato (Rio Grande)',   'vegetable',   8,  'seedling', 'fa-apple-whole','Classic processing tomato. Heavy producer.', true),
  ('Cabbage (Sukuma)',      'vegetable',   6,  'seedling', 'fa-leaf',       'Tender, fast-maturing cabbage variety.', true),
  ('Kale (Sukuma Wiki)',    'vegetable',   5,  'seedling', 'fa-leaf',       'Popular Kenyan kale. High yield.', true),
  ('Mango (Apple)',         'fruit',       80, 'seedling', 'fa-tree',       'Sweet dwarf mango. Fruits in 2–3 years.', true),
  ('Avocado (Hass)',        'fruit',       120,'seedling', 'fa-tree',       'Premium Hass avocado. High market value.', true),
  ('Passion (Purple)',      'fruit',       30, 'seedling', 'fa-flower',     'Sweet purple passion. Vigorous climber.', true),
  ('Coffee (Arabica)',      'cash_crop',   25, 'seedling', 'fa-mug-hot',    'High-quality Arabica coffee seedlings.', true),
  ('Tea',                   'cash_crop',   15, 'seedling', 'fa-mug-hot',    'Selected tea clones. High yield.', true),
  ('Sugarcane',             'cash_crop',   10, 'seedling', 'fa-cane',       'High-sucrose sugarcane. Fast growing.', true),
  ('Napier Grass',          'fodder',      3,  'seedling', 'fa-grass',      'Improved Napier. Excellent for dairy.', true),
  ('Banana (Giant Cavendish)','fruit',     20, 'sucker',   'fa-tree',       'Large bunch banana. Reliable producer.', true),
  ('Orange (Washington)',   'fruit',       60, 'seedling', 'fa-tree',       'Juicy navel orange. Disease resistant.', true),
  ('Lemon',                 'fruit',       50, 'seedling', 'fa-tree',       'Dwarf Meyer lemon. Year-round fruiting.', true),
  ('Papaya (Mountain)',     'fruit',       15, 'seedling', 'fa-tree',       'Sweet mountain papaya. Early fruiting.', true),
  ('Watermelon',            'vegetable',   8,  'seedling', 'fa-apple-whole','Sweet red flesh. Large fruits.', true),
  ('Spinach',               'vegetable',   5,  'seedling', 'fa-leaf',       'Tender-leaf spinach. Fast growing.', true),
  ('Onion (Red Creole)',    'vegetable',   4,  'seedling', 'fa-onion',      'Red onion. Pungent, good storage.', true),
  ('Jacaranda',             'ornamental',  200,'seedling', 'fa-flower',     'Purple flowering tree. Landscaping.', true),
  ('Bamboo',                'tree',        150,'seedling', 'fa-tree',       'Giant bamboo. Fast growing, versatile.', false)
ON CONFLICT (id) DO NOTHING;
```

### Step 3 — Get Your API Keys

In Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL** → `https://xxxx.supabase.co`
- Copy **anon public** key

### Step 4 — Update `mku.html` to Use Supabase

Add this `<script>` tag in the `<head>` of `mku.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Then replace the inline `<script>` block at the bottom of the file with the updated version below.

#### Replace the product data section:

```javascript
// --- Supabase Setup ---
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- State ---
let products = [];
let selectedProduct = null;
let isAdmin = false;
const ADMIN_PASSWORD = 'Mkulima2024!'; // Change this!

// --- Load products from Supabase on page load ---
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  products = data;
  renderProducts();
  renderAdminProducts();
}
```

#### Replace `handleContactSubmit`:

```javascript
async function handleContactSubmit(e) {
  e.preventDefault();
  const name    = e.target.querySelector('input[type="text"]').value;
  const phone   = e.target.querySelectorAll('input[type="text"]')[1].value;
  const interest= e.target.querySelector('select').value;
  const message = e.target.querySelector('textarea').value;

  const { error } = await supabase.from('contacts').insert([{ name, phone, interest, message }]);
  if (error) { console.error(error); showToast('Error sending message. Try again.'); return; }

  e.target.reset();
  showToast('Message sent! We will contact you shortly.');
}
```

#### Replace `handleOrderSubmit`:

```javascript
async function handleOrderSubmit(e) {
  e.preventDefault();
  if (!selectedProduct) return;

  const { error } = await supabase.from('orders').insert([{
    product_id:   selectedProduct.id,
    product_name: selectedProduct.name,
    customer_name: e.target.querySelectorAll('input[type="text"]')[0].value,
    phone:        e.target.querySelectorAll('input[type="text"]')[1].value,
    quantity:     parseInt(e.target.querySelectorAll('input[type="number"]')[0].value),
    delivery:     e.target.querySelector('input[type="text"]').value,
  }]);

  if (error) { console.error(error); showToast('Error submitting order. Try again.'); return; }

  e.target.reset();
  closeOrderModal();
  showToast('Order request submitted! We will contact you shortly.');
}
```

#### Replace `toggleStock` in admin:

```javascript
async function toggleStock(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const { error } = await supabase.from('products').update({ in_stock: !product.in_stock }).eq('id', id);
  if (error) { console.error(error); return; }
  await loadProducts();
  showToast(`${product.name} is now ${!product.inStock ? 'available' : 'out of stock'}`);
}
```

#### Call `loadProducts()` on page load:

Add at the very end of the `<script>` block:

```javascript
loadProducts();
```

### Step 5 — Enable Row Level Security (RLS)

In Supabase → **Table Editor** → select each table → **Policies** → **New Policy**:

```sql
-- Allow public read access to products
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Allow public insert on orders
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);

-- Allow public insert on contacts
CREATE POLICY "Public insert contacts" ON contacts FOR INSERT WITH CHECK (true);
```

> ⚠️ For production, add an `admin` role and restrict write access to products to authenticated admins only.

### Step 6 — Set Up Email Notifications (Optional)

Use **[Supabase Edge Functions](https://supabase.com/docs/guides/functions)** or a service like **[Resend](https://resend.com)** to send email alerts when a new order or contact message is received.

Example trigger in Supabase SQL Editor:

```sql
-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Notify on new order (call a webhook)
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-webhook-url.com/order-alert',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object('order_id', NEW.id, 'product', NEW.product_name, 'customer', NEW.customer_name)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_new_order();
```

---

## 4. Option B — Node.js + Express + SQLite

Use this if you want **full control** over the backend code.

### Step 1 — Project Setup

```bash
# In your project folder
npm init -y
npm install express cors better-sqlite3 dotenv
npm install --save-dev nodemon
```

### Step 2 — Create `server.js`

```javascript
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const Database   = require('better-sqlite3');
const path       = require('path');

const app    = express();
const DB_PATH = path.join(__dirname, 'mkulima.db');
const db     = new Database(DB_PATH);

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve mku.html

// --- Init DB ---
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, category TEXT NOT NULL,
    price INTEGER NOT NULL, unit TEXT DEFAULT 'seedling',
    icon TEXT DEFAULT 'fa-seedling', description TEXT,
    in_stock INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER, product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL, phone TEXT NOT NULL,
    quantity INTEGER NOT NULL, delivery TEXT NOT NULL,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, phone TEXT NOT NULL,
    interest TEXT, message TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- Seed products if empty ---
const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) {
  const insert = db.prepare(`INSERT INTO products (name,category,price,unit,icon,description,in_stock) VALUES (?,?,?,?,?,?,?)`);
  const seeds = [
    ['Maize (Hybrid)','grain',5,'seedling','fa-corn','High-yield hybrid maize. Drought tolerant.',1],
    ['Tomato (Rio Grande)','vegetable',8,'seedling','fa-apple-whole','Classic processing tomato. Heavy producer.',1],
    ['Cabbage (Sukuma)','vegetable',6,'seedling','fa-leaf','Tender, fast-maturing cabbage variety.',1],
    ['Kale (Sukuma Wiki)','vegetable',5,'seedling','fa-leaf','Popular Kenyan kale. High yield.',1],
    ['Mango (Apple)','fruit',80,'seedling','fa-tree','Sweet dwarf mango. Fruits in 2–3 years.',1],
    ['Avocado (Hass)','fruit',120,'seedling','fa-tree','Premium Hass avocado. High market value.',1],
    ['Passion (Purple)','fruit',30,'seedling','fa-flower','Sweet purple passion. Vigorous climber.',1],
    ['Coffee (Arabica)','cash_crop',25,'seedling','fa-mug-hot','High-quality Arabica coffee seedlings.',1],
    ['Tea','cash_crop',15,'seedling','fa-mug-hot','Selected tea clones. High yield.',1],
    ['Sugarcane','cash_crop',10,'seedling','fa-cane','High-sucrose sugarcane. Fast growing.',1],
    ['Napier Grass','fodder',3,'seedling','fa-grass','Improved Napier. Excellent for dairy.',1],
    ['Banana (Giant Cavendish)','fruit',20,'sucker','fa-tree','Large bunch banana. Reliable producer.',1],
    ['Orange (Washington)','fruit',60,'seedling','fa-tree','Juicy navel orange. Disease resistant.',1],
    ['Lemon','fruit',50,'seedling','fa-tree','Dwarf Meyer lemon. Year-round fruiting.',1],
    ['Papaya (Mountain)','fruit',15,'seedling','fa-tree','Sweet mountain papaya. Early fruiting.',1],
    ['Watermelon','vegetable',8,'seedling','fa-apple-whole','Sweet red flesh. Large fruits.',1],
    ['Spinach','vegetable',5,'seedling','fa-leaf','Tender-leaf spinach. Fast growing.',1],
    ['Onion (Red Creole)','vegetable',4,'seedling','fa-onion','Red onion. Pungent, good storage.',1],
    ['Jacaranda','ornamental',200,'seedling','fa-flower','Purple flowering tree. Landscaping.',1],
    ['Bamboo','tree',150,'seedling','fa-tree','Giant bamboo. Fast growing, versatile.',0],
  ];
  seeds.forEach(s => insert.run(...s));
}

// --- API Routes ---

// GET all products
app.get('/api/products', (_, res) => {
  const rows = db.prepare('SELECT * FROM products').all();
  res.json(rows.map(r => ({ ...r, inStock: !!r.in_stock })));
});

// PUT toggle stock
app.put('/api/products/:id/stock', (req, res) => {
  const { in_stock } = req.body;
  db.prepare('UPDATE products SET in_stock = ? WHERE id = ?').run(in_stock ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// POST new order
app.post('/api/orders', (req, res) => {
  const { product_id, product_name, customer_name, phone, quantity, delivery } = req.body;
  const info = db.prepare('INSERT INTO orders (product_id,product_name,customer_name,phone,quantity,delivery) VALUES (?,?,?,?,?,?)')
    .run(product_id, product_name, customer_name, phone, quantity, delivery);
  res.json({ success: true, id: info.lastInsertRowid });
});

// POST contact message
app.post('/api/contacts', (req, res) => {
  const { name, phone, interest, message } = req.body;
  db.prepare('INSERT INTO contacts (name,phone,interest,message) VALUES (?,?,?,?)').run(name, phone, interest, message);
  res.json({ success: true });
});

// GET all orders (admin)
app.get('/api/admin/orders', (req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all());
});

// GET all contacts (admin)
app.get('/api/admin/contacts', (req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all());
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌱 MKULIMA server running on port ${PORT}`));
```

### Step 3 — Create `.env`

```env
PORT=3000
ADMIN_PASSWORD=Mkulima2024!
```

### Step 4 — Update `mku.html` API Calls

Replace the inline `<script>` block with API calls:

```javascript
const API_BASE = ''; // Same origin when served by Express

async function loadProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  products = await res.json();
  renderProducts();
  renderAdminProducts();
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const [name, phone] = e.target.querySelectorAll('input[type="text"]');
  const interest = e.target.querySelector('select').value;
  const message  = e.target.querySelector('textarea').value;
  await fetch(`${API_BASE}/api/contacts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.value, phone: phone.value, interest, message })
  });
  e.target.reset();
  showToast('Message sent! We will contact you shortly.');
}

async function handleOrderSubmit(e) {
  e.preventDefault();
  if (!selectedProduct) return;
  const [name, phone] = e.target.querySelectorAll('input[type="text"]');
  const [qty] = e.target.querySelectorAll('input[type="number"]');
  const delivery = e.target.querySelector('input[type="text"]').value;
  await fetch(`${API_BASE}/api/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: selectedProduct.id, product_name: selectedProduct.name,
      customer_name: name.value, phone: phone.value,
      quantity: parseInt(qty.value), delivery
    })
  });
  e.target.reset(); closeOrderModal();
  showToast('Order request submitted! We will contact you shortly.');
}

async function toggleStock(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  await fetch(`${API_BASE}/api/products/${id}/stock`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ in_stock: !product.inStock })
  });
  await loadProducts();
  showToast(`${product.name} is now ${!product.inStock ? 'available' : 'out of stock'}`);
}
```

### Step 5 — Deploy the Server

#### Option A — Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

Add environment variables in the Railway dashboard:
- `ADMIN_PASSWORD` = your admin password
- `PORT` = auto-set by Railway

#### Option B — Render

1. Push `server.js`, `package.json`, and `mku.html` to GitHub
2. Go to **[render.com](https://render.com)** → **New** → **Web Service**
3. Connect your repo → Build command: `npm install` → Start command: `node server.js`
4. Add environment variable `ADMIN_PASSWORD`

#### Option C — DigitalOcean App Platform / Fly.io / Heroku

All follow the same pattern: push to Git → connect repo → set start command → deploy.

---

## 5. Option C — Firebase

Best if you want **real-time updates** and are already in the Google ecosystem.

### Step 1 — Create Firebase Project

1. Go to **[firebase.google.com](https://firebase.google.com)** → **Add project**
2. Name: `mkulima-seedlings`
3. Disable Google Analytics (not needed)

### Step 2 — Enable Firestore

1. In Firebase Console → **Build** → **Firestore Database** → **Create Database**
2. Start in **Test Mode** (open access — secure later)
3. Create collections: `products`, `orders`, `contacts`

### Step 3 — Add Firebase SDK to `mku.html`

```html
<script src="https://www.gstatic.com/firebasejs/10.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.x/firebase-firestore-compat.js"></script>
```

```javascript
// Firebase config (from Project Settings → General → Your apps)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "mkulima-seedlings.firebaseapp.com",
  projectId: "mkulima-seedlings",
  storageBucket: "mkulima-seedlings.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

### Step 4 — Replace Data Functions

```javascript
// Load products
async function loadProducts() {
  const snap = await db.collection('products').get();
  products = snap.docs.map(d => ({ id: d.id, ...d.data(), inStock: d.data().in_stock ?? d.data().inStock }));
  renderProducts(); renderAdminProducts();
}

// Save order
async function handleOrderSubmit(e) {
  e.preventDefault();
  await db.collection('orders').add({ /* ...fields... */ });
  e.target.reset(); closeOrderModal();
  showToast('Order submitted!');
}

// Save contact
async function handleContactSubmit(e) {
  e.preventDefault();
  await db.collection('contacts').add({ /* ...fields... */ });
  e.target.reset();
  showToast('Message sent!');
}

// Toggle stock
async function toggleStock(id) {
  const doc = await db.collection('products').doc(id).get();
  await db.collection('products').doc(id).update({ in_stock: !doc.data().in_stock });
  await loadProducts();
}
```

### Step 5 — Deploy Frontend to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select: mkulima-seedlings project → use current folder → configure as single-page app: No
firebase deploy
```

---

## 6. Frontend Deployment

The `mku.html` file is a **single static file** — deploy it anywhere.

### Netlify (Drag & Drop — Easiest)

1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag the folder containing `mku.html` onto the page
3. Done — you get a live URL instantly

> **For API proxy** (if using Supabase or external backend): create a `netlify.toml`:
> ```toml
> [[redirects]]
>   from = "/api/*"
>   to = "https://your-backend-url.com/api/:splat"
>   status = 200
>   force = true
> ```

### Vercel

```bash
npm install -g vercel
vercel
```

### GitHub Pages

1. Push `mku.html` to a GitHub repo
2. Repo → **Settings** → **Pages** → Source: `main` branch → root
3. Site live at `https://yourusername.github.io/repo-name/`

### Cloudflare Pages

1. Go to **[pages.cloudflare.com](https://pages.cloudflare.com)**
2. Connect GitHub repo → Build command: leave empty → Output directory: `.`
3. Deploy

---

## 7. Environment Variables & Security

### Admin Password

**Never hardcode passwords in production HTML.** Use one of these approaches:

#### Approach A — Environment Variable (Node.js backend)
```javascript
// server.js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
```

#### Approach B — Supabase Edge Function (server-side check)
```javascript
// Edge function validates password server-side, returns JWT
```

#### Approach C — Firebase Auth
```javascript
// Use Firebase Authentication with email/password
// Admin users get a custom claim: admin: true
```

### CORS

If your frontend and backend are on different domains, enable CORS:

```javascript
// Express
const cors = require('cors');
app.use(cors({ origin: 'https://your-frontend-domain.com' }));
```

### Rate Limiting

Prevent abuse on public forms:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

## 8. Post-Deployment Checklist

- [ ] **Products load** from the database on page load
- [ ] **Admin login** works with the new password
- [ ] **Toggle stock** persists after page refresh
- [ ] **Contact form** submissions are saved to the database
- [ ] **Order form** submissions are saved to the database
- [ ] **Email notifications** are configured for new orders
- [ ] **SSL/HTTPS** is enabled (all recommended hosts do this automatically)
- [ ] **Admin password** is not visible in client-side source code
- [ ] **CORS** is configured correctly
- [ ] **Database backups** are enabled (Supabase/Railway/Render handle this)
- [ ] **Custom domain** is pointed to the deployed site

---

## 📞 Recommended Stack Summary

| Layer | Recommended Tool | Why |
|---|---|---|
| **Frontend hosting** | Netlify / Vercel | Free, instant deploy, HTTPS |
| **Database + API** | Supabase | PostgreSQL, REST API, Auth — all in one |
| **Email alerts** | Resend / SendGrid | Reliable transactional email |
| **Admin dashboard** | Supabase Table Editor | View/edit orders/contacts without code |
| **Custom domain** | Namecheap / Cloudflare Registrar | ~$10/year for `.co.ke` |

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---|---|
| Products don't load | Check browser console for CORS / API errors |
| Orders not saving | Verify Supabase RLS policies allow INSERT |
| Admin toggle has no effect | Confirm `in_stock` column name matches in DB |
| Email not received | Check Resend/SendGrid logs; verify webhook URL |
| Site shows blank | Ensure `loadProducts()` is called on page load |
