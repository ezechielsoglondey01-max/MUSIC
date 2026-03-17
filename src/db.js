const mongoose = require("mongoose");

function getMongoUri() {
  const uri = process.env.MONGO_URI;
  if (uri && uri.trim()) return uri.trim();
  return "mongodb://localhost:27017/music";
}

async function connectDb() {
  mongoose.set("strictQuery", true);
  const uri = getMongoUri();
  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production"
  });
  return mongoose.connection;
}

module.exports = { connectDb, getMongoUri };

