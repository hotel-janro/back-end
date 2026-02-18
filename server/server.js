import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hotel Management Backend Running");
});

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
