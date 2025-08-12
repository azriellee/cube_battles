/*
  Warnings:

  - The primary key for the `Player` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Player` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Player_playerName_key";

-- AlterTable
ALTER TABLE "Player" DROP CONSTRAINT "Player_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("playerName");
