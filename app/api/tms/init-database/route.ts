/**
 * TMS Database Initialization API
 * Creates all required tables
 */

import { NextResponse } from "next/server";
import { tmsDatabaseAdapter } from "@/lib/services/tms/database/tmsDatabaseAdapter";

/**
 * POST /api/tms/init-database - Initialize database tables
 */
export async function POST() {
  try {
    // Force initialization by calling ensureInitialized
    // This will create tables if they don't exist
    const adapter = new tmsDatabaseAdapter();

    // Try to store a dummy job to trigger table creation
    // Actually, let's just call ensureTables directly
    // But since it's private, we'll trigger it by attempting an operation

    // Create a test connection to trigger table creation
    await (adapter as any).ensureInitialized();

    return NextResponse.json({
      success: true,
      message: "Database tables initialized successfully",
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
