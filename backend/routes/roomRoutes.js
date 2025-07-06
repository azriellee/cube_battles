// routes/rooms.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { getScramblesForRoom } from "./scrambleUtils.js";

const router = express.Router();
const prisma = new PrismaClient();

// Generate random room code
const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

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

// Create a new room
router.post("/create", async (req, res) => {
  try {
    let roomCode;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique room code
    while (attempts < maxAttempts) {
      roomCode = generateRoomCode();

      const existingRoom = await prisma.room.findUnique({
        where: { code: roomCode },
      });

      if (!existingRoom) {
        break;
      }
      attempts++;
    }

    if (attempts === maxAttempts) {
      return res.status(500).json({
        error: "Failed to generate unique room code. Please try again.",
      });
    }

    // Create the room
    const room = await prisma.room.create({
      data: { code: roomCode },
    });

    res.status(201).json({
      success: true,
      roomCode: room.code,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      error: "Failed to create room",
      details: error.message,
    });
  }
});

// Join an existing room
router.post("/join", async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        error: "Room code is required",
      });
    }

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

    res.json({
      success: true,
      roomCode: room.code,
      message: "Successfully joined room",
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      error: "Failed to join room",
      details: error.message,
    });
  }
});

// Submit a username for the room
router.post("/submit-username", async (req, res) => {
  try {
    const { roomCode, username } = req.body;

    if (!roomCode || !username) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Room code and username are required.",
      });
    }

    const upperRoomCode = roomCode.toUpperCase();

    await prisma.roomParticipant.create({
      data: {
        roomCode: upperRoomCode,
        playerName: username,
      },
    });

    res.status(200).json({
      success: true,
      message: `Welcome, ${username}! You have successfully joined room ${roomCode}.`,
      roomCode: upperRoomCode,
      playerName: username,
    });
  } catch (error) {
    console.error("Error in /submit-username endpoint:", error);
    
    // Check if it's a unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Username taken",
        message: `The username '${req.body.username}' is already taken in room '${req.body.roomCode}'. Please choose a different one.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: "Server error",
        message: "An unexpected error occurred while processing your request.",
        details: error.message,
      });
    }
  }
});

// Get room scrambles
router.get("/:roomCode/scrambles", async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
    });

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }
    const scrambles = await getScramblesForRoom(roomCode);
    res.json({ scrambles });
  } catch (error) {
    console.error("Error fetching room info:", error);
    res.status(500).json({
      error: "Failed to fetch room information",
      details: error.message,
    });
  }
});

// Get daily leaderboard for a room
router.get("/:roomCode/daily-leaderboard", async (req, res) => {
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

    // Get today's date range
    const { startOfDay, endOfDay } = getPreviousDayDateRange();
    // console.log(startOfDay, endOfDay);
    // Fetch today's statistics for the room
    const todayStats = await prisma.roomStatistics.findMany({
      where: {
        roomCode: roomCode.toUpperCase(),
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: [
        { ao5: "asc" }, // Best AO5 first (ascending - lower is better)
        { ao12: "asc" }, // Then best AO12
        { bestSolve: "asc" }, // Then best single solve
      ],
    });

    // Format the leaderboard data
    const leaderboard = todayStats.map((stat, index) => ({
      rank: index + 1,
      playerName: stat.playerName,
      ao5: stat.ao5,
      ao12: stat.ao12,
      bestSolve: stat.bestSolve,
      date: stat.date,
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

router.post("/updateStatistics", async (req, res) => {
  try {
    // Get data from request body, not params
    const { roomCode, playerName, date, ao5, ao12, bestSolve } = req.body;

    if (!roomCode || !playerName || !date) {
      return res.status(400).json({
        error: "Room code, player name, and date are required",
      });
    }

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

    // Convert date string to DateTime if needed
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        message: "Date must be a valid ISO string",
      });
    }

    // Convert string values to Float if they're not null/undefined
    const parsedAo5 =
      ao5 !== null && ao5 !== undefined ? parseFloat(ao5) : null;
    const parsedAo12 =
      ao12 !== null && ao12 !== undefined ? parseFloat(ao12) : null;
    const parsedBestSolve =
      bestSolve !== null && bestSolve !== undefined
        ? parseFloat(bestSolve)
        : null;

    // Check for NaN values
    if (
      (ao5 !== null && ao5 !== undefined && isNaN(parsedAo5)) ||
      (ao12 !== null && ao12 !== undefined && isNaN(parsedAo12)) ||
      (bestSolve !== null && bestSolve !== undefined && isNaN(parsedBestSolve))
    ) {
      return res.status(400).json({
        error: "Invalid number format",
        message: "ao5, ao12, and bestSolve must be valid numbers",
      });
    }

    // Use upsert to either create new or update existing statistics
    const stats = await prisma.roomStatistics.upsert({
      where: {
        roomCode_playerName_date: {
          roomCode: roomCode.toUpperCase(),
          playerName: playerName,
          date: parsedDate,
        },
      },
      update: {
        ao5: parsedAo5,
        ao12: parsedAo12,
        bestSolve: parsedBestSolve,
      },
      create: {
        roomCode: roomCode.toUpperCase(),
        playerName: playerName,
        date: parsedDate,
        ao5: parsedAo5,
        ao12: parsedAo12,
        bestSolve: parsedBestSolve,
      },
    });

    res.json({
      success: true,
      data: stats,
      message: "Statistics updated successfully",
    });
  } catch (error) {
    console.error("Error updating statistics:", error);
    res.status(500).json({
      error: "Failed to update statistics",
      details: error.message,
    });
  }
});

// List all rooms (optional - for debugging/admin)
router.get("/", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { code: "asc" },
    });

    res.json({
      success: true,
      rooms: rooms.map((room) => ({ code: room.code })),
      count: rooms.length,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      error: "Failed to fetch rooms",
      details: error.message,
    });
  }
});

export default router;
