/**
 * Enhanced PDF Extractor - World-Class Multi-Strategy PDF Processing
 *
 * This is the most capable PDF extraction system, using multiple strategies:
 * 1. pdf-parse (best for text-based PDFs)
 * 2. pdfjs-dist (embedded text extraction)
 * 3. Cloud OCR (GPT-4 Vision / Claude Vision - best for scanned PDFs)
 * 4. Local OCR (Tesseract - fallback)
 * 5. Intelligent fallback chain with graceful degradation
 */

import type { OCRResult } from "../ocr/ocrService";

export interface EnhancedPDFExtractionResult {
  text: string;
  confidence: number;
  method: "pdf-parse" | "pdfjs-embedded" | "cloud-ocr" | "local-ocr" | "hybrid";
  pages: number;
  processingTime: number;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    isTextBased?: boolean;
    isScanned?: boolean;
    isPasswordProtected?: boolean;
    isEncrypted?: boolean;
  };
}

export interface EnhancedPDFExtractionConfig {
  tenantId: string;
  openaiKey?: string;
  anthropicKey?: string;
  maxPages?: number;
  useCloudOCR?: boolean;
  preferCloudOCR?: boolean; // Use cloud OCR first for scanned PDFs
}

class EnhancedPDFExtractor {
  /**
   * Extract text from PDF using multiple strategies intelligently
   */
  async extractText(
    pdfBuffer: Buffer | Uint8Array,
    config: EnhancedPDFExtractionConfig,
  ): Promise<EnhancedPDFExtractionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    const hasValidOpenAI = !!(
      config.openaiKey &&
      config.openaiKey.length > 20 &&
      config.openaiKey.startsWith("sk-")
    );
    const hasValidAnthropic = !!(
      config.anthropicKey &&
      config.anthropicKey.length > 20 &&
      config.anthropicKey.startsWith("sk-ant-")
    );

    console.log("[enhanced-pdf] 🚀 Starting multi-strategy PDF extraction...", {
      bufferSize: pdfBuffer.length,
      openaiKey: hasValidOpenAI
        ? `✅ Valid (${config.openaiKey.substring(0, 7)}...)`
        : "❌ Missing/Invalid",
      anthropicKey: hasValidAnthropic
        ? `✅ Valid (${config.anthropicKey.substring(0, 10)}...)`
        : "❌ Missing/Invalid",
      willUseCloudOCR:
        config.preferCloudOCR && (hasValidOpenAI || hasValidAnthropic),
    });

    // Strategy 1: Try pdf-parse first (best for text-based PDFs, fastest)
    try {
      const pdfParseResult = await this.extractWithPdfParse(pdfBuffer);
      if (pdfParseResult && pdfParseResult.text.trim().length >= 100) {
        console.log(
          "[enhanced-pdf] ✅ pdf-parse extracted",
          pdfParseResult.text.length,
          "chars",
        );
        return {
          ...pdfParseResult,
          method: "pdf-parse",
          processingTime: Date.now() - startTime,
          metadata: { isTextBased: true },
        };
      } else if (pdfParseResult && pdfParseResult.text.trim().length > 0) {
        warnings.push(
          `pdf-parse extracted only ${pdfParseResult.text.length} chars - PDF may be scanned`,
        );
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("password") || errorMsg.includes("encrypted")) {
        errors.push("PDF is password-protected or encrypted");
        return {
          text: "",
          confidence: 0,
          method: "pdf-parse",
          pages: 0,
          processingTime: Date.now() - startTime,
          errors,
          metadata: { isPasswordProtected: true, isEncrypted: true },
        };
      }
      console.warn("[enhanced-pdf] pdf-parse failed:", errorMsg);
      errors.push(`pdf-parse: ${errorMsg}`);
    }

