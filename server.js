require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { connectDB, Farmer, Seedling, Distribution, Product, Order, Contact } = require('./models');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Since your package.json uses the cors package

// ── Admin password hashing ───────────────────────────────────────────────────
const SALT_ROUNDS = 10;
let hashedAdminPassword = null;
const validTokens = new Set();

// Hash the admin password on startup
async function hashAdminPassword() {
  const pwd = process.env.ADMIN_PASSWORD || 'mkulima';
  hashedAdminPassword = await bcrypt.hash(pwd, SALT_ROUNDS);
  console.log('✅ Admin password hashed and ready (password: ' + pwd + ')');
}

// ── File Upload Configuration ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'seedling-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// ── Seed data for products ───────────────────────────────────────────────────
const SEED_PRODUCTS = [
  // TOMATOES
  ['Tomato Zara F1', 'vegetable', 4, 'seedling', 'fa-apple-whole', 'High-yielding F1 hybrid tomato. Disease resistant, excellent for all growing zones.', true, 'Images/zara f1.png'],
  ['Tomato Nova F1', 'vegetable', 5, 'seedling', 'fa-apple-whole', 'F1 hybrid variety with uniform fruits. Good shelf life and transportability.', true, 'Images/nova f1.png'],
  ['Tomato Ansal F1', 'vegetable', 6, 'seedling', 'fa-apple-whole', 'Disease resistant F1 hybrid. Produces large, firm fruits with excellent flavor.', true, 'Images/ansali f1.png'],
  ['Tomato Terminator F1', 'vegetable', 4, 'seedling', 'fa-apple-whole', 'High yielding F1 hybrid with good fruit setting. Suitable for greenhouse and open field.', true, 'Images/terminator f1.png'],
  // CABBAGES
  ['Cabbage Gloria F1', 'vegetable', 2.5, 'seedling', 'fa-leaf', 'F1 hybrid cabbage with excellent head formation. Good for fresh market and storage.', true, 'Images/gloria f1.png'],
  ['Cabbage Pructor F1', 'vegetable', 2, 'seedling', 'fa-leaf', 'Medium maturity F1 hybrid. Produces firm, round heads with good wrapper leaves.', true, 'Images/pruktor f1.png'],
  ['Cabbage Kilimo F1', 'vegetable', 2, 'seedling', 'fa-leaf', 'High yielding variety suitable for commercial production. Good disease resistance.', true, 'Images/kilimo f1.png'],
  ['Cabbage Queen F1', 'vegetable', 2, 'seedling', 'fa-leaf', 'F1 hybrid with uniform heads. Excellent for processing and fresh consumption.', true, 'Images/queen f1.png'],
  ['Cabbage Victoria F1', 'vegetable', 2, 'seedling', 'fa-leaf', 'Reliable F1 hybrid with good head size and excellent storage qualities.', true, 'Images/victoria f1.png'],
  ['Cabbage Faida', 'vegetable', 2, 'seedling', 'fa-leaf', 'Open pollinated variety with good market acceptance. Medium maturity.', true, 'Images/faida.png'],
  ['Cabbage Powerslam', 'vegetable', 2, 'seedling', 'fa-leaf', 'High yielding cabbage variety. Produces large, compact heads.', true, 'Images/powerslam.png'],
  ['Red Cabbage', 'vegetable', 4, 'seedling', 'fa-leaf', 'Red/purple cabbage variety. Rich in antioxidants, good for fresh and processing.', true, 'Images/red cabbage.png'],
  // SPINACH
  ['Spinach Fordhook', 'vegetable', 2, 'seedling', 'fa-leaf', 'Large leaf spinach variety. Tender leaves, excellent for cooking and salads.', true, 'Images/fordhook giant.png'],
  ['Spinach Giant', 'vegetable', 2, 'seedling', 'fa-leaf', 'Giant leaf variety with excellent yield. Good for commercial production.', true, 'Images/giant.png'],
  // SUKUMAWIKI (KALE)
  ['Sukumawiki Ahadi F1', 'vegetable', 2, 'seedling', 'fa-leaf', 'F1 hybrid kale with tender leaves. High yielding and disease resistant.', true, 'Images/ahadi f1.png'],
  ['Sukumawiki Spinner', 'vegetable', 2, 'seedling', 'fa-leaf', 'Leafy kale variety with excellent flavor. Good for continuous harvesting.', true, 'Images/spinner.png'],
  ['Sukumawiki Tausi', 'vegetable', 2, 'seedling', 'fa-leaf', 'Traditional kale variety with good market demand. Easy to grow.', true, 'Images/tausi.png'],
  ['Sukumawiki Top Bunch', 'vegetable', 2, 'seedling', 'fa-leaf', 'Vigorous growing kale with dark green leaves. High yield potential.', true, 'Images/topbunch.png'],
  ['Sukumawiki Thousand Headed', 'vegetable', 2, 'seedling', 'fa-leaf', 'Produces numerous side shoots. Excellent for continuous harvest.', true, 'Images/headed thao.png'],
  ['Curly Kales Malkia F1', 'vegetable', 3, 'seedling', 'fa-leaf', 'F1 hybrid curly kale with attractive leaves. Good for fresh market.', true, 'Images/malkia.png'],
  // CAPSICUM
  ['Capsicum Calypso', 'vegetable', 4, 'seedling', 'fa-pepper-hot', 'Blocky bell pepper variety. Produces uniform fruits with thick walls.', true, 'Images/calypso f1.png'],
  ['Capsicum Superbell', 'vegetable', 4, 'seedling', 'fa-pepper-hot', 'High yielding bell pepper. Good for greenhouse and open field production.', true, 'Images/superbell f1.png'],
  ['Capsicum Superwonder', 'vegetable', 4, 'seedling', 'fa-pepper-hot', 'F1 hybrid with excellent fruit set. Produces large, uniform fruits.', true, 'Images/hybridmanagu.png'],
  ['Capsicum Victory Red', 'vegetable', 15, 'seedling', 'fa-pepper-hot', 'Red blocky pepper variety. Excellent color and taste. High market value.', true, 'Images/victory red.png'],
  ['Capsicum Victory Yellow', 'vegetable', 15, 'seedling', 'fa-pepper-hot', 'Yellow bell pepper with attractive fruits. Good for fresh market and processing.', true, 'Images/vegetable.png'],
  ['Capsicum Nyuki Yellow', 'vegetable', 15, 'seedling', 'fa-pepper-hot', 'Yellow hot pepper variety. High yielding with good pungency.', true, 'Images/vegetable.png'],
  ['Capsicum Nyuki Red', 'vegetable', 15, 'seedling', 'fa-pepper-hot', 'Red hot pepper with excellent color. Good for processing and fresh use.', true, 'Images/tracy f1.png'],
  // PEPPERS
  ['Pepper Birdseye', 'vegetable', 5, 'seedling', 'fa-pepper-hot', 'Hot birdseye pepper. Small fruits with intense heat. Good for drying and processing.', true, 'Images/vegetable.png'],
  ['Pepper Red Thunder', 'vegetable', 5, 'seedling', 'fa-pepper-hot', 'Red hot pepper variety. High yielding with good fruit size.', true, 'Images/red thunder.png'],
  // CAULIFLOWER
  ['Cauliflower Bella', 'vegetable', 3, 'seedling', 'fa-seedling', 'White cauliflower with good head formation. Suitable for fresh market.', true, 'Images/vegetable.png'],
  // BROCCOLI
  ['Broccoli Titanic', 'vegetable', 3, 'seedling', 'fa-seedling', 'Large head broccoli variety. Good for commercial production and fresh market.', true, 'Images/vegetable.png'],
  ['Broccoli Harriet', 'vegetable', 3, 'seedling', 'fa-seedling', 'F1 hybrid broccoli with excellent head quality. Good disease resistance.', true, 'Images/vegetable.png'],
  // WATERMELON
  ['Watermelon Sukari', 'fruit', 6, 'seedling', 'fa-apple-whole', 'Sweet red fleshed watermelon. High sugar content, excellent for fresh consumption.', true, 'Images/eggplantblackbeauty.png'],
  // TERERE (AMARANTHUS)
  ['Terere Amaranthus', 'vegetable', 2, 'seedling', 'fa-leaf', 'Traditional leafy vegetable. Fast growing with excellent nutritional value.', true, 'Images/amaranthus.png'],
  // MANAGU (NIGHTSHADE)
  ['Managu Giant Nightshade', 'vegetable', 2, 'seedling', 'fa-leaf', 'Leafy nightshade variety. Popular traditional vegetable with good market demand.', true, 'Images/hybridmanagu.png'],
  // LETTUCE
  ['Lettuce', 'vegetable', 3, 'seedling', 'fa-leaf', 'Leafy lettuce variety. Good for salads and fresh consumption.', true, 'Images/tracy f1.png'],
  // BEETROOT
  ['Beetroot', 'vegetable', 4, 'seedling', 'fa-circle', 'Root vegetable with excellent color and taste. Good for fresh and processing.', true, 'Images/beetroot.png'],
  // CUCUMBER
  ['Cucumber Ashley', 'vegetable', 6, 'seedling', 'fa-leaf', 'F1 hybrid cucumber with excellent fruit quality. Good for greenhouse production.', true, 'Images/ashley f1.png'],
  // COURGETTE
  ['Courgette Zucchini', 'vegetable', 6, 'seedling', 'fa-leaf', 'Summer squash variety. High yielding with tender fruits. Good for fresh market.', true, 'Images/courgette.png'],
  // ORANGES
  ['Orange Pixie', 'fruit', 200, 'seedling', 'fa-apple-whole', 'Easy peelers variety. Sweet and juicy fruits. Early maturing.', true, 'Images/orange pixie.png'],
  ['Tangarine', 'fruit', 200, 'seedling', 'fa-apple-whole', 'Mandarin variety with easy peel skin. Sweet flavor, good for fresh consumption.', true, 'Images/Tangarine orange.png'],
  ['Orange Washington', 'fruit', 200, 'seedling', 'fa-apple-whole', 'Navel orange variety. Seedless with excellent taste. Good storage qualities.', true, 'Images/washington.png'],
  // AVOCADO
  ['Hass Avocado', 'fruit', 150, 'seedling', 'fa-tree', 'Premium grafted Hass avocado. High yield, disease resistant. Ideal for export.', true, 'Images/Grafted hass ovacado.png'],
  // STRAWBERRY
  ['Strawberry', 'fruit', 50, 'seedling', 'fa-apple-whole', 'Sweet strawberry variety. High yielding with excellent fruit quality.', true, 'Images/straw.png'],
  // MANGOES
  ['Mango Tommy', 'fruit', 150, 'seedling', 'fa-tree', 'Local mango variety with excellent flavor. Good for fresh consumption.', true, 'Images/mangoes.png'],
  ['Apple Mangoes', 'fruit', 150, 'seedling', 'fa-tree', 'Apple mango variety with fiberless flesh. Sweet taste and aromatic.', true, 'Images/applemangos.png'],
  // APPLES
  ['Green Apple', 'fruit', 500, 'seedling', 'fa-tree', 'Green apple variety with tart flavor. Good for processing and fresh market.', true, 'Images/greenapple.png'],
  ['Red Apple', 'fruit', 500, 'seedling', 'fa-tree', 'Red apple tree. Sweet fruits.', true, 'Images/redapple.png'],
  // DRAGON FRUIT
  ['Dragon Fruit', 'fruit', 450, 'seedling', 'fa-seedling', 'Exotic dragon fruit plant. High value crop with growing market demand.', true, 'Images/dragonf.png'],
   // PASSION FRUIT
   ['Passion Purple Passion', 'fruit', 50, 'seedling', 'fa-flower', 'Purple passion fruit variety. High yielding with excellent flavor.', true, 'Images/grafted passion p.png'],
   ['Passion Yellow Passion', 'fruit', 50, 'seedling', 'fa-flower', 'Yellow passion fruit variety. Good for juice production and fresh market.', true, 'Images/yellowpassion.png'],
   ['Passion Sweet Granadilla', 'fruit', 50, 'seedling', 'fa-flower', 'Sweet granadilla variety. Delicious flavor with high market value.', true, 'Images/purple passion.png'],
   // BANANAS
   ['Banana', 'fruit', 700, 'seedling', 'fa-apple-whole', 'Fresh banana seedlings for planting.', true, 'Images/banana.jpg'],
  // TREE TOMATOES
  ['Tree Tomatoes', 'fruit', 50, 'seedling', 'fa-apple-whole', 'Tree tomato (tamarillo) seedlings. High yielding with excellent taste.', true, 'Images/tree tomatoes.png'],
  // PAWPAW (PAPAYA)
  ['Pawpaw Sharp F1', 'fruit', 100, 'seedling', 'fa-tree', 'F1 hybrid papaya with good fruit quality. Disease resistant and high yielding.', true, 'Images/sharp f1.png'],
  ['Pawpaw Red Royale', 'fruit', 150, 'seedling', 'fa-tree', 'Red fleshed papaya variety. Sweet taste with excellent market appeal.', true, 'Images/redroyal f1.png'],
  ['Pawpaw Vega F1', 'fruit', 200, 'seedling', 'fa-tree', 'Premium F1 hybrid papaya. Large fruits with excellent flavor.', true, 'Images/pawpaw.png'],
  ['Pawpaw Glory F1', 'fruit', 100, 'seedling', 'fa-tree', 'F1 hybrid papaya with good yield potential. Suitable for commercial production.', true, 'Images/glory f1.png'],
  // FORESTRY
  ['Grape', 'forestry', 350, 'seedling', 'fa-tree', 'Grape vine seedlings for planting.', true, 'Images/grape red.png'],
  ['Gravellia', 'forestry', 30, 'seedling', 'fa-tree', 'Gravellia tree seedlings, fast-growing timber species.', true, 'Images/vegetable.png'],
  ['Cypress', 'forestry', 50, 'seedling', 'fa-tree', 'Cypress tree seedlings for ornamental and timber use.', true, 'Images/cypress.jpg'],
  ['Pine', 'forestry', 80, 'seedling', 'fa-tree', 'Pine tree seedlings for reforestation and timber.', true, 'Images/vegetable.png'],
  ['Whistling Pine', 'forestry', 60, 'seedling', 'fa-tree', 'Whistling pine (Casuarina) seedlings for windbreaks and timber.', true, 'Images/vegetable.png'],
  ['Eucalyptus', 'forestry', 40, 'seedling', 'fa-tree', 'Eucalyptus tree seedlings for timber and oil production.', true, 'Images/eucalyptus.png'],
  // ORNAMENTAL
  ['Hibiscus', 'ornamental', 150, 'seedling', 'fa-flower', 'Colorful hibiscus ornamental plants. Beautiful flowers for landscaping.', true, 'Images/vegetable.png'],
  ['Bougainvillea', 'ornamental', 200, 'seedling', 'fa-flower', 'Vibrant bougainvillea plants for ornamental use. Fast growing climber.', true, 'Images/vegetable.png'],
  ['Rose', 'ornamental', 100, 'seedling', 'fa-flower', 'Fragrant rose plants for gardens and landscaping.', true, 'Images/vegetable.png'],
  // CASH CROP
  ['Coffee Arabica', 'cash_crop', 300, 'seedling', 'fa-mug-hot', 'Arabica coffee seedlings. Premium variety for commercial coffee production.', true, 'Images/vegetable.png'],
  ['Tea', 'cash_crop', 250, 'seedling', 'fa-leaf', 'Tea plant seedlings for commercial tea farming.', true, 'Images/vegetable.png'],
  ['Vanilla', 'cash_crop', 500, 'seedling', 'fa-flower', 'Vanilla orchid seedlings for high-value vanilla production.', true, 'Images/vegetable.png'],
  // FODDER
  ['Napier Grass', 'fodder', 50, 'seedling', 'fa-seedling', 'High-yielding Napier grass for livestock feed. Fast growing fodder.', true, 'Images/vegetable.png'],
  ['Clover', 'fodder', 30, 'seedling', 'fa-seedling', 'Clover seedlings for animal feed and soil improvement.', true, 'Images/vegetable.png'],
  ['Lucerne', 'fodder', 40, 'seedling', 'fa-seedling', 'Lucerne (alfalfa) seedlings for high-protein animal feed.', true, 'Images/vegetable.png'],
  // SUPPLIES
  ['Customized Grow Bag for Tubers', 'supplies', 150, 'bag', 'fa-box', 'Durable, eco-friendly and breathable grow bag for Irish potatoes and sweet potatoes. Available in white, black and grey.', true, 'Images/vegetable.png'],
  ['Plastic Planting Pots', 'supplies', 50, 'pot', 'fa-seedling', 'Plastic planting pots for nursery seedlings and herbs. Decorative flower pots available in black and green.', true, 'Images/vegetable.png'],
  ['Non-woven Grow Bags', 'supplies', 100, 'bag', 'fa-box', 'Different gallon sizes available. Eco-friendly, breathable felt bags in black and white.', true, 'Images/vegetable.png'],
  ['Propagation Planting Trays 200 Holes', 'supplies', 200, 'tray', 'fa-th', 'Plastic deep seedling tray with 200 holes. Color: black.', true, 'Images/vegetable.png'],
  ['Simple Planting Pots/Propagation', 'supplies', 30, 'pot', 'fa-seedling', 'Breathable holes decorative pots. Available in flower color, black and green.', true, 'Images/vegetable.png'],
  ['White Garden Labels 5.5" (15cm)', 'supplies', 20, 'pcs', 'fa-tag', 'Waterproof, durable and easy to clean plant tags. Size: 5.5" (15cm).', true, 'Images/vegetable.png'],
  ['White Garden Labels 10cm', 'supplies', 15, 'pcs', 'fa-tag', 'Waterproof, durable and easy to clean plant tags. Size: 10cm.', true, 'Images/vegetable.png'],
  ['White Garden Labels 7cm', 'supplies', 10, 'pcs', 'fa-tag', 'Waterproof, durable and easy to clean plant tags. Size: 7cm.', true, 'Images/vegetable.png']
];

