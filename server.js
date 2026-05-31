require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

// ── Admin password hashing ───────────────────────────────────────────────────
const SALT_ROUNDS = 10;
let hashedAdminPassword = null;
const validTokens = new Set(); // Store valid tokens in memory

// Hash the admin password on startup
async function hashAdminPassword() {
  const pwd = process.env.ADMIN_PASSWORD || 'mkulima';
  hashedAdminPassword = await bcrypt.hash(pwd, SALT_ROUNDS);
  console.log('✅ Admin password hashed and ready (password: ' + pwd + ')');
}

// ── In-memory fallback store (used when MongoDB is unavailable) ──────────
let useDb = false;
let inMemoryProducts = [];
let inMemoryOrders = [];
let inMemoryContacts = [];
let nextProductId = 1;
let nextOrderId = 1;
let nextContactId = 1;

// Seed data for in-memory mode — 57 products matching mku.html
const SEED_PRODUCTS = [
  // TOMATOES
  ['Tomato Zara F1',              'vegetable',   4,  'seedling', 'fa-apple-whole', 'High-yielding F1 hybrid tomato. Disease resistant, excellent for all growing zones.',           true, 'Images/zara f1.png'],
  ['Tomato Nova F1',              'vegetable',   5,  'seedling', 'fa-apple-whole', 'F1 hybrid variety with uniform fruits. Good shelf life and transportability.',             true, 'Images/nova f1.png'],
  ['Tomato Ansal F1',             'vegetable',   6,  'seedling', 'fa-apple-whole', 'Disease resistant F1 hybrid. Produces large, firm fruits with excellent flavor.',                true, 'Images/ansali f1.png'],
  ['Tomato Terminator F1',        'vegetable',   4,  'seedling', 'fa-apple-whole', 'High yielding F1 hybrid with good fruit setting. Suitable for greenhouse and open field.',                true, 'Images/terminator f1.png'],
  // CABBAGES
  ['Cabbage Gloria F1',           'vegetable',   2.5,'seedling', 'fa-leaf',        'F1 hybrid cabbage with excellent head formation. Good for fresh market and storage.',                     true, 'Images/gloria f1.png'],
  ['Cabbage Pructor F1',          'vegetable',   2,  'seedling', 'fa-leaf',        'Medium maturity F1 hybrid. Produces firm, round heads with good wrapper leaves.',          true, 'Images/pruktor f1.png'],
  ['Cabbage Kilimo F1',           'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding variety suitable for commercial production. Good disease resistance.',              true, 'Images/kilimo f1.png'],
  ['Cabbage Queen F1',            'vegetable',   2,  'seedling', 'fa-leaf',        'F1 hybrid with uniform heads. Excellent for processing and fresh consumption.',                  true, 'Images/queen f1.png'],
  ['Cabbage Victoria F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'Reliable F1 hybrid with good head size and excellent storage qualities.',                     true, 'Images/victoria f1.png'],
  ['Cabbage Faida',               'vegetable',   2,  'seedling', 'fa-leaf',        'Open pollinated variety with good market acceptance. Medium maturity.',                   true, 'Images/faida.png'],
  ['Cabbage Powerslam',           'vegetable',   2,  'seedling', 'fa-leaf',        'High yielding cabbage variety. Produces large, compact heads.',             true, 'Images/powerslam.png'],
  ['Red Cabbage',                 'vegetable',   4,  'seedling', 'fa-leaf',        'Red/purple cabbage variety. Rich in antioxidants, good for fresh and processing.',             true, 'Images/red cabbage.png'],
  // SPINACH
  ['Spinach Fordhook',            'vegetable',   2,  'seedling', 'fa-leaf',        'Large leaf spinach variety. Tender leaves, excellent for cooking and salads.',                        true, 'Images/fordhook giant.png'],
  ['Spinach Giant',               'vegetable',   2,  'seedling', 'fa-leaf',        'Giant leaf variety with excellent yield. Good for commercial production.',                     true, 'Images/giant.png'],
  // SUKUMAWIKI (KALE)
  ['Sukumawiki Ahadi F1',         'vegetable',   2,  'seedling', 'fa-leaf',        'F1 hybrid kale with tender leaves. High yielding and disease resistant.',           true, 'Images/ahadi f1.png'],
  ['Sukumawiki Spinner',          'vegetable',   2,  'seedling', 'fa-leaf',        'Leafy kale variety with excellent flavor. Good for continuous harvesting.',               true, 'Images/spinner.png'],
  ['Sukumawiki Tausi',            'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional kale variety with good market demand. Easy to grow.',                      true, 'Images/tausi.png'],
  ['Sukumawiki Top Bunch',        'vegetable',   2,  'seedling', 'fa-leaf',        'Vigorous growing kale with dark green leaves. High yield potential.',                 true, 'Images/topbunch.png'],
  ['Sukumawiki Thousand Headed',   'vegetable',   2,  'seedling', 'fa-leaf',        'Produces numerous side shoots. Excellent for continuous harvest.',          true, 'Images/headed thao.png'],
  ['Curly Kales Malkia F1',       'vegetable',   3,  'seedling', 'fa-leaf',        'F1 hybrid curly kale with attractive leaves. Good for fresh market.',                 true, 'Images/malkia.png'],
  // CAPSICUM
  ['Capsicum Calypso',            'vegetable',   4,  'seedling', 'fa-pepper-hot',  'Blocky bell pepper variety. Produces uniform fruits with thick walls.',                        true, 'Images/calypso f1.png'],
  ['Capsicum Superbell',          'vegetable',   4,  'seedling', 'fa-pepper-hot',  'High yielding bell pepper. Good for greenhouse and open field production.',                         true, 'Images/superbell f1.png'],
  ['Capsicum Superwonder',        'vegetable',   4,  'seedling', 'fa-pepper-hot',  'F1 hybrid with excellent fruit set. Produces large, uniform fruits.',              true, 'Images/hybridmanagu.png'],
  ['Capsicum Victory Red',        'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red blocky pepper variety. Excellent color and taste. High market value.',                       true, 'Images/victory red.png'],
  ['Capsicum Victory Yellow',     'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow bell pepper with attractive fruits. Good for fresh market and processing.',                      true, 'Images/vegetable.png'],
  ['Capsicum Nyuki Yellow',       'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Yellow hot pepper variety. High yielding with good pungency.',                       true, 'Images/vegetable.png'],
  ['Capsicum Nyuki Red',          'vegetable',   15, 'seedling', 'fa-pepper-hot',  'Red hot pepper with excellent color. Good for processing and fresh use.',                          true, 'Images/tracy f1.png'],
  // PEPPERS
  ['Pepper Birdseye',             'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Hot birdseye pepper. Small fruits with intense heat. Good for drying and processing.',                          true, 'Images/vegetable.png'],
  ['Pepper Red Thunder',          'vegetable',   5,  'seedling', 'fa-pepper-hot',  'Red hot pepper variety. High yielding with good fruit size.',                      true, 'Images/red thunder.png'],
  // CAULIFLOWER
  ['Cauliflower Bella',           'vegetable',   3,  'seedling', 'fa-seedling',    'White cauliflower with good head formation. Suitable for fresh market.',                          true, 'Images/vegetable.png'],
  // BROCCOLI
  ['Broccoli Titanic',            'vegetable',   3,  'seedling', 'fa-seedling',    'Large head broccoli variety. Good for commercial production and fresh market.',                       true, 'Images/vegetable.png'],
  ['Broccoli Harriet',            'vegetable',   3,  'seedling', 'fa-seedling',    'F1 hybrid broccoli with excellent head quality. Good disease resistance.',                     true, 'Images/vegetable.png'],
  // WATERMELON
  ['Watermelon Sukari',           'fruit',       6,  'seedling', 'fa-apple-whole', 'Sweet red fleshed watermelon. High sugar content, excellent for fresh consumption.',                 true, 'Images/eggplantblackbeauty.png'],
  // TERERE (AMARANTHUS)
  ['Terere Amaranthus',           'vegetable',   2,  'seedling', 'fa-leaf',        'Traditional leafy vegetable. Fast growing with excellent nutritional value.',                  true, 'Images/amaranthus.png'],
  // MANAGU (NIGHTSHADE)
  ['Managu Giant Nightshade',     'vegetable',   2,  'seedling', 'fa-leaf',        'Leafy nightshade variety. Popular traditional vegetable with good market demand.',                     true, 'Images/hybridmanagu.png'],
  // LETTUCE
  ['Lettuce',                     'vegetable',   3,  'seedling', 'fa-leaf',        'Leafy lettuce variety. Good for salads and fresh consumption.',                     true, 'Images/tracy f1.png'],
  // BEETROOT
  ['Beetroot',                    'vegetable',   4,  'seedling', 'fa-circle',      'Root vegetable with excellent color and taste. Good for fresh and processing.',           true, 'Images/beetroot.png'],
  // CUCUMBER
  ['Cucumber Ashley',             'vegetable',   6,  'seedling', 'fa-leaf',        'F1 hybrid cucumber with excellent fruit quality. Good for greenhouse production.',                             true, 'Images/ashley f1.png'],
  // COURGETTE
  ['Courgette Zucchini',          'vegetable',   6,  'seedling', 'fa-leaf',        'Summer squash variety. High yielding with tender fruits. Good for fresh market.',                      true, 'Images/courgette.png'],
  // ORANGES
  ['Orange Pixie',                'fruit',       200,'seedling', 'fa-apple-whole', 'Easy peelers variety. Sweet and juicy fruits. Early maturing.',                      true, 'Images/orange pixie.png'],
  ['Tangarine',                   'fruit',       200,'seedling', 'fa-apple-whole', 'Mandarin variety with easy peel skin. Sweet flavor, good for fresh consumption.',                       true, 'Images/Tangarine orange.png'],
  ['Orange Washington',           'fruit',       200,'seedling', 'fa-apple-whole', 'Navel orange variety. Seedless with excellent taste. Good storage qualities.',                true, 'Images/washington.png'],
  // AVOCADO
  ['Hass Avocado',                'fruit',       150,'seedling', 'fa-tree',        'Premium grafted Hass avocado. High yield, disease resistant. Ideal for export.',                  true, 'Images/Grafted hass ovacado.png'],
  // STRAWBERRY
  ['Strawberry',                  'fruit',       50, 'seedling', 'fa-apple-whole', 'Sweet strawberry variety. High yielding with excellent fruit quality.',                      true, 'Images/straw.png'],
  // MANGOES
  ['Mango Tommy',                 'fruit',       150,'seedling', 'fa-tree',        'Local mango variety with excellent flavor. Good for fresh consumption.',                       true, 'Images/mangoes.png'],
  ['Apple Mangoes',               'fruit',       150,'seedling', 'fa-tree',        'Apple mango variety with fiberless flesh. Sweet taste and aromatic.',                     true, 'Images/applemangos.png'],
  // APPLES
  ['Green Apple',                 'fruit',       500,'seedling', 'fa-tree',        'Green apple variety with tart flavor. Good for processing and fresh market.',                            true, 'Images/greenapple.png'],
  ['Red Apple',                   'fruit',       500,'seedling', 'fa-tree',        'Red apple tree. Sweet fruits.',                             true, 'Images/redapple.png'],
  // DRAGON FRUIT
  ['Dragon Fruit',                'fruit',       450,'seedling', 'fa-seedling',    'Exotic dragon fruit plant. High value crop with growing market demand.',                       true, 'Images/dragonf.png'],
  // PASSION FRUIT
  ['Passion Purple Passion',      'fruit',       50, 'seedling', 'fa-flower',      'Purple passion fruit variety. High yielding with excellent flavor.',                       true, 'Images/grafted passion p.png'],
  ['Passion Yellow Passion',      'fruit',       50, 'seedling', 'fa-flower',      'Yellow passion fruit variety. Good for juice production and fresh market.',                      true, 'Images/yellowpassion.png'],
  ['Passion Sweet Granadilla',    'fruit',       50, 'seedling', 'fa-flower',      'Sweet granadilla variety. Delicious flavor with high market value.',                        true, 'Images/purple passion.png'],
  // TREE TOMATOES
  ['Tree Tomatoes',               'fruit',       50, 'seedling', 'fa-apple-whole', 'Tree tomato (tamarillo) seedlings. High yielding with excellent taste.',                               true, 'Images/tree tomatoes.png'],
  // PAWPAW (PAPAYA)
  ['Pawpaw Sharp F1',             'fruit',       100,'seedling', 'fa-tree',        'F1 hybrid papaya with good fruit quality. Disease resistant and high yielding.',                       true, 'Images/sharp f1.png'],
  ['Pawpaw Red Royale',           'fruit',       150,'seedling', 'fa-tree',        'Red fleshed papaya variety. Sweet taste with excellent market appeal.',                      true, 'Images/redroyal f1.png'],
  ['Pawpaw Vega F1',              'fruit',       200,'seedling', 'fa-tree',        'Premium F1 hybrid papaya. Large fruits with excellent flavor.',                          true, 'Images/pawpaw.png'],
  ['Pawpaw Glory F1',             'fruit',       100,'seedling', 'fa-tree',        'F1 hybrid papaya with good yield potential. Suitable for commercial production.',                 true, 'Images/glory f1.png'],
];

// ── MongoDB connection ───────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/mkulima';

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    useDb = true;
    return true;
  } catch (err) {
    console.log('⚠️ MongoDB unavailable, using in-memory store');
    useDb = false;
    return false;
  }
}

