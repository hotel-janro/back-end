import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
<<<<<<< Updated upstream
  res.send("Hotel Management Backend Running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wedding", weddingRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
=======
  res.json({ message: "POS API running" });
});

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
>>>>>>> Stashed changes
