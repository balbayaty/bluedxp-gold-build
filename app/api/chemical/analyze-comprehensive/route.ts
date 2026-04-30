/**
 * Comprehensive Chemical Analysis API Route
 * Uses SDS Parser and ML services to extract comprehensive data from MSDS documents
 */

import { NextRequest, NextResponse } from "next/server";
import { SDSParserService } from "@/lib/services/ml/sds-parser";
import { HazardPredictionService } from "@/lib/services/ml/hazard-prediction";
import { ChemicalRiskAssessmentService } from "@/lib/services/ml/risk-assessment";
import { ChemicalCompatibilityService } from "@/lib/services/ml/chemical-compatibility";
import { MSDSDocument, MSDSMetadata } from "@/types/chemical";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// Force Node.js runtime (uses Node-only deps like pdf-parse, xlsx, Buffer).
export const runtime = "nodejs";

const sdsParser = new SDSParserService();
const hazardPrediction = new HazardPredictionService();
const riskAssessment = new ChemicalRiskAssessmentService();
const compatibilityService = new ChemicalCompatibilityService();

/**
 * Extract NFPA Health Rating
 */
function extractNFPAHealth(parsedData: any, hazardLevel: string): string {
  // Check hazard statements for health indicators
  const hazardStatements = parsedData.hazardStatements || [];
  const hasToxic = hazardStatements.some(
    (h: string) =>
      h.toLowerCase().includes("toxic") ||
      h.toLowerCase().includes("fatal") ||
      h.toLowerCase().includes("poison"),
  );
  const hasCorrosive = hazardStatements.some(
    (h: string) =>
      h.toLowerCase().includes("corrosive") ||
      h.toLowerCase().includes("skin burn"),
  );

  if (hasToxic || hasCorrosive) return "3";
  if (hazardLevel === "High") return "3";
  if (hazardLevel === "Medium") return "2";
  return "1";
}

/**
 * Extract NFPA Flammability Rating
 */
function extractNFPAFlammability(parsedData: any, hazardLevel: string): string {
  const flashPoint = parsedData.physicalProperties?.flashPoint;
  const physicalState =
    parsedData.physicalProperties?.appearance?.toLowerCase() || "";

  // Check flash point
  if (flashPoint) {
    const flashPointNum = parseFloat(
      flashPoint.toString().replace(/[^\d.-]/g, ""),
    );
    if (!isNaN(flashPointNum)) {
      if (flashPointNum < 0) return "4"; // Extremely flammable
      if (flashPointNum < 23) return "3"; // Highly flammable
      if (flashPointNum < 38) return "2"; // Flammable
      if (flashPointNum < 93) return "1"; // Combustible
    }
  }

  // Check for gas
  if (physicalState.includes("gas")) return "4";

  // Check hazard statements
  const hazardStatements = parsedData.hazardStatements || [];
  const isFlammable = hazardStatements.some(
    (h: string) =>
      h.toLowerCase().includes("flammable") ||
      h.toLowerCase().includes("combustible"),
  );

  if (isFlammable) {
    if (hazardLevel === "High") return "3";
    return "2";
  }

  return "0";
}

/**
 * Extract NFPA Reactivity Rating
 */
