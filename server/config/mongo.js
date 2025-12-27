const mongoose = require('mongoose');
const config = require('./index');

mongoose.set('strictQuery', true);

async function connectMongo() {
  console.log('🔌 Attempting MongoDB connection...');
  console.log('📍 MongoDB URI:', config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
  
  try {
    await mongoose.connect(config.mongoUri, {
      autoIndex: true,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔢 Ready State:', mongoose.connection.readyState); // 1 = connected
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('🔍 Full Error:', error);
    throw error;
  }
}

module.exports = connectMongo;
