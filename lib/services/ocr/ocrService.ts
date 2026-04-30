/**
 * OCR Service
 * Handles Optical Character Recognition for scanned PDFs and images
 * Supports Tesseract.js and cloud OCR services
 */

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  pages?: number;
  errors?: string[];
}

export interface OCRConfig {
  language?: string; // Default: 'eng'
  psm?: number; // Page segmentation mode (0-13)
  oem?: number; // OCR Engine Mode (0-3)
  useCloudOCR?: boolean; // Use cloud OCR service if available
  cloud?: {
    tenantId?: string;
    provider?: "openai" | "anthropic" | "auto";
    openaiKey?: string;
    anthropicKey?: string;
    mimeType?: string;
  };
}

class OCRService {
  private tesseractAvailable: boolean = false;
  private tesseractWorker: any = null;
  private pdfRenderAvailable: boolean = false;

  /**
   * Initialize OCR service
   */
  async initialize(): Promise<void> {
    try {
      // Try to load Tesseract.js
      const Tesseract = await this.loadTesseract();
      if (Tesseract) {
        this.tesseractAvailable = true;
        // Create worker (will be created on-demand for better performance)
        console.log("OCR Service: Tesseract.js available");
      }
    } catch (error) {
      console.warn(
        "OCR Service: Tesseract.js not available, OCR will use fallback methods",
        error,
      );
      this.tesseractAvailable = false;
    }

    // Try to load PDF rendering deps (for scanned PDF OCR)
    try {
      await this.loadPDFRenderer();
      this.pdfRenderAvailable = true;
      console.log("OCR Service: PDF renderer available");
    } catch (error) {
      this.pdfRenderAvailable = false;
      console.warn(
        "OCR Service: PDF renderer not available (scanned PDF OCR disabled)",
        error,
      );
    }
  }

