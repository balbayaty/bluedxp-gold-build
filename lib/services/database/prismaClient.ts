/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of PrismaClient is created
 * SERVER-ONLY: This file should never be imported in client components
 */

// CRITICAL: Only import Prisma on the server
// This prevents webpack from trying to bundle it for the browser
let PrismaClient: any = null;
let prismaInstance: any = null;

if (typeof window === "undefined") {
  // Server-side: Import Prisma normally
  const { PrismaClient: PrismaClientClass } = require("@prisma/client");
  PrismaClient = PrismaClientClass;
} else {
  // Client-side: Return a mock that throws an error if used
  PrismaClient = class {
    constructor() {
      throw new Error(
        "PrismaClient cannot be used on the client side. Use server actions or API routes instead.",
      );
    }
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (typeof window === "undefined"
    ? new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })
    : null);

if (process.env.NODE_ENV !== "production" && typeof window === "undefined") {
  globalForPrisma.prisma = prisma;
}
