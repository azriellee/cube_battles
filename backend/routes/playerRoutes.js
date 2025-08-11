import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Create new player upon sign up
router.post("/create-player", async (req, res) => {
  try {
    const { playerName, email } = req.body;
    console.log("Creating player:", playerName, email);
    await prisma.player.create({
      data: {
        playerName,
        email,
      },
    });

    res.json({ message: "Player created successfully" });
  } catch (error) {
    console.error("Error creating player:", error);

    if (error.code === "P2002") {
      // Prisma unique constraint error
      return res.status(400).json({
        error: "Player with this email or name already exists",
      });
    }

    res.status(500).json({ error: "Failed to create player" });
  }
});

router.get("/get-player/:playerName", async (req, res) => {
  try {
    const { playerName } = req.params;
    const player = await prisma.player.findUnique({
      where: { playerName },
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const averageTime =
      player.numSolves > 0 && player.totalTime
        ? parseFloat((player.totalTime / player.numSolves).toFixed(2))
        : null;

    const response = {
      id: player.id,
      playerName: player.playerName,
      email: player.email,
      dateJoined: player.dateJoined,
      numSolves: player.numSolves,
      averageTime: averageTime,
      bestAo5: player.bestAo5,
      bestAo12: player.bestAo12,
      bestSolve: player.bestSolve,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ error: "Failed to fetch player" });
  }
});

router.post("/update-player-stats", async (req, res) => {
  const { playerName, numSolves, totalTime, bestAo5, bestAo12, bestSolve } =
    req.body;

  console.log("details received: ", req.body);

  try {
    const player = await prisma.player.findUnique({
      where: { playerName },
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Convert string values to Float if they're not null/undefined
    const parsedAo5 =
      bestAo5 !== null && bestAo5 !== undefined ? parseFloat(bestAo5) : null;
    const parsedAo12 =
      bestAo12 !== null && bestAo12 !== undefined ? parseFloat(bestAo12) : null;
    const parsedBestSolve =
      bestSolve !== null && bestSolve !== undefined
        ? parseFloat(bestSolve)
        : null;

    const updatedPlayer = await prisma.player.update({
      where: { playerName },
      data: {
        numSolves: {
          increment: numSolves,
        },
        totalTime: {
          increment: totalTime,
        },
        bestAo5:
          player.bestAo5 == null || parsedAo5 < player.bestAo5
            ? parsedAo5
            : player.bestAo5,
        bestAo12:
          player.bestAo12 == null || parsedAo12 < player.bestAo12
            ? parsedAo12
            : player.bestAo12,
        bestSolve:
          player.bestSolve == null || parsedBestSolve < player.bestSolve
            ? parsedBestSolve
            : player.bestSolve,
      },
    });

    res
      .status(200)
      .json({ message: "Player stats updated", player: updatedPlayer });
  } catch (err) {
    console.error("Error updating player stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/get-rooms/:playerName", async (req, res) => {
  try {
    const { playerName } = req.params;

    // Find all roomParticipants with this playerName
    const rooms = await prisma.roomParticipant.findMany({
      where: { playerName },
      select: {
        roomCode: true, // Only select roomCode
      },
    });

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ error: "No rooms joined" });
    }

    res.json({ rooms });
  } catch (error) {
    console.error("Error fetching player rooms:", error);
    res.status(500).json({ error: "Failed to fetch player rooms" });
  }
});

export default router;