  /**
   * Load Tesseract.js dynamically
   */
  private async loadTesseract(): Promise<any> {
    try {
      // Try to require Tesseract.js
      // Use dynamic import for better compatibility
      const Tesseract = require("tesseract.js");
      return Tesseract;
    } catch (error) {
      // Tesseract.js not installed
      console.warn("Tesseract.js not available:", error);
      return null;
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(
    imageBuffer: Buffer | Uint8Array,
    config: OCRConfig = {},
  ): Promise<OCRResult> {
    const startTime = Date.now();
    const language = config.language || "eng";
    const psm = config.psm || 6; // Assume single uniform block of text

    try {
      // Try Tesseract.js first
      if (this.tesseractAvailable || (await this.loadTesseract())) {
        return await this.extractWithTesseract(
          imageBuffer,
          language,
          psm,
          startTime,
        );
      }

      // Fallback: Use AI Vision API if available
      if (config.useCloudOCR) {
        return await this.extractWithCloudOCR(imageBuffer, startTime, config);
      }

      // Final fallback: Return error
      throw new Error(
        "OCR not available. Please install tesseract.js or enable cloud OCR.",
      );
    } catch (error) {
      console.error("OCR extraction error:", error);
      return {
        text: "",
        confidence: 0,
        language,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : "Unknown OCR error"],
      };
    }
  }

  /**
   * Extract text using Tesseract.js
   */
  private async extractWithTesseract(
    imageBuffer: Buffer | Uint8Array,
    language: string,
    psm: number,
    startTime: number,
  ): Promise<OCRResult> {
    try {
      const Tesseract = await this.loadTesseract();
      if (!Tesseract) {
        throw new Error("Tesseract.js not available");
      }

      // Create worker with error handling
      let worker;
      try {
        worker = await Tesseract.createWorker(language, 1, {
          logger: (m: any) => {
            // Optional: Log OCR progress (can be enabled for debugging)
            // if (m.status === 'recognizing text') {
            //   console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
            // }
          },
        });
      } catch (workerError) {
        console.error("Failed to create Tesseract worker:", workerError);
        throw new Error("Failed to initialize OCR worker");
      }

      // Set PSM mode
      await worker.setParameters({
        tessedit_pageseg_mode: psm,
      });

      // Perform OCR
      const { data } = await worker.recognize(imageBuffer);

      // Terminate worker
      await worker.terminate();

      return {
        text: data.text || "",
        confidence: data.confidence || 0,
        language,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Tesseract OCR error:", error);
      throw error;
    }
  }

  /**
   * Extract text using cloud OCR (AI Vision API)
   */
  private async extractWithCloudOCR(
    imageBuffer: Buffer | Uint8Array,
    startTime: number,
    config: OCRConfig,
  ): Promise<OCRResult> {
    const { documentVisionOCRService } =
      await import("@/lib/services/ai/documentVisionOCRService");

    // Determine tenant context (required for multi-tenant day 1)
    const effectiveTenantId = (config.cloud?.tenantId || "").trim();
    if (!effectiveTenantId) {
      throw new Error("Cloud OCR requires tenantId (config.cloud.tenantId)");
    }

    const buf = Buffer.isBuffer(imageBuffer)
      ? imageBuffer
      : Buffer.from(imageBuffer);
    const result = await documentVisionOCRService.extractTextFromImageBuffer(
      buf,
      {
        tenantId: effectiveTenantId,
        provider: config.cloud?.provider || "auto",
        openaiKey: config.cloud?.openaiKey,
        anthropicKey: config.cloud?.anthropicKey,
        mimeType: config.cloud?.mimeType || "image/png",
        maxTokens: 2500,
      },
    );

    return {
      text: result.text,
      confidence: result.confidence,
      language: "eng",
      processingTime: Date.now() - startTime,
      errors: result.warnings,
    };
  }

  /**
   * Load PDF.js (pdfjs-dist) dynamically.
   * Used for text extraction without requiring native canvas bindings.
   */
  private async loadPDFJS(): Promise<any> {
    // Use ESM dynamic imports only.
    // Important: avoid `require()` fallbacks here because Next/webpack tries to
    // resolve them at build time even if they're never executed.
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (!pdfjs?.getDocument) throw new Error("pdfjs-dist not available");
    return pdfjs;
  }

  /**
   * Load PDF renderer (pdfjs + canvas) dynamically.
   * This avoids native system dependencies (pdf2pic/poppler) and works in Node.
   */
  private async loadPDFRenderer(): Promise<{
    pdfjs: any;
    createCanvas: (w: number, h: number) => any;
  }> {
    // Use ESM dynamic imports only.
    // Important: avoid `require()` fallbacks here because Next/webpack tries to
    // resolve them at build time even if they're never executed.
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const canvasMod: any = await import("@napi-rs/canvas");
    const createCanvas = canvasMod.createCanvas;

    if (!pdfjs?.getDocument) throw new Error("pdfjs-dist not available");
    if (typeof createCanvas !== "function")
      throw new Error("@napi-rs/canvas not available");

    return { pdfjs, createCanvas };
  }

  /**
   * Extract text from PDF pages (for scanned PDFs)
   */
  async extractTextFromPDF(
    pdfBuffer: Buffer | Uint8Array,
    config: OCRConfig = {},
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // First: try to extract embedded text via pdfjs-dist (fast path)
      // This avoids pdf-parse (which may pin to older pdfjs-dist build paths).
      const pdfjsLib = await this.loadPDFJS();
      const textMaxPages = Math.max(
        1,
        Math.min(5, Number((config as any).textMaxPages || 3)),
      );

      const textLoadingTask = pdfjsLib.getDocument({
        data: pdfBuffer,
        disableWorker: true,
      });
      const textPdf = await textLoadingTask.promise;
      const pagesForText = Math.min(textPdf.numPages || 1, textMaxPages);

      let extractedText = "";
      for (let pageNum = 1; pageNum <= pagesForText; pageNum++) {
        const page = await textPdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = (content?.items || [])
          .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
          .filter(Boolean)
          .join(" ");
        if (pageText.trim()) extractedText += `\n${pageText}`;
        if (extractedText.trim().length > 1200) break;
      }

      // Increase text extraction limit for better coverage
      if (extractedText.trim().length > 50) {
        // Try to extract more pages if we have less than 2000 characters
        if (
          extractedText.trim().length < 2000 &&
          textPdf.numPages > pagesForText
        ) {
          const additionalPages = Math.min(textPdf.numPages, pagesForText + 5);
          for (
            let pageNum = pagesForText + 1;
            pageNum <= additionalPages;
            pageNum++
          ) {
            try {
              const page = await textPdf.getPage(pageNum);
              const content = await page.getTextContent();
              const pageText = (content?.items || [])
                .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
                .filter(Boolean)
                .join(" ");
              if (pageText.trim()) extractedText += `\n${pageText}`;
              if (extractedText.trim().length > 5000) break; // Cap at 5000 chars for performance
            } catch (e) {
              // Continue with next page
              break;
            }
          }
        }

        return {
          text: extractedText.trim(),
          confidence: 100,
          language: config.language || "eng",
          processingTime: Date.now() - startTime,
          pages: Math.min(textPdf.numPages, pagesForText + 5),
        };
      }

      // PDF is image-only, need OCR: render first pages to images then run image OCR
      console.log(
        "[ocr] No embedded text found, attempting OCR on rendered pages...",
      );

      // Check if we should use cloud OCR directly (preferred for scanned PDFs)
      if (config.useCloudOCR && config.cloud) {
        console.log("[ocr] Using cloud OCR for scanned PDF...");
        try {
          const { pdfjs, createCanvas } = await this.loadPDFRenderer();
          const maxPages = Math.max(
            1,
            Math.min(5, Number((config as any).maxPages || 3)),
          ); // Increased from 2 to 3
          const scale = Math.max(
            2,
            Math.min(4, Number((config as any).scale || 3)),
          ); // Increased scale for better quality

          const loadingTask = pdfjs.getDocument({
            data: pdfBuffer,
            disableWorker: true,
            password: "", // Try empty password
          });
          const pdf = await loadingTask.promise;

          const pagesToProcess = Math.min(pdf.numPages || 1, maxPages);
          let combinedText = "";
          const confidences: number[] = [];
          const errors: string[] = [];

          for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale });

              const canvas = createCanvas(
                Math.ceil(viewport.width),
                Math.ceil(viewport.height),
              );
              const ctx = canvas.getContext("2d");

              await page.render({ canvasContext: ctx, viewport }).promise;

              const pngBuffer: Buffer = canvas.toBuffer("image/png");

              // Use cloud OCR directly (better for scanned PDFs)
              const pageResult = await this.extractTextFromImage(pngBuffer, {
                language: config.language || "eng",
                psm: config.psm || 6,
                useCloudOCR: true, // Force cloud OCR
                cloud: config.cloud
                  ? { ...config.cloud, mimeType: "image/png" }
                  : undefined,
              });

              if (pageResult.text?.trim()) {
                combinedText += `\n\n${pageResult.text}`;
                console.log(
                  `[ocr] Page ${pageNum}: extracted ${pageResult.text.length} chars`,
                );
              } else {
                console.warn(`[ocr] Page ${pageNum}: no text extracted`);
                errors.push(`Page ${pageNum}: no text extracted`);
              }

              if (typeof pageResult.confidence === "number") {
                confidences.push(pageResult.confidence);
              }

              // Extract more text for better parsing
              if (combinedText.trim().length > 8000) break; // Increased limit
            } catch (pageError: any) {
              console.error(
                `[ocr] Error processing page ${pageNum}:`,
                pageError,
              );
              errors.push(
                `Page ${pageNum}: ${pageError.message || "Unknown error"}`,
              );
              // Continue with next page
            }
          }

          if (combinedText.trim().length > 0) {
            const avgConfidence =
              confidences.length > 0
                ? Math.round(
                    confidences.reduce((a, b) => a + b, 0) / confidences.length,
                  )
                : 60;
            return {
              text: combinedText.trim(),
              confidence: avgConfidence,
              language: config.language || "eng",
              processingTime: Date.now() - startTime,
              pages: pagesToProcess,
              errors: errors.length > 0 ? errors : undefined,
            };
          }
        } catch (cloudOcrError: any) {
          console.error("[ocr] Cloud OCR failed:", cloudOcrError);
          // Fall through to local OCR
        }
      }

      // Fallback to local OCR if cloud OCR not available or failed
      if (!this.tesseractAvailable && !config.useCloudOCR) {
        throw new Error(
          "Scanned PDF detected but OCR engine (tesseract.js) is not available. Please configure cloud OCR (OpenAI or Anthropic API keys) for scanned PDF support.",
        );
      }

      if (!this.pdfRenderAvailable) {
        throw new Error(
          "Scanned PDF detected but PDF renderer is not available. Install pdfjs-dist and @napi-rs/canvas, or use cloud OCR.",
        );
      }

      const { pdfjs, createCanvas } = await this.loadPDFRenderer();
      const maxPages = Math.max(
        1,
        Math.min(5, Number((config as any).maxPages || 3)),
      ); // Increased
      const scale = Math.max(
        2,
        Math.min(4, Number((config as any).scale || 3)),
      ); // Increased for better quality

      const loadingTask = pdfjs.getDocument({
        data: pdfBuffer,
        disableWorker: true,
        password: "", // Try empty password
      });
      const pdf = await loadingTask.promise;

      const pagesToProcess = Math.min(pdf.numPages || 1, maxPages);
      let combinedText = "";
      const confidences: number[] = [];
      const errors: string[] = [];

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = createCanvas(
            Math.ceil(viewport.width),
            Math.ceil(viewport.height),
          );
          const ctx = canvas.getContext("2d");

          await page.render({ canvasContext: ctx, viewport }).promise;

          const pngBuffer: Buffer = canvas.toBuffer("image/png");
          const pageResult = await this.extractTextFromImage(pngBuffer, {
            language: config.language || "eng",
            psm: config.psm || 6,
            useCloudOCR: config.useCloudOCR || false,
            cloud: config.cloud
              ? { ...config.cloud, mimeType: "image/png" }
              : undefined,
          });

          if (pageResult.text?.trim()) {
            combinedText += `\n\n${pageResult.text}`;
            console.log(
              `[ocr] Page ${pageNum}: extracted ${pageResult.text.length} chars (local OCR)`,
            );
          } else {
            errors.push(`Page ${pageNum}: no text extracted`);
          }

          if (typeof pageResult.confidence === "number") {
            confidences.push(pageResult.confidence);
          }

          // Extract more text for better parsing
          if (combinedText.trim().length > 8000) break; // Increased limit
        } catch (pageError: any) {
          console.error(`[ocr] Error processing page ${pageNum}:`, pageError);
          errors.push(
            `Page ${pageNum}: ${pageError.message || "Unknown error"}`,
          );
          // Continue with next page
        }
      }

      const avgConfidence =
        confidences.length > 0
          ? Math.round(
              confidences.reduce((a, b) => a + b, 0) / confidences.length,
            )
          : 30;

      // Return whatever text we got, even if short (graceful degradation)
      if (combinedText.trim().length > 0) {
        return {
          text: combinedText.trim(),
          confidence: avgConfidence,
          language: config.language || "eng",
          processingTime: Date.now() - startTime,
          pages: pagesToProcess,
          errors: errors.length > 0 ? errors : undefined,
        };
      }

      // If we still have no text, throw a helpful error
      throw new Error(
        `Could not extract text from PDF. ${errors.length > 0 ? "Errors: " + errors.join("; ") : "PDF may be corrupted, password-protected, or contain only images without text."}`,
      );
    } catch (error: any) {
      console.error("[ocr] PDF extraction error:", error);

      // Provide helpful error messages
      let errorMessage = "Unknown OCR error";
      if (error?.message?.includes("password")) {
        errorMessage =
          "PDF is password-protected. Please remove password protection or convert to Excel/CSV format.";
      } else if (error?.message?.includes("encrypted")) {
        errorMessage =
          "PDF is encrypted. Please decrypt the PDF or convert to Excel/CSV format.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        text: "",
        confidence: 0,
        language: config.language || "eng",
        processingTime: Date.now() - startTime,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Check if OCR is available
   */
  isAvailable(): boolean {
    return this.tesseractAvailable;
  }

  /**
   * Check if scanned PDF OCR is available (renderer + OCR engine).
   */
  async isPDFAvailable(): Promise<boolean> {
    if (!this.tesseractAvailable) return false;
    if (this.pdfRenderAvailable) return true;
    try {
      await this.loadPDFRenderer();
      this.pdfRenderAvailable = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    if (!this.tesseractAvailable) {
      return ["eng"]; // Default to English
    }

    try {
      const Tesseract = await this.loadTesseract();
      if (Tesseract) {
        const worker = await Tesseract.createWorker("eng");
        const languages = await worker.getAvailableLanguages();
        await worker.terminate();
        return languages;
      }
    } catch (error) {
      console.error("Error getting supported languages:", error);
    }

    return ["eng"]; // Default fallback
  }
}

// Export singleton instance
export const ocrService = new OCRService();

// Initialize on module load
ocrService.initialize().catch(console.error);
