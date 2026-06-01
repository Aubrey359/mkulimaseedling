const mongoose = require('mongoose');

// Railway MongoDB plugin provides MONGODB_URL, also support MONGODB_URI and MONGO_URL
const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/mkulima';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    return false;
  }
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
});

module.exports = { connectDB, mongoose };