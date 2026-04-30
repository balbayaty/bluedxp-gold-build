/**
 * Database Service
 * Central database access layer
 */

export { prisma } from "./prismaClient";
export { eventStorePersistence } from "./eventStorePersistence";

/**
 * Initialize database
 * In development, connection failures are non-blocking to allow app to start without database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection with reduced timeout (2s instead of 5s) for faster startup
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          2000,
        ),
      ),
    ]);
    console.log("✅ Database connected successfully");

    // Initialize event store persistence
    if (typeof window === "undefined") {
      eventStorePersistence.initialize();
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);

    // In development, allow app to continue without database
    // Services will use fallbacks (in-memory storage, etc.)
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️ Continuing without database connection - services will use fallbacks",
      );
      return;
    }

    // In production, throw error to prevent deployment with broken database
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}
