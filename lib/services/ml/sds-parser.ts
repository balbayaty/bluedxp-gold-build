import { aiService } from "../ai/chemcheckService";
import { parsingPatternLibrary } from "./parsingPatternLibrary";
import { buildSdsExtractionPrompt } from "./chemcheckPromptSelector";

// Output interface for the parsed SDS data
export interface SDSData {
  chemicalName: string;
  manufacturer: string;
  casNumber?: string;
  ecNumber?: string;
  unNumber?: string;
  molecularFormula?: string;
  productCode?: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
  firstAid: {
    inhalation?: string;
    skinContact?: string;
    eyeContact?: string;
    ingestion?: string;
  };
  fireExtinguishingMedia?: string[];
  storageRequirements?: string[];
  physicalProperties: {
    appearance?: string;
    odor?: string;
    ph?: string | number;
    boilingPoint?: string;
    flashPoint?: string;
    density?: string;
    solubility?: string;
  };
  stabilityReactivity: {
    stability?: string;
    conditionsToAvoid?: string[];
    incompatibleMaterials?: string[];
    decompositionProducts?: string[];
  };
  regulatoryInformation?: string[];
  disposalConsiderations?: string;
  confidence: number;
}

/**
 * SDS Parser Service
 * Uses AI-powered NLP to extract structured data from Safety Data Sheets
 */
export class SDSParserService {
  /**
   * Parse raw text from a Safety Data Sheet and extract structured information
   * @param rawText The raw text content from the SDS
   * @returns Parsed and structured SDS data
   */
  async parseSDS(rawText: string): Promise<SDSData> {
    try {
      console.log("[sds-parser] Starting parse, text length:", rawText.length);

      // Preprocess the text to clean it up
      const processedText = this.preprocessText(rawText);
      console.log(
        "[sds-parser] Preprocessed text length:",
        processedText.length,
      );

      // Always try AI first if available, but fall back to deterministic extraction
      const providerName = aiService.getActiveProvider().name || "";
      const isMockProvider = providerName.toLowerCase().includes("mock");

      let result: any = { confidence: 0.1 };

      if (!isMockProvider) {
        // Try AI extraction
        try {
          result = await this.extractDataWithAI(processedText);
        } catch (aiError) {
          console.warn(
            "[sds-parser] AI extraction failed, using deterministic extraction:",
            aiError,
          );
          result = { confidence: 0.1 };
        }
      }

      // Always enhance with deterministic extraction (even if AI succeeded)
      // This ensures we get all fields even if AI misses some
      const deterministicData = this.extractDeterministicFields(processedText);
      result = { ...deterministicData, ...result }; // Deterministic takes precedence for accuracy
      console.log("[sds-parser] AI extraction result:", {
        chemicalName: result.chemicalName,
        casNumber: result.casNumber,
        manufacturer: result.manufacturer,
        confidence: result.confidence,
      });

      // Post-process and validate the extracted data
      const finalData = this.postprocessData(result, rawText);
      console.log("[sds-parser] Final parsed data:", {
        chemicalName: finalData.chemicalName,
        casNumber: finalData.casNumber,
        ecNumber: (finalData as any).identifiers?.ecNumber,
        unNumber: (finalData as any).identifiers?.unNumber,
        molecularFormula: (finalData as any).identifiers?.molecularFormula,
        manufacturer: finalData.manufacturer,
        confidence: finalData.confidence,
      });

      return finalData;
    } catch (error) {
      console.error("[sds-parser] Error parsing SDS:", error);
      // Return a minimal SDS data object with low confidence
      return {
        chemicalName: "Unknown Chemical",
        manufacturer: "Unknown",
        hazardStatements: ["Could not parse Safety Data Sheet"],
        precautionaryStatements: ["Refer to original SDS document"],
        firstAid: {},
        physicalProperties: {},
        stabilityReactivity: {},
        confidence: 0.1,
      };
    }
  }

