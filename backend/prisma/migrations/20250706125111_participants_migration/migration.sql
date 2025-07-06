-- CreateTable
CREATE TABLE "RoomParticipant" (
    "roomCode" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("roomCode","playerName")
);
