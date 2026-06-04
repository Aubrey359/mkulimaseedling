const { connectDB, Product } = require('./models');

async function addBanana() {
  try {
    await connectDB(); // This uses the MONGODB_URI from .env

    const exists = await Product.findOne({ name: 'Banana' });
    if (!exists) {
      await Product.create({
        name: 'Banana',
        category: 'fruit',
        price: 700,
        unit: 'seedling',
        icon: 'fa-apple-whole',
        image: 'Images/banana.jpg',
        description: 'Fresh banana seedlings for planting.',
        inStock: true
      });
      console.log('Banana added');
    } else {
      console.log('Banana already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addBanana();