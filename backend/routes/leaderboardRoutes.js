// leaderboardRoutes.js
// This file defines the routes for managing the leaderboard, including manual updates and fetching current standings. This is mainly used for testing and debugging and would not be
// exposed in production
import express from "express";
import { updateLeaderboardData } from "../cron_jobs/updateLeaderboard.js";
import { PrismaClient } from "@prisma/client";
import {
  getWeekStart,
  getPreviousDayDateRange,
  getCurrentDayDateRange,
} from "./dateUtils.js";

const prisma = new PrismaClient();
const router = express.Router();

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

    const leaderboard = await prisma.weeklyLeaderboard.findMany({
      where: {
        roomCode: roomCode,
      },
      orderBy: [{ weekStart: "desc" }, { weeklyPoints: "desc" } ],
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get weekly best stats for a room with summaries + full details
router.get("/weekly-best-stats/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;

    // 1️⃣ Get all WeeklyBestStats rows for this room
    const bestStatsRows = await prisma.weeklyBestStats.findMany({
      where: { roomCode },
      orderBy: { weekStart: "desc" },
    });

    // 2️⃣ Get all WeeklyLeaderboard rows for this room (for winners)
    const leaderboardRows = await prisma.weeklyLeaderboard.findMany({
      where: { roomCode },
    });

    // 3️⃣ Group WeeklyBestStats by weekStart
    const groupedByWeek = bestStatsRows.reduce((acc, row) => {
      const weekKey = row.weekStart.toISOString();

      if (!acc[weekKey]) {
        acc[weekKey] = { weekStart: row.weekStart, players: [] };
      }
      acc[weekKey].players.push(row);

      return acc;
    }, {});

    // 4️⃣ Build final array with summaries
    const result = Object.values(groupedByWeek).map((weekData) => {
      const { weekStart, players } = weekData;

      // Get winner from leaderboard
      const leaderboardForWeek = leaderboardRows.filter(
        (lb) => lb.weekStart.getTime() === weekStart.getTime()
      );
      const winnerEntry = leaderboardForWeek.reduce((best, curr) =>
        curr.weeklyPoints > (best?.weeklyPoints ?? -Infinity) ? curr : best,
        null
      );

      // Find best Ao5, Ao12, bestSolve from players
      const bestAo5Entry = players.reduce((best, curr) =>
        curr.bestAo5 !== null && curr.bestAo5 < (best?.bestAo5 ?? Infinity) ? curr : best,
        null
      );
      const bestAo12Entry = players.reduce((best, curr) =>
        curr.bestAo12 !== null && curr.bestAo12 < (best?.bestAo12 ?? Infinity) ? curr : best,
        null
      );
      const bestSolveEntry = players.reduce((best, curr) =>
        curr.bestSolve !== null && curr.bestSolve < (best?.bestSolve ?? Infinity) ? curr : best,
        null
      );

      return {
        weekStart,
        summary: {
          winner: winnerEntry
            ? { playerName: winnerEntry.playerName, points: winnerEntry.weeklyPoints }
            : null,
          bestAo5: bestAo5Entry
            ? { playerName: bestAo5Entry.playerName, solveTime: bestAo5Entry.bestAo5 }
            : null,
          bestAo12: bestAo12Entry
            ? { playerName: bestAo12Entry.playerName, solveTime: bestAo12Entry.bestAo12 }
            : null,
          bestSolve: bestSolveEntry
            ? { playerName: bestSolveEntry.playerName, solveTime: bestSolveEntry.bestSolve }
            : null,
        },
        players: players.map((p) => ({
          playerName: p.playerName,
          bestAo5: p.bestAo5,
          bestAo12: p.bestAo12,
          bestSolve: p.bestSolve,
          // optional: include points for detail view
          points: leaderboardForWeek.find((lb) => lb.playerName === p.playerName)?.weeklyPoints ?? 0,
        })),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching best stats:", error);
    res.status(500).json({ error: "Failed to fetch best stats" });
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
        { bestSolve: "asc" },
        { ao5: "asc" },
        { ao12: "asc" },
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

// Get Todays stats for players in the room who have submitted (entry in roomStatistics)
router.get("/today-stats/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { startOfToday, endOfToday } = getCurrentDayDateRange();
    console.log("fetching stats for date: ", startOfToday, endOfToday);
    const todayStats = await prisma.roomStatistics.findMany({
      where: {
        roomCode: roomCode.toUpperCase(),
        date: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      orderBy: [{ bestSolve: "asc" }, { ao5: "asc" }, { ao12: "asc" }],
      select: {
        playerName: true,
        ao5: true,
        ao12: true,
        bestSolve: true,
      },
    });

    res.json(todayStats);
    console.log("Today's stats fetched successfully", todayStats);
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    res.status(500).json({
      error: "Failed to fetch today's stats",
      details: error.message,
    });
  }
});

export default router;
