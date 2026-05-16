require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const DB_PATH = path.join(__dirname, 'mkulima.db');
const db = new Database(DB_PATH);

// HTTPS redirect (for Render / production)
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

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    unit TEXT DEFAULT 'seedling',
    icon TEXT DEFAULT 'fa-seedling',
    description TEXT,
    in_stock INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    delivery TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    interest TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed products if empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, price, unit, icon, description, in_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const seeds = [
    ['Maize (Hybrid)', 'grain', 5, 'seedling', 'fa-corn', 'High-yield hybrid maize. Drought tolerant.', 1],
    ['Tomato (Rio Grande)', 'vegetable', 8, 'seedling', 'fa-apple-whole', 'Classic processing tomato. Heavy producer.', 1],
    ['Cabbage (Sukuma)', 'vegetable', 6, 'seedling', 'fa-leaf', 'Tender, fast-maturing cabbage variety.', 1],
    ['Kale (Sukuma Wiki)', 'vegetable', 5, 'seedling', 'fa-leaf', 'Popular Kenyan kale. High yield.', 1],
    ['Mango (Apple)', 'fruit', 80, 'seedling', 'fa-tree', 'Sweet dwarf mango. Fruits in 2-3 years.', 1],
    ['Avocado (Hass)', 'fruit', 120, 'seedling', 'fa-tree', 'Premium Hass avocado. High market value.', 1],
    ['Passion (Purple)', 'fruit', 30, 'seedling', 'fa-flower', 'Sweet purple passion. Vigorous climber.', 1],
    ['Coffee (Arabica)', 'cash_crop', 25, 'seedling', 'fa-mug-hot', 'High-quality Arabica coffee seedlings.', 1],
    ['Tea', 'cash_crop', 15, 'seedling', 'fa-mug-hot', 'Selected tea clones. High yield.', 1],
    ['Sugarcane', 'cash_crop', 10, 'seedling', 'fa-cane', 'High-sucrose sugarcane. Fast growing.', 1],
    ['Napier Grass', 'fodder', 3, 'seedling', 'fa-grass', 'Improved Napier. Excellent for dairy.', 1],
    ['Banana (Giant Cavendish)', 'fruit', 20, 'sucker', 'fa-tree', 'Large bunch banana. Reliable producer.', 1],
    ['Orange (Washington)', 'fruit', 60, 'seedling', 'fa-tree', 'Juicy navel orange. Disease resistant.', 1],
    ['Lemon', 'fruit', 50, 'seedling', 'fa-tree', 'Dwarf Meyer lemon. Year-round fruiting.', 1],
    ['Papaya (Mountain)', 'fruit', 15, 'seedling', 'fa-tree', 'Sweet mountain papaya. Early fruiting.', 1],
    ['Watermelon', 'vegetable', 8, 'seedling', 'fa-apple-whole', 'Sweet red flesh. Large fruits.', 1],
    ['Spinach', 'vegetable', 5, 'seedling', 'fa-leaf', 'Tender-leaf spinach. Fast growing.', 1],
    ['Onion (Red Creole)', 'vegetable', 4, 'seedling', 'fa-onion', 'Red onion. Pungent, good storage.', 1],
    ['Jacaranda', 'ornamental', 200, 'seedling', 'fa-flower', 'Purple flowering tree. Landscaping.', 1],
    ['Bamboo', 'tree', 150, 'seedling', 'fa-tree', 'Giant bamboo. Fast growing, versatile.', 0]
  ];
  seeds.forEach(s => insert.run(...s));
}

// API Routes

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
  const info = db.prepare(`
    INSERT INTO orders (product_id, product_name, customer_name, phone, quantity, delivery)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(product_id, product_name, customer_name, phone, quantity, delivery);
  res.json({ success: true, id: info.lastInsertRowid });
});

// POST contact message
app.post('/api/contacts', (req, res) => {
  const { name, phone, interest, message } = req.body;
  db.prepare('INSERT INTO contacts (name, phone, interest, message) VALUES (?, ?, ?, ?)')
    .run(name, phone, interest, message);
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌱 MKULIMA server running on port ${PORT}`);
});