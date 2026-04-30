/**
 * Copilot Chat API with Attachment Support
 * Handles copilot conversations with file attachments and document analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotService } from "@/lib/services/copilot/copilotService";
import type {
  CopilotRequest,
  CopilotResponse,
} from "@/lib/services/copilot/copilotService";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 },
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const message = (formData.get("message") as string) || "";
    const conversationId = formData.get("conversationId") as string | null;
    const contextStr = formData.get("context") as string | null;
    const optionsStr = formData.get("options") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File attachment is required" },
        { status: 400 },
      );
    }

    // Parse context and options
    let contextObj = {};
    let options = {
      useRAG: true,
      useMemory: true,
      useTools: true,
    };

    try {
      if (contextStr) {
        contextObj = JSON.parse(contextStr);
      }
      if (optionsStr) {
        options = { ...options, ...JSON.parse(optionsStr) };
      }
    } catch (e) {
      console.warn("[Copilot] Failed to parse context/options:", e);
    }

    // Analyze the file
    let attachmentAnalysis: any = null;
    try {
      // Convert file to buffer for analysis
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine file type
      const fileName = file.name.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileName);
      const isPDF = fileName.endsWith(".pdf");
      const isDocument = /\.(doc|docx|xls|xlsx|ppt|pptx|txt|md)$/i.test(
        fileName,
      );

      let extractedText = "";
      let confidence = 0.5;

      // Try to extract text from the file
      if (isPDF || isImage) {
        try {
          const { ocrService } = await import("@/lib/services/ocr/ocrService");
          if (ocrService.isAvailable()) {
            if (isPDF) {
              const ocrResult = await ocrService.extractTextFromPDF(buffer, {
                language: "eng",
                psm: 6,
              });
              extractedText = ocrResult.text;
              confidence = ocrResult.confidence / 100;
            } else if (isImage) {
              const ocrResult = await ocrService.extractTextFromImage(buffer, {
                language: "eng",
                psm: 6,
              });
              extractedText = ocrResult.text;
              confidence = ocrResult.confidence / 100;
            }
          }
        } catch (ocrError) {
          console.warn("[Copilot] OCR extraction failed:", ocrError);
        }
      } else if (isDocument) {
        try {
          // Try to use document parser
          const { UniversalDocumentParser } =
            await import("@/lib/services/ai-document-processor/documentParser");
          const parser = new UniversalDocumentParser();
          const parsed = await parser.parseDocument(buffer, file.name);
          extractedText = parsed.content.text || "";
          confidence = 0.8;
        } catch (parseError) {
          console.warn("[Copilot] Document parsing failed:", parseError);
          // Fallback: try to read as text
          try {
            extractedText = buffer.toString(
              "utf-8",
              0,
              Math.min(50000, buffer.length),
            );
            confidence = 0.6;
          } catch (e) {
            console.warn("[Copilot] Text extraction failed:", e);
          }
        }
      } else {
        // Try to read as text
        try {
          extractedText = buffer.toString(
            "utf-8",
            0,
            Math.min(50000, buffer.length),
          );
          confidence = 0.5;
        } catch (e) {
          console.warn("[Copilot] Text extraction failed:", e);
        }
      }

      attachmentAnalysis = {
        filename: file.name,
        type: isImage
          ? "image"
          : isPDF
            ? "pdf"
            : isDocument
              ? "document"
              : "other",
        size: file.size,
        mimeType: file.type,
        extractedText: extractedText.substring(0, 10000), // Limit text size
        confidence,
        extractedAt: new Date().toISOString(),
      };
    } catch (analysisError) {
      console.error("[Copilot] File analysis error:", analysisError);
      // Continue without analysis
      attachmentAnalysis = {
        filename: file.name,
        type: "other",
        size: file.size,
        mimeType: file.type,
        error: "Analysis failed",
      };
    }

    // Build enhanced message with file context
    const enhancedMessage = attachmentAnalysis?.extractedText
      ? `${message}\n\n[File Context]\nFilename: ${file.name}\nType: ${attachmentAnalysis.type}\nSize: ${(file.size / 1024).toFixed(1)}KB\n\nExtracted Content:\n${attachmentAnalysis.extractedText.substring(0, 5000)}`
      : `${message}\n\n[File Attachment]\nFilename: ${file.name}\nType: ${attachmentAnalysis?.type || "unknown"}\nSize: ${(file.size / 1024).toFixed(1)}KB`;

    // Create copilot request
    const copilotRequest: CopilotRequest = {
      conversationId: conversationId || undefined,
      message: enhancedMessage,
      context: contextObj,
      options,
    };

    // Process message with copilot service
    const response = await copilotService.processMessage(
      context.tenantId,
      context.userId,
      copilotRequest,
    );

    // Add attachment analysis to response metadata
    const enhancedResponse: CopilotResponse = {
      ...response,
      message: {
        ...response.message,
        metadata: {
          ...response.message.metadata,
          attachmentAnalysis,
        },
      },
    };

    return NextResponse.json(enhancedResponse, { status: 200 });
  } catch (error: any) {
    console.error("[Copilot API] FATAL ERROR:", error);
    if (error.response) {
      console.error("[Copilot API] Response data:", error.response.data);
      console.error("[Copilot API] Response status:", error.response.status);
    }
    return NextResponse.json(
      {
        error: "Failed to process message with attachment",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
