/**
 * Document Intelligence Service
 * OCR, extraction, and validation for trade compliance documents
 */

export interface DocumentExtraction {
  documentType: string;
  fields: Record<string, any>;
  confidence: number;
  rawText: string;
  structuredData: any;
}

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  confidence: number;
}

class DocumentIntelligenceService {
  /**
   * Extract data from document using OCR and AI
   */
  async extractDocument(
    file: File | Blob,
    documentType: string,
  ): Promise<DocumentExtraction> {
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine file type
      const fileName = file instanceof File ? file.name : "document";
      const isPDF = fileName.toLowerCase().endsWith(".pdf");
      const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileName);

      let rawText = "";
      let confidence = 0.5;

      // Use OCR if needed
      if (isPDF || isImage) {
        try {
          const { ocrService } = await import("@/lib/services/ocr/ocrService");

          if (ocrService.isAvailable()) {
            if (isPDF) {
              const ocrResult = await ocrService.extractTextFromPDF(buffer, {
                language: "eng",
                psm: 6,
              });
              rawText = ocrResult.text;
              confidence = ocrResult.confidence / 100;
            } else if (isImage) {
              const ocrResult = await ocrService.extractTextFromImage(buffer, {
                language: "eng",
                psm: 6,
              });
              rawText = ocrResult.text;
              confidence = ocrResult.confidence / 100;
            }
          } else {
            // OCR not available, try to read as text
            rawText = buffer.toString(
              "utf-8",
              0,
              Math.min(10000, buffer.length),
            );
            confidence = 0.3;
          }
        } catch (ocrError) {
          console.error("OCR extraction error:", ocrError);
          // Fallback: try to read as text
          rawText = buffer.toString("utf-8", 0, Math.min(10000, buffer.length));
          confidence = 0.3;
        }
      } else {
        // Text-based file, read directly
        rawText = buffer.toString("utf-8");
        confidence = 0.8;
      }

      // Use AI to structure the data (if rawText is available)
      let structuredData: any = {};
      let fields: Record<string, any> = {};

      if (rawText && rawText.trim().length > 50) {
        // Extract structured data using pattern matching and AI if available
        fields = this.extractBasicFields(rawText, documentType);

        // Try AI extraction for better results (if available)
        try {
          const { aiService } =
            await import("@/lib/services/ai/chemcheckService");
          if (
            aiService.getActiveProvider().isAvailable() &&
            !aiService.getActiveProvider().name.includes("Mock")
          ) {
            const aiResult = await aiService.analyzeDocument(
              `Extract structured data from this ${documentType} document:\n\n${rawText.substring(0, 5000)}`,
              { response_format: { type: "json_object" } },
            );
            if (aiResult.analysis && typeof aiResult.analysis === "string") {
              try {
                const aiFields = JSON.parse(aiResult.analysis);
                // Merge AI fields with pattern-matched fields (AI takes precedence)
                fields = { ...fields, ...aiFields };
                confidence = Math.min(0.95, confidence + 0.2);
              } catch (e) {
                // AI returned non-JSON, use pattern matching only
              }
            }
          }
        } catch (aiError) {
          // AI extraction failed, continue with pattern matching
          console.warn(
            "AI extraction failed, using pattern matching:",
            aiError,
          );
        }

        structuredData = { rawText, extractedFields: fields };
      } else {
        // No text extracted - return empty fields, not mock data
        fields = {};
        confidence = 0.1;
      }

      const extraction: DocumentExtraction = {
        documentType,
        fields,
        confidence,
        rawText: rawText || "Could not extract text from document",
        structuredData,
      };

      return extraction;
    } catch (error) {
      console.error("Document extraction error:", error);
      // Return minimal extraction on error
      return {
        documentType,
        fields: {},
        confidence: 0.1,
        rawText: "Error extracting document",
        structuredData: {},
      };
    }
  }

  /**
   * Extract basic fields using pattern matching
   */
  private extractBasicFields(
    text: string,
    documentType: string,
  ): Record<string, any> {
    const fields: Record<string, any> = {};

    // Extract invoice number
    const invoiceMatch = text.match(/(?:invoice|inv)[\s#:]*([A-Z0-9\-]+)/i);
    if (invoiceMatch) {
      fields.invoiceNumber = invoiceMatch[1];
    }

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      fields.date = dateMatch[1];
    }

    // Extract amount
    const amountMatch = text.match(/(?:total|amount)[\s:]*([\d,]+\.?\d*)/i);
    if (amountMatch) {
      fields.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
    }

    // Extract currency
    const currencyMatch = text.match(/(SAR|USD|EUR|GBP|AED)/i);
    if (currencyMatch) {
      fields.currency = currencyMatch[1];
    }

    return fields;
  }

  /**
   * Validate extracted document data
   */
  async validateDocument(
    extraction: DocumentExtraction,
  ): Promise<DocumentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Check required fields based on document type
    const requiredFields = this.getRequiredFields(extraction.documentType);

    for (const field of requiredFields) {
      if (!extraction.fields[field]) {
        missingFields.push(field);
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field formats
    if (extraction.fields.date && !this.isValidDate(extraction.fields.date)) {
      errors.push("Invalid date format");
    }

    if (extraction.fields.totalAmount && extraction.fields.totalAmount < 0) {
      warnings.push("Total amount is negative");
    }

    // Calculate confidence
    const confidence = Math.max(
      0,
      Math.min(
        1,
        extraction.confidence - errors.length * 0.1 - warnings.length * 0.05,
      ),
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      confidence,
    };
  }

  /**
   * Get required fields for document type
   */
  private getRequiredFields(documentType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      COMMERCIAL_INVOICE: [
        "invoiceNumber",
        "date",
        "totalAmount",
        "currency",
        "supplier",
      ],
      PACKING_LIST: ["packingListNumber", "date", "items"],
      BILL_OF_LADING: ["blNumber", "date", "shipper", "consignee", "vessel"],
      CERTIFICATE_OF_ORIGIN: [
        "certificateNumber",
        "date",
        "originCountry",
        "exporter",
      ],
      MSDS: ["productName", "hazardous", "ghsClassification"],
    };

    return fieldMap[documentType] || [];
  }

  /**
   * Validate date format
   */
  private isValidDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }

  /**
   * Compare documents for consistency
   */
  async compareDocuments(
    doc1: DocumentExtraction,
    doc2: DocumentExtraction,
  ): Promise<{
    consistent: boolean;
    differences: string[];
    confidence: number;
  }> {
    const differences: string[] = [];

    // Compare common fields
    const commonFields = Object.keys(doc1.fields).filter((f) => doc2.fields[f]);

    for (const field of commonFields) {
      if (doc1.fields[field] !== doc2.fields[field]) {
        differences.push(
          `Field ${field} differs: ${doc1.fields[field]} vs ${doc2.fields[field]}`,
        );
      }
    }

    return {
      consistent: differences.length === 0,
      differences,
      confidence:
        differences.length === 0
          ? 0.95
          : Math.max(0.5, 1 - differences.length * 0.1),
    };
  }

  /**
   * Extract specific field from document
   */
  async extractField(
    file: File | Blob,
    fieldName: string,
  ): Promise<{
    value: any;
    confidence: number;
  }> {
    const extraction = await this.extractDocument(file, "AUTO");
    return {
      value: extraction.fields[fieldName],
      confidence: extraction.confidence,
    };
  }
}

export const documentIntelligenceService = new DocumentIntelligenceService();