    // Strategy 2: Try pdfjs-dist embedded text extraction
    try {
      console.log(
        "[enhanced-pdf] Strategy 2: Attempting pdfjs-dist embedded text extraction...",
      );
      const pdfjsResult = await this.extractWithPdfJS(
        pdfBuffer,
        config.maxPages || 10,
      );
      if (pdfjsResult && pdfjsResult.text.trim().length >= 100) {
        console.log(
          "[enhanced-pdf] ✅ pdfjs-dist extracted",
          pdfjsResult.text.length,
          "chars",
        );
        return {
          ...pdfjsResult,
          method: "pdfjs-embedded",
          processingTime: Date.now() - startTime,
          metadata: { isTextBased: true },
        };
      } else if (pdfjsResult && pdfjsResult.text.trim().length > 0) {
        warnings.push(
          `pdfjs-dist extracted only ${pdfjsResult.text.length} chars - PDF may be scanned`,
        );
        console.warn(
          "[enhanced-pdf] ⚠️ pdfjs-dist extracted only",
          pdfjsResult.text.length,
          "chars",
        );
      } else {
        console.warn("[enhanced-pdf] ⚠️ pdfjs-dist returned no text");
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.warn("[enhanced-pdf] pdfjs-dist failed:", errorMsg);
      errors.push(`pdfjs-dist: ${errorMsg || "Unknown error"}`);
    }

    // Strategy 3: PDF appears to be scanned - use OCR
    console.log("[enhanced-pdf] PDF appears to be scanned, using OCR...");

    // Strategy 3a: Cloud OCR (preferred for scanned PDFs)
    const hasValidKeys =
      (config.openaiKey && config.openaiKey.length > 20) ||
      (config.anthropicKey && config.anthropicKey.length > 20);
    if (config.preferCloudOCR && hasValidKeys) {
      console.log(
        "[enhanced-pdf] Attempting Cloud OCR (preferred for scanned PDFs)...",
        {
          hasOpenAIKey: !!(config.openaiKey && config.openaiKey.length > 20),
          hasAnthropicKey: !!(
            config.anthropicKey && config.anthropicKey.length > 20
          ),
        },
      );
      try {
        const cloudOcrResult = await this.extractWithCloudOCR(
          pdfBuffer,
          config,
        );
        if (cloudOcrResult && cloudOcrResult.text.trim().length > 0) {
          console.log(
            "[enhanced-pdf] ✅ Cloud OCR extracted",
            cloudOcrResult.text.length,
            "chars",
          );
          return {
            ...cloudOcrResult,
            method: "cloud-ocr",
            processingTime: Date.now() - startTime,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
            metadata: { isScanned: true },
          };
        } else {
          console.warn("[enhanced-pdf] ⚠️ Cloud OCR returned no text");
        }
      } catch (error: any) {
        console.error(
          "[enhanced-pdf] ❌ Cloud OCR failed:",
          error?.message || error,
        );
        errors.push(`cloud-ocr: ${error?.message || "Unknown error"}`);
      }
    } else if (config.preferCloudOCR && !hasValidKeys) {
      console.warn(
        "[enhanced-pdf] ⚠️ Cloud OCR requested but no valid API keys provided",
      );
      warnings.push("Cloud OCR requested but API keys not provided or invalid");
    }

    // Strategy 3b: Local OCR (fallback)
    try {
      const localOcrResult = await this.extractWithLocalOCR(
        pdfBuffer,
        config.maxPages || 5,
      );
      if (localOcrResult && localOcrResult.text.trim().length > 0) {
        console.log(
          "[enhanced-pdf] ✅ Local OCR extracted",
          localOcrResult.text.length,
          "chars",
        );
        return {
          ...localOcrResult,
          method: "local-ocr",
          processingTime: Date.now() - startTime,
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
          metadata: { isScanned: true },
        };
      }
    } catch (error: any) {
      console.warn("[enhanced-pdf] Local OCR failed:", error?.message);
      errors.push(`local-ocr: ${error?.message || "Unknown error"}`);
    }

    // Strategy 4: Hybrid - combine any partial results we got
    const partialResults: string[] = [];
    try {
      const pdfParsePartial = await this.extractWithPdfParse(pdfBuffer);
      if (pdfParsePartial?.text) partialResults.push(pdfParsePartial.text);
    } catch {}

    try {
      const pdfjsPartial = await this.extractWithPdfJS(pdfBuffer, 5);
      if (pdfjsPartial?.text) partialResults.push(pdfjsPartial.text);
    } catch {}

    if (partialResults.length > 0) {
      const combinedText = partialResults.join("\n\n").trim();
      if (combinedText.length > 0) {
        console.log(
          "[enhanced-pdf] ⚠️ Using hybrid extraction:",
          combinedText.length,
          "chars",
        );
        return {
          text: combinedText,
          confidence: 40, // Low confidence for partial extraction
          method: "hybrid",
          pages: 0,
          processingTime: Date.now() - startTime,
          errors: errors.length > 0 ? errors : undefined,
          warnings: [...warnings, "Partial extraction - some methods failed"],
          metadata: { isScanned: true },
        };
      }
    }

    // All strategies failed - provide detailed error message
    const errorSummary =
      errors.length > 0
        ? errors.join("; ")
        : "All extraction methods failed silently (no specific error details available)";

    const errorMessage =
      `Could not extract text from PDF using any method. ` +
      `Errors: ${errorSummary}. ` +
      `PDF may be corrupted, password-protected, or contain only unreadable images. ` +
      `Tried: pdf-parse, pdfjs-dist embedded text, cloud OCR, local OCR, and hybrid methods. ` +
      `Solutions: 1) Remove password protection, 2) Convert to Excel/CSV, 3) Use a different PDF file, ` +
      `4) Ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is configured for cloud OCR (better for scanned PDFs).`;

    console.error("[enhanced-pdf] ❌ All extraction strategies failed:", {
      errors,
      warnings,
      bufferSize: pdfBuffer.length,
      hasOpenAIKey: !!(config.openaiKey && config.openaiKey.length > 20),
      hasAnthropicKey: !!(
        config.anthropicKey && config.anthropicKey.length > 20
      ),
    });

    throw new Error(errorMessage);
  }