  /**
   * Preprocess SDS text for better AI analysis
   */
  private preprocessText(rawText: string): string {
    // Remove excessive whitespace and normalize line breaks
    let processed = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    // Try to identify and enhance section headers to help AI recognize them
    const sectionHeaders = [
      "IDENTIFICATION",
      "HAZARD",
      "COMPOSITION",
      "FIRST AID",
      "FIRE FIGHTING",
      "ACCIDENTAL RELEASE",
      "HANDLING AND STORAGE",
      "EXPOSURE CONTROL",
      "PHYSICAL AND CHEMICAL PROPERTIES",
      "STABILITY AND REACTIVITY",
      "TOXICOLOGICAL",
      "ECOLOGICAL",
      "DISPOSAL",
      "TRANSPORT",
      "REGULATORY",
    ];

    // Highlight section headers with newlines and uppercase
    for (const header of sectionHeaders) {
      const regex = new RegExp(`(SECTION\\s*\\d+\\s*:?\\s*)?${header}`, "gi");
      processed = processed.replace(
        regex,
        `\n\n## ${header.toUpperCase()} ##\n`,
      );
    }

    return processed;
  }

  // ============================================================================
  // Deterministic extraction helpers (used even when AI is unavailable)
  // ============================================================================

  private isValidCAS(cas: string): boolean {
    const m = cas.match(/^(\d{2,7})-(\d{2})-(\d)$/);
    if (!m) return false;
    const digits = `${m[1]}${m[2]}`;
    const checkDigit = Number(m[3]);
    let sum = 0;
    let weight = 1;
    for (let i = digits.length - 1; i >= 0; i--) {
      sum += Number(digits[i]) * weight;
      weight++;
    }
    return sum % 10 === checkDigit;
  }

  private normalizeCAS(raw: string): string | null {
    const cleaned = raw.trim();
    // If it already matches strict CAS format and checksum, accept it.
    if (/^\d{2,7}-\d{2}-\d$/.test(cleaned) && this.isValidCAS(cleaned))
      return cleaned;

    // Tolerate OCR that drops hyphens/spaces: "64175" or "64 17 5" or "64-17 5"
    const compact = cleaned.replace(/[^\d]/g, "");
    // Must be at least 5 digits total (2 + 2 + 1)
    if (compact.length < 5 || compact.length > 10) return null;

    const check = compact.slice(-1);
    const mid = compact.slice(-3, -1);
    const left = compact.slice(0, -3);
    if (left.length < 2 || left.length > 7) return null;

    const formatted = `${left}-${mid}-${check}`;
    return this.isValidCAS(formatted) ? formatted : null;
  }

  private extractCASNumber(text: string): string | undefined {
    // Try the pattern library first
    const fromLibrary =
      parsingPatternLibrary.extract("casNumber", text, "identification") ||
      parsingPatternLibrary.extract("casNumber", text, "anywhere");
    if (fromLibrary) {
      const normalized = this.normalizeCAS(fromLibrary);
      if (normalized) return normalized;
    }

    // OCR-tolerant scan across the document
    const candidates =
      text.match(/\b\d{2,7}[\s-]{0,3}\d{2}[\s-]{0,3}\d\b/g) || [];
    for (const c of candidates) {
      const normalized = this.normalizeCAS(c);
      if (normalized) return normalized;
    }

    // As a last resort, look for "CAS" label with looser separators
    const labeled = text.match(
      /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*([0-9\-\s]{5,15})/i,
    )?.[1];
    if (labeled) {
      const normalized = this.normalizeCAS(labeled);
      if (normalized) return normalized;
    }

    return undefined;
  }

  private extractECNumber(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract("ecNumber", text, "identification") ||
      parsingPatternLibrary.extract("ecNumber", text, "anywhere") ||
      text.match(/\b\d{3}-\d{3}-\d\b/)?.[0];
    return v ? v.trim() : undefined;
  }

  private extractUNNumber(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract("unNumber", text, "transport") ||
      parsingPatternLibrary.extract("unNumber", text, "anywhere") ||
      text.match(/UN\s*(?:No|Number)?\s*:?\s*(\d{4})/i)?.[1];
    return v ? v.trim() : undefined;
  }

  private extractMolecularFormula(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract("molecularFormula", text, "composition") ||
      parsingPatternLibrary.extract("molecularFormula", text, "anywhere");
    return v ? v.trim() : undefined;
  }

  private extractManufacturer(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract("manufacturer", text, "identification") ||
      parsingPatternLibrary.extract("manufacturer", text, "anywhere");
    if (v) return v.trim();

    // Common SDS layouts
    const labeled =
      text.match(
        /(?:Manufacturer|Supplier|Company)\s*:?\s*([^\n\r]{3,80})/i,
      )?.[1] ||
      text.match(/Company\s*Identification\s*:?\s*([^\n\r]{3,80})/i)?.[1];
    return labeled ? labeled.trim() : undefined;
  }