function extractNFPAReactivity(parsedData: any, hazardLevel: string): string {
  const stabilityReactivity = parsedData.stabilityReactivity || {};
  const conditionsToAvoid = stabilityReactivity.conditionsToAvoid || [];
  const incompatibleMaterials = stabilityReactivity.incompatibleMaterials || [];

  // Check for water reactive
  const isWaterReactive =
    conditionsToAvoid.some(
      (c: string) =>
        c.toLowerCase().includes("water") ||
        c.toLowerCase().includes("moisture"),
    ) ||
    incompatibleMaterials.some((m: string) =>
      m.toLowerCase().includes("water"),
    );

  // Check for explosive
  const isExplosive = (parsedData.hazardStatements || []).some(
    (h: string) =>
      h.toLowerCase().includes("explosive") ||
      h.toLowerCase().includes("detonate"),
  );

  if (isExplosive) return "4";
  if (isWaterReactive) return "3";
  if (hazardLevel === "High" && incompatibleMaterials.length > 0) return "2";
  if (hazardLevel === "Medium") return "1";
  return "0";
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    // AI keys:
    // - Prefer server-side env vars (recommended)
    // - Allow client-supplied keys (x-openai-key / x-anthropic-key) ONLY in dev
    //   or when explicitly enabled for production.
    const allowClientSuppliedKeys =
      process.env.NODE_ENV !== "production" ||
      (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() ===
        "true";

    const openaiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-openai-key") : null);

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-anthropic-key") : null);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Check file type
    const fileType = file.type || file.name.split(".").pop()?.toLowerCase();
    const isPDF =
      fileType === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isExcel =
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel" ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls");
    const isCSV =
      fileType === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    let text: string;

    // Handle Excel files
    if (isExcel) {
      try {
        const XLSX = require("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });

        // Extract text from all sheets
        let excelText = "";
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          // Convert sheet data to text
          sheetData.forEach((row: any[]) => {
            if (Array.isArray(row)) {
              excelText +=
                row
                  .filter(
                    (cell) =>
                      cell !== null && cell !== undefined && cell !== "",
                  )
                  .join(" ") + "\n";
            }
          });
        });

        if (!excelText || excelText.trim().length < 50) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Excel file appears to be empty or contains insufficient data.",
              fileType: "excel",
              suggestion:
                "Please ensure the Excel file contains MSDS data in a readable format.",
            },
            { status: 400 },
          );
        }

        text = excelText;
      } catch (excelError: any) {
        const err =
          excelError instanceof Error
            ? excelError
            : new Error(String(excelError));
        logger.error("Excel parsing error", err, {
          module: "chemical",
          service: "analyze-comprehensive",
        });
        errorTrackingService.captureException(err, {
          module: "chemical",
          service: "analyze-comprehensive",
        });
        return NextResponse.json(
          {
            success: false,
            error: `Failed to parse Excel file: ${excelError?.message || "Unknown error"}`,
            fileType: "excel",
            suggestion:
              "Please try converting the Excel file to CSV format, or ensure it's a valid Excel file.",
          },
          { status: 400 },
        );
      }
    }

    // Handle PDF files
    if (isPDF) {
      try {
        // Try to use pdf-parse if available
        const buffer = await file.arrayBuffer();
        let pdfParse: any = null;

        try {
          // Try require first (CommonJS module)
          const pdfParseModule = require("pdf-parse");

          // pdf-parse exports the function directly or as default
          if (typeof pdfParseModule === "function") {
            pdfParse = pdfParseModule;
          } else if (
            pdfParseModule.default &&
            typeof pdfParseModule.default === "function"
          ) {
            pdfParse = pdfParseModule.default;
          } else if (
            pdfParseModule.pdfParse &&
            typeof pdfParseModule.pdfParse === "function"
          ) {
            pdfParse = pdfParseModule.pdfParse;
          } else {
            logger.warn(
              "pdf-parse module structure unexpected",
              new Error("Unexpected pdf-parse module structure"),
              {
                module: "chemical",
                service: "analyze-comprehensive",
                moduleKeys: Object.keys(pdfParseModule),
              },
            );
            pdfParse = null;
          }
        } catch (e: any) {
          logger.warn(
            "pdf-parse not available, using fallback method",
            e instanceof Error ? e : new Error(String(e)),
            {
              module: "chemical",
              service: "analyze-comprehensive",
            },
          );
          pdfParse = null;
        }

        if (pdfParse && typeof pdfParse === "function") {
          // Use pdf-parse library
          try {
            // Convert ArrayBuffer to Buffer for pdf-parse
            const nodeBuffer = Buffer.from(buffer);
            const pdfData = await pdfParse(nodeBuffer);
            text = pdfData.text || "";

            if (!text || text.trim().length < 100) {
              // Try OCR for scanned PDFs
              try {
                const { ocrService } =
                  await import("@/lib/services/ocr/ocrService");

                if (await ocrService.isPDFAvailable()) {
                  logger.info("Attempting OCR for scanned PDF", undefined, {
                    module: "chemical",
                    service: "analyze-comprehensive",
                  });
                  const cloudEnabled = !!(openaiKey || anthropicKey);
                  const ocrResult = await ocrService.extractTextFromPDF(
                    nodeBuffer,
                    {
                      language: "eng",
                      psm: 6,
                      useCloudOCR: cloudEnabled,
                      cloud: cloudEnabled
                        ? {
                            tenantId: context.tenantId,
                            provider: "auto",
                            openaiKey: openaiKey || undefined,
                            anthropicKey: anthropicKey || undefined,
                          }
                        : undefined,
                    },
                  );

                  if (ocrResult.text && ocrResult.text.trim().length >= 100) {
                    logger.info("OCR extracted text", undefined, {
                      module: "chemical",
                      service: "analyze-comprehensive",
                      textLength: ocrResult.text.length,
                      confidence: ocrResult.confidence,
                    });
                    text = ocrResult.text;
                  } else {
                    // OCR didn't extract enough text
                    return NextResponse.json(
                      {
                        success: false,
                        error:
                          "PDF appears to be image-only (scanned). OCR attempted but extracted insufficient text.",
                        fileType: "pdf",
                        suggestion:
                          "Please ensure the scanned PDF has clear, readable text. You can also convert it to Excel/CSV format.",
                        ocrAttempted: true,
                        ocrConfidence: ocrResult.confidence,
                      },
                      { status: 400 },
                    );
                  }
                } else {
                  // OCR not available
                  return NextResponse.json(
                    {
                      success: false,
                      error:
                        "PDF appears to be empty or image-only (scanned). OCR support is not available.",
                      fileType: "pdf",
                      suggestion:
                        "If this is a scanned PDF, install OCR support with: npm install tesseract.js pdfjs-dist @napi-rs/canvas. Or convert the PDF to Excel/CSV format.",
                      installInstructions:
                        "Run: npm install tesseract.js pdfjs-dist @napi-rs/canvas",
                    },
                    { status: 400 },
                  );
                }
              } catch (ocrError) {
                const err =
                  ocrError instanceof Error
                    ? ocrError
                    : new Error(String(ocrError));
                logger.error("OCR attempt failed", err, {
                  module: "chemical",
                  service: "analyze-comprehensive",
                });
                errorTrackingService.captureException(err, {
                  module: "chemical",
                  service: "analyze-comprehensive",
                });
                // Fall through to return error
                return NextResponse.json(
                  {
                    success: false,
                    error:
                      "PDF appears to be empty or image-only. OCR is not available.",
                    fileType: "pdf",
                    suggestion:
                      "If this is a scanned PDF, install OCR support with: npm install tesseract.js. Or convert the PDF to Excel/CSV format.",
                    installInstructions: "Run: npm install tesseract.js",
                  },
                  { status: 400 },
                );
              }
            }
          } catch (parseError: any) {
            const err =
              parseError instanceof Error
                ? parseError
                : new Error(String(parseError));
            logger.error("pdf-parse error", err, {
              module: "chemical",
              service: "analyze-comprehensive",
            });
            errorTrackingService.captureException(err, {
              module: "chemical",
              service: "analyze-comprehensive",
            });
            // Check for specific error types
            if (
              parseError.message?.includes("password") ||
              parseError.message?.includes("encrypted")
            ) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    "PDF is password-protected. Please remove the password or convert to Excel/CSV format.",
                  fileType: "pdf",
                  suggestion:
                    "Open the PDF, remove password protection, then upload again. Or convert to Excel/CSV format.",
                },
                { status: 400 },
              );
            }
            throw new Error(
              `PDF parsing failed: ${parseError?.message || "Unknown error"}`,
            );
          }
        } else {
          // Fallback: Try to extract text using basic method
          // Some PDFs have text embedded that can be extracted
          const buffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);

          // Try to find text content in PDF (basic extraction)
          // This is a simple approach - for production, install pdf-parse
          let extractedText = "";
          const bufferString = Buffer.from(uint8Array).toString("binary");

          // Look for text streams in PDF (basic pattern matching)
          const textMatches = bufferString.match(/BT[\s\S]*?ET/g);
          if (textMatches) {
            for (const match of textMatches) {
              // Extract text between parentheses (PDF text objects)
              const textInParens = match.match(/\(([^)]+)\)/g);
              if (textInParens) {
                extractedText +=
                  textInParens.map((t) => t.slice(1, -1)).join(" ") + " ";
              }
            }
          }

          // Also try to decode as UTF-8 (some PDFs have readable text)
          try {
            const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(
              uint8Array,
            );
            // Extract readable text portions
            const readableText =
              utf8Text.match(/[a-zA-Z0-9\s]{20,}/g)?.join(" ") || "";
            if (readableText.length > extractedText.length) {
              extractedText = readableText;
            }
          } catch (e) {
            // Ignore UTF-8 decode errors
          }

          if (!extractedText || extractedText.trim().length < 100) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Could not extract text from PDF. This PDF may be image-based (scanned) or password-protected.",
                fileType: "pdf",
                suggestion:
                  "Please install pdf-parse library for better PDF support, or convert the PDF to Excel/CSV format. For scanned PDFs, use OCR first.",
                installInstructions: "Run: npm install pdf-parse",
              },
              { status: 400 },
            );
          }

          text = extractedText;
        }
      } catch (pdfError) {
        const err =
          pdfError instanceof Error ? pdfError : new Error(String(pdfError));
        logger.error("PDF parsing error", err, {
          module: "chemical",
          service: "analyze-comprehensive",
        });
        errorTrackingService.captureException(err, {
          module: "chemical",
          service: "analyze-comprehensive",
        });
        return NextResponse.json(
          {
            success: false,
            error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}. The PDF may be password-protected, corrupted, or image-only.`,
            fileType: "pdf",
            suggestion:
              "Try converting the PDF to Excel (.xlsx) or CSV format, or ensure the PDF is not password-protected. For scanned PDFs, use OCR to extract text first.",
            installInstructions:
              "For better PDF support, install pdf-parse: npm install pdf-parse",
          },
          { status: 400 },
        );
      }
    } else if (isCSV) {
      // Read CSV as text
      const buffer = await file.arrayBuffer();
      text = new TextDecoder("utf-8").decode(buffer);
    } else {
      // Try to read as text for other file types
      const buffer = await file.arrayBuffer();
      try {
        text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      } catch (decodeError) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unsupported file type. Please upload PDF, Excel (.xlsx), or CSV files.",
            fileType: fileType || "unknown",
          },
          { status: 400 },
        );
      }
    }

    // Validate extracted text
    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          success: false,
          error:
            "File appears to be empty or contains insufficient text. Please ensure the file contains readable MSDS data (at least 100 characters).",
          fileType: fileType || "unknown",
        },
        { status: 400 },
      );
    }

    // Parse SDS using the parser service
    let parsedData;
    try {
      parsedData = await sdsParser.parseSDS(text);

      // Validate parsed data has minimum required fields
      if (
        !parsedData ||
        !parsedData.chemicalName ||
        parsedData.chemicalName === "Unknown Chemical"
      ) {
        // If parsing failed but didn't throw, we still got a fallback structure
        // Continue with low confidence data - but try to extract identifiers from raw text
        logger.warn(
          "SDS parsing returned low confidence data, attempting identifier extraction from raw text",
          undefined,
          {
            module: "chemical",
            service: "analyze-comprehensive",
          },
        );

        // Try to extract identifiers directly from raw text as last resort
        const directCAS =
          (sdsParser as any).extractCASNumber?.(text) ||
          text.match(
            /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*(\d{2,7}-\d{2}-\d{1})/i,
          )?.[1];
        if (directCAS && !parsedData.casNumber) {
          parsedData.casNumber = directCAS.trim();
          logger.info("Extracted CAS directly from text", undefined, {
            module: "chemical",
            service: "analyze-comprehensive",
            casNumber: directCAS,
          });
        }
      }
    } catch (parseError) {
      const err =
        parseError instanceof Error
          ? parseError
          : new Error(String(parseError));
      logger.error("SDS parsing error", err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      errorTrackingService.captureException(err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      // Even on error, try to extract basic identifiers from text
      let fallbackData: any = {
        chemicalName: "Unknown Chemical",
        manufacturer: "Unknown",
        hazardStatements: [],
        precautionaryStatements: [],
        firstAid: {},
        physicalProperties: {},
        stabilityReactivity: {},
        confidence: 0.1,
      };

      // Try direct extraction
      try {
        const directCAS = text.match(
          /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*(\d{2,7}-\d{2}-\d{1})/i,
        )?.[1];
        if (directCAS) {
          fallbackData.casNumber = directCAS.trim();
          logger.info(
            "Extracted CAS from text even after parse error",
            undefined,
            {
              module: "chemical",
              service: "analyze-comprehensive",
              casNumber: directCAS,
            },
          );
        }
      } catch (e) {
        // Ignore extraction errors
      }

      // Return error but with any extracted identifiers
      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse MSDS document: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}. Please ensure the file contains readable MSDS data.`,
          suggestion:
            "Try uploading an Excel (.xlsx) or CSV file with MSDS data, or ensure PDF files are not password-protected.",
          extractedData: fallbackData, // Include any extracted data
        },
        { status: 400 },
      );
    }

    // Perform hazard prediction
    let hazards: any[] = [];
    try {
      hazards = await hazardPrediction.predictHazards({
        name: parsedData.chemicalName,
        casNumber: parsedData.casNumber,
        hazardStatements: parsedData.hazardStatements || [],
        physicalProperties: parsedData.physicalProperties,
      } as any);
    } catch (hazardError) {
      const err =
        hazardError instanceof Error
          ? hazardError
          : new Error(String(hazardError));
      logger.error("Hazard prediction error", err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      errorTrackingService.captureException(err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      // Continue with empty hazards array
      hazards = [];
    }

    // Perform risk assessment
    let riskResult: any;
    try {
      const chemical = {
        id: parsedData.casNumber || "unknown",
        name: parsedData.chemicalName,
        casNumber: parsedData.casNumber,
        hazardClassifications: parsedData.hazardStatements || [],
        hazardStatements: parsedData.hazardStatements || [],
        physicalProperties: parsedData.physicalProperties
          ? {
              physicalState: (parsedData.physicalProperties.appearance
                ?.toLowerCase()
                .includes("liquid")
                ? "liquid"
                : parsedData.physicalProperties.appearance
                      ?.toLowerCase()
                      .includes("gas")
                  ? "gas"
                  : "solid") as "solid" | "liquid" | "gas",
              boilingPoint: parseFloat(
                parsedData.physicalProperties.boilingPoint || "0",
              ),
              flashPoint: parseFloat(
                parsedData.physicalProperties.flashPoint || "0",
              ),
            }
          : undefined,
      };

      const scenario = {
        id: "default-scenario",
        name: "General Handling",
        description: "General chemical handling scenario",
        exposureRoute: "multiple" as const,
        duration: "intermediate" as const,
        frequency: "occasional" as const,
        magnitude: "moderate" as const,
        controlMeasures: ["Standard PPE", "Ventilation"],
      };

      const workplace = {
        id: "default-workplace",
        name: "Warehouse",
        type: "Warehouse",
        area: 1000,
        controlMeasures: ["Standard controls"],
        averageOccupancy: 5,
        activities: ["Storage", "Handling"],
      };

      const assessmentResult = await riskAssessment.performRiskAssessment(
        chemical,
        scenario,
        workplace,
      );
      riskResult = {
        overallRiskScore: assessmentResult.riskScore / 20, // Convert 0-100 to 0-5 scale
        riskLevel: assessmentResult.riskLevel,
        recommendedPPE: assessmentResult.recommendedPPE,
        recommendedControls: assessmentResult.recommendedControls,
      };
    } catch (riskError) {
      const err =
        riskError instanceof Error ? riskError : new Error(String(riskError));
      logger.error("Risk assessment error", err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      errorTrackingService.captureException(err, {
        module: "chemical",
        service: "analyze-comprehensive",
      });
      // Use default risk result
      riskResult = {
        overallRiskScore: 2.5,
        riskLevel: "MEDIUM",
        recommendedPPE: ["Standard PPE"],
        recommendedControls: ["Standard controls"],
      };
    }

    // Calculate hazard level
    const hazardLevel =
      hazards.length > 0 && hazards[0].severityLevel === "Extreme"
        ? "High"
        : hazards.length > 0 && hazards[0].severityLevel === "High"
          ? "High"
          : hazards.length > 0
            ? "Medium"
            : "Low";

    // Build comprehensive extracted data
    const extractedData = {
      // Basic Information
      productName: parsedData.chemicalName,
      manufacturer: parsedData.manufacturer,
      casNumber: parsedData.casNumber || undefined,
      ecNumber:
        (parsedData as any).identifiers?.ecNumber || parsedData.ecNumber,
      unNumber:
        (parsedData as any).identifiers?.unNumber || parsedData.unNumber,
      molecularFormula:
        (parsedData as any).identifiers?.molecularFormula ||
        parsedData.molecularFormula,
      formula:
        (parsedData as any).identifiers?.molecularFormula ||
        parsedData.molecularFormula ||
        parsedData.physicalProperties?.appearance ||
        "Not specified",
      hazardClass: parsedData.hazardStatements[0] || "Not classified",
      hazardLevel: hazardLevel as "High" | "Medium" | "Low",
      hazardStatements: parsedData.hazardStatements,
      precautionaryStatements: parsedData.precautionaryStatements,

      // Physical Properties
      physicalState:
        parsedData.physicalProperties?.appearance || "Not specified",
      flashPoint: parsedData.physicalProperties?.flashPoint || "Not specified",
      boilingPoint:
        parsedData.physicalProperties?.boilingPoint || "Not specified",
      ph: parsedData.physicalProperties?.ph?.toString() || "Not specified",

      // Storage & Handling
      storageConditions: Array.isArray(parsedData.storageRequirements)
        ? parsedData.storageRequirements
        : [],
      storageRequirements: Array.isArray(parsedData.storageRequirements)
        ? parsedData.storageRequirements
        : [],
      incompatibleMaterials: Array.isArray(
        parsedData.stabilityReactivity?.incompatibleMaterials,
      )
        ? parsedData.stabilityReactivity.incompatibleMaterials
        : [],
      ppeRequired: riskResult?.recommendedPPE || ["Standard PPE"],

      // Safety Measures
      firstAid:
        parsedData.firstAid?.inhalation ||
        parsedData.firstAid?.skinContact ||
        "Seek medical attention",
      firefighting:
        Array.isArray(parsedData.fireExtinguishingMedia) &&
        parsedData.fireExtinguishingMedia.length > 0
          ? parsedData.fireExtinguishingMedia.join(", ")
          : "CO2, dry chemical",
      spillResponse: "Contain and clean up",
      emergencyProcedures: parsedData.firstAid
        ? [
            parsedData.firstAid.inhalation || "",
            parsedData.firstAid.skinContact || "",
            parsedData.firstAid.eyeContact || "",
            parsedData.firstAid.ingestion || "",
          ].filter(Boolean)
        : ["Seek medical attention"],

      // Compliance
      ghsCompliant:
        Array.isArray(parsedData.hazardStatements) &&
        (parsedData.hazardStatements?.length || 0) > 0,
      safetyScore:
        riskResult && riskResult.overallRiskScore
          ? Math.max(0, Math.min(100, 100 - riskResult.overallRiskScore * 20))
          : 75,
      aiConfidence: parsedData.confidence
        ? Math.max(0, Math.min(100, parsedData.confidence * 100))
        : 50,

      // Transport & Packaging
      packagingType: "Drums/Containers",
      transportClass: "Class 9",
      packingGroup: "PG III",
      fireSuppressionRequired:
        Array.isArray(parsedData.fireExtinguishingMedia) &&
        parsedData.fireExtinguishingMedia.length > 0
          ? parsedData.fireExtinguishingMedia.join(", ")
          : "CO2, Dry chemical",
      specialHazards:
        Array.isArray(parsedData.stabilityReactivity?.conditionsToAvoid) &&
        parsedData.stabilityReactivity.conditionsToAvoid.length > 0
          ? parsedData.stabilityReactivity.conditionsToAvoid.join(", ")
          : "Standard combustion hazards",
      remarks: "",

      // NFPA Ratings (intelligent extraction from physical properties and hazard statements)
      healthRating: extractNFPAHealth(parsedData, hazardLevel),
      flammabilityRating: extractNFPAFlammability(parsedData, hazardLevel),
      reactivityRating: extractNFPAReactivity(parsedData, hazardLevel),
    };

    // Store MSDS for cross-module access (warehouse, transportation, compliance)
    try {
      const msdsId = `msds-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const msds: MSDSDocument = {
        id: msdsId,
        chemicalName:
          extractedData.productName ||
          file.name.replace(/\.(pdf|xlsx|csv)$/i, ""),
        manufacturer: extractedData.manufacturer || "Unknown",
        version: "1.0",
        language: "en",
        fileType: file.type.includes("pdf")
          ? "pdf"
          : file.type.includes("excel")
            ? "excel"
            : "csv",
        extractedData,
        status: "analyzing",
        workflowStatus: "pending_analysis",
        metadata: {
          submittedDate: new Date().toISOString(),
          source: "upload",
          filename: file.name,
        } as MSDSMetadata,
      };

      await msdsDomainService.storeExtractedMSDS({
        tenantId: context.tenantId,
        actor: { userId: context.userId, roles: context.permissions || [] },
        msds,
        extractedData,
        source: "upload",
      });
    } catch (storageError) {
      logger.warn(
        "Storage failed (non-critical)",
        storageError instanceof Error
          ? storageError
          : new Error(String(storageError)),
        {
          module: "chemical",
          service: "analyze-comprehensive",
        },
      );
      // Don't fail the request if storage fails
    }

    return NextResponse.json({
      success: true,
      extractedData,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        confidence: parsedData.confidence,
      },
      hazards,
      riskAssessment: riskResult,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Comprehensive analysis error", err, {
      module: "chemical",
      service: "analyze-comprehensive",
    });
    errorTrackingService.captureException(err, {
      module: "chemical",
      service: "analyze-comprehensive",
    });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze document",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.analyze-comprehensive",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
