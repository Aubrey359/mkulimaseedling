require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// PostgreSQL connection (Railway injects DATABASE_URL automatically)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// HTTPS redirect (production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize database tables + seed
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      price       INTEGER NOT NULL,
      unit        TEXT DEFAULT 'seedling',
      icon        TEXT DEFAULT 'fa-seedling',
      description TEXT,
      in_stock    BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS orders (
      id            SERIAL PRIMARY KEY,
      product_id    INTEGER,
      product_name  TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone         TEXT NOT NULL,
      quantity      INTEGER NOT NULL,
      delivery      TEXT NOT NULL,
      status        TEXT DEFAULT 'pending',
      created_at    TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      interest   TEXT,
      message    TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed products only if table is empty
  const { rows } = await pool.query('SELECT COUNT(*) AS c FROM products');
  if (parseInt(rows[0].c) === 0) {
    const seeds = [
      ['Maize (Hybrid)',           'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',       true],
      ['Tomato (Rio Grande)',       'vegetable',   8,  'seedling', 'fa-apple-whole', 'Classic processing tomato. Heavy producer.',        true],
      ['Cabbage (Sukuma)',          'vegetable',   6,  'seedling', 'fa-leaf',        'Tender, fast-maturing cabbage variety.',            true],
      ['Kale (Sukuma Wiki)',        'vegetable',   5,  'seedling', 'fa-leaf',        'Popular Kenyan kale. High yield.',                  true],
      ['Mango (Apple)',             'fruit',       80, 'seedling', 'fa-tree',        'Sweet dwarf mango. Fruits in 2-3 years.',           true],
      ['Avocado (Hass)',            'fruit',       120,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',          true],
      ['Passion (Purple)',          'fruit',       30, 'seedling', 'fa-flower',      'Sweet purple passion. Vigorous climber.',           true],
      ['Coffee (Arabica)',          'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',            true],
      ['Tea',                       'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                  true],
      ['Sugarcane',                 'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',             true],
      ['Napier Grass',              'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',             true],
      ['Banana (Giant Cavendish)',  'fruit',       20, 'sucker',   'fa-tree',        'Large bunch banana. Reliable producer.',            true],
      ['Orange (Washington)',       'fruit',       60, 'seedling', 'fa-tree',        'Juicy navel orange. Disease resistant.',            true],
      ['Lemon',                     'fruit',       50, 'seedling', 'fa-tree',        'Dwarf Meyer lemon. Year-round fruiting.',           true],
      ['Papaya (Mountain)',         'fruit',       15, 'seedling', 'fa-tree',        'Sweet mountain papaya. Early fruiting.',            true],
      ['Watermelon',                'vegetable',   8,  'seedling', 'fa-apple-whole', 'Sweet red flesh. Large fruits.',                    true],
      ['Spinach',                   'vegetable',   5,  'seedling', 'fa-leaf',        'Tender-leaf spinach. Fast growing.',                true],
      ['Onion (Red Creole)',        'vegetable',   4,  'seedling', 'fa-onion',       'Red onion. Pungent, good storage.',                 true],
      ['Jacaranda',                 'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',               true],
      ['Bamboo',                    'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',            false],
    ];
    for (const [name, category, price, unit, icon, description, in_stock] of seeds) {
      await pool.query(
        'INSERT INTO products (name, category, price, unit, icon, description, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [name, category, price, unit, icon, description, in_stock]
      );
    }
    console.log('✅ Seeded 20 products');
  }
}

// --- API Routes ---

// GET all products
app.get('/api/products', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
  res.json(rows.map(r => ({ ...r, inStock: r.in_stock })));
});

// PUT toggle stock
app.put('/api/products/:id/stock', async (req, res) => {
  const { in_stock } = req.body;
  await pool.query('UPDATE products SET in_stock = $1 WHERE id = $2', [in_stock, req.params.id]);
  res.json({ success: true });
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const { product_id, product_name, customer_name, phone, quantity, delivery } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO orders (product_id, product_name, customer_name, phone, quantity, delivery) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [product_id, product_name, customer_name, phone, quantity, delivery]
  );
  res.json({ success: true, id: rows[0].id });
});

// POST contact message
app.post('/api/contacts', async (req, res) => {
  const { name, phone, interest, message } = req.body;
  await pool.query(
    'INSERT INTO contacts (name, phone, interest, message) VALUES ($1,$2,$3,$4)',
    [name, phone, interest, message]
  );
  res.json({ success: true });
});

// GET all orders (admin)
app.get('/api/admin/orders', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

// GET all contacts (admin)
app.get('/api/admin/contacts', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
  res.json(rows);
});

// Start
const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`🌱 MKULIMA server running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
