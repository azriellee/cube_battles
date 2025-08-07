-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numSolves" INTEGER NOT NULL DEFAULT 0,
    "totalTime" DOUBLE PRECISION,
    "bestAo5" DOUBLE PRECISION,
    "bestAo12" DOUBLE PRECISION,
    "bestSolve" DOUBLE PRECISION,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_playerName_key" ON "Player"("playerName");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");
