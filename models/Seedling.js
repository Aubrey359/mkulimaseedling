const { Schema, model } = require('mongoose');

const seedlingSchema = new Schema({
  farmer: {
    type: Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['fruit', 'vegetable', 'forestry', 'ornamental', 'cash_crop', 'fodder'],
    required: true
  },
  variety: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'seedling'
  },
  quantity: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  inStock: {
    type: Boolean,
    default: true
  },
  datePlanted: {
    type: Date
  },
  expectedHarvest: {
    type: Date
  },
  status: {
    type: String,
    enum: ['growing', 'ready', 'distributed', 'sold'],
    default: 'growing'
  }
}, {
  timestamps: true
});

module.exports = model('Seedling', seedlingSchema);