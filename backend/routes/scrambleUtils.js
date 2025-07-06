// scrambleUtils.js
import { PrismaClient } from "@prisma/client";
import cstimer from "cstimer_module"; // Make sure cstimer_module is installed

const prisma = new PrismaClient();

/**
 * Gets the current date set to midnight UTC.
 * This is crucial for consistent daily entries in the database.
 * @returns {Date} A Date object representing the current day at 00:00:00 UTC.
 */
function getTodayMidnightUtc() {
  const now = new Date();
  // Construct a new Date object based on UTC year, month, day to get midnight UTC
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}

/**
 * Ensures that scrambles for a given room and the current day exist in the database.
 * If they don't exist, new scrambles are generated and inserted.
 * @param {string} roomCode The code of the room.
 * @returns {Promise<string[]>} A promise that resolves to an array of 20 scramble strings.
 */
export async function getScramblesForRoom(roomCode) {
  const today = getTodayMidnightUtc();

  try {
    // 1. Try to find existing scrambles for today
    let roomScramblesRecord = await prisma.roomScrambles.findUnique({
      where: {
        roomCode_date: { // Using the compound unique ID defined in schema.prisma
          roomCode: roomCode,
          date: today,
        },
      },
    });

    if (!roomScramblesRecord) {
      // 2. If no scrambles found for today, generate them
      const generatedScrambles = [];
      for (let i = 0; i < 20; i++) {
        generatedScrambles.push(cstimer.getScramble("333"));
      }

      // 3. Store the new scrambles in the database
      roomScramblesRecord = await prisma.roomScrambles.create({
        data: {
          roomCode: roomCode,
          date: today,
          scrambles: JSON.stringify(generatedScrambles), // Store array as a JSON string
        },
      });
      console.log(`Generated and stored new scrambles for room ${roomCode} on ${today.toISOString().split('T')[0]}`);
    } else {
      console.log(`Found existing scrambles for room ${roomCode} on ${today.toISOString().split('T')[0]}`);
    }

    // 4. Return the scrambles, parsing them from the JSON string
    return JSON.parse(roomScramblesRecord.scrambles);

  } catch (error) {
    console.error(`Error in getScramblesForRoom for room ${roomCode}:`, error);
    throw new Error("Failed to retrieve or generate daily scrambles.");
  }
}