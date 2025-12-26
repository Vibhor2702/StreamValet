const mongoose = require('mongoose');
const config = require('./index');

mongoose.set('strictQuery', true);

async function connectMongo() {
  await mongoose.connect(config.mongoUri, {
    autoIndex: true,
  });
  return mongoose.connection;
}

module.exports = connectMongo;
