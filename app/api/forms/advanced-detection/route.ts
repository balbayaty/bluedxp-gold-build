import { NextRequest, NextResponse } from "next/server";
import { advancedSmartDetectionService } from "@/lib/services/forms/advancedSmartDetectionService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fieldsRaw = formData.get("fields");
    const contextRaw = formData.get("context");

    if (!fieldsRaw || typeof fieldsRaw !== "string") {
      return NextResponse.json(
        { success: false, error: "fields is required" },
        { status: 400 },
      );
    }
    if (!contextRaw || typeof contextRaw !== "string") {
      return NextResponse.json(
        { success: false, error: "context is required" },
        { status: 400 },
      );
    }

    const fields = JSON.parse(fieldsRaw);
    const context = JSON.parse(contextRaw);

    // Optional uploads (multipart)
    const documents = (formData.getAll("documents") || []).filter(
      Boolean,
    ) as File[];
    const images = (formData.getAll("images") || []).filter(Boolean) as File[];
    const voice = formData.get("voice") as Blob | null;

    if (documents.length > 0) context.uploadedDocuments = documents;
    if (images.length > 0) context.uploadedImages = images;
    if (voice) context.voiceInput = voice;

    const result = await advancedSmartDetectionService.detectFormFieldsAdvanced(
      fields,
      context,
    );
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Advanced detection error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Advanced detection failed" },
      { status: 500 },
    );
  }
}
