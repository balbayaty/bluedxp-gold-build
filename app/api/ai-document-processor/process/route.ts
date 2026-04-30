/**
 * API: Process Document to Workflow
 * Upload any document and convert it to a visualized process
 */

import { NextRequest, NextResponse } from "next/server";
import { processDocumentToWorkflow } from "@/lib/services/ai-document-processor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const useAI = formData.get("useAI") === "true";
    const processType = formData.get("processType") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process document
    const result = await processDocumentToWorkflow(buffer, file.name, {
      useAI,
      processType: processType as any,
    });

    return NextResponse.json({
      success: true,
      data: {
        parsed: {
          id: result.parsed.id,
          filename: result.parsed.filename,
          type: result.parsed.type,
          wordCount: result.parsed.metadata.wordCount,
        },
        extracted: {
          id: result.extracted.id,
          name: result.extracted.name,
          description: result.extracted.description,
          type: result.extracted.type,
          stepsCount: result.extracted.steps.length,
          actors: result.extracted.actors,
          confidence: result.extracted.metadata.confidence,
        },
        visualization: result.visualization,
        workflow: result.workflow,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
