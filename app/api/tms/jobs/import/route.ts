/**
 * TMS CSV Import API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { tmsCoreService } from "@/lib/services/tms/tmsCoreService";
import { tmsDatabaseAdapter } from "@/lib/services/tms/database/tmsDatabaseAdapter";

/**
 * POST /api/tms/jobs/import - Import jobs from CSV
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure database tables exist
    try {
      const adapter = new tmsDatabaseAdapter();
      await (adapter as any).ensureInitialized();
    } catch (initError) {
      console.warn("Database initialization warning:", initError);
      // Continue anyway - tables might already exist
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tenantId = formData.get("tenantId") as string;
    const createdBy = formData.get("createdBy") as string;

    if (!file) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 },
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: "Created by is required" },
        { status: 400 },
      );
    }

    // Read CSV content
    const csvContent = await file.text();

    // Import jobs
    const result = await tmsCoreService.importJobsFromCSV(
      csvContent,
      tenantId,
      createdBy,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing jobs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