  private extractPH(text: string): string | number | undefined {
    const v =
      parsingPatternLibrary.extract("ph", text, "physical properties") ||
      parsingPatternLibrary.extract("ph", text, "anywhere");
    if (!v) return undefined;
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : v;
  }

  private extractBoilingPoint(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract(
        "boilingPoint",
        text,
        "physical properties",
      ) || parsingPatternLibrary.extract("boilingPoint", text, "anywhere");
    return v ? v.trim() : undefined;
  }

  private extractFlashPoint(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract(
        "flashPoint",
        text,
        "physical properties",
      ) || parsingPatternLibrary.extract("flashPoint", text, "anywhere");
    return v ? v.trim() : undefined;
  }

  private extractDensity(text: string): string | undefined {
    const v =
      parsingPatternLibrary.extract("density", text, "physical properties") ||
      parsingPatternLibrary.extract("density", text, "anywhere");
    return v ? v.trim() : undefined;
  }

  /**
   * Use AI to extract structured data from the preprocessed SDS text
   */
  private async extractDataWithAI(processedText: string): Promise<any> {
    try {
      const analysisPrompt = buildSdsExtractionPrompt(processedText);

      console.log("[sds-parser] Calling AI service for extraction...");
      console.log(
        "[sds-parser] Active provider:",
        aiService.getActiveProvider().name,
      );
      console.log(
        "[sds-parser] Provider available:",
        aiService.getActiveProvider().isAvailable(),
      );

      const result = await aiService.analyzeDocument(analysisPrompt, {
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      console.log("[sds-parser] AI service response:", {
        provider: result.provider,
        hasError: !!result.error,
        analysisType: typeof result.analysis,
        analysisLength:
          typeof result.analysis === "string"
            ? result.analysis.length
            : "object",
      });

      try {
        const parsed =
          typeof result.analysis === "string"
            ? JSON.parse(result.analysis)
            : result.analysis;

        // If using mock provider, the data structure might be different
        if (result.provider?.includes("Mock")) {
          console.warn(
            "[sds-parser] ⚠️ Using Mock AI Provider - API keys not configured!",
          );
          console.warn(
            "[sds-parser] To enable real AI extraction, set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local",
          );
        }

        // Ensure confidence is set
        if (!parsed.confidence) {
          parsed.confidence = result.provider?.includes("Mock") ? 0.1 : 0.5;
        }

        console.log("[sds-parser] Parsed AI result:", {
          chemicalName: parsed.chemicalName,
          casNumber: parsed.casNumber,
          manufacturer: parsed.manufacturer,
          confidence: parsed.confidence,
        });

        return parsed;
      } catch (e) {
        console.error("Error parsing AI response:", e);
        // Return fallback data structure
        return {
          chemicalName: "Unknown Chemical",
          manufacturer: "Unknown",
          hazardStatements: [],
          precautionaryStatements: [],
          firstAid: {},
          physicalProperties: {},
          stabilityReactivity: {},
          confidence: 0.1,
        };
      }
    } catch (error) {
      console.error("Error in AI extraction:", error);
      // Return fallback data structure instead of throwing
      return {
        chemicalName: "Unknown Chemical",
        manufacturer: "Unknown",
        hazardStatements: [],
        precautionaryStatements: [],
        firstAid: {},
        physicalProperties: {},
        stabilityReactivity: {},
        confidence: 0.1,
      };
    }
  }

  /**
   * Extract fields using deterministic patterns (no AI required)
   */
  private extractDeterministicFields(text: string): any {
    const data: any = {
      confidence: 0.3, // Lower confidence for deterministic-only extraction
    };

    // Extract all fields using pattern library and regex
    const casNumber = this.extractCASNumber(text);
    if (casNumber) data.casNumber = casNumber;

    const ecNumber = this.extractECNumber(text);
    if (ecNumber) data.ecNumber = ecNumber;

    const unNumber = this.extractUNNumber(text);
    if (unNumber) data.unNumber = unNumber;

    const molecularFormula = this.extractMolecularFormula(text);
    if (molecularFormula) data.molecularFormula = molecularFormula;

    const manufacturer = this.extractManufacturer(text);
    if (manufacturer) data.manufacturer = manufacturer;

    const ph = this.extractPH(text);
    if (ph !== undefined)
      data.physicalProperties = { ...(data.physicalProperties || {}), ph };

    const boilingPoint = this.extractBoilingPoint(text);
    if (boilingPoint)
      data.physicalProperties = {
        ...(data.physicalProperties || {}),
        boilingPoint,
      };

    const flashPoint = this.extractFlashPoint(text);
    if (flashPoint)
      data.physicalProperties = {
        ...(data.physicalProperties || {}),
        flashPoint,
      };

    const density = this.extractDensity(text);
    if (density)
      data.physicalProperties = { ...(data.physicalProperties || {}), density };

    // Extract GHS codes
    const { hCodes, pCodes } = this.extractGHSCodes(text);
    if (hCodes.length > 0) data.hazardStatements = hCodes;
    if (pCodes.length > 0) data.precautionaryStatements = pCodes;

    // Extract chemical name
    const chemicalName = this.fallbackExtractChemicalName(text);
    if (chemicalName && chemicalName !== "Unknown Chemical")
      data.chemicalName = chemicalName;

    return data;
  }

  /**
   * Post-process and validate the AI-extracted data
   */
  private postprocessData(extractedData: any, originalText: string): SDSData {
    console.log(
      "[sds-parser] Post-processing data, checking CAS extraction...",
    );
    // Extract CAS number using regex fallback if AI didn't extract it
    let casNumber = extractedData.casNumber;
    if (!casNumber) {
      casNumber = this.extractCASNumber(originalText);
    }

    // Extract other identifiers using regex
    const ecNumber = this.extractECNumber(originalText);
    const unNumber = this.extractUNNumber(originalText);
    const molecularFormula =
      extractedData.molecularFormula ||
      this.extractMolecularFormula(originalText);

    // Ensure all required fields are present
    const hazardStatements: string[] = Array.isArray(
      extractedData.hazardStatements,
    )
      ? extractedData.hazardStatements
      : [];
    const precautionaryStatements: string[] = Array.isArray(
      extractedData.precautionaryStatements,
    )
      ? extractedData.precautionaryStatements
      : [];

    // If AI is unavailable/weak, enrich with deterministic GHS code extraction.
    const { hCodes, pCodes } = this.extractGHSCodes(originalText);
    const mergedHazards = [...hazardStatements];
    for (const h of hCodes)
      if (!mergedHazards.includes(h)) mergedHazards.push(h);
    const mergedPrecautions = [...precautionaryStatements];
    for (const p of pCodes)
      if (!mergedPrecautions.includes(p)) mergedPrecautions.push(p);

    // Extract manufacturer with better fallback (don't use 'Unknown' if we can find it)
    const manufacturer =
      extractedData.manufacturer || this.extractManufacturer(originalText);

    const validatedData: SDSData = {
      chemicalName:
        extractedData.chemicalName ||
        this.fallbackExtractChemicalName(originalText),
      manufacturer: manufacturer || undefined, // Don't use 'Unknown' - let UI handle missing (only use undefined if truly not found)
      hazardStatements: mergedHazards,
      precautionaryStatements: mergedPrecautions,
      firstAid: {
        inhalation: extractedData.firstAid?.inhalation || undefined,
        skinContact: extractedData.firstAid?.skinContact || undefined,
        eyeContact: extractedData.firstAid?.eyeContact || undefined,
        ingestion: extractedData.firstAid?.ingestion || undefined,
      },
      physicalProperties: {
        appearance: extractedData.physicalProperties?.appearance || undefined,
        odor: extractedData.physicalProperties?.odor || undefined,
        ph:
          extractedData.physicalProperties?.ph || this.extractPH(originalText),
        boilingPoint:
          extractedData.physicalProperties?.boilingPoint ||
          this.extractBoilingPoint(originalText),
        flashPoint:
          extractedData.physicalProperties?.flashPoint ||
          this.extractFlashPoint(originalText),
        density:
          extractedData.physicalProperties?.density ||
          this.extractDensity(originalText),
        solubility: extractedData.physicalProperties?.solubility || undefined,
      },
      stabilityReactivity: {
        stability: extractedData.stabilityReactivity?.stability || undefined,
        conditionsToAvoid: Array.isArray(
          extractedData.stabilityReactivity?.conditionsToAvoid,
        )
          ? extractedData.stabilityReactivity.conditionsToAvoid
          : undefined,
        incompatibleMaterials: Array.isArray(
          extractedData.stabilityReactivity?.incompatibleMaterials,
        )
          ? extractedData.stabilityReactivity.incompatibleMaterials
          : undefined,
        decompositionProducts: Array.isArray(
          extractedData.stabilityReactivity?.decompositionProducts,
        )
          ? extractedData.stabilityReactivity.decompositionProducts
          : undefined,
      },
      confidence:
        typeof extractedData.confidence === "number"
          ? extractedData.confidence
          : 0.5,
    };

    // Add optional fields if present
    if (casNumber) {
      validatedData.casNumber = casNumber;
    }

    if (extractedData.productCode) {
      validatedData.productCode = extractedData.productCode;
    }

    // Add extracted identifiers to a custom field (we'll extend the interface)
    if (ecNumber || unNumber || molecularFormula) {
      (validatedData as any).identifiers = {
        ecNumber,
        unNumber,
        molecularFormula,
      };
    }

    // Add transport information if extracted
    if (extractedData.transportInformation) {
      (validatedData as any).transportClass =
        extractedData.transportInformation.transportClass;
      (validatedData as any).packingGroup =
        extractedData.transportInformation.packingGroup;
      (validatedData as any).packagingType =
        extractedData.transportInformation.packagingType;
    }

    // Add NFPA ratings if extracted
    if (extractedData.nfpa) {
      (validatedData as any).nfpa = extractedData.nfpa;
      (validatedData as any).healthRating =
        extractedData.nfpa.health?.toString() || "0";
      (validatedData as any).flammabilityRating =
        extractedData.nfpa.flammability?.toString() || "0";
      (validatedData as any).reactivityRating =
        extractedData.nfpa.reactivity?.toString() || "0";
    }

    // Add hazard class if extracted
    if (extractedData.hazardClass) {
      (validatedData as any).hazardClass = extractedData.hazardClass;
    }

    if (Array.isArray(extractedData.fireExtinguishingMedia)) {
      validatedData.fireExtinguishingMedia =
        extractedData.fireExtinguishingMedia;
    }

    if (Array.isArray(extractedData.storageRequirements)) {
      validatedData.storageRequirements = extractedData.storageRequirements;
    }

    if (Array.isArray(extractedData.regulatoryInformation)) {
      validatedData.regulatoryInformation = extractedData.regulatoryInformation;
    }

    if (extractedData.disposalConsiderations) {
      validatedData.disposalConsiderations =
        extractedData.disposalConsiderations;
    }

    return validatedData;
  }

  /**
   * Fallback method to extract chemical name from text if AI fails
   */
  private fallbackExtractChemicalName(text: string): string {
    // Look for patterns like "Product Name:" or "Chemical Name:"
    const nameMatch = text.match(
      /(product|chemical|substance|material)\s+name\s*:?\s*([^\n\r.]+)/i,
    );
    if (nameMatch && nameMatch[2]) {
      return nameMatch[2].trim();
    }

    // Try to find title-like content at the beginning
    const firstLines = text.split("\n").slice(0, 5).join(" ");
    const titleMatch = firstLines.match(/^([A-Z][A-Za-z0-9\s]{2,30})/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    return "Unknown Chemical";
  }

  /**
   * Extract specific GHS hazard codes from raw text
   */
  extractGHSCodes(text: string): { hCodes: string[]; pCodes: string[] } {
    const hCodes: string[] = [];
    const pCodes: string[] = [];

    // Find H-codes (Hazard statements)
    const hMatches = text.match(/H\d{3}[A-Za-z]*/g) || [];
    hMatches.forEach((code) => {
      if (!hCodes.includes(code)) {
        hCodes.push(code);
      }
    });

    // Find P-codes (Precautionary statements)
    const pMatches = text.match(/P\d{3}[A-Za-z]*/g) || [];
    pMatches.forEach((code) => {
      if (!pCodes.includes(code)) {
        pCodes.push(code);
      }
    });

    return { hCodes, pCodes };
  }

  /**
   * Enhanced SDS parsing with section detection
   * Parses specific sections of the SDS document
   */
  async parseSDSWithSections(
    rawText: string,
  ): Promise<SDSData & { sections: Record<string, string> }> {
    // First get the basic SDS data
    const basicData = await this.parseSDS(rawText);

    // Attempt to extract each section separately
    const sections: Record<string, string> = {};

    // Common SDS section titles with variations
    const sectionPatterns = [
      {
        name: "identification",
        pattern:
          /(?:SECTION\s*1[\.:])?\s*(?:PRODUCT(?:\s*AND\s*COMPANY)?\s*IDENTIFICATION|IDENTIFICATION)/i,
      },
      {
        name: "hazards",
        pattern: /(?:SECTION\s*2[\.:])?\s*(?:HAZARDS?\s*IDENTIFICATION)/i,
      },
      {
        name: "composition",
        pattern:
          /(?:SECTION\s*3[\.:])?\s*(?:COMPOSITION|INFORMATION\s*ON\s*INGREDIENTS)/i,
      },
      {
        name: "firstAid",
        pattern: /(?:SECTION\s*4[\.:])?\s*(?:FIRST[\-\s]*AID\s*MEASURES)/i,
      },
      {
        name: "firefighting",
        pattern: /(?:SECTION\s*5[\.:])?\s*(?:FIRE[\-\s]*FIGHTING\s*MEASURES)/i,
      },
      {
        name: "accidentalRelease",
        pattern: /(?:SECTION\s*6[\.:])?\s*(?:ACCIDENTAL\s*RELEASE\s*MEASURES)/i,
      },
      {
        name: "handling",
        pattern: /(?:SECTION\s*7[\.:])?\s*(?:HANDLING\s*AND\s*STORAGE)/i,
      },
      {
        name: "exposureControls",
        pattern:
          /(?:SECTION\s*8[\.:])?\s*(?:EXPOSURE\s*CONTROLS?|PERSONAL\s*PROTECTION)/i,
      },
      {
        name: "physicalProperties",
        pattern:
          /(?:SECTION\s*9[\.:])?\s*(?:PHYSICAL\s*AND\s*CHEMICAL\s*PROPERTIES)/i,
      },
      {
        name: "stability",
        pattern: /(?:SECTION\s*10[\.:])?\s*(?:STABILITY\s*AND\s*REACTIVITY)/i,
      },
      {
        name: "toxicological",
        pattern: /(?:SECTION\s*11[\.:])?\s*(?:TOXICOLOGICAL\s*INFORMATION)/i,
      },
      {
        name: "ecological",
        pattern: /(?:SECTION\s*12[\.:])?\s*(?:ECOLOGICAL\s*INFORMATION)/i,
      },
      {
        name: "disposal",
        pattern: /(?:SECTION\s*13[\.:])?\s*(?:DISPOSAL\s*CONSIDERATIONS)/i,
      },
      {
        name: "transport",
        pattern: /(?:SECTION\s*14[\.:])?\s*(?:TRANSPORT\s*INFORMATION)/i,
      },
      {
        name: "regulatory",
        pattern: /(?:SECTION\s*15[\.:])?\s*(?:REGULATORY\s*INFORMATION)/i,
      },
      {
        name: "other",
        pattern: /(?:SECTION\s*16[\.:])?\s*(?:OTHER\s*INFORMATION)/i,
      },
    ];

    // Split the text into sections
    const lines = rawText.split("\n");
    let currentSection = "";
    let currentContent: string[] = [];

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line matches any section header
      let matchedSection = "";
      for (const { name, pattern } of sectionPatterns) {
        if (pattern.test(line)) {
          matchedSection = name;
          break;
        }
      }

      if (matchedSection) {
        // Save current section content before starting new one
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n");
        }

        // Start new section
        currentSection = matchedSection;
        currentContent = [line];
      } else if (currentSection) {
        // Add to current section
        currentContent.push(line);
      }
    }

    // Add the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n");
    }

    // Extract GHS codes
    const { hCodes, pCodes } = this.extractGHSCodes(rawText);
    if (
      hCodes.length > 0 &&
      !basicData.hazardStatements.some((s) => /H\d{3}/.test(s))
    ) {
      basicData.hazardStatements = [...basicData.hazardStatements, ...hCodes];
    }

    if (
      pCodes.length > 0 &&
      !basicData.precautionaryStatements.some((s) => /P\d{3}/.test(s))
    ) {
      basicData.precautionaryStatements = [
        ...basicData.precautionaryStatements,
        ...pCodes,
      ];
    }

    return {
      ...basicData,
      sections,
    };
  }