// Import models
const Product = require('./models/Product');
const Order = require('./models/Order');
const Contact = require('./models/Contact');

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
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  // Check if token is in the valid tokens set
  if (validTokens.has(token)) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

// ── Database helpers ─────────────────────────────────────────────────────────

/** Seed the in-memory store (called when MongoDB is unavailable). */
function seedInMemory() {
  if (inMemoryProducts.length > 0) return; // already seeded
  for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
    inMemoryProducts.push({
      id: nextProductId++,
      name, category, price, unit, icon, description, in_stock, image,
      inStock: in_stock
    });
  }
  console.log('✅ Seeded', inMemoryProducts.length, 'products (in-memory mode)');
}

// Initialize database + seed
async function initDb() {
  const connected = await connectMongoDB();
  
  if (connected) {
    // Seed products only if collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
        await Product.create({
          name, category, price, unit, icon, image, description, in_stock
        });
      }
      console.log('✅ Seeded 57 products');
    }
  } else {
    seedInMemory();
  }
}

// Root redirect → main HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'mku.html')));

// Products page
app.get('/products.html', (_, res) => res.sendFile(path.join(__dirname, 'products.html')));

// Admin page
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin.html', (_, res) => res.sendFile(path.join(__dirname, 'admin.html')));

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
    const products = await Product.find().sort({ _id: 1 });
    res.json(products.map(p => ({ ...p.toObject(), inStock: p.in_stock })));
  } else {
    res.json(inMemoryProducts.map(p => ({ ...p, inStock: p.in_stock })));
  }
});

