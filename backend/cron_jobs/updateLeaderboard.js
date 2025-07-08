// Install: npm install node-cron
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to calculate and update daily leaderboard
async function updateDailyLeaderboard() {
  try {
    console.log('Starting daily leaderboard update...');
    
    // get yesterday's date range in UTC, since the frontend uses UTC timing
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
    
    // Get all statistics from yesterday
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
    
    // Group by room code
    const roomGroups = {};
    yesterdayStats.forEach(stat => {
      if (!roomGroups[stat.roomCode]) {
        roomGroups[stat.roomCode] = [];
      }
      roomGroups[stat.roomCode].push(stat);
    });
    
    // Process each room
    for (const [roomCode, stats] of Object.entries(roomGroups)) {
      console.log(`Processing room: ${roomCode}`);
      
      // Find best performers in each category
      const bestSolveWinner = stats.reduce((best, current) => 
        current.bestSolve < best.bestSolve ? current : best
      );
      
      const bestAo5Winner = stats.reduce((best, current) => 
        current.ao5 < best.ao5 ? current : best
      );
      
      const bestAo12Winner = stats.reduce((best, current) => 
        current.ao12 < best.ao12 ? current : best
      );
      
      // Award points
      const pointsToAward = {};
      
      // Best solve: 4 points
      if (!pointsToAward[bestSolveWinner.playerName]) {
        pointsToAward[bestSolveWinner.playerName] = 0;
      }
      pointsToAward[bestSolveWinner.playerName] += 4;
      
      // Best ao5: 3 points
      if (!pointsToAward[bestAo5Winner.playerName]) {
        pointsToAward[bestAo5Winner.playerName] = 0;
      }
      pointsToAward[bestAo5Winner.playerName] += 3;
      
      // Best ao12: 3 points
      if (!pointsToAward[bestAo12Winner.playerName]) {
        pointsToAward[bestAo12Winner.playerName] = 0;
      }
      pointsToAward[bestAo12Winner.playerName] += 3;
      
      // Update leaderboard
      for (const [playerName, points] of Object.entries(pointsToAward)) {
        await prisma.roomLeaderboard.upsert({
          where: {
            roomCode_playerName: {
              roomCode,
              playerName
            }
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
        
        console.log(`Awarded ${points} points to ${playerName} in room ${roomCode}`);
      }
    }
    
    console.log('Daily leaderboard update completed successfully');
    
  } catch (error) {
    console.error('Error updating daily leaderboard:', error);
  }
}

// Schedule the job to run every day at 00:01 UTC
cron.schedule('1 0 * * *', updateDailyLeaderboard, {
  timezone: 'UTC'
});

// Optional: Run immediately when server starts (for testing)
// updateDailyLeaderboard();

console.log('Daily leaderboard cron job scheduled for 00:01 UTC');

export { updateDailyLeaderboard };