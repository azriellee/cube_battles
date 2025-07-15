import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import roomRoutes from "./routes/roomRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import "./cron_jobs/updateLeaderboard.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/roomRoutes", roomRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
