/**
 * ERPNext Compliance API Route
 *
 * API endpoint for compliance records
 */

import { NextRequest, NextResponse } from "next/server";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";

export async function GET() {
  try {
    // In a real implementation, this would fetch from database
    // For now, return empty array - will be populated by POST
    return NextResponse.json({ records: [] });
  } catch (error) {
    console.error("Failed to fetch compliance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // In a real implementation, this would save to database
    // For now, return the created record
    const record = {
      id: `record-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Failed to create compliance record:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}
