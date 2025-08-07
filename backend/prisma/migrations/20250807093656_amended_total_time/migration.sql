/*
  Warnings:

  - Made the column `totalTime` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "totalTime" SET NOT NULL,
ALTER COLUMN "totalTime" SET DEFAULT 0;
