const { connectDB, mongoose } = require('../config/database');

// Import models
const Farmer = require('./Farmer');
const Seedling = require('./Seedling');
const Distribution = require('./Distribution');
const Product = require('./Product');
const Order = require('./Order');
const Contact = require('./Contact');

// Define associations (for virtual populate)
Seedling.schema.virtual('distributions', {
  ref: 'Distribution',
  localField: '_id',
  foreignField: 'seedling',
  justOne: false
});

Product.schema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

module.exports = {
  connectDB,
  mongoose,
  Farmer,
  Seedling,
  Distribution,
  Product,
  Order,
  Contact
};