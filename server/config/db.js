import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hotel_janro";

  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch(error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error; // Throw so startServer can catch and exit
  }
};
