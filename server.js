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

// Seed data for in-memory mode — 55 products matching products.html
const SEED_PRODUCTS = [
  // Tomatoes
  ['Tomato Zara F1',              'vegetable',   4,  'seedling', 'fa-apple-whole', 'High-yield tomato variety. Disease resistant.',           true, 'Images/zara f1.png'],
  ['Tomato Nova F1',              'vegetable',   5,  'seedling', 'fa-apple-whole', 'Vigorous tomato plant. Excellent fruit set.',             true, 'Images/tomato-nova.jpg'],
  ['Tomato Ansal F1',             'vegetable',   6,  'seedling', 'fa-apple-whole', 'Determinate tomato. Good for processing.',                true, 'Images/tomato-ansal.jpg'],
  ['Tomato Terminator F1',        'vegetable',   4,  'seedling', 'fa-apple-whole', 'Disease tolerant tomato. Heavy producer.',                true, 'Images/terminator f1.png'],
  // Cabbages
  ['Cabbage Gloria F1',           'vegetable',   2.5,'seedling', 'fa-leaf',        'Crisp cabbage. Good head formation.',                     true, 'Images/gloria f1.png'],
  ['Cabbage Pructor F1',          'vegetable',   2,  'seedling', 'fa-leaf',        'Medium maturity cabbage. Resistant to bolting.',          true, 'Images/cabbage-pructor.jpg'],
  ['Cabbage Kilimo F1',           'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding variety. Suitable for Kenya.',              true, 'Images/cabbage-kilimo.jpg'],
  ['Cabbage Queen F1',            'vegetable',   2,  'seedling', 'fa-leaf',        'Large head cabbage. Excellent storage.',                  true, 'Images/cabbage-queen.jpg'],
  ['Cabbage Victoria F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'Uniform heads. Good market quality.',                     true, 'Images/cabbage-victoria.jpg'],
  ['Cabbage Faida',               'vegetable',   2,  'seedling', 'fa-leaf',        'Reliable cabbage variety. Good yield.',                   true, 'Images/cabbage-faida.jpg'],
  ['Cabbage Powerslam',           'vegetable',   2,  'seedling', 'fa-leaf',        'Heavy producing cabbage. Disease resistant.',             true, 'Images/cabbage-powerslam.jpg'],
  ['Red Cabbage',                 'vegetable',   4,  'seedling', 'fa-leaf',        'Colorful red cabbage. Nutritious and tasty.',             true, 'Images/red cabbage.png'],
  // Spinach
  ['Spinach Fordhook Giant',      'vegetable',   2,  'seedling', 'fa-leaf',        'Large leaf spinach. Fast growing.',                        true, 'Images/spinach-fordhook.jpg'],
  // Sukumawiki (Kale)
  ['Sukumawiki Ahadi F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding sukuma wiki. Disease resistant.',           true, 'Images/sukumawiki-ahadi.jpg'],
  ['Sukumawiki Spinner',          'vegetable',   2,  'seedling', 'fa-leaf',        'Tender leaves. Good for continuous harvest.',               true, 'Images/sukumawiki-spinner.jpg'],
  ['Sukumawiki Tausi',            'vegetable',   2,  'seedling', 'fa-leaf',        'African kale variety. Heat tolerant.',                      true, 'Images/sukumawiki-tausi.jpg'],
  ['Sukumawiki Top Bunch',        'vegetable',   2,  'seedling', 'fa-leaf',        'Vigorous growth. Large bunch formation.',                 true, 'Images/sukumawiki-topbunch.jpg'],
  ['Sukumawiki Thousand Headed',   'vegetable',   2,  'seedling', 'fa-leaf',        'Multiple harvest variety. Continuous production.',          true, 'Images/sukumawiki-thousand.jpg'],
  ['Curly Kales Malkia F1',       'vegetable',   3,  'seedling', 'fa-leaf',        'Curly leaf kale. Ornamental and edible.',                 true, 'Images/malika f1.png'],
  // Capsicum
  ['Capsicum Calypso',            'vegetable',   4,  'seedling', 'fa-pepper-hot',  'Bell pepper variety. Sweet flavor.',                        true, 'Images/capsicum-calypso.jpg'],
  ['Capsicum Superbell',          'vegetable',   4,  'seedling', 'fa-pepper-hot',  'Large bell pepper. Thick walls.',                         true, 'Images/capsicum-superbell.jpg'],
  ['Capsicum Superwonder',        'vegetable',   4,  'seedling', 'fa-pepper-hot',  'High yielding capsicum. Disease resistant.',              true, 'Images/capsicum-superwonder.jpg'],
  ['Capsicum Victory Red',        'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red bell pepper. Sweet and crisp.',                       true, 'Images/capsicum-victoryred.jpg'],
  ['Capsicum Victory Yellow',     'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow bell pepper. Vibrant color.',                      true, 'Images/capsicum-victoryyellow.jpg'],
  ['Capsicum Nyuki Yellow',       'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow Nyuki pepper. Hot variety.',                       true, 'Images/capsicum-nyuki-yellow.jpg'],
  ['Capsicum Nyuki Red',          'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red Nyuki pepper. Hot variety.',                          true, 'Images/capsicum-nyuki-red.jpg'],
  // Peppers
  ['Pepper Birdseye',             'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Hot birdseye pepper. Very spicy.',                          true, 'Images/pepper-birdseye.jpg'],
  ['Pepper Red Thunder',          'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Hot red pepper. Excellent for chili.',                      true, 'Images/red thunder.png'],
  // Beetroot
  ['Beetroot',                    'vegetable',   4,  'seedling', 'fa-circle',      'Sweet red beetroot. Nutritious root vegetable.',           true, 'Images/beetroot.png'],
  // Cauliflower
  ['Cauliflower Bella',           'vegetable',   3,  'seedling', 'fa-seedling',    'White cauliflower. Compact head.',                          true, 'Images/cauliflower-bella.jpg'],
  // Broccoli
  ['Broccoli Titanic',            'vegetable',   3,  'seedling', 'fa-seedling',    'Large broccoli head. Cold tolerant.',                       true, 'Images/broccoli-titanic.jpg'],
  ['Broccoli Harriet',            'vegetable',   3,  'seedling', 'fa-seedling',    'Early maturing broccoli. Good flavor.',                     true, 'Images/broccoli-harriet.jpg'],
  // Watermelon
  ['Watermelon Sukari',           'vegetable',   6,  'seedling', 'fa-apple-whole', 'Sweet red flesh watermelon. Large fruits.',                 true, 'Images/watermelon-sukari.jpg'],
  // Terere (Amaranth)
  ['Terere Amaranthus',           'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional leafy vegetable. Nutritious.',                  true, 'Images/terere-amaranthus.jpg'],
  // Manangu (Nightshade)
  ['Manangu Giant Nightshade',    'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional vegetable. Heat tolerant.',                     true, 'Images/manangu-nightshade.jpg'],
  // Lettuce
  ['Lettuce Pixie',               'vegetable',   3,  'seedling', 'fa-leaf',        'Mini lettuce variety. Compact heads.',                      true, 'Images/lettuce-pixie.jpg'],
  ['Lettuce Tangerine',           'vegetable',   3,  'seedling', 'fa-leaf',        'Orange lettuce. Unique color.',                             true, 'Images/lettuce-tangerine.jpg'],
  ['Lettuce Washington',          'vegetable',   3,  'seedling', 'fa-leaf',        'Butterhead lettuce. Tender leaves.',                        true, 'Images/lettuce-washington.jpg'],
  // Cucumber
  ['Cucumber Ashley',             'vegetable',   6,  'seedling', 'fa-leaf',        'Cucumber variety. Good yield.',                             true, 'Images/cucumber-ashley.jpg'],
  // Courgette
  ['Courgette Zucchini',          'vegetable',   6,  'seedling', 'fa-leaf',        'Zucchini squash. Productive variety.',                      true, 'Images/courgette-zucchini.jpg'],
  // Fruits
  ['Hass Avocado',                'fruit',       150,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                  true, 'Images/avocado-hass.jpg'],
  ['Strawberry',                  'fruit',       50, 'seedling', 'fa-apple-whole', 'Sweet strawberry. Runner production.',                      true, 'Images/strawberry.jpg'],
  ['Mango Tommy',                 'fruit',       150,'seedling', 'fa-tree',        'Tommy Atkins mango. Red blush skin.',                       true, 'Images/mango-tommy.jpg'],
  ['Mango Apple',                 'fruit',       150,'seedling', 'fa-tree',        'Apple mango variety. Sweet and juicy.',                     true, 'Images/mango-apple.jpg'],
  ['Green Apple',                 'fruit',       500,'seedling', 'fa-tree',        'Green apple tree. Tart fruits.',                            true, 'Images/green-apple.jpg'],
  ['Red Apple',                   'fruit',       500,'seedling', 'fa-tree',        'Red apple tree. Sweet fruits.',                             true, 'Images/red-apple.jpg'],
  ['Dragon Fruit',                'fruit',       450,'seedling', 'fa-seedling',    'Exotic dragon fruit. Vibrant color.',                       true, 'Images/dragon-fruit.jpg'],
  ['Passion Purple',              'fruit',       50, 'seedling', 'fa-flower',      'Purple passion fruit. Sweet flavor.',                       true, 'Images/passion-purple.jpg'],
  ['Passion Yellow',              'fruit',       50, 'seedling', 'fa-flower',      'Yellow passion fruit. Tangy taste.',                        true, 'Images/passion-yellow.jpg'],
  ['Sweet Granadilla',            'fruit',       50, 'seedling', 'fa-flower',      'Sweet granadilla. Delicious fruit.',                        true, 'Images/granadilla.jpg'],
  ['Tree Tomato',                 'fruit',       50, 'seedling', 'fa-apple-whole', 'Tree tomato. Unique flavor.',                               true, 'Images/tree-tomato.jpg'],
  ['Pawpaw Sharp F1',             'fruit',       100,'seedling', 'fa-tree',        'Sharp pawpaw variety. Tropical fruit.',                       true, 'Images/pawpaw-sharp.jpg'],
  ['Pawpaw Red Royale',           'fruit',       150,'seedling', 'fa-tree',        'Red Royale pawpaw. Sweet and creamy.',                      true, 'Images/pawpaw-redroyale.jpg'],
  ['Pawpaw Vega F1',              'fruit',       200,'seedling', 'fa-tree',        'Vega pawpaw variety. High yield.',                          true, 'Images/pawpaw-vega.jpg'],
  ['Pawpaw Glory F1',             'fruit',       100,'seedling', 'fa-tree',        'Glory pawpaw variety. Good fruit quality.',                 true, 'Images/pawpaw-glory.jpg'],
  // Grains
  ['Maize (Hybrid)',              'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',              true, 'Images/maize-hybrid.jpg'],
  // Cash Crops
  ['Coffee (Arabica)',            'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',                     true, 'Images/coffee-arabica.jpg'],
  ['Tea',                         'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                         true, 'Images/tea.jpg'],
  ['Sugarcane',                   'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',                      true, 'Images/sugarcane.jpg'],
  // Fodder
  ['Napier Grass',                'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',                      true, 'Images/napier-grass.jpg'],
  // Ornamental
  ['Jacaranda',                   'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',                        true, 'Images/jacaranda.jpg'],
  // Trees
  ['Bamboo',                      'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',                   false, 'Images/bamboo.jpg'],
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
        // Tomatoes
        ['Tomato Zara F1',              'vegetable',   4,  'seedling', 'fa-apple-whole', 'High-yield tomato variety. Disease resistant.',           true, 'Images/zara f1.png'],
        ['Tomato Nova F1',              'vegetable',   5,  'seedling', 'fa-apple-whole', 'Vigorous tomato plant. Excellent fruit set.',             true, 'Images/tomato-nova.jpg'],
        ['Tomato Ansal F1',             'vegetable',   6,  'seedling', 'fa-apple-whole', 'Determinate tomato. Good for processing.',                true, 'Images/tomato-ansal.jpg'],
        ['Tomato Terminator F1',        'vegetable',   4,  'seedling', 'fa-apple-whole', 'Disease tolerant tomato. Heavy producer.',                true, 'Images/terminator f1.png'],
        // Cabbages
        ['Cabbage Gloria F1',           'vegetable',   2.5,'seedling', 'fa-leaf',        'Crisp cabbage. Good head formation.',                     true, 'Images/gloria f1.png'],
        ['Cabbage Pructor F1',          'vegetable',   2,  'seedling', 'fa-leaf',        'Medium maturity cabbage. Resistant to bolting.',          true, 'Images/cabbage-pructor.jpg'],
        ['Cabbage Kilimo F1',           'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding variety. Suitable for Kenya.',              true, 'Images/cabbage-kilimo.jpg'],
        ['Cabbage Queen F1',            'vegetable',   2,  'seedling', 'fa-leaf',        'Large head cabbage. Excellent storage.',                  true, 'Images/cabbage-queen.jpg'],
        ['Cabbage Victoria F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'Uniform heads. Good market quality.',                     true, 'Images/cabbage-victoria.jpg'],
        ['Cabbage Faida',               'vegetable',   2,  'seedling', 'fa-leaf',        'Reliable cabbage variety. Good yield.',                   true, 'Images/cabbage-faida.jpg'],
        ['Cabbage Powerslam',           'vegetable',   2,  'seedling', 'fa-leaf',        'Heavy producing cabbage. Disease resistant.',             true, 'Images/cabbage-powerslam.jpg'],
        ['Red Cabbage',                 'vegetable',   4,  'seedling', 'fa-leaf',        'Colorful red cabbage. Nutritious and tasty.',             true, 'Images/red cabbage.png'],
        // Spinach
        ['Spinach Fordhook Giant',      'vegetable',   2,  'seedling', 'fa-leaf',        'Large leaf spinach. Fast growing.',                        true, 'Images/spinach-fordhook.jpg'],
        // Sukumawiki (Kale)
        ['Sukumawiki Ahadi F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding sukuma wiki. Disease resistant.',           true, 'Images/sukumawiki-ahadi.jpg'],
        ['Sukumawiki Spinner',          'vegetable',   2,  'seedling', 'fa-leaf',        'Tender leaves. Good for continuous harvest.',               true, 'Images/sukumawiki-spinner.jpg'],
        ['Sukumawiki Tausi',            'vegetable',   2,  'seedling', 'fa-leaf',        'African kale variety. Heat tolerant.',                      true, 'Images/sukumawiki-tausi.jpg'],
        ['Sukumawiki Top Bunch',        'vegetable',   2,  'seedling', 'fa-leaf',        'Vigorous growth. Large bunch formation.',                 true, 'Images/sukumawiki-topbunch.jpg'],
        ['Sukumawiki Thousand Headed',   'vegetable',   2,  'seedling', 'fa-leaf',        'Multiple harvest variety. Continuous production.',          true, 'Images/sukumawiki-thousand.jpg'],
        ['Curly Kales Malkia F1',       'vegetable',   3,  'seedling', 'fa-leaf',        'Curly leaf kale. Ornamental and edible.',                 true, 'Images/malika f1.png'],
        // Capsicum
        ['Capsicum Calypso',            'vegetable',   4,  'seedling', 'fa-pepper-hot',  'Bell pepper variety. Sweet flavor.',                        true, 'Images/capsicum-calypso.jpg'],
        ['Capsicum Superbell',          'vegetable',   4,  'seedling', 'fa-pepper-hot',  'Large bell pepper. Thick walls.',                         true, 'Images/capsicum-superbell.jpg'],
        ['Capsicum Superwonder',        'vegetable',   4,  'seedling', 'fa-pepper-hot',  'High yielding capsicum. Disease resistant.',              true, 'Images/capsicum-superwonder.jpg'],
        ['Capsicum Victory Red',        'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red bell pepper. Sweet and crisp.',                       true, 'Images/capsicum-victoryred.jpg'],
        ['Capsicum Victory Yellow',     'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow bell pepper. Vibrant color.',                      true, 'Images/capsicum-victoryyellow.jpg'],
        ['Capsicum Nyuki Yellow',       'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow Nyuki pepper. Hot variety.',                       true, 'Images/capsicum-nyuki-yellow.jpg'],
        ['Capsicum Nyuki Red',          'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red Nyuki pepper. Hot variety.',                          true, 'Images/capsicum-nyuki-red.jpg'],
        // Peppers
        ['Pepper Birdseye',             'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Hot birdseye pepper. Very spicy.',                          true, 'Images/pepper-birdseye.jpg'],
        ['Pepper Red Thunder',          'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Hot red pepper. Excellent for chili.',                      true, 'Images/red thunder.png'],
        // Beetroot
        ['Beetroot',                    'vegetable',   4,  'seedling', 'fa-circle',      'Sweet red beetroot. Nutritious root vegetable.',           true, 'Images/beetroot.png'],
        // Cauliflower
        ['Cauliflower Bella',           'vegetable',   3,  'seedling', 'fa-seedling',    'White cauliflower. Compact head.',                          true, 'Images/cauliflower-bella.jpg'],
        // Broccoli
        ['Broccoli Titanic',            'vegetable',   3,  'seedling', 'fa-seedling',    'Large broccoli head. Cold tolerant.',                       true, 'Images/broccoli-titanic.jpg'],
        ['Broccoli Harriet',            'vegetable',   3,  'seedling', 'fa-seedling',    'Early maturing broccoli. Good flavor.',                     true, 'Images/broccoli-harriet.jpg'],
        // Watermelon
        ['Watermelon Sukari',           'vegetable',   6,  'seedling', 'fa-apple-whole', 'Sweet red flesh watermelon. Large fruits.',                 true, 'Images/watermelon-sukari.jpg'],
        // Terere (Amaranth)
        ['Terere Amaranthus',           'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional leafy vegetable. Nutritious.',                  true, 'Images/terere-amaranthus.jpg'],
        // Manangu (Nightshade)
        ['Manangu Giant Nightshade',    'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional vegetable. Heat tolerant.',                     true, 'Images/manangu-nightshade.jpg'],
        // Lettuce
        ['Lettuce Pixie',               'vegetable',   3,  'seedling', 'fa-leaf',        'Mini lettuce variety. Compact heads.',                      true, 'Images/lettuce-pixie.jpg'],
        ['Lettuce Tangerine',           'vegetable',   3,  'seedling', 'fa-leaf',        'Orange lettuce. Unique color.',                             true, 'Images/lettuce-tangerine.jpg'],
        ['Lettuce Washington',          'vegetable',   3,  'seedling', 'fa-leaf',        'Butterhead lettuce. Tender leaves.',                        true, 'Images/lettuce-washington.jpg'],
        // Cucumber
        ['Cucumber Ashley',             'vegetable',   6,  'seedling', 'fa-leaf',        'Cucumber variety. Good yield.',                             true, 'Images/cucumber-ashley.jpg'],
        // Courgette
        ['Courgette Zucchini',          'vegetable',   6,  'seedling', 'fa-leaf',        'Zucchini squash. Productive variety.',                      true, 'Images/courgette-zucchini.jpg'],
        // Fruits
        ['Hass Avocado',                'fruit',       150,'seedling', 'fa-tree',        'Premium Hass avocado. High market value.',                  true, 'Images/avocado-hass.jpg'],
        ['Strawberry',                  'fruit',       50, 'seedling', 'fa-apple-whole', 'Sweet strawberry. Runner production.',                      true, 'Images/strawberry.jpg'],
        ['Mango Tommy',                 'fruit',       150,'seedling', 'fa-tree',        'Tommy Atkins mango. Red blush skin.',                       true, 'Images/mango-tommy.jpg'],
        ['Mango Apple',                 'fruit',       150,'seedling', 'fa-tree',        'Apple mango variety. Sweet and juicy.',                     true, 'Images/mango-apple.jpg'],
        ['Green Apple',                 'fruit',       500,'seedling', 'fa-tree',        'Green apple tree. Tart fruits.',                            true, 'Images/green-apple.jpg'],
        ['Red Apple',                   'fruit',       500,'seedling', 'fa-tree',        'Red apple tree. Sweet fruits.',                             true, 'Images/red-apple.jpg'],
        ['Dragon Fruit',                'fruit',       450,'seedling', 'fa-seedling',    'Exotic dragon fruit. Vibrant color.',                       true, 'Images/dragon-fruit.jpg'],
        ['Passion Purple',              'fruit',       50, 'seedling', 'fa-flower',      'Purple passion fruit. Sweet flavor.',                       true, 'Images/passion-purple.jpg'],
        ['Passion Yellow',              'fruit',       50, 'seedling', 'fa-flower',      'Yellow passion fruit. Tangy taste.',                        true, 'Images/passion-yellow.jpg'],
        ['Sweet Granadilla',            'fruit',       50, 'seedling', 'fa-flower',      'Sweet granadilla. Delicious fruit.',                        true, 'Images/granadilla.jpg'],
        ['Tree Tomato',                 'fruit',       50, 'seedling', 'fa-apple-whole', 'Tree tomato. Unique flavor.',                               true, 'Images/tree-tomato.jpg'],
        ['Pawpaw Sharp F1',             'fruit',       100,'seedling', 'fa-tree',        'Sharp pawpaw variety. Tropical fruit.',                       true, 'Images/pawpaw-sharp.jpg'],
        ['Pawpaw Red Royale',           'fruit',       150,'seedling', 'fa-tree',        'Red Royale pawpaw. Sweet and creamy.',                      true, 'Images/pawpaw-redroyale.jpg'],
        ['Pawpaw Vega F1',              'fruit',       200,'seedling', 'fa-tree',        'Vega pawpaw variety. High yield.',                          true, 'Images/pawpaw-vega.jpg'],
        ['Pawpaw Glory F1',             'fruit',       100,'seedling', 'fa-tree',        'Glory pawpaw variety. Good fruit quality.',                 true, 'Images/pawpaw-glory.jpg'],
        // Grains
        ['Maize (Hybrid)',              'grain',       5,  'seedling', 'fa-corn',        'High-yield hybrid maize. Drought tolerant.',              true, 'Images/maize-hybrid.jpg'],
        // Cash Crops
        ['Coffee (Arabica)',            'cash_crop',   25, 'seedling', 'fa-mug-hot',     'High-quality Arabica coffee seedlings.',                     true, 'Images/coffee-arabica.jpg'],
        ['Tea',                         'cash_crop',   15, 'seedling', 'fa-mug-hot',     'Selected tea clones. High yield.',                         true, 'Images/tea.jpg'],
        ['Sugarcane',                   'cash_crop',   10, 'seedling', 'fa-cane',        'High-sucrose sugarcane. Fast growing.',                      true, 'Images/sugarcane.jpg'],
        // Fodder
        ['Napier Grass',                'fodder',      3,  'seedling', 'fa-grass',       'Improved Napier. Excellent for dairy.',                      true, 'Images/napier-grass.jpg'],
        // Ornamental
        ['Jacaranda',                   'ornamental',  200,'seedling', 'fa-flower',      'Purple flowering tree. Landscaping.',                        true, 'Images/jacaranda.jpg'],
        // Trees
        ['Bamboo',                      'tree',        150,'seedling', 'fa-tree',        'Giant bamboo. Fast growing, versatile.',                   false, 'Images/bamboo.jpg'],
      ];
      for (const [name, category, price, unit, icon, description, in_stock, image] of seeds) {
        await pool.query(
          'INSERT INTO products (name, category, price, unit, icon, image, description, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [name, category, price, unit, icon, image, description, in_stock]
        );
      }
      console.log('✅ Seeded 55 products');
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
