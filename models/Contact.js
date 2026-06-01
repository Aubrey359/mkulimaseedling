const { Schema, model } = require('mongoose');

const contactSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  interest: {
    type: String
  },
  message: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = model('Contact', contactSchema);