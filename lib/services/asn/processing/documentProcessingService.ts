/**
 * Document Processing Service
 * Handles OCR, EDI parsing, and document extraction for ASNs
 */

import { PrismaClient } from "@prisma/client";
import type { ASNDocument, DocumentType } from "@/types/asn";
import { ocrService } from "@/lib/services/ocr/ocrService";

export class DocumentProcessingService {
  constructor(private db: PrismaClient) {}

  /**
   * Process ASN document (OCR, parsing, etc.)
   */
  async processDocument(
    documentId: string,
    tenantId: string,
  ): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    const document = await this.db.aSNDocument.findFirst({
      where: {
        id: documentId,
        tenantId,
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Determine processing method based on document type
    switch (document.type) {
      case "asn_document":
        return this.processAsnDocument(document);
      case "invoice":
        return this.processInvoice(document);
      case "packing_list":
        return this.processPackingList(document);
      case "photo":
        return this.processPhoto(document);
      default:
        return this.processGenericDocument(document);
    }
  }

  /**
   * Process ASN document (PDF, image, etc.)
   */
  private async processAsnDocument(document: any): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    try {
      // Download document from URL
      const fileBuffer = await this.downloadFileFromUrl(document.url);

      // Determine file type
      const isPDF =
        document.mimeType?.includes("pdf") ||
        document.url.toLowerCase().endsWith(".pdf");
      const isImage =
        document.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(document.url);

      let ocrResult;
      let extractedText = "";

      // Run OCR based on file type
      if (isPDF) {
        ocrResult = await ocrService.extractTextFromPDF(fileBuffer, {
          language: "eng",
          useCloudOCR: true, // Prefer cloud OCR for better accuracy
          cloud: {
            tenantId: document.tenantId,
            provider: "auto",
          },
        });
        extractedText = ocrResult.text;
      } else if (isImage) {
        ocrResult = await ocrService.extractTextFromImage(fileBuffer, {
          language: "eng",
          useCloudOCR: true,
          cloud: {
            tenantId: document.tenantId,
            provider: "auto",
            mimeType: document.mimeType || "image/jpeg",
          },
        });
        extractedText = ocrResult.text;
      } else {
        return {
          extractedData: {},
          confidence: 0,
          errors: ["Unsupported file type for OCR processing"],
        };
      }

      // Parse extracted text into structured ASN data
      const extractedData = this.parseASNText(extractedText);

      return {
        extractedData,
        confidence: (ocrResult.confidence || 0) / 100, // Convert to 0-1 scale
        errors: ocrResult.errors,
      };
    } catch (error: any) {
      console.error("Error processing ASN document:", error);
      return {
        extractedData: {},
        confidence: 0,
        errors: [error.message || "Failed to process document"],
      };
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFileFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(`Failed to download file from URL: ${error.message}`);
    }
  }

  /**
   * Parse OCR text into structured ASN data
   */
  private parseASNText(text: string): Record<string, unknown> {
    const extractedData: Record<string, unknown> = {
      asnNumber: null as string | null,
      supplierName: null as string | null,
      items: [] as any[],
      dates: {
        expectedArrival: null as Date | null,
        shipDate: null as Date | null,
      },
      totals: {
        quantity: null as number | null,
        value: null as number | null,
      },
    };

    // Extract ASN number (common patterns: ASN-12345, ASN12345, 12345)
    const asnMatch = text.match(
      /(?:ASN[:\s-]?|Advance\s+Shipping\s+Notice[:\s-]?)(\d+)/i,
    );
    if (asnMatch) {
      extractedData.asnNumber = asnMatch[1];
    }

    // Extract supplier name (look for "Supplier:", "Vendor:", "From:", etc.)
    const supplierMatch = text.match(
      /(?:Supplier|Vendor|From|Shipper)[:\s]+([A-Za-z\s&.,]+)/i,
    );
    if (supplierMatch) {
      extractedData.supplierName = supplierMatch[1].trim();
    }

    // Extract dates (various formats)
    const datePatterns = [
      /(?:Expected\s+Arrival|ETA|Arrival\s+Date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:Ship\s+Date|Shipped\s+On)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ];

    datePatterns.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            if (index === 0) {
              extractedData.dates = {
                ...(extractedData.dates as any),
                expectedArrival: date,
              };
            } else {
              extractedData.dates = {
                ...(extractedData.dates as any),
                shipDate: date,
              };
            }
          }
        } catch (e) {
          // Invalid date format, skip
        }
      }
    });

    // Extract quantities and values (look for "Total Quantity:", "Total:", etc.)
    const quantityMatch = text.match(/(?:Total\s+)?Quantity[:\s]+(\d+)/i);
    if (quantityMatch) {
      extractedData.totals = {
        ...(extractedData.totals as any),
        quantity: parseInt(quantityMatch[1], 10),
      };
    }

    const valueMatch = text.match(
      /(?:Total\s+)?(?:Value|Amount)[:\s]+[\$]?(\d+[.,]?\d*)/i,
    );
    if (valueMatch) {
      extractedData.totals = {
        ...(extractedData.totals as any),
        value: parseFloat(valueMatch[1].replace(",", "")),
      };
    }

    // Extract line items (look for SKU patterns)
    const skuPattern =
      /(?:SKU|Item|Part)[:\s#]+([A-Z0-9\-]+)[\s\S]*?(?:Qty|Quantity)[:\s]+(\d+)/gi;
    let itemMatch;
    const items: any[] = [];

    while ((itemMatch = skuPattern.exec(text)) !== null) {
      items.push({
        sku: itemMatch[1],
        quantity: parseInt(itemMatch[2], 10),
      });
    }

    if (items.length > 0) {
      extractedData.items = items;
    }

    return extractedData;
  }

  /**
   * Process invoice document
   */
  private async processInvoice(document: any): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    try {
      // Use vision service to extract invoice data
      const { visionService } = await import("@/lib/services/ai/visionService");
      const { callAI, isAIAvailable } = await import("@/utils/aiClient");

      // First, get OCR text from document
      const visionResult = await visionService.analyzeImage(document.url, {
        context: "Extract invoice data from this document",
        enableRootCauseAnalysis: false,
      });

      // Use AI to structure the extracted text
      if (isAIAvailable()) {
        const extractedText =
          visionResult.analysis.description || "No text extracted";

        const aiResponse = await callAI({
          prompt: `Extract invoice data from this text:

${extractedText}

Extract and return JSON with:
- invoiceNumber: string
- invoiceDate: string (ISO format)
- dueDate: string (ISO format)
- supplierName: string
- totalAmount: number
- currency: string
- lineItems: [{description, quantity, unitPrice, totalPrice, sku?}]
- taxAmount: number
- subtotal: number`,
          systemPrompt:
            "You are an invoice data extraction expert. Extract structured data accurately. Return valid JSON only.",
          model: "gpt-4",
          temperature: 0.2,
        });

        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          return {
            extractedData,
            confidence: 0.9,
          };
        }
      }

      // Fallback: Basic pattern matching
      return {
        extractedData: {
          invoiceNumber: this.extractInvoiceNumber(
            visionResult.analysis.description,
          ),
          invoiceDate: null,
          lineItems: [],
          totals: {},
        },
        confidence: 0.6,
      };
    } catch (error) {
      console.error("[Document Processing] Error processing invoice:", error);
      return {
        extractedData: {
          invoiceNumber: null,
          invoiceDate: null,
          lineItems: [],
          totals: {},
        },
        confidence: 0.3,
        errors: [
          error instanceof Error ? error.message : "Failed to process invoice",
        ],
      };
    }
  }

  /**
   * Extract invoice number from text using patterns
   */
  private extractInvoiceNumber(text: string | undefined): string | null {
    if (!text) return null;

    const patterns = [
      /Invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /INV\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /Invoice\s+Number\s*:?\s*([A-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Process packing list
   */
  private async processPackingList(document: any): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    try {
      // Use vision service to extract packing list data
      const { visionService } = await import("@/lib/services/ai/visionService");
      const { callAI, isAIAvailable } = await import("@/utils/aiClient");

      // Get OCR text from document
      const visionResult = await visionService.analyzeImage(document.url, {
        context: "Extract packing list data from this document",
        enableRootCauseAnalysis: false,
      });

      // Use AI to structure the extracted text
      if (isAIAvailable()) {
        const extractedText =
          visionResult.analysis.description || "No text extracted";

        const aiResponse = await callAI({
          prompt: `Extract packing list data from this text:

${extractedText}

Extract and return JSON with:
- packingListNumber: string
- shipDate: string (ISO format)
- items: [{sku, description, quantity, unit, weight?, dimensions?}]
- packages: [{packageNumber, type, weight, dimensions, contents: [sku]}]
- totalPackages: number
- totalWeight: number
- weightUnit: string
- shippingMethod: string`,
          systemPrompt:
            "You are a packing list data extraction expert. Extract structured data accurately. Return valid JSON only.",
          model: "gpt-4",
          temperature: 0.2,
        });

        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          return {
            extractedData,
            confidence: 0.88,
          };
        }
      }

      // Fallback: Return basic structure
      return {
        extractedData: {
          items: [],
          quantities: {},
          packages: [],
        },
        confidence: 0.5,
      };
    } catch (error) {
      console.error(
        "[Document Processing] Error processing packing list:",
        error,
      );
      return {
        extractedData: {
          items: [],
          quantities: {},
          packages: [],
        },
        confidence: 0.3,
        errors: [
          error instanceof Error
            ? error.message
            : "Failed to process packing list",
        ],
      };
    }
  }

  /**
   * Process photo (vision analysis)
   * Note: This delegates to Vision Integration Service for actual analysis
   */
  private async processPhoto(document: any): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    // Photo processing is handled by Vision Integration Service
    // This method is kept for consistency but delegates to vision service
    const { getVisionIntegrationService } =
      await import("./visionIntegrationService");
    const visionService = getVisionIntegrationService();

    try {
      // Get ASN ID from document metadata or parent
      const asnId = (document.metadata as any)?.asnId || document.asnId;
      if (!asnId) {
        return {
          extractedData: {
            objects: [],
            damage: null,
            quantity: null,
          },
          confidence: 0.5,
          errors: ["ASN ID not found for photo analysis"],
        };
      }

      const analysis = await visionService.analyzeReceivingPhoto(
        asnId,
        document.url,
        document.tenantId,
      );

      return {
        extractedData: {
          objects: analysis.objects,
          damage: analysis.damage,
          quantity: analysis.quantity,
          quality: analysis.quality,
        },
        confidence: analysis.quality?.score
          ? analysis.quality.score / 100
          : 0.8,
      };
    } catch (error: any) {
      console.error("Error processing photo:", error);
      return {
        extractedData: {
          objects: [],
          damage: null,
          quantity: null,
        },
        confidence: 0.5,
        errors: [error.message || "Failed to process photo"],
      };
    }
  }

  /**
   * Process generic document
   */
  private async processGenericDocument(document: any): Promise<{
    extractedData: Record<string, unknown>;
    confidence: number;
    errors?: string[];
  }> {
    return {
      extractedData: {},
      confidence: 0.5,
      errors: ["Document type not supported for automatic processing"],
    };
  }

  /**
   * Parse EDI ASN (X12, EDIFACT)
   */
  async parseEDI(
    ediContent: string,
    format: "X12" | "EDIFACT",
  ): Promise<{
    asnData: Record<string, unknown>;
    errors?: string[];
  }> {
    try {
      // Use EDI adapter for parsing
      const { EDIAdapter } =
        await import("@/lib/adapters/procurement/ediAdapter");
      const ediAdapter = new EDIAdapter();

      const parsedDocument = await ediAdapter.parseEDIDocument(ediContent, {
        standard: format,
        version: format === "X12" ? "4010" : "D01B",
        tradingPartnerId: "default",
        documentType: "ASN",
      });

      // Map EDI document to ASN data
      const asnData = {
        asnNumber: parsedDocument.parsedData.documentNumber || null,
        supplierId: parsedDocument.tradingPartnerId,
        items: parsedDocument.parsedData.items || [],
        dates: {
          expectedArrival: parsedDocument.parsedData.date
            ? new Date(parsedDocument.parsedData.date)
            : null,
        },
        rawEDI: ediContent,
        ediFormat: format,
        ediDocumentId: parsedDocument.documentId,
      };

      return {
        asnData,
        errors:
          parsedDocument.status === "ERROR"
            ? ["EDI parsing encountered errors"]
            : undefined,
      };
    } catch (error) {
      console.error("[Document Processing] Error parsing EDI:", error);

      // Fallback: Basic EDI structure extraction using regex
      const asnData = {
        asnNumber: this.extractFromEDI(ediContent, /ASN\*([^\*~]+)/),
        supplierId: this.extractFromEDI(ediContent, /N1\*SU\*([^\*~]+)/),
        items: [],
        dates: {},
        rawEDI: ediContent,
        ediFormat: format,
      };

      return {
        asnData,
        errors: [error instanceof Error ? error.message : "EDI parsing failed"],
      };
    }
  }

  /**
   * Extract value from EDI using regex
   */
  private extractFromEDI(ediContent: string, pattern: RegExp): string | null {
    const match = ediContent.match(pattern);
    return match ? match[1] : null;
  }

  /**
   * Extract data from PDF
   */
  async extractFromPDF(pdfUrl: string): Promise<{
    text: string;
    structuredData: Record<string, unknown>;
    confidence: number;
  }> {
    try {
      // Download PDF
      const fileBuffer = await this.downloadFileFromUrl(pdfUrl);

      // Run OCR
      const ocrResult = await ocrService.extractTextFromPDF(fileBuffer, {
        language: "eng",
        useCloudOCR: true,
        cloud: {
          provider: "auto",
        },
      });

      // Parse structured data
      const structuredData = this.parseASNText(ocrResult.text);

      return {
        text: ocrResult.text,
        structuredData,
        confidence: (ocrResult.confidence || 0) / 100,
      };
    } catch (error: any) {
      console.error("Error extracting from PDF:", error);
      return {
        text: "",
        structuredData: {},
        confidence: 0,
      };
    }
  }

  /**
   * Extract data from image (OCR)
   */
  async extractFromImage(imageUrl: string): Promise<{
    text: string;
    structuredData: Record<string, unknown>;
    confidence: number;
  }> {
    try {
      // Download image
      const fileBuffer = await this.downloadFileFromUrl(imageUrl);

      // Run OCR
      const ocrResult = await ocrService.extractTextFromImage(fileBuffer, {
        language: "eng",
        useCloudOCR: true,
        cloud: {
          provider: "auto",
        },
      });

      // Parse structured data
      const structuredData = this.parseASNText(ocrResult.text);

      return {
        text: ocrResult.text,
        structuredData,
        confidence: (ocrResult.confidence || 0) / 100,
      };
    } catch (error: any) {
      console.error("Error extracting from image:", error);
      return {
        text: "",
        structuredData: {},
        confidence: 0,
      };
    }
  }

  /**
   * Validate extracted ASN data
   */
  validateExtractedData(data: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!data.asnNumber) {
      errors.push("ASN number is required");
    }

    if (!data.supplierName && !data.supplierId) {
      errors.push("Supplier information is required");
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("At least one item is required");
    }

    // Validate items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any, index: number) => {
        if (!item.sku) {
          errors.push(`Item ${index + 1}: SKU is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Valid quantity is required`);
        }
      });
    }

    // Warnings
    if (!data.expectedArrivalDate) {
      warnings.push("Expected arrival date not found");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton
let documentProcessingServiceInstance: DocumentProcessingService | null = null;

export function getDocumentProcessingService(): DocumentProcessingService {
  if (!documentProcessingServiceInstance) {
    const { PrismaClient } = require("@prisma/client");
    documentProcessingServiceInstance = new DocumentProcessingService(
      new PrismaClient(),
    );
  }
  return documentProcessingServiceInstance;
}
