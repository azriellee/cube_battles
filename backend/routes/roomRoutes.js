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
    const { roomCode, playerName } = req.body;

    if (!roomCode || !playerName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Room code and playerName are required.",
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

    const upperRoomCode = roomCode.toUpperCase();

    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomCode_playerName: {
          roomCode: upperRoomCode,
          playerName: playerName,
        },
      },
    });

    if (!existingParticipant) {
      await prisma.roomParticipant.create({
        data: {
          roomCode: upperRoomCode,
          playerName: playerName,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome, ${playerName}! You have successfully joined room ${roomCode}.`,
      roomCode: upperRoomCode,
      playerName: playerName,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      error: "Failed to join room",
      details: error.message,
    });
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

// Get room participants
router.get("/:roomCode/participants", async (req, res) => {
  try {
    const { roomCode } = req.params;

    const participants = await prisma.roomParticipant.findMany({
      where: { roomCode: roomCode.toUpperCase() },
      select: {
        playerName: true,
      },
    });

    if (!participants) {
      return res.status(404).json({
        error: "No participants found",
      });
    }
    res.json(participants);
  } catch (error) {
    console.error("Error fetching room participants:", error);
    res.status(500).json({
      error: "Failed to fetch room information",
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
