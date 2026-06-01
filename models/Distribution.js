const { Schema, model } = require('mongoose');

const distributionSchema = new Schema({
  seedling: {
    type: Schema.Types.ObjectId,
    ref: 'Seedling',
    required: true
  },
  farmer: {
    type: Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  county: {
    type: String
  },
  distributedBy: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = model('Distribution', distributionSchema);