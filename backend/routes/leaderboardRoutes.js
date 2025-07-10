// leaderboardRoutes.js
// This file defines the routes for managing the leaderboard, including manual updates and fetching current standings. This is mainly used for testing and debugging and would not be
// exposed in production
import express from "express";
import { updateLeaderboardData } from "../cron_jobs/updateLeaderboard.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

const getPreviousDayDateRange = () => {
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      0,
      0,
      0
    )
  );
  const endOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  return { startOfDay, endOfDay };
};

// Manual trigger endpoint (protected route recommended)
router.post("/update-leaderboard", async (req, res) => {
  try {
    // Optional: Add authentication/authorization here
    // const adminKey = req.headers['x-admin-key'];
    // if (adminKey !== process.env.ADMIN_KEY) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    await updateLeaderboardData();
    res.json({ message: "Leaderboard updated successfully" });
  } catch (error) {
    console.error("Manual leaderboard update failed:", error);
    res.status(500).json({ error: "Failed to update leaderboard" });
  }
});

// Get weekly leaderboard for a room
router.get("/weekly-leaderboard/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;

    const leaderboard = await prisma.roomLeaderboard.findMany({
      where: { roomCode },
      orderBy: { playerScore: "desc" },
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get daily leaderboard for a room
router.get("/daily-leaderboard/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
    });

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
        message: "The room code you entered does not exist",
      });
    }

    const { startOfDay, endOfDay } = getPreviousDayDateRange();
    const todayStats = await prisma.roomStatistics.findMany({
      where: {
        roomCode: roomCode.toUpperCase(),
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: [
        { dailyPoints: "desc" },
      ],
    });

    // Format the leaderboard data
    const leaderboard = todayStats.map((stat, index) => ({
      rank: index + 1,
      username: stat.playerName,
      ao5: stat.ao5,
      ao12: stat.ao12,
      bestSingle: stat.bestSolve,
      date: stat.date,
      dailyPoints: stat.dailyPoints,
    }));

    res.json({
      success: true,
      roomCode: roomCode.toUpperCase(),
      date: startOfDay.toISOString().split("T")[0],
      leaderboard,
      totalPlayers: leaderboard.length,
    });
  } catch (error) {
    console.error("Error fetching daily leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch daily leaderboard",
      details: error.message,
    });
  }
});

export default router;
