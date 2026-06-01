const { connectDB, mongoose } = require('./config/database');

async function testMongoDBConnection() {
  try {
    const success = await connectDB();
    if (success) {
      console.log('Database name:', mongoose.connection.name);
      console.log('Host:', mongoose.connection.host);
      console.log('Port:', mongoose.connection.port);
      
      // Close the connection
      await mongoose.disconnect();
      console.log('✅ MongoDB connection closed');
      return true;
    }
    return false;
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