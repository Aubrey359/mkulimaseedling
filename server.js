require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// ── In-memory fallback store (used when PostgreSQL is unavailable) ──────────
let useDb = false;
let inMemoryProducts = [];
let inMemoryOrders = [];
let inMemoryContacts = [];
let nextProductId = 1;
let nextOrderId = 1;
let nextContactId = 1;

// Seed data for in-memory mode
const SEED_PRODUCTS = [
  // Tomatoes
  ['Tomato Zara F1',              'vegetable',   8,  'seedling', 'fa-apple-whole', 'High-yield tomato variety. Disease resistant.',           true, null],
  ['Tomato Nova F1',              'vegetable',   8,  'seedling', 'fa-apple-whole', 'Vigorous tomato plant. Excellent fruit set.',             true, null],
  ['Tomato Ansal F1',             'vegetable',   8,  'seedling', 'fa-apple-whole', 'Determinate tomato. Good for processing.',                true, null],
  ['Tomato Terminator F1',        'vegetable',   8,  'seedling', 'fa-apple-whole', 'Disease tolerant tomato. Heavy producer.',                true, null],
  // Cabbages
  ['Cabbage Gloria F1',           'vegetable',   6,  'seedling', 'fa-leaf',        'Crisp cabbage. Good head formation.',                     true, null],
  ['Cabbage Pructor F1',          'vegetable',   6,  'seedling', 'fa-leaf',        'Medium maturity cabbage. Resistant to bolting.',          true, null],
  ['Cabbage Kilimo F1',           'vegetable',   6,  'seedling', 'fa-leaf',        'High yielding variety. Suitable for Kenya.',              true, null],
  ['Cabbage Queen F1',            'vegetable',   6,  'seedling', 'fa-leaf',        'Large head cabbage. Excellent storage.',                  true, null],
  ['Cabbage Victoria F1',         'vegetable',   6,  'seedling', 'fa-leaf',        'Uniform heads. Good market quality.',                     true, null],
  ['Cabbage Faida',               'vegetable',   6,  'seedling', 'fa-leaf',        'Reliable cabbage variety. Good yield.',                   true, null],
  ['Cabbage Powerslam',           'vegetable',   6,  'seedling', 'fa-leaf',        'Heavy producing cabbage. Disease resistant.',             true, null],
  ['Red Cabbage',                 'vegetable',   6,  'seedling', 'fa-leaf',        'Colorful red cabbage. Nutritious and tasty.',             true, null],
  // Spinach
  ['Spinach Fordhook Giant',      'vegetable',   5,  'seedling', 'fa-leaf',        'Large leaf spinach. Fast growing.',                        true, null],
  // Sukumawiki (Kale)
  ['Sukumawiki Ahadi F1',         'vegetable',   5,  'seedling', 'fa-leaf',        'High yielding sukuma wiki. Disease resistant.',           true, null],
  ['Sukumawiki Spinner',          'vegetable',   5,  'seedling', 'fa-leaf',        'Tender leaves. Good for continuous harvest.',               true, null],
  ['Sukumawiki Tausi',            'vegetable',   5,  'seedling', 'fa-leaf',        'African kale variety. Heat tolerant.',                      true, null],
  ['Sukumawiki Top Bunch',        'vegetable',   5,  'seedling', 'fa-leaf',        'Vigorous growth. Large bunch formation.',                 true, null],
  ['Sukumawiki Thousand Headed',   'vegetable',   5,  'seedling', 'fa-leaf',        'Multiple harvest variety. Continuous production.',          true, null],
  ['Curly Kales Malkia F1',       'vegetable',   5,  'seedling', 'fa-leaf',        'Curly leaf kale. Ornamental and edible.',                 true, null],
  // Capsicum
  ['Capsicum Calypso',            'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Bell pepper variety. Sweet flavor.',                        true, null],
  ['Capsicum Superbell',          'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Large bell pepper. Thick walls.',                         true, null],
  ['Capsicum Superwonder',        'vegetable',   10, 'seedling', 'fa-pepper-hot',  'High yielding capsicum. Disease resistant.',              true, null],
  ['Capsicum Victory Red',        'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Red bell pepper. Sweet and crisp.',                       true, null],
  ['Capsicum Victory Yellow',     'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Yellow bell pepper. Vibrant color.',                      true, null],
  // Peppers
  ['Pepper Birdseye',             'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Hot birdseye pepper. Very spicy.',                          true, null],
  ['Pepper Red Thunder',          'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Hot red pepper. Excellent for chili.',                      true, null],
  // Cauliflower
  ['Cauliflower Bella',           'vegetable',   8,  'seedling', 'fa-seedling',    'White cauliflower. Compact head.',                          true, null],
  // Broccoli
  ['Broccoli Titanic',            'vegetable',   8,  'seedling', 'fa-seedling',    'Large broccoli head. Cold tolerant.',                       true, null],
  ['Broccoli Harriet',            'vegetable',   8,  'seedling', 'fa-seedling',    'Early maturing broccoli. Good flavor.',                     true, null],
  // Watermelon
  ['Watermelon Sukari',           'vegetable',   8,  'seedling', 'fa-apple-whole', 'Sweet red flesh watermelon. Large fruits.',                 true, null],
  // Terere (Amaranth)
  ['Terere Amaranthus',           'vegetable',   5,  'seedling', 'fa-leaf',        'Traditional leafy vegetable. Nutritious.',                  true, null],
  // Manangu (Nightshade)
  ['Manangu Giant Nightshade',    'vegetable',   5,  'seedling', 'fa-leaf',        'Traditional vegetable. Heat tolerant.',                     true, null],
  // Lettuce
  ['Lettuce Pixie',               'vegetable',   200,'seedling', 'fa-leaf',        'Mini lettuce variety. Compact heads.',                      true, null],
  ['Lettuce Tangerine',           'vegetable',   200,'seedling', 'fa-leaf',        'Orange lettuce. Unique color.',                             true, null],
  ['Lettuce Washington',          'vegetable',   200,'seedling', 'fa-leaf',        'Butterhead lettuce. Tender leaves.',                        true, null],
  // Fruits
  ['Hass Avocado',                'fruit',       150,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                  true, null],
  ['Strawberry',                  'fruit',       50, 'seedling', 'fa-apple-whole', 'Sweet strawberry. Runner production.',                      true, null],
  ['Mango Tommy',                 'fruit',       150,'seedling', 'fa-tree',        'Tommy Atkins mango. Red blush skin.',                       true, null],
  ['Mango Apple',                 'fruit',       150,'seedling', 'fa-tree',        'Apple mango variety. Sweet and juicy.',                     true, null],
  ['Green Apple',                 'fruit',       500,'seedling', 'fa-tree',        'Green apple tree. Tart fruits.',                            true, null],
  ['Red Apple',                   'fruit',       500,'seedling', 'fa-tree',        'Red apple tree. Sweet fruits.',                             true, null],
  ['Dragon Fruit',                'fruit',       450,'seedling', 'fa-seedling',    'Exotic dragon fruit. Vibrant color.',                       true, null],
  ['Passion Purple',              'fruit',       50, 'seedling', 'fa-flower',      'Purple passion fruit. Sweet flavor.',                       true, null],
  ['Passion Yellow',              'fruit',       50, 'seedling', 'fa-flower',      'Yellow passion fruit. Tangy taste.',                        true, null],
  ['Sweet Granadilla',            'fruit',       50, 'seedling', 'fa-flower',      'Sweet granadilla. Delicious fruit.',                        true, null],
  ['Tree Tomato',                 'fruit',       50, 'seedling', 'fa-apple-whole', 'Tree tomato. Unique flavor.',                               true, null],
  ['Pawpaw Sharp F1',             'fruit',       100,'seedling', 'fa-tree',        'Sharp pawpaw variety. Tropical fruit.',                       true, null],
  ['Pawpaw Red Royale',           'fruit',       100,'seedling', 'fa-tree',        'Red Royale pawpaw. Sweet and creamy.',                      true, null],
  // Existing products
  ['Maize (Hybrid)',              'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',              true, null],
  ['Tomato (Rio Grande)',         'vegetable',   8,  'seedling', 'fa-apple-whole', 'Classic processing tomato. Heavy producer.',               true,  'red thunder.png'],
  ['Cabbage (Sukuma)',            'vegetable',   6,  'seedling', 'fa-leaf',        'Tender, fast-maturing cabbage variety.',                   true,  'red cabbage.png'],
  ['Kale (Sukuma Wiki)',          'vegetable',   5,  'seedling', 'fa-leaf',        'Popular Kenyan kale. High yield.',                         true,  null],
  ['Mango (Apple)',               'fruit',       80, 'seedling', 'fa-tree',        'Sweet dwarf mango. Fruits in 2-3 years.',                  true,  null],
  ['Avocado (Hass)',              'fruit',       120,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                   true,  null],
  ['Passion (Purple)',            'fruit',       30, 'seedling', 'fa-flower',      'Sweet purple passion. Vigorous climber.',                  true,  null],
  ['Coffee (Arabica)',            'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',                     true,  null],
  ['Tea',                         'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                         true,  null],
  ['Sugarcane',                   'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',                      true,  null],
  ['Napier Grass',                'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',                      true,  null],
  ['Banana (Giant Cavendish)',    'fruit',       20, 'sucker',   'fa-tree',        'Large bunch banana. Reliable producer.',                     true,  null],
  ['Orange (Washington)',         'fruit',       60, 'seedling', 'fa-tree',        'Juicy navel orange. Disease resistant.',                     true,  null],
  ['Lemon',                       'fruit',       50, 'seedling', 'fa-tree',        'Dwarf Meyer lemon. Year-round fruiting.',                    true,  null],
  ['Papaya (Mountain)',           'fruit',       15, 'seedling', 'fa-tree',        'Sweet mountain papaya. Early fruiting.',                     true,  null],
  ['Onion (Red Creole)',          'vegetable',   4,  'seedling', 'fa-onion',       'Red onion. Pungent, good storage.',                          true,  null],
  ['Jacaranda',                   'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',                        true,  null],
  ['Bamboo',                      'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',                   false, null],
];

// ── PostgreSQL connection ───────────────────────────────────────────────────
const isInternalRailway = (process.env.DATABASE_URL || '').includes('.railway.internal');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isInternalRailway ? false : { rejectUnauthorized: false },
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

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ── Database helpers ─────────────────────────────────────────────────────────

/** Returns `true` when PostgreSQL is connected and usable. */
async function pingDb() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/** Seed the in-memory store (called when PostgreSQL is unavailable). */
function seedInMemory() {
  if (inMemoryProducts.length > 0) return; // already seeded
  for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
    inMemoryProducts.push({
      id: nextProductId++,
      name, category, price, unit, icon, description, in_stock, image,
    });
  }
  console.log('✅ Seeded', inMemoryProducts.length, 'products (in-memory mode)');
}

