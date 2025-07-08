import express from 'express';
import { updateDailyLeaderboard } from '../cron_jobs/updateLeaderboard.js';

const router = express.Router();

// Manual trigger endpoint (protected route recommended)
router.post('/update-leaderboard', async (req, res) => {
  try {
    // Optional: Add authentication/authorization here
    // const adminKey = req.headers['x-admin-key'];
    // if (adminKey !== process.env.ADMIN_KEY) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    await updateDailyLeaderboard();
    res.json({ message: 'Leaderboard updated successfully' });
  } catch (error) {
    console.error('Manual leaderboard update failed:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// Get current leaderboard for a room
router.get('/leaderboard/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    const leaderboard = await prisma.roomLeaderboard.findMany({
      where: { roomCode },
      orderBy: { playerScore: 'desc' }
    });
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;