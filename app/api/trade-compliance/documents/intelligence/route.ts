import { NextRequest, NextResponse } from "next/server";
import { documentIntelligenceService } from "@/lib/services/trade-compliance/documentIntelligenceService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType =
      (formData.get("documentType") as string | null) || "COMMERCIAL_INVOICE";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "file is required" },
        { status: 400 },
      );
    }

    const extraction = await documentIntelligenceService.extractDocument(
      file,
      documentType,
    );
    const validation =
      await documentIntelligenceService.validateDocument(extraction);

    return NextResponse.json({ success: true, extraction, validation });
  } catch (error: any) {
    console.error("Trade compliance document intelligence error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process document" },
      { status: 500 },
    );
  }
}
