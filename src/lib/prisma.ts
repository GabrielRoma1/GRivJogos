import { PrismaClient } from "@prisma/client";
import path from "path";

const prismaClientSingleton = () => {
  // Resolve o caminho absoluto para o banco SQLite na pasta prisma
  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