// PUT toggle stock
app.put('/api/products/:id/stock', authenticateAdmin, async (req, res) => {
  const { in_stock } = req.body;
  if (useDb) {
    await Product.findByIdAndUpdate(req.params.id, { in_stock });
  } else {
    const p = inMemoryProducts.find(p => p.id === Number(req.params.id));
    if (p) p.in_stock = in_stock;
  }
  res.json({ success: true });
});

// PUT update product
app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, price, unit, icon, image, description, in_stock } = req.body;

  // Validate required fields
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  if (useDb) {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { name, category, price, unit: unit || 'seedling', icon: icon || 'fa-seedling', image, description, in_stock: !!in_stock },
        { new: true }
      );
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true, product: { ...product.toObject(), inStock: product.in_stock } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    const p = inMemoryProducts.find(p => p.id === Number(id));
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }
    p.name = name;
    p.category = category;
    p.price = price;
    p.unit = unit || 'seedling';
    p.icon = icon || 'fa-seedling';
    p.image = image;
    p.description = description;
    p.in_stock = !!in_stock;
    res.json({ success: true, product: { ...p, inStock: p.in_stock } });
  }
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const { product_id, product_name, customer_name, phone, quantity, price, delivery } = req.body;
  if (useDb) {
    const order = await Order.create({
      product_id, product_name, customer_name, phone, quantity, price, delivery
    });
    res.json({ success: true, id: order._id });
  } else {
    const id = nextOrderId++;
    inMemoryOrders.push({ id, product_id, product_name, customer_name, phone, quantity, price, delivery, status: 'pending', created_at: new Date().toISOString() });
    res.json({ success: true, id });
  }
});