// ── MongoDB connection ────────────────────────────────────────────────────────
async function initDb() {
  try {
    // Seed products only if collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      for (const [name, category, price, unit, icon, description, inStock, image] of SEED_PRODUCTS) {
        await Product.create({
          name, category, price, unit, icon, image, description, inStock
        });
      }
      console.log('✅ Seeded ' + SEED_PRODUCTS.length + ' products');
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
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
  
  if (validTokens.has(token)) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

// ── Page Routes ─────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'mku.html')));
app.get('/products.html', (_, res) => res.sendFile(path.join(__dirname, 'products.html')));
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

// ── API Routes ───────────────────────────────────────────────────────────────

// GET all products
app.get('/api/products', async (_, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// PUT update product
app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, price, unit, icon, image, description, inStock } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    product.name = name;
    product.category = category;
    product.price = price;
    product.unit = unit || 'seedling';
    product.icon = icon || 'fa-seedling';
    product.image = image;
    product.description = description;
    product.inStock = !!inStock;
    await product.save();
    
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const { productId, productName, customerName, phone, quantity, price, delivery } = req.body;
  try {
    const order = await Order.create({
      product: productId, productName, customerName, phone, quantity, price, delivery
    });
    res.json({ success: true, id: order._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// POST contact message
app.post('/api/contacts', async (req, res) => {
  const { name, phone, interest, message } = req.body;
  try {
    await Contact.create({ name, phone, interest, message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit contact' });
  }
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
    await Product.deleteMany({});
    
    for (const [name, category, price, unit, icon, description, inStock, image] of SEED_PRODUCTS) {
      await Product.create({
        name, category, price, unit, icon, image, description, inStock
      });
    }
    res.json({ success: true, message: 'Database reset and re-seeded' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', details: err.message });
  }
});

// GET all orders (admin)
app.get('/api/admin/orders', authenticateAdmin, async (_, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT update order status (admin)
app.put('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = status;
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});

// GET all contacts (admin)
app.get('/api/admin/contacts', authenticateAdmin, async (_, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET all products (admin)
app.get('/api/admin/products', authenticateAdmin, async (_, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST new product (admin)
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  const { name, category, price, unit, icon, image, description, inStock } = req.body;
  
  if (!name || !category || !price || !image) {
    return res.status(400).json({ error: 'Name, category, price, and image are required' });
  }
  
  try {
    const product = await Product.create({
      name, category, price, unit: unit || 'seedling', icon: icon || 'fa-seedling', image, description, inStock: !!inStock
    });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// PUT update product (admin)
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { name, category, price, unit, icon, image, description, inStock } = req.body;
  
  if (!name || !category || !price || !image) {
    return res.status(400).json({ error: 'Name, category, price, and image are required' });
  }
  
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    product.name = name;
    product.category = category;
    product.price = price;
    product.unit = unit || 'seedling';
    product.icon = icon || 'fa-seedling';
    product.image = image;
    product.description = description;
    product.inStock = !!inStock;
    await product.save();
    
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// PUT toggle stock (admin)
app.put('/api/admin/products/:id/stock', authenticateAdmin, async (req, res) => {
  const { inStock } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.inStock = inStock;
    await product.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock', details: err.message });
  }
});

// DELETE product (admin)
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});

// GET product tracking statistics (admin)
app.get('/api/admin/products/tracking', authenticateAdmin, async (_, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    const products = await Product.find({}).sort({ createdAt: 1 });

    // Build tracking stats per product
    const trackingMap = new Map();

    for (const order of orders) {
      const pid = order.product ? order.product.toString() : order.productId;
      if (!trackingMap.has(pid)) {
        trackingMap.set(pid, {
          productId: pid,
          productName: order.productName,
          totalOrders: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          lastOrdered: null,
          statusBreakdown: { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 }
        });
      }
      const stats = trackingMap.get(pid);
      stats.totalOrders += 1;
      stats.totalQuantity += order.quantity;
      stats.totalRevenue += parseFloat(order.price || 0) * order.quantity;
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
      const orderDate = new Date(order.createdAt);
      if (!stats.lastOrdered || orderDate > new Date(stats.lastOrdered)) {
        stats.lastOrdered = orderDate.toISOString();
      }
    }

    // Merge with product details
    const trackingData = products.map(p => {
      const stats = trackingMap.get(p._id.toString()) || {
        productId: p._id,
        productName: p.name,
        totalOrders: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        lastOrdered: null,
        statusBreakdown: { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 }
      };
      return {
        ...stats,
        category: p.category,
        price: p.price,
        inStock: p.inStock,
        image: p.image,
        unit: p.unit
      };
    });

    res.json(trackingData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product tracking', details: err.message });
  }
});

// ── Farmer Routes ─────────────────────────────────────────────────────────────

// GET all farmers (admin)
app.get('/api/admin/farmers', authenticateAdmin, async (req, res) => {
  try {
    const farmers = await Farmer.find({}).sort({ createdAt: -1 }).populate('seedlings');
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

// POST new farmer (admin)
app.post('/api/admin/farmers', authenticateAdmin, async (req, res) => {
  const { name, phone, email, location, county, farmSize } = req.body;
  
  if (!name || !phone || !location) {
    return res.status(400).json({ error: 'Name, phone, and location are required' });
  }
  
  try {
    const farmer = await Farmer.create({
      name, phone, email, location, county, farmSize
    });
    res.json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create farmer', details: err.message });
  }
});

// PUT update farmer (admin)
app.put('/api/admin/farmers/:id', authenticateAdmin, async (req, res) => {
  const { name, phone, email, location, county, farmSize, status } = req.body;
  
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    
    farmer.name = name || farmer.name;
    farmer.phone = phone || farmer.phone;
    farmer.email = email;
    farmer.location = location || farmer.location;
    farmer.county = county;
    farmer.farmSize = farmSize;
    farmer.status = status || farmer.status;
    await farmer.save();
    
    res.json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update farmer', details: err.message });
  }
});

// DELETE farmer (admin)
app.delete('/api/admin/farmers/:id', authenticateAdmin, async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete farmer', details: err.message });
  }
});

// ── Seedling Routes ───────────────────────────────────────────────────────────

// GET all seedlings (admin)
app.get('/api/admin/seedlings', authenticateAdmin, async (req, res) => {
  try {
    const seedlings = await Seedling.find({}).sort({ createdAt: -1 }).populate('farmer');
    res.json(seedlings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seedlings' });
  }
});

// POST new seedling (admin)
app.post('/api/admin/seedlings', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { farmer, name, category, variety, price, quantity, description, datePlanted, expectedHarvest } = req.body;
  
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }
  
  try {
    const image = req.file ? '/uploads/' + req.file.filename : null;
    const seedling = await Seedling.create({
      farmer, name, category, variety, price, quantity, description, image, datePlanted, expectedHarvest
    });
    res.json({ success: true, seedling });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create seedling', details: err.message });
  }
});

// PUT update seedling (admin)
app.put('/api/admin/seedlings/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { farmer, name, category, variety, price, quantity, description, datePlanted, expectedHarvest, status } = req.body;
  
  try {
    const seedling = await Seedling.findById(req.params.id);
    if (!seedling) {
      return res.status(404).json({ error: 'Seedling not found' });
    }
    
    seedling.farmer = farmer || seedling.farmer;
    seedling.name = name || seedling.name;
    seedling.category = category || seedling.category;
    seedling.variety = variety;
    seedling.price = price || seedling.price;
    seedling.quantity = quantity !== undefined ? quantity : seedling.quantity;
    seedling.description = description;
    seedling.datePlanted = datePlanted;
    seedling.expectedHarvest = expectedHarvest;
    seedling.status = status || seedling.status;
    
    if (req.file) {
      seedling.image = '/uploads/' + req.file.filename;
    }
    
    await seedling.save();
    res.json({ success: true, seedling });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update seedling', details: err.message });
  }
});

// DELETE seedling (admin)
app.delete('/api/admin/seedlings/:id', authenticateAdmin, async (req, res) => {
  try {
    const seedling = await Seedling.findByIdAndDelete(req.params.id);
    if (!seedling) {
      return res.status(404).json({ error: 'Seedling not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete seedling', details: err.message });
  }
});

// ── Distribution Routes ─────────────────────────────────────────────────────

// GET all distributions (admin)
app.get('/api/admin/distributions', authenticateAdmin, async (req, res) => {
  try {
    const distributions = await Distribution.find({}).sort({ distributionDate: -1 }).populate('seedling farmer');
    res.json(distributions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

// POST new distribution (admin)
app.post('/api/admin/distributions', authenticateAdmin, async (req, res) => {
  const { seedling, farmer, quantity, destination, county, distributedBy, notes } = req.body;
  
  if (!seedling || !quantity || !destination) {
    return res.status(400).json({ error: 'Seedling ID, quantity, and destination are required' });
  }
  
  try {
    const distribution = await Distribution.create({
      seedling, farmer, quantity, destination, county, distributedBy, notes
    });
    res.json({ success: true, distribution });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create distribution', details: err.message });
  }
});

// PUT update distribution status (admin)
app.put('/api/admin/distributions/:id', authenticateAdmin, async (req, res) => {
  const { status, notes } = req.body;
  
  try {
    const distribution = await Distribution.findById(req.params.id);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    
    distribution.status = status || distribution.status;
    distribution.notes = notes !== undefined ? notes : distribution.notes;
    await distribution.save();
    
    res.json({ success: true, distribution });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update distribution', details: err.message });
  }
});

// DELETE distribution (admin)
app.delete('/api/admin/distributions/:id', authenticateAdmin, async (req, res) => {
  try {
    const distribution = await Distribution.findByIdAndDelete(req.params.id);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete distribution', details: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await hashAdminPassword();
  await connectDB();
  await initDb();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ⚠️ ADD THIS LINE RIGHT HERE TO TRIGGER STARTUP:
start().catch(err => console.error("❌ Critical server startup failure:", err));

module.exports = app;