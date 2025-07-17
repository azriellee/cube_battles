// import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { getWeekStart, getPreviousDayDateRange } from "../routes/dateUtils.js";

const prisma = new PrismaClient();

// Daily cron job to do the following:
// 1. Read the roomstatistics data and update the weekly leaderboard points
// 2. Update weekly best stats table if there are changes to week's best ao5, ao12, bestSolve
// UPDATE: exposed endpoint to manually trigger leaderboard update, scheduled using cloud scheduler on GCR
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
    const pointsToAward = {};

    // Filter out null stats
    const validBestSolveStats = stats.filter((s) => s.bestSolve !== null);
    const validAo5Stats = stats.filter((s) => s.ao5 !== null);
    const validAo12Stats = stats.filter((s) => s.ao12 !== null);

    let bestSolveWinner, bestAo5Winner, bestAo12Winner;

    if (validBestSolveStats.length > 0) {
      bestSolveWinner = validBestSolveStats.reduce((best, curr) =>
        curr.bestSolve < best.bestSolve ? curr : best
      );
      pointsToAward[bestSolveWinner.playerName] =
        (pointsToAward[bestSolveWinner.playerName] || 0) + 4;
    }

    if (validAo5Stats.length > 0) {
      bestAo5Winner = validAo5Stats.reduce((best, curr) =>
        curr.ao5 < best.ao5 ? curr : best
      );
      pointsToAward[bestAo5Winner.playerName] =
        (pointsToAward[bestAo5Winner.playerName] || 0) + 3;
    }

    if (validAo12Stats.length > 0) {
      bestAo12Winner = validAo12Stats.reduce((best, curr) =>
        curr.ao12 < best.ao12 ? curr : best
      );
      pointsToAward[bestAo12Winner.playerName] =
        (pointsToAward[bestAo12Winner.playerName] || 0) + 3;
    }

    // Award points and update stats
    const playersInRoom = [...new Set(stats.map((s) => s.playerName))];
    console.log(
      `Processing room ${roomCode} with players: ${playersInRoom.join(", ")}`
    );

    for (const playerName of playersInRoom) {
      const points = pointsToAward[playerName] || 0;

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

      if (points > 0) {
        console.log(
          `Awarded ${points} points to ${playerName} in room ${roomCode}`
        );
      } else {
        console.log(
          `Inserted ${playerName} in weekly leaderboard with 0 points for room ${roomCode}`
        );
      }
    }

    // Handle weekly bests only if valid winners exist
    const currentWeeklyBest = await prisma.weeklyBestStats.findUnique({
      where: {
        roomCode_weekStart: { roomCode, weekStart },
      },
    });

    const weeklyUpdates = {};

    if (
      bestAo5Winner &&
      (!currentWeeklyBest ||
        !currentWeeklyBest.bestAo5 ||
        bestAo5Winner.ao5 < currentWeeklyBest.bestAo5)
    ) {
      weeklyUpdates.bestAo5 = bestAo5Winner.ao5;
      weeklyUpdates.bestAo5PlayerName = bestAo5Winner.playerName;
    }

    if (
      bestAo12Winner &&
      (!currentWeeklyBest ||
        !currentWeeklyBest.bestAo12 ||
        bestAo12Winner.ao12 < currentWeeklyBest.bestAo12)
    ) {
      weeklyUpdates.bestAo12 = bestAo12Winner.ao12;
      weeklyUpdates.bestAo12PlayerName = bestAo12Winner.playerName;
    }

    if (
      bestSolveWinner &&
      (!currentWeeklyBest ||
        !currentWeeklyBest.bestSolve ||
        bestSolveWinner.bestSolve < currentWeeklyBest.bestSolve)
    ) {
      weeklyUpdates.bestSolve = bestSolveWinner.bestSolve;
      weeklyUpdates.bestSolvePlayerName = bestSolveWinner.playerName;
    }

    if (Object.keys(weeklyUpdates).length > 0) {
      await prisma.weeklyBestStats.upsert({
        where: {
          roomCode_weekStart: { roomCode, weekStart },
        },
        update: weeklyUpdates,
        create: {
          roomCode,
          weekStart,
          bestAo5: bestAo5Winner?.ao5 ?? null,
          bestAo5PlayerName: bestAo5Winner?.playerName ?? null,
          bestAo12: bestAo12Winner?.ao12 ?? null,
          bestAo12PlayerName: bestAo12Winner?.playerName ?? null,
          bestSolve: bestSolveWinner?.bestSolve ?? null,
          bestSolvePlayerName: bestSolveWinner?.playerName ?? null,
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
// cron.schedule("1 0 * * *", updateLeaderboardData, {
//   timezone: "UTC",
// });

export { updateLeaderboardData };