  /**
   * Compare two SDSs and generate a report of significant differences
   */
  async compareSDSDocuments(
    sds1: SDSData,
    sds2: SDSData,
  ): Promise<{
    isDifferent: boolean;
    differences: string[];
    summary: string;
  }> {
    const differences: string[] = [];

    // Compare chemical names
    if (sds1.chemicalName !== sds2.chemicalName) {
      differences.push(
        `Chemical name different: "${sds1.chemicalName}" vs "${sds2.chemicalName}"`,
      );
    }

    // Compare CAS numbers
    if (sds1.casNumber !== sds2.casNumber && sds1.casNumber && sds2.casNumber) {
      differences.push(
        `CAS number different: "${sds1.casNumber}" vs "${sds2.casNumber}"`,
      );
    }

    // Compare hazard statements
    const uniqueHazards1 = sds1.hazardStatements.filter(
      (h) => !sds2.hazardStatements.includes(h),
    );
    const uniqueHazards2 = sds2.hazardStatements.filter(
      (h) => !sds1.hazardStatements.includes(h),
    );

    if (uniqueHazards1.length > 0) {
      differences.push(
        `Hazards only in first SDS: ${uniqueHazards1.join(", ")}`,
      );
    }

    if (uniqueHazards2.length > 0) {
      differences.push(
        `Hazards only in second SDS: ${uniqueHazards2.join(", ")}`,
      );
    }

    // Compare precautionary statements
    const uniquePrecautions1 = sds1.precautionaryStatements.filter(
      (p) => !sds2.precautionaryStatements.includes(p),
    );
    const uniquePrecautions2 = sds2.precautionaryStatements.filter(
      (p) => !sds1.precautionaryStatements.includes(p),
    );

    if (uniquePrecautions1.length > 0) {
      differences.push(
        `Precautions only in first SDS: ${uniquePrecautions1.join(", ")}`,
      );
    }

    if (uniquePrecautions2.length > 0) {
      differences.push(
        `Precautions only in second SDS: ${uniquePrecautions2.join(", ")}`,
      );
    }

    // Compare physical properties with tolerance for slight variations
    for (const prop of ["flashPoint", "boilingPoint", "ph"] as const) {
      const val1 = sds1.physicalProperties[prop];
      const val2 = sds2.physicalProperties[prop];

      if (val1 && val2 && val1 !== val2) {
        differences.push(`${prop} different: "${val1}" vs "${val2}"`);
      }
    }

    // Compare stability/reactivity incompatible materials
    if (
      sds1.stabilityReactivity.incompatibleMaterials &&
      sds2.stabilityReactivity.incompatibleMaterials
    ) {
      const uniqueIncompat1 =
        sds1.stabilityReactivity.incompatibleMaterials.filter(
          (m) => !sds2.stabilityReactivity.incompatibleMaterials?.includes(m),
        );

      const uniqueIncompat2 =
        sds2.stabilityReactivity.incompatibleMaterials.filter(
          (m) => !sds1.stabilityReactivity.incompatibleMaterials?.includes(m),
        );

      if (uniqueIncompat1.length > 0) {
        differences.push(
          `Incompatible materials only in first SDS: ${uniqueIncompat1.join(", ")}`,
        );
      }

      if (uniqueIncompat2.length > 0) {
        differences.push(
          `Incompatible materials only in second SDS: ${uniqueIncompat2.join(", ")}`,
        );
      }
    }

    // Generate a summary
    let summary = "No significant differences detected between SDS documents.";
    if (differences.length > 0) {
      summary = `${differences.length} significant difference(s) detected between SDS documents.`;

      // Check for critical safety differences
      const criticalDifferences = differences.filter(
        (d) =>
          d.includes("Hazards") ||
          d.includes("CAS number") ||
          d.includes("incompatible") ||
          d.includes("flash"),
      );

      if (criticalDifferences.length > 0) {
        summary += ` WARNING: ${criticalDifferences.length} critical safety difference(s) identified.`;
      }
    }

    return {
      isDifferent: differences.length > 0,
      differences,
      summary,
    };
  }
}

// Export singleton instance
export const sdsParserService = new SDSParserService();
