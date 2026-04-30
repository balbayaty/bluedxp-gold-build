"use server";

import { documentQRService } from "@/lib/services/qr/documentQRService";
import { qrTemplateService } from "@/lib/services/qr/qrTemplateService";
import { QRCodeData } from "@/types/qr";

export interface GenerateQRResult {
  success: boolean;
  qrCode?: string;
  qrImageUrl?: string;
  qrId?: string;
  error?: string;
}

export interface GenerateQRInput {
  entityId: string;
  entityType?: QRCodeData["type"];
  entityName?: string;
  documentType?: QRCodeData["documentType"];
  documentUrl?: string;
  module?: string;
  templateId?: string;
  customData?: Record<string, any>;
}

/**
 * Server Action to generate QR codes
 * Wraps backend services to prevent bundler issues with fs/sqlite in client components
 */
export async function generateUniversalQR(
  input: GenerateQRInput,
): Promise<GenerateQRResult> {
  try {
    const {
      entityId,
      entityType = "other",
      entityName,
      documentType,
      documentUrl,
      module,
      templateId,
      customData,
    } = input;

    let result;

    if (templateId) {
      // Generate from template
      result = await qrTemplateService.generateFromTemplate(templateId, {
        documentId: entityId,
        documentType: documentType || "other",
        documentUrl: documentUrl || `/${module || entityType}/${entityId}`,
        customData: {
          ...customData,
          entityType,
          entityName,
          module,
        },
      });
    } else {
      // Generate standard QR
      const qrResult = await documentQRService.generateDocumentQR({
        documentId: entityId,
        documentType: documentType || "other",
        documentUrl: documentUrl || `/${module || entityType}/${entityId}`,
        dynamic: true,
        analytics: true,
        customData: {
          ...customData,
          entityType,
          entityName,
          module,
        },
      });

      result = {
        qrCode: qrResult.qrCode,
        qrImageUrl: qrResult.qrImageUrl,
        qrId: qrResult.qrData.id,
      };
    }

    return {
      success: true,
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      qrId: result.qrId,
    };
  } catch (error: any) {
    console.error("Error in generateUniversalQR:", error);
    return {
      success: false,
      error: error.message || "Failed to generate QR code",
    };
  }
}
