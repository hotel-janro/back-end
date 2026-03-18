import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing in environment variables.");
    console.warn("⚠️  Add MONGO_URI to your .env file to enable database connection.");
    return null;
  }

  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch(error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.warn("⚠️  MongoDB connection failed. Server running without database connection.");
    return null;
  }
};