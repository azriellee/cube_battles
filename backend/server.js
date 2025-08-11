import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import roomRoutes from "./routes/roomRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import "./cron_jobs/updateLeaderboard.js";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  "https://cube-battles.web.app", // Your deployed frontend
  "http://localhost:5173",
];

// Middleware
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (e.g. curl or mobile apps)
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//   })
// );
app.use(
  cors({
    origin: "*", // This tells the cors middleware to allow all origins
  })
);
app.use(express.json());

// Routes
app.use("/api/roomRoutes", roomRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/player", playerRoutes);

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
