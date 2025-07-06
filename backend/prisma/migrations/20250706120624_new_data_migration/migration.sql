-- CreateTable
CREATE TABLE "Room" (
    "code" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "RoomScrambles" (
    "roomCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scrambles" TEXT NOT NULL,

    CONSTRAINT "RoomScrambles_pkey" PRIMARY KEY ("roomCode","date")
);

-- CreateTable
CREATE TABLE "RoomStatistics" (
    "roomCode" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ao5" DOUBLE PRECISION NOT NULL,
    "ao12" DOUBLE PRECISION NOT NULL,
    "bestSolve" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoomStatistics_pkey" PRIMARY KEY ("roomCode","playerName","date")
);

-- CreateTable
CREATE TABLE "RoomLeaderboard" (
    "roomCode" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerScore" INTEGER NOT NULL,

    CONSTRAINT "RoomLeaderboard_pkey" PRIMARY KEY ("roomCode","playerName")
);
