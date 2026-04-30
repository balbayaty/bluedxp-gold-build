/**
 * Default MSDS Extraction Adapter
 * Uses SDSParserService (deterministic parsing) and light heuristics for completeness.
 */

import type { ExtractedMSDSData } from "@/types/chemical";
import { SDSParserService } from "@/lib/services/ml/sds-parser";
import type {
  MSDSExtractionAdapter,
  MSDSExtractionIssue,
  MSDSExtractionResult,
  MSDSExtractionOptions,
} from "./msdsExtractionAdapter";
import { msdsExtractionValidator } from "./msdsExtractionValidator";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeUnNumber(un?: string): string | undefined {
  if (!un) return undefined;
  const trimmed = un.trim();
  const m = trimmed.match(/^(UN\s*)?(\d{4})$/i);
  return m ? `UN${m[2]}` : trimmed;
}

function inferHazardLevel(
  hazardStatements: string[] | undefined,
): "High" | "Medium" | "Low" | undefined {
  if (!hazardStatements || hazardStatements.length === 0) return undefined;
  const joined = hazardStatements.join(" ").toLowerCase();
  if (
    joined.includes("fatal") ||
    joined.includes("toxic") ||
    joined.includes("corrosive") ||
    joined.includes("explosive")
  )
    return "High";
  if (
    joined.includes("flammable") ||
    joined.includes("irritation") ||
    joined.includes("harmful")
  )
    return "Medium";
  return "Low";
}

export class DefaultMsdsExtractionAdapter implements MSDSExtractionAdapter {
  id = "default-parser";
  name = "Default SDS Parser";
  private parser = new SDSParserService();

