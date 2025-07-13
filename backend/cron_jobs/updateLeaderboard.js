import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { getWeekStart, getPreviousDayDateRange } from "../routes/dateUtils.js";

const prisma = new PrismaClient();

// Daily cron job to do the following:
// 1. Read the roomstatistics data and update the weekly leaderboard points
// 2. Update weekly best stats table if there are changes to week's best ao5, ao12, bestSolve
async function updateLeaderboardData() {
  console.log("Starting daily leaderboard update...");

  const { startOfDay, endOfDay } = getPreviousDayDateRange();

  const yesterdayStats = await prisma.roomStatistics.findMany({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (yesterdayStats.length === 0) {
    console.log("No statistics found for startOfDay");
    return;
  }

  const roomGroups = {};
  yesterdayStats.forEach((stat) => {
    if (!roomGroups[stat.roomCode]) {
      roomGroups[stat.roomCode] = [];
    }
    roomGroups[stat.roomCode].push(stat);
  });

  const weekStart = getWeekStart(startOfDay);

  for (const [roomCode, stats] of Object.entries(roomGroups)) {
    console.log(`Processing room: ${roomCode}`);

    // Daily competition logic
    const bestSolveWinner = stats.reduce((best, curr) =>
      curr.bestSolve < best.bestSolve ? curr : best
    );
    const bestAo5Winner = stats.reduce((best, curr) =>
      curr.ao5 < best.ao5 ? curr : best
    );
    const bestAo12Winner = stats.reduce((best, curr) =>
      curr.ao12 < best.ao12 ? curr : best
    );

    const pointsToAward = {};
    pointsToAward[bestSolveWinner.playerName] =
      (pointsToAward[bestSolveWinner.playerName] || 0) + 4;
    pointsToAward[bestAo5Winner.playerName] =
      (pointsToAward[bestAo5Winner.playerName] || 0) + 3;
    pointsToAward[bestAo12Winner.playerName] =
      (pointsToAward[bestAo12Winner.playerName] || 0) + 3;

    // Update weekly leaderboard
    for (const [playerName, points] of Object.entries(pointsToAward)) {
      await prisma.weeklyLeaderboard.upsert({
        where: {
          roomCode_playerName_weekStart: { roomCode, playerName, weekStart },
        },
        update: {
          weeklyPoints: {
            increment: points,
          },
        },
        create: {
          roomCode,
          playerName,
          weekStart,
          weeklyPoints: points,
        },
      });

      await prisma.roomStatistics.updateMany({
        where: {
          roomCode,
          playerName,
          date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        data: {
          dailyPoints: points,
        },
      });

      console.log(
        `Awarded ${points} points to ${playerName} in room ${roomCode}`
      );
    }

    // Update weekly best stats using the already calculated winners
    // Get current weekly records first
    const currentWeeklyBest = await prisma.weeklyBestStats.findUnique({
      where: {
        roomCode_weekStart: { roomCode, weekStart },
      },
    });

    // Prepare updates only if endOfDay's records are better (reuse the winners we already found)
    const weeklyUpdates = {};

    if (
      !currentWeeklyBest ||
      !currentWeeklyBest.bestAo5 ||
      bestAo5Winner.ao5 < currentWeeklyBest.bestAo5
    ) {
      weeklyUpdates.bestAo5 = bestAo5Winner.ao5;
      weeklyUpdates.bestAo5PlayerName = bestAo5Winner.playerName;
    }

    if (
      !currentWeeklyBest ||
      !currentWeeklyBest.bestAo12 ||
      bestAo12Winner.ao12 < currentWeeklyBest.bestAo12
    ) {
      weeklyUpdates.bestAo12 = bestAo12Winner.ao12;
      weeklyUpdates.bestAo12PlayerName = bestAo12Winner.playerName;
    }

    if (
      !currentWeeklyBest ||
      !currentWeeklyBest.bestSolve ||
      bestSolveWinner.bestSolve < currentWeeklyBest.bestSolve
    ) {
      weeklyUpdates.bestSolve = bestSolveWinner.bestSolve;
      weeklyUpdates.bestSolvePlayerName = bestSolveWinner.playerName;
    }

    // Update weekly records if we have any improvements
    if (Object.keys(weeklyUpdates).length > 0) {
      await prisma.weeklyBestStats.upsert({
        where: {
          roomCode_weekStart: { roomCode, weekStart },
        },
        update: weeklyUpdates,
        create: {
          roomCode,
          weekStart,
          bestAo5: bestAo5Winner.ao5,
          bestAo5PlayerName: bestAo5Winner.playerName,
          bestAo12: bestAo12Winner.ao12,
          bestAo12PlayerName: bestAo12Winner.playerName,
          bestSolve: bestSolveWinner.bestSolve,
          bestSolvePlayerName: bestSolveWinner.playerName,
        },
      });

      console.log(
        `Updated weekly records for room ${roomCode}:`,
        weeklyUpdates
      );
    }
  }
}

// weekly cron job for pruning of data, i think i can prune everything before the previous week

// daily leaderboard updating to run everyday at 12:01am UTC
cron.schedule("1 0 * * *", updateLeaderboardData, {
  timezone: "UTC",
});

export { updateLeaderboardData };
