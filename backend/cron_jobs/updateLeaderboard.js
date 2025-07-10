// Install: npm install node-cron
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to calculate and update daily leaderboard and weekly leaderboard points
async function updateLeaderboardData() {
  try {
    console.log('Starting daily leaderboard update...');
    
    const now = new Date();
    const yesterday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      0, 0, 0, 0
    ));
    
    const endOfYesterday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      23, 59, 59, 999
    ));
    
    const yesterdayStats = await prisma.roomStatistics.findMany({
      where: {
        date: {
          gte: yesterday,
          lte: endOfYesterday
        }
      }
    });
    
    if (yesterdayStats.length === 0) {
      console.log('No statistics found for yesterday');
      return;
    }

    const roomGroups = {};
    yesterdayStats.forEach(stat => {
      if (!roomGroups[stat.roomCode]) {
        roomGroups[stat.roomCode] = [];
      }
      roomGroups[stat.roomCode].push(stat);
      console.log(`Grouped stat for room ${stat.roomCode}:`, stat);
    });

    for (const [roomCode, stats] of Object.entries(roomGroups)) {
      console.log(`Processing room: ${roomCode}`);

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

      pointsToAward[bestSolveWinner.playerName] = (pointsToAward[bestSolveWinner.playerName] || 0) + 4;
      pointsToAward[bestAo5Winner.playerName] = (pointsToAward[bestAo5Winner.playerName] || 0) + 3;
      pointsToAward[bestAo12Winner.playerName] = (pointsToAward[bestAo12Winner.playerName] || 0) + 3;

      for (const [playerName, points] of Object.entries(pointsToAward)) {
        await prisma.roomLeaderboard.upsert({
          where: {
            roomCode_playerName: { roomCode, playerName }
          },
          update: {
            playerScore: {
              increment: points
            }
          },
          create: {
            roomCode,
            playerName,
            playerScore: points
          }
        });

        await prisma.roomStatistics.updateMany({
          where: {
            roomCode,
            playerName,
            date: {
              gte: yesterday,
              lte: endOfYesterday
            }
          },
          data: {
            dailyPoints: points
          }
        });

        console.log(`Awarded ${points} points to ${playerName} in room ${roomCode}`);
      }
    }

    console.log('✅ Daily leaderboard update completed successfully');
  } catch (error) {
    console.error('❌ Error updating daily leaderboard:', error);
  }
}

cron.schedule('1 0 * * *', updateLeaderboardData, {
  timezone: 'UTC'
});

console.log('Daily leaderboard cron job scheduled for 00:01 UTC');

export { updateLeaderboardData };