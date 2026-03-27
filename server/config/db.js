import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch(error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.warn("⚠️  MongoDB connection failed. Server running without database connection.");
  }
};