// POST contact message
app.post('/api/contacts', async (req, res) => {
  const { name, phone, interest, message } = req.body;
  if (useDb) {
    await Contact.create({ name, phone, interest, message });
  } else {
    const id = nextContactId++;
    inMemoryContacts.push({ id, name, phone, interest, message, created_at: new Date().toISOString() });
  }
  res.json({ success: true });
});

// POST admin login
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;

  if (hashedAdminPassword && password) {
    const isValid = await bcrypt.compare(password, hashedAdminPassword);
    if (isValid) {
      const token = 'admin-' + Date.now();
      validTokens.add(token);
      res.json({
        success: true,
        token
      });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// POST reset database (admin only) - clears and re-seeds products
app.post('/api/admin/reset', authenticateAdmin, async (req, res) => {
  try {
    if (useDb) {
      await Product.deleteMany({});
      
      for (const [name, category, price, unit, icon, description, in_stock, image] of SEED_PRODUCTS) {
        await Product.create({
          name, category, price, unit, icon, image, description, in_stock
        });
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
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders.map(o => o.toObject()));
  } else {
    res.json([...inMemoryOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// PUT update order status (admin)
app.put('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    if (useDb) {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true, order: order.toObject() });
    } else {
      const orderIndex = inMemoryOrders.findIndex(o => o.id === Number(req.params.id));
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }
      inMemoryOrders[orderIndex].status = status;
      res.json({ success: true, order: inMemoryOrders[orderIndex] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});

// GET all contacts (admin)
app.get('/api/admin/contacts', authenticateAdmin, async (_, res) => {
  if (useDb) {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts.map(c => c.toObject()));
  } else {
    res.json([...inMemoryContacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// GET all products (admin)
app.get('/api/admin/products', authenticateAdmin, async (_, res) => {
  if (useDb) {
    const products = await Product.find().sort({ _id: 1 });
    res.json(products.map(p => ({ ...p.toObject(), inStock: p.in_stock })));
  } else {
    res.json(inMemoryProducts.map(p => ({ ...p, inStock: p.in_stock })));
  }
});

// POST new product (admin)
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  const { name, category, price, unit, icon, image, description, in_stock } = req.body;
  
  // Basic validation
  if (!name || !category || !price || !image) {
    return res.status(400).json({ error: 'Name, category, price, and image are required' });
  }
  
  try {
    if (useDb) {
      const product = await Product.create({
        name, category, price, unit: unit || 'seedling', icon: icon || 'fa-seedling', image, description, in_stock: !!in_stock
      });
      res.json({ success: true, product: { ...product.toObject(), inStock: product.in_stock } });
    } else {
      const product = {
        id: nextProductId++,
        name,
        category,
        price,
        unit: unit || 'seedling',
        icon: icon || 'fa-seedling',
        image,
        description: description || '',
        in_stock: !!in_stock,
        inStock: !!in_stock
      };
      inMemoryProducts.push(product);
      res.json({ success: true, product });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// PUT update product (admin)
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { name, category, price, unit, icon, image, description, in_stock } = req.body;
  
  // Basic validation
  if (!name || !category || !price || !image) {
    return res.status(400).json({ error: 'Name, category, price, and image are required' });
  }
  
  try {
    if (useDb) {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, category, price, unit: unit || 'seedling', icon: icon || 'fa-seedling', image, description, in_stock: !!in_stock },
        { new: true }
      );
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, product: { ...product.toObject(), inStock: product.in_stock } });
    } else {
      const productIndex = inMemoryProducts.findIndex(p => p.id === Number(req.params.id));
      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      inMemoryProducts[productIndex] = {
        ...inMemoryProducts[productIndex],
        name,
        category,
        price,
        unit: unit || 'seedling',
        icon: icon || 'fa-seedling',
        image,
        description: description || '',
        in_stock: !!in_stock,
        inStock: !!in_stock
      };
      
      res.json({ success: true, product: inMemoryProducts[productIndex] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// DELETE product (admin)
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    if (useDb) {
      const product = await Product.findByIdAndDelete(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      const productIndex = inMemoryProducts.findIndex(p => p.id === Number(req.params.id));
      if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      inMemoryProducts.splice(productIndex, 1);
      res.json({ success: true, message: 'Product deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});

// Start
const PORT = process.env.PORT || 3000;
async function startServer() {
  await hashAdminPassword();
  await initDb().catch(err => {
    console.error('DB init error:', err);
    seedInMemory();
  });
  app.listen(PORT, () => console.log(`🌱 MKULIMA server running on port ${PORT}`));
}
startServer();