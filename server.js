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
  ['Tomato Zara F1',              'vegetable',   8,  'seedling', 'fa-apple-whole', 'High-yield tomato variety. Disease resistant.',           true, 'https://images.unsplash.com/photo-1561136594-ebf61b8c4c25?w=400&h=300&fit=crop'],
  ['Tomato Nova F1',              'vegetable',   8,  'seedling', 'fa-apple-whole', 'Vigorous tomato plant. Excellent fruit set.',             true, 'https://images.unsplash.com/photo-1561136594-ebf61b8c4c25?w=400&h=300&fit=crop'],
  ['Tomato Ansal F1',             'vegetable',   8,  'seedling', 'fa-apple-whole', 'Determinate tomato. Good for processing.',                true, 'https://images.unsplash.com/photo-1561136594-ebf61b8c4c25?w=400&h=300&fit=crop'],
  ['Tomato Terminator F1',        'vegetable',   8,  'seedling', 'fa-apple-whole', 'Disease tolerant tomato. Heavy producer.',                true, 'https://images.unsplash.com/photo-1561136594-ebf61b8c4c25?w=400&h=300&fit=crop'],
  // Cabbages
  ['Cabbage Gloria F1',           'vegetable',   6,  'seedling', 'fa-leaf',        'Crisp cabbage. Good head formation.',                     true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Pructor F1',          'vegetable',   6,  'seedling', 'fa-leaf',        'Medium maturity cabbage. Resistant to bolting.',          true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Kilimo F1',           'vegetable',   6,  'seedling', 'fa-leaf',        'High yielding variety. Suitable for Kenya.',              true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Queen F1',            'vegetable',   6,  'seedling', 'fa-leaf',        'Large head cabbage. Excellent storage.',                  true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Victoria F1',         'vegetable',   6,  'seedling', 'fa-leaf',        'Uniform heads. Good market quality.',                     true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Faida',               'vegetable',   6,  'seedling', 'fa-leaf',        'Reliable cabbage variety. Good yield.',                   true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Cabbage Powerslam',           'vegetable',   6,  'seedling', 'fa-leaf',        'Heavy producing cabbage. Disease resistant.',             true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Red Cabbage',                 'vegetable',   6,  'seedling', 'fa-leaf',        'Colorful red cabbage. Nutritious and tasty.',             true, 'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  // Spinach
  ['Spinach Fordhook Giant',      'vegetable',   5,  'seedling', 'fa-leaf',        'Large leaf spinach. Fast growing.',                        true, 'https://images.unsplash.com/photo-1576045058966-5156a113a0e9?w=400&h=300&fit=crop'],
  // Sukumawiki (Kale)
  ['Sukumawiki Ahadi F1',         'vegetable',   5,  'seedling', 'fa-leaf',        'High yielding sukuma wiki. Disease resistant.',           true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Sukumawiki Spinner',          'vegetable',   5,  'seedling', 'fa-leaf',        'Tender leaves. Good for continuous harvest.',               true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Sukumawiki Tausi',            'vegetable',   5,  'seedling', 'fa-leaf',        'African kale variety. Heat tolerant.',                      true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Sukumawiki Top Bunch',        'vegetable',   5,  'seedling', 'fa-leaf',        'Vigorous growth. Large bunch formation.',                 true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Sukumawiki Thousand Headed',   'vegetable',   5,  'seedling', 'fa-leaf',        'Multiple harvest variety. Continuous production.',          true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Curly Kales Malkia F1',       'vegetable',   5,  'seedling', 'fa-leaf',        'Curly leaf kale. Ornamental and edible.',                 true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  // Capsicum
  ['Capsicum Calypso',            'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Bell pepper variety. Sweet flavor.',                        true, 'https://images.unsplash.com/photo-1563565721-c52c6b01dbc1?w=400&h=300&fit=crop'],
  ['Capsicum Superbell',          'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Large bell pepper. Thick walls.',                         true, 'https://images.unsplash.com/photo-1563565721-c52c6b01dbc1?w=400&h=300&fit=crop'],
  ['Capsicum Superwonder',        'vegetable',   10, 'seedling', 'fa-pepper-hot',  'High yielding capsicum. Disease resistant.',              true, 'https://images.unsplash.com/photo-1563565721-c52c6b01dbc1?w=400&h=300&fit=crop'],
  ['Capsicum Victory Red',        'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Red bell pepper. Sweet and crisp.',                       true, 'https://images.unsplash.com/photo-1563565721-c52c6b01dbc1?w=400&h=300&fit=crop'],
  ['Capsicum Victory Yellow',     'vegetable',   10, 'seedling', 'fa-pepper-hot',  'Yellow bell pepper. Vibrant color.',                      true, 'https://images.unsplash.com/photo-1563565721-c52c6b01dbc1?w=400&h=300&fit=crop'],
  // Peppers
  ['Pepper Birdseye',             'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Hot birdseye pepper. Very spicy.',                          true, 'https://images.unsplash.com/photo-1589299940469-159684810300?w=400&h=300&fit=crop'],
  ['Pepper Red Thunder',          'vegetable',   8,  'seedling', 'fa-pepper-hot',  'Hot red pepper. Excellent for chili.',                      true, 'https://images.unsplash.com/photo-1589299940469-159684810300?w=400&h=300&fit=crop'],
  // Cauliflower
  ['Cauliflower Bella',           'vegetable',   8,  'seedling', 'fa-seedling',    'White cauliflower. Compact head.',                          true, 'https://images.unsplash.com/photo-1565067246077-8c0c5c8a1c8e?w=400&h=300&fit=crop'],
  // Broccoli
  ['Broccoli Titanic',            'vegetable',   8,  'seedling', 'fa-seedling',    'Large broccoli head. Cold tolerant.',                       true, 'https://images.unsplash.com/photo-1583475001909-0a4e0c4c4c4c?w=400&h=300&fit=crop'],
  ['Broccoli Harriet',            'vegetable',   8,  'seedling', 'fa-seedling',    'Early maturing broccoli. Good flavor.',                     true, 'https://images.unsplash.com/photo-1583475001909-0a4e0c4c4c4c?w=400&h=300&fit=crop'],
  // Watermelon
  ['Watermelon Sukari',           'vegetable',   8,  'seedling', 'fa-apple-whole', 'Sweet red flesh watermelon. Large fruits.',                 true, 'https://images.unsplash.com/photo-1564193565846-5c2c5a5a5a5a?w=400&h=300&fit=crop'],
  // Terere (Amaranth)
  ['Terere Amaranthus',           'vegetable',   5,  'seedling', 'fa-leaf',        'Traditional leafy vegetable. Nutritious.',                  true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  // Manangu (Nightshade)
  ['Manangu Giant Nightshade',    'vegetable',   5,  'seedling', 'fa-leaf',        'Traditional vegetable. Heat tolerant.',                     true, 'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  // Lettuce
  ['Lettuce Pixie',               'vegetable',   200,'seedling', 'fa-leaf',        'Mini lettuce variety. Compact heads.',                      true, 'https://images.unsplash.com/photo-1516689301880-8c6a3a3b3b3b?w=400&h=300&fit=crop'],
  ['Lettuce Tangerine',           'vegetable',   200,'seedling', 'fa-leaf',        'Orange lettuce. Unique color.',                             true, 'https://images.unsplash.com/photo-1516689301880-8c6a3a3b3b3b?w=400&h=300&fit=crop'],
  ['Lettuce Washington',          'vegetable',   200,'seedling', 'fa-leaf',        'Butterhead lettuce. Tender leaves.',                        true, 'https://images.unsplash.com/photo-1516689301880-8c6a3a3b3b3b?w=400&h=300&fit=crop'],
  // Fruits
  ['Hass Avocado',                'fruit',       150,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                  true, 'https://images.unsplash.com/photo-1523042707052-8021c9c7c32a?w=400&h=300&fit=crop'],
  ['Strawberry',                  'fruit',       50, 'seedling', 'fa-apple-whole', 'Sweet strawberry. Runner production.',                      true, 'https://images.unsplash.com/photo-1518633387331-3e0257b1c1c1?w=400&h=300&fit=crop'],
  ['Mango Tommy',                 'fruit',       150,'seedling', 'fa-tree',        'Tommy Atkins mango. Red blush skin.',                       true, 'https://images.unsplash.com/photo-1591073111884-9c2f50a0a0a0?w=400&h=300&fit=crop'],
  ['Mango Apple',                 'fruit',       150,'seedling', 'fa-tree',        'Apple mango variety. Sweet and juicy.',                     true, 'https://images.unsplash.com/photo-1591073111884-9c2f50a0a0a0?w=400&h=300&fit=crop'],
  ['Green Apple',                 'fruit',       500,'seedling', 'fa-tree',        'Green apple tree. Tart fruits.',                            true, 'https://images.unsplash.com/photo-1560806887-1e4cd0d1a1a1?w=400&h=300&fit=crop'],
  ['Red Apple',                   'fruit',       500,'seedling', 'fa-tree',        'Red apple tree. Sweet fruits.',                             true, 'https://images.unsplash.com/photo-1560806887-1e4cd0d1a1a1?w=400&h=300&fit=crop'],
  ['Dragon Fruit',                'fruit',       450,'seedling', 'fa-seedling',    'Exotic dragon fruit. Vibrant color.',                       true, 'https://images.unsplash.com/photo-1526318472351-3a5a0c0c0c0c?w=400&h=300&fit=crop'],
  ['Passion Purple',              'fruit',       50, 'seedling', 'fa-flower',      'Purple passion fruit. Sweet flavor.',                       true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Passion Yellow',              'fruit',       50, 'seedling', 'fa-flower',      'Yellow passion fruit. Tangy taste.',                        true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Sweet Granadilla',            'fruit',       50, 'seedling', 'fa-flower',      'Sweet granadilla. Delicious fruit.',                        true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Tree Tomato',                 'fruit',       50, 'seedling', 'fa-apple-whole', 'Tree tomato. Unique flavor.',                               true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Pawpaw Sharp F1',             'fruit',       100,'seedling', 'fa-tree',        'Sharp pawpaw variety. Tropical fruit.',                       true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Pawpaw Red Royale',           'fruit',       100,'seedling', 'fa-tree',        'Red Royale pawpaw. Sweet and creamy.',                      true, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  // Existing products
  ['Maize (Hybrid)',              'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',              true, 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop'],
  ['Tomato (Rio Grande)',         'vegetable',   8,  'seedling', 'fa-apple-whole', 'Classic processing tomato. Heavy producer.',               true,  'https://images.unsplash.com/photo-1561136594-ebf61b8c4c25?w=400&h=300&fit=crop'],
  ['Cabbage (Sukuma)',            'vegetable',   6,  'seedling', 'fa-leaf',        'Tender, fast-maturing cabbage variety.',                   true,  'https://images.unsplash.com/photo-1594282583010-818c69d5a2a9?w=400&h=300&fit=crop'],
  ['Kale (Sukuma Wiki)',          'vegetable',   5,  'seedling', 'fa-leaf',        'Popular Kenyan kale. High yield.',                         true,  'https://images.unsplash.com/photo-1515694346933-4c9d2cdc0c2d?w=400&h=300&fit=crop'],
  ['Mango (Apple)',               'fruit',       80, 'seedling', 'fa-tree',        'Sweet dwarf mango. Fruits in 2-3 years.',                  true,  'https://images.unsplash.com/photo-1591073111884-9c2f50a0a0a0?w=400&h=300&fit=crop'],
  ['Avocado (Hass)',              'fruit',       120,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                   true,  'https://images.unsplash.com/photo-1523042707052-8021c9c7c32a?w=400&h=300&fit=crop'],
  ['Passion (Purple)',            'fruit',       30, 'seedling', 'fa-flower',      'Sweet purple passion. Vigorous climber.',                  true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Coffee (Arabica)',            'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',                     true,  'https://images.unsplash.com/photo-1511920170033-f83967b73c33?w=400&h=300&fit=crop'],
  ['Tea',                         'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                         true,  'https://images.unsplash.com/photo-1544787205-8c1c2a1a1a1a?w=400&h=300&fit=crop'],
  ['Sugarcane',                   'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',                      true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Napier Grass',                'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',                      true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Banana (Giant Cavendish)',    'fruit',       20, 'sucker',   'fa-tree',        'Large bunch banana. Reliable producer.',                     true,  'https://images.unsplash.com/photo-1574226516107-7d3a0c0c0c0c?w=400&h=300&fit=crop'],
  ['Orange (Washington)',         'fruit',       60, 'seedling', 'fa-tree',        'Juicy navel orange. Disease resistant.',                     true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Lemon',                       'fruit',       50, 'seedling', 'fa-tree',        'Dwarf Meyer lemon. Year-round fruiting.',                    true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Papaya (Mountain)',           'fruit',       15, 'seedling', 'fa-tree',        'Sweet mountain papaya. Early fruiting.',                     true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Onion (Red Creole)',          'vegetable',   4,  'seedling', 'fa-onion',       'Red onion. Pungent, good storage.',                          true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Jacaranda',                   'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',                        true,  'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
  ['Bamboo',                      'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',                   false, 'https://images.unsplash.com/photo-1560185127-6b4a5a5a5a5a?w=400&h=300&fit=crop'],
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
  try {
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

    // Seed products only if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) AS c FROM products');
    if (parseInt(rows[0].c) === 0) {
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
      ];
      for (const [name, category, price, unit, icon, description, in_stock, image] of seeds) {
        await pool.query(
          'INSERT INTO products (name, category, price, unit, icon, image, description, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [name, category, price, unit, icon, image, description, in_stock]
        );
      }
      console.log('✅ Seeded 20 products');
    }
    useDb = true;
    console.log('✅ Database connected');
  } catch (err) {
    console.log('⚠️ Database unavailable, using in-memory store');
    seedInMemory();
  }
}

// Root redirect → main HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'mku.html')));

// Products page
app.get('/products.html', (_, res) => res.sendFile(path.join(__dirname, 'products.html')));

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
  .catch(err => { console.error('DB init error:', err); app.listen(PORT, () => console.log(`🌱 MKULIMA server running on port ${PORT} (in-memory mode)`)); });
