import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

async function main() {
  const game = await prisma.game.update({
    where: { slug: "social-empires" },
    data: {
      gameUrl: "/social-emperors",
    },
  });
  console.log("gameUrl atualizado:", game.gameUrl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
