/**
 * ERPNext Materials API Route
 *
 * API endpoint for materials management
 */

import { NextRequest, NextResponse } from "next/server";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";

export async function GET() {
  try {
    // In a real implementation, this would fetch from database
    // For now, return empty array - will be populated by POST
    return NextResponse.json({ materials: [] });
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // In a real implementation, this would save to database
    // For now, return the created material
    const material = {
      id: `material-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };

    return NextResponse.json({ material });
  } catch (error) {
    console.error("Failed to create material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 },
    );
  }
}
