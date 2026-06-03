const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  productId: {
    type: String,
    required: false
  },
  productName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  delivery: {
    type: String,
    required: false,
    default: 'Not specified'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = model('Order', orderSchema);