require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// PostgreSQL connection (Railway injects DATABASE_URL automatically)
// Internal Railway postgres (.railway.internal) does not use SSL
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
      image       TEXT,
      description TEXT,
      in_stock    BOOLEAN DEFAULT true,
      UNIQUE(name)
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

  // Ensure name is unique so ON CONFLICT upsert works (no-op if index already exists)
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS products_name_key ON products(name)`);

  // Always upsert products — inserts new ones and updates existing ones by name
  const seeds = [
    ['Maize (Hybrid)',           'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',       true, null],
    ['Tomato (Rio Grande)',       'vegetable',   8,  'seedling', 'fa-apple-whole', 'Classic processing tomato. Heavy producer.',        true,  'red thunder.png'],
    ['Cabbage (Sukuma)',          'vegetable',   6,  'seedling', 'fa-leaf',        'Tender, fast-maturing cabbage variety.',            true,  'red cabbage.png'],
    ['Kale (Sukuma Wiki)',        'vegetable',   5,  'seedling', 'fa-leaf',        'Popular Kenyan kale. High yield.',                  true,  null],
    ['Mango (Apple)',             'fruit',       80, 'seedling', 'fa-tree',        'Sweet dwarf mango. Fruits in 2-3 years.',           true,  null],
    ['Avocado (Hass)',            'fruit',       120,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',          true,  null],
    ['Passion (Purple)',          'fruit',       30, 'seedling', 'fa-flower',      'Sweet purple passion. Vigorous climber.',           true,  null],
    ['Coffee (Arabica)',          'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',            true,  null],
    ['Tea',                       'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                  true,  null],
    ['Sugarcane',                 'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',             true,  null],
    ['Napier Grass',              'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',             true,  null],
    ['Banana (Giant Cavendish)',  'fruit',       20, 'sucker',   'fa-tree',        'Large bunch banana. Reliable producer.',            true,  null],
    ['Orange (Washington)',       'fruit',       60, 'seedling', 'fa-tree',        'Juicy navel orange. Disease resistant.',            true,  null],
    ['Lemon',                     'fruit',       50, 'seedling', 'fa-tree',        'Dwarf Meyer lemon. Year-round fruiting.',           true,  null],
    ['Papaya (Mountain)',         'fruit',       15, 'seedling', 'fa-tree',        'Sweet mountain papaya. Early fruiting.',            true,  null],
    ['Watermelon',                'vegetable',   8,  'seedling', 'fa-apple-whole', 'Sweet red flesh. Large fruits.',                    true,  null],
    ['Spinach',                   'vegetable',   5,  'seedling', 'fa-leaf',        'Tender-leaf spinach. Fast growing.',                true,  null],
    ['Onion (Red Creole)',        'vegetable',   4,  'seedling', 'fa-onion',       'Red onion. Pungent, good storage.',                 true,  null],
    ['Jacaranda',                 'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',               true,  null],
    ['Bamboo',                    'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',            false, null],

    // ── Tomatoes ──────────────────────────────────────────────────────────
    ['Tomato (Zara F1)',          'vegetable',   8,  'seedling', 'fa-apple-whole', 'High-yield tomato. Good shelf life.',               true,  null],
    ['Tomato (Nova F1)',          'vegetable',   8,  'seedling', 'fa-apple-whole', 'Early maturing tomato. Disease resistant.',         true,  null],
    ['Tomato (Ansal F1)',         'vegetable',   8,  'seedling', 'fa-apple-whole', 'Heat-tolerant tomato. Heavy producer.',             true,  null],
    ['Tomato (Terminator F1)',    'vegetable',   8,  'seedling', 'fa-apple-whole', 'High-yield processing tomato.',                     true,  null],

    // ── Cabbages ──────────────────────────────────────────────────────────
    ['Cabbage (Gloria F1)',       'vegetable',   6,  'seedling', 'fa-leaf',        'Large-headed cabbage. Good wrapper leaves.',        true,  null],
    ['Cabbage (Pructor F1)',      'vegetable',   6,  'seedling', 'fa-leaf',        'Compact cabbage. Uniform heads.',                   true,  null],
    ['Cabbage (Kilimo F1)',       'vegetable',   6,  'seedling', 'fa-leaf',        'High-yield cabbage. Good storage.',                 true,  null],
    ['Cabbage (Queen F1)',        'vegetable',   6,  'seedling', 'fa-leaf',        'Premium cabbage. Tight, round heads.',              true,  null],
    ['Cabbage (Victoria F1)',     'vegetable',   6,  'seedling', 'fa-leaf',        'Heat-tolerant cabbage. Reliable producer.',         true,  null],
    ['Cabbage (Faida)',           'vegetable',   6,  'seedling', 'fa-leaf',        'Popular local variety. Good market demand.',        true,  null],
    ['Cabbage (Powerslam)',       'vegetable',   6,  'seedling', 'fa-leaf',        'High-yield hybrid. Uniform heads.',                 true,  null],
    ['Red Cabbage',               'vegetable',   6,  'seedling', 'fa-leaf',        'Deep purple-red heads. Rich in antioxidants.',      true,  null],

    // ── Spinach ───────────────────────────────────────────────────────────
    ['Spinach (Fordhook Giant)',  'vegetable',   5,  'seedling', 'fa-leaf',        'Large dark-green leaves. Slow to bolt.',            true,  null],

    // ── Sukuma Wiki ───────────────────────────────────────────────────────
    ['Sukuma Wiki (Ahadi F1)',    'vegetable',   5,  'seedling', 'fa-leaf',        'High-yield kale. Disease resistant.',               true,  null],
    ['Sukuma Wiki (Spinner)',     'vegetable',   5,  'seedling', 'fa-leaf',        'Prolific producer. Long harvest window.',           true,  null],
    ['Sukuma Wiki (Tausi)',       'vegetable',   5,  'seedling', 'fa-leaf',        'Large leaves. High market demand.',                 true,  null],
    ['Sukuma Wiki (Top Bunch)',   'vegetable',   5,  'seedling', 'fa-leaf',        'Premium variety. Upright growth habit.',            true,  null],
    ['Sukuma Wiki (Thousand Headed)', 'vegetable', 5, 'seedling', 'fa-leaf',        'Prolific producer. Continuous harvesting.',         true,  null],
    ['Curly Kale',                'vegetable',   5,  'seedling', 'fa-leaf',        'Ornamental and edible. Nutritious.',                true,  null],
    ['Sukuma Wiki (Malkia F1)',   'vegetable',   5,  'seedling', 'fa-leaf',        'High-yield hybrid. Tender leaves.',                 true,  null],

    // ── Capsicum ──────────────────────────────────────────────────────────
    ['Capsicum (Calypso)',        'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Sweet capsicum. Blocky green fruits.',              true,  null],
    ['Capsicum (Superbell)',      'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Large blocky fruits. Thick walls.',                 true,  null],
    ['Capsicum (Superwonder)',    'vegetable',   10, 'seedling', 'fa-pepper-hot',  'High-yield capsicum. Good shelf life.',             true,  null],
    ['Capsicum (Victory Red)',    'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Sweet red capsicum. Heavy producer.',               true,  null],
    ['Capsicum (Victory Yellow)', 'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Sweet yellow capsicum. Blocky fruits.',             true,  null],

    // ── Hot Peppers ───────────────────────────────────────────────────────
    ['Pepper (Birdseye)',         'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Small hot pepper. Very pungent.',                   true,  null],
    ['Pepper (Red Thunder)',      'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Medium hot pepper. Good yield.',                    true,  null],

    // ── Cauliflower ───────────────────────────────────────────────────────
    ['Cauliflower (Bella)',       'vegetable',   8,  'seedling', 'fa-apple-whole', 'White curd. Compact and uniform.',                  true,  null],

    // ── Broccoli ──────────────────────────────────────────────────────────
    ['Broccoli (Titanic)',        'vegetable',   8,  'seedling', 'fa-apple-whole', 'Large green heads. High yield.',                    true,  null],
    ['Broccoli (Harriet)',        'vegetable',   8,  'seedling', 'fa-apple-whole', 'Premium broccoli. Tight florets.',                  true,  null],

    // ── Watermelon ─────────────────────────────────────────────────────────
    ['Watermelon (Sukari)',       'vegetable',   8,  'seedling', 'fa-apple-whole', 'Sweet red flesh. Small to medium fruits.',          true,  null],

    // ── Terere ────────────────────────────────────────────────────────────
    ['Terere (Amaranthus)',       'vegetable',   5,  'seedling', 'fa-leaf',        'Nutritious leafy green. Fast growing.',             true,  null],

    // ── Managu ────────────────────────────────────────────────────────────
    ['Managu (Giant Nightshade)', 'vegetable',   5,  'seedling', 'fa-leaf',        'Traditional Kenyan vegetable. Nutritious.',         true,  null],

    // ── Lettuce ───────────────────────────────────────────────────────────
    ['Lettuce',                   'vegetable',   5,  'seedling', 'fa-leaf',        'Crisp green lettuce. Fast growing.',                true,  null],

    // ── Oranges ───────────────────────────────────────────────────────────
    ['Orange (Pixie)',            'fruit',       60, 'seedling', 'fa-tree',        'Sweet seedless orange. Early season.',              true,  null],
    ['Orange (Tangerine)',        'fruit',       60, 'seedling', 'fa-tree',        'Easy-peel tangerine. Sweet and juicy.',             true,  null],

    // ── Avocado @150 ───────────────────────────────────────────────────────
    ['Avocado (Hass)',            'fruit',       150,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',          true,  null],

    // ── Strawberry ─────────────────────────────────────────────────────────
    ['Strawberry',                'fruit',       50, 'seedling', 'fa-flower',      'Sweet juicy berries. Ever-bearing.',                true,  null],

    // ── Mangoes ───────────────────────────────────────────────────────────
    ['Mango (Tommy)',             'fruit',       150,'seedling', 'fa-tree',        'Popular Tommy Atkins mango. Good shelf life.',      true,  null],
    ['Mango (Apple)',             'fruit',       150,'seedling', 'fa-tree',        'Sweet apple mango. Fibre-free flesh.',              true,  null],

    // ── Apples ────────────────────────────────────────────────────────────
    ['Apple (Green)',             'fruit',       500,'seedling', 'fa-tree',        'Crisp green apple. Tart and sweet.',                true,  null],
    ['Apple (Red)',               'fruit',       500,'seedling', 'fa-tree',        'Sweet red apple. Firm and juicy.',                  true,  null],

    // ── Dragon Fruit ───────────────────────────────────────────────────────
    ['Dragon Fruit',              'fruit',       450,'seedling', 'fa-tree',        'Exotic pitaya. Sweet and refreshing.',              true,  null],

    // ── Passion Fruit ──────────────────────────────────────────────────────
    ['Passion (Purple)',          'fruit',       50, 'seedling', 'fa-flower',      'Sweet purple passion. Vigorous climber.',           true,  null],
    ['Passion (Yellow)',          'fruit',       50, 'seedling', 'fa-flower',      'Large yellow passion. High yield.',                 true,  null],
    ['Passion (Sweet Granadilla)','fruit',       50, 'seedling', 'fa-flower',      'Sweet aromatic fruit. Vigorous vine.',              true,  null],

    // ── Tree Tomatoes ──────────────────────────────────────────────────────
    ['Tree Tomato',               'fruit',       50, 'seedling', 'fa-tree',        'Fast-growing tree tomato. Continuous fruiting.',    true,  null],

    // ── Pawpaw ────────────────────────────────────────────────────────────
    ['Pawpaw (Sharp F1)',         'fruit',       30, 'seedling', 'fa-tree',        'High-yield pawpaw. Sweet orange flesh.',            true,  null],
    ['Pawpaw (Red Royale)',       'fruit',       30, 'seedling', 'fa-tree',        'Premium pawpaw. Red-orange flesh.',                 true,  null],
  ];
  for (const [name, category, price, unit, icon, description, in_stock, image] of seeds) {
    await pool.query(
      `INSERT INTO products (name, category, price, unit, icon, image, description, in_stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (name) DO UPDATE SET
         category    = EXCLUDED.category,
         price       = EXCLUDED.price,
         unit        = EXCLUDED.unit,
         icon        = EXCLUDED.icon,
         image       = EXCLUDED.image,
         description = EXCLUDED.description,
         in_stock    = EXCLUDED.in_stock`,
      [name, category, price, unit, icon, image, description, in_stock]
    );
  }
  console.log('✅ Seeded/updated 66 products');
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
