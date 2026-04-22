import mongoose from "mongoose";

export async function connectDB() {
	const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hotel_janro";

	try {
		await mongoose.connect(mongoUri);
		console.log("MongoDB connected");
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
		throw error;
	}
}
