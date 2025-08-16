/*
  Warnings:

  - The primary key for the `WeeklyBestStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bestAo12PlayerName` on the `WeeklyBestStats` table. All the data in the column will be lost.
  - You are about to drop the column `bestAo5PlayerName` on the `WeeklyBestStats` table. All the data in the column will be lost.
  - You are about to drop the column `bestSolvePlayerName` on the `WeeklyBestStats` table. All the data in the column will be lost.
  - Added the required column `playerName` to the `WeeklyBestStats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WeeklyBestStats" DROP CONSTRAINT "WeeklyBestStats_pkey",
DROP COLUMN "bestAo12PlayerName",
DROP COLUMN "bestAo5PlayerName",
DROP COLUMN "bestSolvePlayerName",
ADD COLUMN     "playerName" TEXT NOT NULL,
ADD CONSTRAINT "WeeklyBestStats_pkey" PRIMARY KEY ("roomCode", "weekStart", "playerName");
