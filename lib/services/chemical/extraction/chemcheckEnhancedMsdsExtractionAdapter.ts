/**
 * Chemcheck-Enhanced MSDS Extraction Adapter
 *
 * Adds:
 * - completeness scoring
 * - stricter validation issues list (like Chemcheck rules engine style)
 *
 * Note: OCR/vision fallback is handled BEFORE this adapter (text extraction layer).
 */

import type { ExtractedMSDSData } from "@/types/chemical";
import { SDSParserService } from "@/lib/services/ml/sds-parser";
import type {
  MSDSExtractionAdapter,
  MSDSExtractionIssue,
  MSDSExtractionOptions,
  MSDSExtractionResult,
} from "./msdsExtractionAdapter";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeUnNumber(un?: string): string | undefined {
  if (!un) return undefined;
  const trimmed = un.trim();
  const m = trimmed.match(/^(UN\s*)?(\d{4})$/i);
  return m ? `UN${m[2]}` : trimmed;
}

function completenessScore(d: ExtractedMSDSData): number {
  // Weight fields that matter most for compliance & logistics
  let score = 0;
  const add = (ok: boolean, w: number) => {
    if (ok) score += w;
  };

  add(!!d.productName && d.productName.trim().length > 1, 15);
  add(!!d.manufacturer && d.manufacturer.trim().length > 1, 10);
  add(!!d.casNumber && d.casNumber.trim().length > 0, 10);
  add(!!d.unNumber && d.unNumber.trim().length > 0, 10);
  add(Array.isArray(d.hazardStatements) && d.hazardStatements.length > 0, 15);
  add(
    Array.isArray(d.precautionaryStatements) &&
      d.precautionaryStatements.length > 0,
    10,
  );
  add(!!d.firstAid && d.firstAid.trim().length > 10, 5);
  add(!!d.firefighting && d.firefighting.trim().length > 5, 5);
  add(Array.isArray(d.storageConditions) && d.storageConditions.length > 0, 5);
  add(
    Array.isArray(d.incompatibleMaterials) &&
      d.incompatibleMaterials.length > 0,
    5,
  );
  add(!!d.flashPoint && String(d.flashPoint).trim().length > 0, 5);
  add(!!d.boilingPoint && String(d.boilingPoint).trim().length > 0, 5);

  return clamp(score, 0, 100);
}

export class ChemcheckEnhancedMsdsExtractionAdapter implements MSDSExtractionAdapter {
  id = "chemcheck-enhanced-parser";
  name = "Chemcheck Enhanced SDS Parser";
  private parser = new SDSParserService();