// Initialize database tables + seed
async function initDb() {
  const ok = await pingDb();
  if (ok) {
    useDb = true;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        category    TEXT NOT NULL,
        price       INTEGER NOT NULL,
        unit        TEXT DEFAULT 'seedling',
        icon        TEXT DEFAULT 'fa-seedling',
        image       TEXT,
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
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM products');
    if (parseInt(rows[0].c) === 0) {
      for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
        await pool.query(
          'INSERT INTO products (name, category, price, unit, icon, image, description, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [name, category, price, unit, icon, image, description, in_stock]
        );
      }
      console.log('✅ Seeded', SEED_PRODUCTS.length, 'products');
    }
  } else {
    useDb = false;
    seedInMemory();
    console.log('⚠️  PostgreSQL unavailable – running in in-memory mode');
  }
}

// Root redirect → main HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'mku.html')));

// Serve sitemap.xml with correct content type
app.get('/sitemap.xml', (_, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Serve robots.txt
app.get('/robots.txt', (_, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// --- API Routes ---

// GET all products
app.get('/api/products', async (_, res) => {
  if (useDb) {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows.map(r => ({ ...r, inStock: r.in_stock })));
  } else {
    res.json(inMemoryProducts.map(p => ({ ...p, inStock: p.in_stock })));
  }
});

// PUT toggle stock
app.put('/api/products/:id/stock', authenticateAdmin, async (req, res) => {
  const { in_stock } = req.body;
  if (useDb) {
    await pool.query('UPDATE products SET in_stock = $1 WHERE id = $2', [in_stock, req.params.id]);
  } else {
    const p = inMemoryProducts.find(p => p.id === Number(req.params.id));
    if (p) p.in_stock = in_stock;
  }
  res.json({ success: true });
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const { product_id, product_name, customer_name, phone, quantity, delivery } = req.body;
  if (useDb) {
    const { rows } = await pool.query(
      'INSERT INTO orders (product_id, product_name, customer_name, phone, quantity, delivery) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [product_id, product_name, customer_name, phone, quantity, delivery]
    );
    res.json({ success: true, id: rows[0].id });
  } else {
    const id = nextOrderId++;
    inMemoryOrders.push({ id, product_id, product_name, customer_name, phone, quantity, delivery, status: 'pending', created_at: new Date().toISOString() });
    res.json({ success: true, id });
  }
});

// POST contact message
app.post('/api/contacts', async (req, res) => {
  const { name, phone, interest, message } = req.body;
  if (useDb) {
    await pool.query(
      'INSERT INTO contacts (name, phone, interest, message) VALUES ($1,$2,$3,$4)',
      [name, phone, interest, message]
    );
  } else {
    const id = nextContactId++;
    inMemoryContacts.push({ id, name, phone, interest, message, created_at: new Date().toISOString() });
  }
  res.json({ success: true });
});

// POST admin login
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    res.json({
      success: true,
      token: 'admin-' + Date.now()
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// POST reset database (admin only) - clears and re-seeds products
app.post('/api/admin/reset', authenticateAdmin, async (req, res) => {
  try {
    if (useDb) {
      await pool.query('DELETE FROM products');

      for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
        await pool.query(
          'INSERT INTO products (name, category, price, unit, icon, image, description, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [name, category, price, unit, icon, image, description, in_stock]
        );
      }
    } else {
      inMemoryProducts = [];
      nextProductId = 1;
      seedInMemory();
    }
    res.json({ success: true, message: 'Database reset and re-seeded' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', details: err.message });
  }
});

// GET all orders (admin)
app.get('/api/admin/orders', authenticateAdmin, async (_, res) => {
  if (useDb) {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } else {
    res.json([...inMemoryOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// GET all contacts (admin)
app.get('/api/admin/contacts', authenticateAdmin, async (_, res) => {
  if (useDb) {
    const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } else {
    res.json([...inMemoryContacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// Start
const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`🌱 MKULIMA server running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
