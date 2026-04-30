/**
 * ERPNext Documents API Route
 * Returns list of documents from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const result = await erpNextAPI.getDocuments();

    if (result.success && result.data) {
      let documents = result.data;

      // Filter by type if provided
      if (type) {
        documents = documents.filter(
          (doc: any) => doc.file_type === type || doc.type === type,
        );
      }

      // Filter by category if provided
      if (category) {
        documents = documents.filter((doc: any) => doc.category === category);
      }

      return NextResponse.json({
        success: true,
        documents: documents,
        data: documents, // Also include 'data' for backward compatibility
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      documents: [
        {
          name: "DOC-2025-001",
          file_name: "Safety_Procedure_v2.pdf",
          file_url: "/files/safety_procedure.pdf",
          creation: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          modified: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          type: "procedure",
          category: "Safety",
        },
        {
          name: "DOC-2025-002",
          file_name: "Quality_Manual.pdf",
          file_url: "/files/quality_manual.pdf",
          creation: new Date(
            Date.now() - 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          modified: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          type: "manual",
          category: "Quality",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await erpNextAPI.createDocument(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        document: result.data,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Failed to create document" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create document" },
      { status: 500 },
    );
  }
}
