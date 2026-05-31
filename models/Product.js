const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'seedling' },
  icon: { type: String, default: 'fa-seedling' },
  image: { type: String },
  description: { type: String },
  in_stock: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual for inStock (alias for in_stock)
productSchema.virtual('inStock').get(function() {
  return this.in_stock;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);