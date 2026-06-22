import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${dbPath}` } },
});

async function main() {
  const existing = await prisma.game.findUnique({
    where: { slug: "social-empires" },
  });

  if (existing) {
    console.log("Jogo social-empires ja existe:", existing.id);
    return;
  }

  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    throw new Error("Nenhuma categoria encontrada. Crie uma categoria no admin primeiro.");
  }

  const category =
    categories.find((c) =>
      /estrat|strategy|acao|aventura/i.test(c.name)
    ) ?? categories[0];

  const maxOrder = await prisma.game.aggregate({ _max: { displayOrder: true } });

  const game = await prisma.game.create({
    data: {
      title: "Social Empires",
      slug: "social-empires",
      description:
        "Jogo de estrategia Flash preservado pelo projeto Social Emperors. Requer o servidor do emulador ativo (npm run social-emperors).",
      imageUrl: "/uploads/images/social-emperors.png",
      gameType: "HTML5",
      gameUrl: "/social-emperors",
      isActive: true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      categoryId: category.id,
    },
  });

  console.log("Jogo criado:", game.id, game.slug, "categoria:", category.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
