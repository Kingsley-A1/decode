import "server-only";

import { PrismaClient } from "@prisma/client";

interface PrismaGlobal {
  prisma?: PrismaClient;
}

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
