const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  interest: { type: String },
  message: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);