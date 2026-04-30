/**
 * Single Declaration API
 * GET: Get declaration by ID
 * PUT: Update declaration
 * DELETE: Cancel declaration
 */

import { NextRequest, NextResponse } from "next/server";
import { customsOrchestrator } from "@/lib/services/customs/customsOrchestrator";
import { declarationStore } from "@/lib/services/customs/declarationStore";
import type { CustomsDeclaration } from "@/types/customs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Get declaration from store
    const declaration = declarationStore.get(id);

    if (!declaration) {
      return NextResponse.json(
        { success: false, error: "Declaration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      declaration,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Get existing declaration
    const existing = declarationStore.get(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Declaration not found" },
        { status: 404 },
      );
    }

    // Update declaration
    const updated: CustomsDeclaration = {
      ...existing,
      ...body,
      updatedAt: new Date(),
    };

    // Save updated declaration
    declarationStore.save(updated);

    // If status changed, update via orchestrator
    if (body.status && body.status !== existing.status) {
      // Would trigger orchestrator update if needed
    }

    return NextResponse.json({
      success: true,
      declaration: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Get declaration
    const declaration = declarationStore.get(id);
    if (!declaration) {
      return NextResponse.json(
        { success: false, error: "Declaration not found" },
        { status: 404 },
      );
    }

    // Cancel via orchestrator if needed
    if (declaration.status !== "CANCELLED") {
      // Would call orchestrator to cancel via adapter
    }

    // Delete from store
    declarationStore.delete(id);

    return NextResponse.json({
      success: true,
      message: "Declaration cancelled",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
