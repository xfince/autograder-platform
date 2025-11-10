import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(rateLimiter);

// CORS configuration - ONLY mention your frontend URL
if (process.env.NODE_ENV === "production") {
  // In production, allow your Vercel frontend
  app.use(cors({ 
    origin: "https://note-ado.vercel.app", // ONLY your frontend URL
    credentials: true 
  }));
} else {
  // Development - allow local frontend
  app.use(cors({ 
    origin: "http://localhost:5173",
    credentials: true 
  }));
}

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "Backend is running!", 
    timestamp: new Date().toISOString() 
  });
});

// REMOVED all frontend serving code - no more dist/index.html references!

// Basic root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend API is running!",
    frontend: "https://note-ado.vercel.app",
    health_check: "/api/health"
  });
});

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
    console.log("Environment:", process.env.NODE_ENV || "development");
  });
}).catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exit(1);
});