/*
  Warnings:

  - You are about to drop the `RoomLeaderboard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "RoomLeaderboard";

-- CreateTable
CREATE TABLE "WeeklyLeaderboard" (
    "roomCode" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeeklyLeaderboard_pkey" PRIMARY KEY ("roomCode","playerName","weekStart")
);

-- CreateTable
CREATE TABLE "WeeklyBestStats" (
    "roomCode" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "bestAo5" DOUBLE PRECISION,
    "bestAo5PlayerName" TEXT,
    "bestAo12" DOUBLE PRECISION,
    "bestAo12PlayerName" TEXT,
    "bestSolve" DOUBLE PRECISION,
    "bestSolvePlayerName" TEXT,

    CONSTRAINT "WeeklyBestStats_pkey" PRIMARY KEY ("roomCode","weekStart")
);
