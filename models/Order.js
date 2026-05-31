const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_name: { type: String, required: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number },
  delivery: { type: String, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);