  /**
   * Strategy 1: Extract using pdf-parse (best for text-based PDFs)
   */
  private async extractWithPdfParse(
    pdfBuffer: Buffer | Uint8Array,
  ): Promise<{ text: string; pages: number } | null> {
    try {
      let pdfParse: any;

      // Try ESM import first
      try {
        const pdfParseModule = await import("pdf-parse");
        // pdf-parse can export in different ways
        if (typeof pdfParseModule === "function") {
          pdfParse = pdfParseModule;
        } else if (
          pdfParseModule.default &&
          typeof pdfParseModule.default === "function"
        ) {
          pdfParse = pdfParseModule.default;
        } else if (
          (pdfParseModule as any).PDFParse &&
          typeof (pdfParseModule as any).PDFParse === "function"
        ) {
          pdfParse = (pdfParseModule as any).PDFParse;
        } else {
          pdfParse = pdfParseModule;
        }
      } catch (importError) {
        // Fallback to require (CommonJS)
        try {
          // Use dynamic require in try-catch
          const pdfParseModule = eval("require")("pdf-parse");
          if (typeof pdfParseModule === "function") {
            pdfParse = pdfParseModule;
          } else if (
            pdfParseModule.default &&
            typeof pdfParseModule.default === "function"
          ) {
            pdfParse = pdfParseModule.default;
          } else if (
            pdfParseModule.PDFParse &&
            typeof pdfParseModule.PDFParse === "function"
          ) {
            pdfParse = pdfParseModule.PDFParse;
          } else {
            pdfParse = pdfParseModule;
          }
        } catch (requireError) {
          console.warn(
            "[enhanced-pdf] pdf-parse not available via require:",
            requireError,
          );
          throw new Error("pdf-parse library not available");
        }
      }

      if (typeof pdfParse !== "function") {
        throw new Error("pdf-parse function not found");
      }

      const buffer = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);
      const pdfData = await pdfParse(buffer);

      const extractedText = pdfData.text || "";
      const pages = pdfData.numpages || pdfData.numPages || 0;

      if (extractedText.trim().length === 0) {
        return null; // No text extracted
      }

      return {
        text: extractedText,
        pages,
      };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (
        errorMsg.includes("password") ||
        errorMsg.includes("encrypted") ||
        errorMsg.includes("PasswordException")
      ) {
        throw error; // Re-throw password/encryption errors
      }
      // For other errors, return null to try next strategy
      return null;
    }
  }

  /**
   * Strategy 2: Extract embedded text using pdfjs-dist
   */
  private async extractWithPdfJS(
    pdfBuffer: Buffer | Uint8Array,
    maxPages: number,
  ): Promise<{ text: string; pages: number } | null> {
    try {
      const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (!pdfjs?.getDocument) {
        throw new Error("pdfjs-dist not available");
      }

      const buffer = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);
      const loadingTask = pdfjs.getDocument({
        data: buffer,
        disableWorker: true,
        password: "", // Try empty password
      });

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages || 1;
      const pagesToExtract = Math.min(totalPages, maxPages);

      let extractedText = "";
      for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = (content?.items || [])
            .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
            .filter(Boolean)
            .join(" ");
          if (pageText.trim()) {
            extractedText += `\n${pageText}`;
          }
        } catch (pageError) {
          // Continue with next page
          console.warn(
            `[enhanced-pdf] Error extracting page ${pageNum}:`,
            pageError,
          );
        }
      }

      return {
        text: extractedText.trim(),
        pages: pagesToExtract,
      };
    } catch (error: any) {
      if (
        error?.name === "PasswordException" ||
        error?.message?.includes("password")
      ) {
        throw new Error("PDF is password-protected");
      }
      return null;
    }
  }

  /**
   * Strategy 3a: Extract using Cloud OCR (GPT-4 Vision / Claude Vision)
   */
  private async extractWithCloudOCR(
    pdfBuffer: Buffer | Uint8Array,
    config: EnhancedPDFExtractionConfig,
  ): Promise<{ text: string; pages: number; confidence: number } | null> {
    try {
      const { ocrService } = await import("@/lib/services/ocr/ocrService");

      const buffer = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);
      const ocrResult = await ocrService.extractTextFromPDF(buffer, {
        language: "eng",
        psm: 6,
        useCloudOCR: true,
        cloud: {
          tenantId: config.tenantId,
          provider: "auto",
          openaiKey: config.openaiKey,
          anthropicKey: config.anthropicKey,
        },
        textMaxPages: 10,
        maxPages: config.maxPages || 5,
        scale: 3, // High quality
      });

      if (ocrResult.text && ocrResult.text.trim().length > 0) {
        return {
          text: ocrResult.text,
          pages: ocrResult.pages || 0,
          confidence: ocrResult.confidence || 60,
        };
      }

      return null;
    } catch (error) {
      console.error("[enhanced-pdf] Cloud OCR error:", error);
      return null;
    }
  }

  /**
   * Strategy 3b: Extract using Local OCR (Tesseract)
   */
  private async extractWithLocalOCR(
    pdfBuffer: Buffer | Uint8Array,
    maxPages: number,
  ): Promise<{ text: string; pages: number; confidence: number } | null> {
    try {
      const { ocrService } = await import("@/lib/services/ocr/ocrService");

      const buffer = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);
      const ocrResult = await ocrService.extractTextFromPDF(buffer, {
        language: "eng",
        psm: 6,
        useCloudOCR: false,
        cloud: undefined,
        textMaxPages: 10,
        maxPages,
        scale: 3,
      });

      if (ocrResult.text && ocrResult.text.trim().length > 0) {
        return {
          text: ocrResult.text,
          pages: ocrResult.pages || 0,
          confidence: ocrResult.confidence || 40,
        };
      }

      return null;
    } catch (error) {
      console.error("[enhanced-pdf] Local OCR error:", error);
      return null;
    }
  }
}

export const enhancedPdfExtractor = new EnhancedPDFExtractor();
