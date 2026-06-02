const { Schema, model } = require('mongoose');

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['fruit', 'vegetable', 'forestry', 'ornamental', 'cash_crop', 'fodder', 'supplies'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'seedling'
  },
  icon: {
    type: String,
    default: 'fa-seedling'
  },
  image: {
    type: String
  },
  description: {
    type: String
  },
  inStock: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = model('Product', productSchema);