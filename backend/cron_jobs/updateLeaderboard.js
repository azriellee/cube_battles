import { PrismaClient } from "@prisma/client";
import { getWeekStart, getPreviousDayDateRange } from "../routes/dateUtils.js";

const prisma = new PrismaClient();
const BEST_SOLVE_POINTS = 4;
const BEST_AO5_POINTS = 3;
const BEST_AO12_POINTS = 3;

// Orchestration function: run both updates
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
    throw new Error("No statistics found for startOfDay");
  }

  // Run sub-tasks
  await Promise.all([
    updateWeeklyLeaderboard(yesterdayStats, startOfDay, endOfDay),
    updateWeeklyBestStats(yesterdayStats, startOfDay),
  ]);
}

/**
 * Update weekly leaderboard by awarding points for daily bests
 */
async function updateWeeklyLeaderboard(yesterdayStats, startOfDay, endOfDay) {
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
        (pointsToAward[bestSolveWinner.playerName] || 0) + BEST_SOLVE_POINTS;
    }

    if (validAo5Stats.length > 0) {
      bestAo5Winner = validAo5Stats.reduce((best, curr) =>
        curr.ao5 < best.ao5 ? curr : best
      );
      pointsToAward[bestAo5Winner.playerName] =
        (pointsToAward[bestAo5Winner.playerName] || 0) + BEST_AO5_POINTS;
    }

    if (validAo12Stats.length > 0) {
      bestAo12Winner = validAo12Stats.reduce((best, curr) =>
        curr.ao12 < best.ao12 ? curr : best
      );
      pointsToAward[bestAo12Winner.playerName] =
        (pointsToAward[bestAo12Winner.playerName] || 0) + BEST_AO12_POINTS;
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
          weeklyPoints: { increment: points },
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
        data: { dailyPoints: points },
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
  }
}

/**
 * Update weekly best Ao5, Ao12, and Solve stats
 */
async function updateWeeklyBestStats(yesterdayStats, startOfDay) {
  const weekStart = getWeekStart(startOfDay);

  for (const stat of yesterdayStats) {
    const currentBest = await prisma.weeklyBestStats.findUnique({
      where: {
        roomCode_weekStart_playerName: {
          roomCode: stat.roomCode,
          weekStart,
          playerName: stat.playerName,
        },
      },
    });

    const curBestAo5 =
      currentBest?.bestAo5 == null ||
      (stat.ao5 != null && stat.ao5 < currentBest.bestAo5)
        ? stat.ao5
        : currentBest?.bestAo5;

    const curBestAo12 =
      currentBest?.bestAo12 == null ||
      (stat.ao12 != null && stat.ao12 < currentBest.bestAo12)
        ? stat.ao12
        : currentBest?.bestAo12;

    const curBestSolve =
      currentBest?.bestSolve == null ||
      (stat.bestSolve != null && stat.bestSolve < currentBest.bestSolve)
        ? stat.bestSolve
        : currentBest?.bestSolve;

    const weeklyUpdates = {
      bestAo5: curBestAo5,
      bestAo12: curBestAo12,
      bestSolve: curBestSolve,
    };

    await prisma.weeklyBestStats.upsert({
      where: {
        roomCode_weekStart_playerName: {
          roomCode: stat.roomCode,
          weekStart,
          playerName: stat.playerName,
        },
      },
      update: weeklyUpdates,
      create: {
        roomCode: stat.roomCode,
        weekStart,
        playerName: stat.playerName,
        bestAo5: curBestAo5,
        bestAo12: curBestAo12,
        bestSolve: curBestSolve,
      },
    });
    console.log(
      `Updated weekly records for room ${stat.roomCode}, player ${stat.playerName}`,
      weeklyUpdates
    );
  }
}

export { updateLeaderboardData };
