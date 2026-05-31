const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/mkulima';

async function testMongoDBConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Test by accessing the connection
    const db = mongoose.connection;
    console.log('Database name:', db.name);
    console.log('Host:', db.host);
    console.log('Port:', db.port);
    
    // Close the connection
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

testMongoDBConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});