  async extractFromText(
    text: string,
    options: MSDSExtractionOptions,
  ): Promise<MSDSExtractionResult> {
    if (!options.tenantId || options.tenantId.trim().length === 0) {
      throw new Error("tenantId is required");
    }

    // Temporarily set API keys in environment if provided (for server-side processing)
    // This allows the AI service to use keys passed from the job service
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

    if (typeof window === "undefined") {
      // Server-side: Set environment variables temporarily
      if (options.openaiKey) {
        process.env.OPENAI_API_KEY = options.openaiKey;
        process.env.NEXT_PUBLIC_OPENAI_API_KEY = options.openaiKey;
      }
      if (options.anthropicKey) {
        process.env.ANTHROPIC_API_KEY = options.anthropicKey;
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY = options.anthropicKey;
      }
    }

    try {
      const parsed = await this.parser.parseSDS(text);

      // Extract all fields from parsed data - don't use 'Unknown' fallbacks
      const extractedData: ExtractedMSDSData = {
        productName: parsed.chemicalName || undefined, // Let UI handle missing
        manufacturer: parsed.manufacturer || undefined, // Don't use 'Unknown'
        casNumber: parsed.casNumber,
        unNumber: parsed.unNumber
          ? normalizeUnNumber(parsed.unNumber)
          : undefined,
        ecNumber: parsed.ecNumber,
        molecularFormula:
          parsed.molecularFormula ||
          parsed.formula ||
          (parsed as any).identifiers?.molecularFormula,
        hazardClass:
          (parsed as any).hazardClass ||
          (parsed as any).transportClass ||
          undefined,
        hazardStatements: parsed.hazardStatements || [],
        precautionaryStatements: parsed.precautionaryStatements || [],
        physicalState: parsed.physicalProperties?.appearance,
        flashPoint: parsed.physicalProperties?.flashPoint?.toString(),
        boilingPoint: parsed.physicalProperties?.boilingPoint?.toString(),
        ph: parsed.physicalProperties?.ph?.toString(),
        storageConditions: parsed.storageRequirements || [],
        incompatibleMaterials:
          parsed.stabilityReactivity?.incompatibleMaterials || [],
        firstAid: parsed.firstAid
          ? [
              parsed.firstAid.inhalation,
              parsed.firstAid.skinContact,
              parsed.firstAid.eyeContact,
              parsed.firstAid.ingestion,
            ]
              .filter(Boolean)
              .join("\n")
          : undefined,
        firefighting: Array.isArray(parsed.fireExtinguishingMedia)
          ? parsed.fireExtinguishingMedia.join(", ")
          : undefined,
        ghsCompliant:
          Array.isArray(parsed.hazardStatements) &&
          parsed.hazardStatements.length > 0,
        aiConfidence: parsed.confidence
          ? clamp(parsed.confidence * 100, 0, 100)
          : 0,
        // Add transport information
        transportClass: (parsed as any).transportClass || undefined,
        packingGroup: (parsed as any).packingGroup || undefined,
        packagingType: (parsed as any).packagingType || undefined,
        // Add NFPA ratings
        healthRating:
          (parsed as any).healthRating ||
          (parsed as any).nfpa?.health?.toString() ||
          undefined,
        flammabilityRating:
          (parsed as any).flammabilityRating ||
          (parsed as any).nfpa?.flammability?.toString() ||
          undefined,
        reactivityRating:
          (parsed as any).reactivityRating ||
          (parsed as any).nfpa?.reactivity?.toString() ||
          undefined,
      };

      const issues: MSDSExtractionIssue[] = [];
      const required: Array<keyof ExtractedMSDSData> = [
        "productName",
        "manufacturer",
        "hazardStatements",
        "precautionaryStatements",
      ];

      for (const f of required) {
        const v = extractedData[f] as any;
        const missing =
          v === undefined ||
          v === null ||
          (typeof v === "string" && v.trim().length === 0) ||
          (Array.isArray(v) && v.length === 0);
        if (missing) {
          issues.push({
            code: "MISSING_REQUIRED_FIELD",
            message: `Missing required field: ${String(f)}`,
            field: String(f),
            severity: "warning",
          });
        }
      }

      if (
        extractedData.unNumber &&
        !/^UN\d{4}$/i.test(extractedData.unNumber)
      ) {
        issues.push({
          code: "INVALID_UN_NUMBER",
          message: "UN number format should be UN####",
          field: "unNumber",
          severity: "warning",
        });
      }
      if (
        extractedData.casNumber &&
        !/^\d{2,7}-\d{2}-\d$/.test(extractedData.casNumber)
      ) {
        issues.push({
          code: "INVALID_CAS_FORMAT",
          message: "CAS number format should be XX-XX-X",
          field: "casNumber",
          severity: "warning",
        });
      }

      const completeness = completenessScore(extractedData);
      if (completeness < 60) {
        issues.push({
          code: "LOW_COMPLETENESS",
          message: `Low extraction completeness (${completeness}%). Consider vision OCR fallback or manual review.`,
          severity: "info",
        });
      }

      // Blend confidence: AI confidence is about extraction; completeness reflects usable coverage.
      const confidence = clamp(
        Math.round(
          clamp(extractedData.aiConfidence || 0, 0, 100) * 0.6 +
            completeness * 0.4,
        ),
        0,
        100,
      );

      return { extractedData, confidence, issues, parsed };
    } finally {
      // Restore original environment variables
      if (typeof window === "undefined") {
        if (originalOpenAIKey !== undefined) {
          process.env.OPENAI_API_KEY = originalOpenAIKey;
        } else {
          delete process.env.OPENAI_API_KEY;
        }
        if (originalAnthropicKey !== undefined) {
          process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
        } else {
          delete process.env.ANTHROPIC_API_KEY;
        }
      }
    }
  }
}

export const chemcheckEnhancedMsdsExtractionAdapter =
  new ChemcheckEnhancedMsdsExtractionAdapter();
