import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { getPreviousDayDateRange } from "../routes/dateUtils.js";

const prisma = new PrismaClient();

async function main() {
  const { startOfDay } = getPreviousDayDateRange();
  for (let i = 0; i < 10; i++) {
    await prisma.roomStatistics.create({
      data: {
        roomCode: "TW6FHU",
        playerName: faker.person.firstName(),
        date: startOfDay,
        ao5: parseFloat(faker.number.float({ min: 10, max: 30 }).toFixed(2)),
        ao12: parseFloat(faker.number.float({ min: 10, max: 35 }).toFixed(2)),
        bestSolve: parseFloat(
          faker.number.float({ min: 8, max: 25 }).toFixed(2)
        ),
      },
    });
  }
}

main()
  .then(() => console.log("Seeding done"))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