  async extractFromText(
    text: string,
    options: MSDSExtractionOptions,
  ): Promise<MSDSExtractionResult> {
    const issues: MSDSExtractionIssue[] = [];

    if (!options.tenantId || options.tenantId.trim().length === 0) {
      throw new Error("tenantId is required");
    }

    // Temporarily set API keys in environment if provided (for server-side processing)
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
      // Use parseSDSWithSections to get all 16 standard sections
      const parsedWithSections = await this.parser.parseSDSWithSections(text);
      const parsed = parsedWithSections;
      const sections = parsedWithSections.sections || {};

      // Extract additional fields from text using enhanced patterns
      const ecNumber =
        (parsed as any).identifiers?.ecNumber || (parsed as any).ecNumber;
      const unNumber =
        (parsed as any).identifiers?.unNumber || (parsed as any).unNumber;
      const molecularFormula =
        parsed.molecularFormula ||
        (parsed as any).formula ||
        (parsed as any).identifiers?.molecularFormula;

      // Extract NFPA diamond ratings from text (look for NFPA 704 diamond pattern)
      // Pattern 1: "NFPA 704 Diamond: 2-0-1" or "NFPA: 2 0 1"
      let nfpaMatch = text.match(
        /NFPA\s*(?:704)?\s*(?:Diamond)?\s*:?\s*(\d)\s*[-\s]?\s*(\d)\s*[-\s]?\s*(\d)/i,
      );

      // Pattern 2: "Health: 2 Flammability: 0 Reactivity: 1"
      if (!nfpaMatch) {
        nfpaMatch = text.match(
          /(?:Health|H)\s*:?\s*(\d).*?(?:Flammability|F)\s*:?\s*(\d).*?(?:Reactivity|R|Instability|I)\s*:?\s*(\d)/i,
        );
      }

      // Pattern 3: Check hazards section
      if (!nfpaMatch && sections.hazards) {
        nfpaMatch = sections.hazards.match(
          /(?:Health|H)\s*:?\s*(\d).*?(?:Flammability|F)\s*:?\s*(\d).*?(?:Reactivity|R|Instability|I)\s*:?\s*(\d)/i,
        );
      }

      let healthRating = (parsed as any).healthRating || "0";
      let flammabilityRating = (parsed as any).flammabilityRating || "0";
      let reactivityRating = (parsed as any).reactivityRating || "0";

      if (nfpaMatch) {
        // NFPA format: Health Flammability Reactivity (values 0-4)
        const h = parseInt(nfpaMatch[1]);
        const f = parseInt(nfpaMatch[2]);
        const r = parseInt(nfpaMatch[3]);

        // Validate range (0-4)
        if (h >= 0 && h <= 4) healthRating = String(h);
        if (f >= 0 && f <= 4) flammabilityRating = String(f);
        if (r >= 0 && r <= 4) reactivityRating = String(r);
      }

      // Extract hazard statements more comprehensively
      let hazardStatements = parsed.hazardStatements || [];
      if (hazardStatements.length === 0 && (parsed as any).hazards) {
        hazardStatements = Array.isArray((parsed as any).hazards)
          ? (parsed as any).hazards
          : [];
      }

      // Extract precautionary statements more comprehensively
      let precautionaryStatements = parsed.precautionaryStatements || [];
      if (precautionaryStatements.length === 0 && (parsed as any).precautions) {
        precautionaryStatements = Array.isArray((parsed as any).precautions)
          ? (parsed as any).precautions
          : [];
      }

      // Extract storage requirements
      let storageConditions = parsed.storageRequirements || [];
      if (storageConditions.length === 0 && (parsed as any).storageConditions) {
        storageConditions = Array.isArray((parsed as any).storageConditions)
          ? (parsed as any).storageConditions
          : [];
      }

      // Extract incompatible materials
      let incompatibleMaterials =
        parsed.stabilityReactivity?.incompatibleMaterials || [];
      if (
        incompatibleMaterials.length === 0 &&
        (parsed as any).incompatibleMaterials
      ) {
        incompatibleMaterials = Array.isArray(
          (parsed as any).incompatibleMaterials,
        )
          ? (parsed as any).incompatibleMaterials
          : [];
      }

      // Extract first aid information
      let firstAid = "";
      if (parsed.firstAid) {
        const firstAidParts = [
          parsed.firstAid.inhalation,
          parsed.firstAid.skinContact,
          parsed.firstAid.eyeContact,
          parsed.firstAid.ingestion,
        ].filter(Boolean);
        firstAid = firstAidParts.length > 0 ? firstAidParts.join("\n") : "";
      }
      if (!firstAid && (parsed as any).firstAid) {
        firstAid =
          typeof (parsed as any).firstAid === "string"
            ? (parsed as any).firstAid
            : JSON.stringify((parsed as any).firstAid);
      }

      // Extract firefighting information
      let firefighting = "";
      if (
        Array.isArray(parsed.fireExtinguishingMedia) &&
        parsed.fireExtinguishingMedia.length > 0
      ) {
        firefighting = parsed.fireExtinguishingMedia.join(", ");
      } else if ((parsed as any).firefighting) {
        firefighting =
          typeof (parsed as any).firefighting === "string"
            ? (parsed as any).firefighting
            : JSON.stringify((parsed as any).firefighting);
      }

      // Extract physical state
      let physicalState = parsed.physicalProperties?.appearance;
      if (!physicalState && (parsed as any).physicalState) {
        physicalState = (parsed as any).physicalState;
      }

      const extractedData: ExtractedMSDSData = {
        productName: parsed.chemicalName || undefined, // Don't use 'Unknown'
        manufacturer: parsed.manufacturer || undefined, // Don't use 'Unknown'
        casNumber: parsed.casNumber || undefined,
        ecNumber: ecNumber,
        unNumber: unNumber,
        molecularFormula: molecularFormula,
        formula: molecularFormula || undefined,
        hazardClass:
          (parsed as any).hazardClass ||
          (parsed as any).transportClass ||
          undefined,
        hazardLevel: inferHazardLevel(hazardStatements) || "Medium",
        hazardStatements: hazardStatements,
        precautionaryStatements: precautionaryStatements,
        physicalState: physicalState || undefined,
        flashPoint:
          parsed.physicalProperties?.flashPoint?.toString() || undefined,
        boilingPoint:
          parsed.physicalProperties?.boilingPoint?.toString() || undefined,
        ph: parsed.physicalProperties?.ph?.toString() || undefined,
        storageConditions: storageConditions,
        incompatibleMaterials: incompatibleMaterials,
        ppeRequired: (parsed as any).ppeRequired || [],
        firstAid: firstAid || undefined,
        firefighting: firefighting || undefined,
        spillResponse:
          (parsed as any).spillResponse ||
          (parsed as any).accidentalRelease ||
          undefined,
        ghsCompliant:
          Array.isArray(hazardStatements) && hazardStatements.length > 0,
        safetyScore: (parsed as any).safetyScore || 75,
        aiConfidence: parsed.confidence
          ? clamp(parsed.confidence * 100, 0, 100)
          : 0,
        packagingType: (parsed as any).packagingType || undefined,
        transportClass:
          (parsed as any).transportClass ||
          (parsed as any).hazardClass ||
          undefined,
        packingGroup: (parsed as any).packingGroup || undefined,
        fireSuppressionRequired: firefighting || undefined,
        specialHazards:
          (parsed as any).specialHazards ||
          (parsed as any).stabilityReactivity?.conditionsToAvoid?.join(", ") ||
          undefined,
        remarks: (parsed as any).remarks || "",
        healthRating: healthRating,
        flammabilityRating: flammabilityRating,
        reactivityRating: reactivityRating,
      };

      // Normalize / infer
      if (extractedData.unNumber)
        extractedData.unNumber = normalizeUnNumber(extractedData.unNumber);
      if (!extractedData.hazardLevel)
        extractedData.hazardLevel = inferHazardLevel(
          extractedData.hazardStatements,
        );

      // Add all 16 sections to parsed data for storage
      const parsedWithAllData = {
        ...parsed,
        sections: sections, // All 16 standard SDS sections
        nfpa: {
          health: parseInt(healthRating),
          flammability: parseInt(flammabilityRating),
          reactivity: parseInt(reactivityRating),
        },
      };

      // Validation issues
      if (
        !extractedData.productName ||
        extractedData.productName.trim().length === 0
      ) {
        issues.push({
          code: "MISSING_PRODUCT_NAME",
          message: "Missing productName",
          field: "productName",
          severity: "error",
        });
      }
      if (
        !extractedData.manufacturer ||
        extractedData.manufacturer.trim().length === 0
      ) {
        issues.push({
          code: "MISSING_MANUFACTURER",
          message: "Missing manufacturer",
          field: "manufacturer",
          severity: "warning",
        });
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
      if (extractedData.hazardLevel === "High" && !extractedData.casNumber) {
        issues.push({
          code: "HIGH_HAZARD_MISSING_CAS",
          message: "High hazard MSDS missing CAS number",
          field: "casNumber",
          severity: "warning",
        });
      }

      const confidence = clamp(extractedData.aiConfidence || 0, 0, 100);

      // Production-ready validation
      const validation = msdsExtractionValidator.validate(extractedData);

      // Add validation issues to extraction issues
      validation.errors.forEach((error) => {
        issues.push({
          code: "VALIDATION_ERROR",
          message: error,
          severity: "error",
        });
      });

      validation.warnings.forEach((warning) => {
        issues.push({
          code: "VALIDATION_WARNING",
          message: warning,
          severity: "warning",
        });
      });

      // Add validation score to extracted data
      const finalExtractedData = {
        ...extractedData,
        validationScore: validation.score,
        isProductionReady: validation.isValid && validation.score >= 70,
      };

      return {
        extractedData: finalExtractedData,
        confidence: Math.max(confidence, validation.score), // Use higher of AI confidence or validation score
        issues,
        parsed: parsedWithAllData,
      };
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

export const defaultMsdsExtractionAdapter = new DefaultMsdsExtractionAdapter();
