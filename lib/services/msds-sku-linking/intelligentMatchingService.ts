/**
 * Intelligent Matching Service
 * Multi-strategy matching between MSDS and SKUs
 * Uses AI/ML, historical data, and semantic matching
 */

import { MSDSDocument, ExtractedMSDSData } from "@/types/chemical";
import { SKU } from "@/types/sku";
import {
  MatchingStrategy,
  MatchingEvidence,
  MatchedField,
  AIAnalysis,
  HistoricalLink,
  MSDSSKULink,
} from "@/types/msdsSkuLinking";

export interface MatchingResult {
  matches: MatchCandidate[];
  suggestions: MatchCandidate[];
  warnings: string[];
}

export interface MatchCandidate {
  msdsId: string;
  skuId: string;
  strategy: MatchingStrategy;
  confidenceScore: number;
  evidence: MatchingEvidence;
  matchedFields: MatchedField[];
}

export class IntelligentMatchingService {
  /**
   * Find potential matches for an MSDS
   */
  async findMatchesForMSDS(
    msds: MSDSDocument,
    skus: SKU[],
    customerId?: string,
  ): Promise<MatchingResult> {
    const matches: MatchCandidate[] = [];
    const suggestions: MatchCandidate[] = [];
    const warnings: string[] = [];

    try {
      // Strategy 1: CAS Number Match (Highest confidence)
      const casMatches = this.matchByCASNumber(msds, skus);
      matches.push(...casMatches.filter((m) => m.confidenceScore >= 90));
      suggestions.push(
        ...casMatches.filter(
          (m) => m.confidenceScore >= 70 && m.confidenceScore < 90,
        ),
      );

      // Strategy 2: Product Name Match
      const nameMatches = this.matchByProductName(msds, skus);
      matches.push(...nameMatches.filter((m) => m.confidenceScore >= 85));
      suggestions.push(
        ...nameMatches.filter(
          (m) => m.confidenceScore >= 60 && m.confidenceScore < 85,
        ),
      );

      // Strategy 3: UN Number Match
      const unMatches = this.matchByUNNumber(msds, skus);
      matches.push(...unMatches.filter((m) => m.confidenceScore >= 80));
      suggestions.push(
        ...unMatches.filter(
          (m) => m.confidenceScore >= 60 && m.confidenceScore < 80,
        ),
      );

      // Strategy 4: Chemical Formula Match
      const formulaMatches = this.matchByFormula(msds, skus);
      matches.push(...formulaMatches.filter((m) => m.confidenceScore >= 75));
      suggestions.push(
        ...formulaMatches.filter(
          (m) => m.confidenceScore >= 50 && m.confidenceScore < 75,
        ),
      );

      // Strategy 5: Manufacturer Match
      const manufacturerMatches = this.matchByManufacturer(msds, skus);
      suggestions.push(
        ...manufacturerMatches.filter((m) => m.confidenceScore >= 50),
      );

      // Strategy 6: Category Match (Lower confidence, but useful)
      const categoryMatches = this.matchByCategory(msds, skus);
      suggestions.push(
        ...categoryMatches.filter((m) => m.confidenceScore >= 40),
      );

      // Strategy 7: Semantic/AI Match (if available)
      try {
        const aiMatches = await this.matchByAI(msds, skus);
        matches.push(...aiMatches.filter((m) => m.confidenceScore >= 70));
        suggestions.push(
          ...aiMatches.filter(
            (m) => m.confidenceScore >= 50 && m.confidenceScore < 70,
          ),
        );
      } catch (error) {
        warnings.push(
          "AI matching unavailable, using rule-based matching only",
        );
      }

      // Deduplicate matches
      const uniqueMatches = this.deduplicateMatches(matches);
      const uniqueSuggestions = this.deduplicateMatches(suggestions);

      // Sort by confidence
      uniqueMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);
      uniqueSuggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

      return {
        matches: uniqueMatches,
        suggestions: uniqueSuggestions,
        warnings,
      };
    } catch (error) {
      console.error("Error in intelligent matching:", error);
      throw new Error(
        `Matching failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Match by CAS Number (Exact match - highest confidence)
   */
  private matchByCASNumber(msds: MSDSDocument, skus: SKU[]): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsCAS = msds.extractedData?.casNumber;

    if (!msdsCAS) return matches;

    for (const sku of skus) {
      // Check if SKU has CAS number in description or metadata
      const skuCAS = this.extractCASFromSKU(sku);

      if (skuCAS && this.normalizeCAS(msdsCAS) === this.normalizeCAS(skuCAS)) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "CAS_NUMBER",
          confidenceScore: 95,
          evidence: {
            strategy: "CAS_NUMBER",
            confidenceScore: 95,
            matchedFields: [
              {
                field: "casNumber",
                msdsValue: msdsCAS,
                skuValue: skuCAS,
                matchType: "EXACT",
                confidence: 95,
              },
            ],
            similarityScores: { casNumber: 1.0 },
          },
          matchedFields: [
            {
              field: "casNumber",
              msdsValue: msdsCAS,
              skuValue: skuCAS,
              matchType: "EXACT",
              confidence: 95,
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by Product Name (Fuzzy matching)
   */
  private matchByProductName(
    msds: MSDSDocument,
    skus: SKU[],
  ): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsName = msds.chemicalName?.toLowerCase().trim();

    if (!msdsName) return matches;

    for (const sku of skus) {
      const skuName = sku.materialDescription?.toLowerCase().trim();
      if (!skuName) continue;

      const similarity = this.calculateStringSimilarity(msdsName, skuName);

      if (similarity >= 0.6) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "PRODUCT_NAME",
          confidenceScore: Math.round(similarity * 100),
          evidence: {
            strategy: "PRODUCT_NAME",
            confidenceScore: Math.round(similarity * 100),
            matchedFields: [
              {
                field: "productName",
                msdsValue: msds.chemicalName,
                skuValue: sku.materialDescription,
                matchType:
                  similarity >= 0.9
                    ? "EXACT"
                    : similarity >= 0.7
                      ? "FUZZY"
                      : "PARTIAL",
                confidence: Math.round(similarity * 100),
              },
            ],
            similarityScores: { productName: similarity },
          },
          matchedFields: [
            {
              field: "productName",
              msdsValue: msds.chemicalName,
              skuValue: sku.materialDescription,
              matchType:
                similarity >= 0.9
                  ? "EXACT"
                  : similarity >= 0.7
                    ? "FUZZY"
                    : "PARTIAL",
              confidence: Math.round(similarity * 100),
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by UN Number
   */
  private matchByUNNumber(msds: MSDSDocument, skus: SKU[]): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsUN = msds.extractedData?.unNumber;

    if (!msdsUN) return matches;

    for (const sku of skus) {
      if (
        sku.unNumber &&
        this.normalizeUN(msdsUN) === this.normalizeUN(sku.unNumber)
      ) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "UN_NUMBER",
          confidenceScore: 85,
          evidence: {
            strategy: "UN_NUMBER",
            confidenceScore: 85,
            matchedFields: [
              {
                field: "unNumber",
                msdsValue: msdsUN,
                skuValue: sku.unNumber,
                matchType: "EXACT",
                confidence: 85,
              },
            ],
            similarityScores: { unNumber: 1.0 },
          },
          matchedFields: [
            {
              field: "unNumber",
              msdsValue: msdsUN,
              skuValue: sku.unNumber,
              matchType: "EXACT",
              confidence: 85,
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by Chemical Formula
   */
  private matchByFormula(msds: MSDSDocument, skus: SKU[]): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsFormula =
      msds.extractedData?.formula || msds.extractedData?.molecularFormula;

    if (!msdsFormula) return matches;

    for (const sku of skus) {
      // Check if formula is in SKU description or specifications
      const skuFormula = this.extractFormulaFromSKU(sku);

      if (
        skuFormula &&
        this.normalizeFormula(msdsFormula) === this.normalizeFormula(skuFormula)
      ) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "CHEMICAL_FORMULA",
          confidenceScore: 80,
          evidence: {
            strategy: "CHEMICAL_FORMULA",
            confidenceScore: 80,
            matchedFields: [
              {
                field: "formula",
                msdsValue: msdsFormula,
                skuValue: skuFormula,
                matchType: "EXACT",
                confidence: 80,
              },
            ],
            similarityScores: { formula: 1.0 },
          },
          matchedFields: [
            {
              field: "formula",
              msdsValue: msdsFormula,
              skuValue: skuFormula,
              matchType: "EXACT",
              confidence: 80,
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by Manufacturer
   */
  private matchByManufacturer(
    msds: MSDSDocument,
    skus: SKU[],
  ): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsManufacturer = msds.manufacturer?.toLowerCase().trim();

    if (!msdsManufacturer) return matches;

    for (const sku of skus) {
      const skuManufacturer = sku.manufacturer?.toLowerCase().trim();
      if (!skuManufacturer) continue;

      const similarity = this.calculateStringSimilarity(
        msdsManufacturer,
        skuManufacturer,
      );

      if (similarity >= 0.7) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "MANUFACTURER",
          confidenceScore: Math.round(similarity * 60), // Lower base confidence
          evidence: {
            strategy: "MANUFACTURER",
            confidenceScore: Math.round(similarity * 60),
            matchedFields: [
              {
                field: "manufacturer",
                msdsValue: msds.manufacturer,
                skuValue: sku.manufacturer,
                matchType: similarity >= 0.9 ? "EXACT" : "FUZZY",
                confidence: Math.round(similarity * 60),
              },
            ],
            similarityScores: { manufacturer: similarity },
          },
          matchedFields: [
            {
              field: "manufacturer",
              msdsValue: msds.manufacturer,
              skuValue: sku.manufacturer,
              matchType: similarity >= 0.9 ? "EXACT" : "FUZZY",
              confidence: Math.round(similarity * 60),
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by Category
   */
  private matchByCategory(msds: MSDSDocument, skus: SKU[]): MatchCandidate[] {
    const matches: MatchCandidate[] = [];
    const msdsCategory = msds.extractedData?.hazardClass?.toLowerCase().trim();

    if (!msdsCategory) return matches;

    for (const sku of skus) {
      const skuCategory = sku.category?.toLowerCase().trim();
      if (!skuCategory) continue;

      const similarity = this.calculateStringSimilarity(
        msdsCategory,
        skuCategory,
      );

      if (similarity >= 0.6) {
        matches.push({
          msdsId: msds.id,
          skuId: sku.id,
          strategy: "CATEGORY",
          confidenceScore: Math.round(similarity * 40), // Lower confidence
          evidence: {
            strategy: "CATEGORY",
            confidenceScore: Math.round(similarity * 40),
            matchedFields: [
              {
                field: "category",
                msdsValue: msdsCategory,
                skuValue: skuCategory,
                matchType: "PARTIAL",
                confidence: Math.round(similarity * 40),
              },
            ],
            similarityScores: { category: similarity },
          },
          matchedFields: [
            {
              field: "category",
              msdsValue: msdsCategory,
              skuValue: skuCategory,
              matchType: "PARTIAL",
              confidence: Math.round(similarity * 40),
            },
          ],
        });
      }
    }

    return matches;
  }

  /**
   * Match by AI/ML Model (if available)
   */
  private async matchByAI(
    msds: MSDSDocument,
    skus: SKU[],
  ): Promise<MatchCandidate[]> {
    const candidates: MatchCandidate[] = [];

    try {
      // Import AI service dynamically
      const { callAI } = await import("@/utils/aiClient");

      // Prepare MSDS summary for AI analysis
      const msdsSummary = {
        productName: msds.productName,
        manufacturer: msds.manufacturer,
        casNumbers: msds.extractedData?.casNumbers || [],
        chemicalName: msds.extractedData?.chemicalName,
        hazardClassification:
          msds.extractedData?.ghsClassification?.hazardClass,
      };

      // Prepare SKU summaries
      const skuSummaries = skus.slice(0, 20).map((sku) => ({
        id: sku.id,
        name: sku.name,
        description: sku.description?.substring(0, 100),
        category: sku.category,
      }));

      // Call AI for intelligent matching
      const response = await callAI({
        prompt: `Analyze this MSDS and find the best matching SKUs.

MSDS:
${JSON.stringify(msdsSummary, null, 2)}

Available SKUs:
${JSON.stringify(skuSummaries, null, 2)}

Return a JSON array of matches with format: [{ "skuId": "...", "confidence": 0-100, "reason": "..." }]
Only include matches with confidence > 50.`,
        systemPrompt: `You are a chemical product matching expert. Match Material Safety Data Sheets (MSDS) to Stock Keeping Units (SKUs) based on product names, chemical names, CAS numbers, and descriptions. Be precise and only suggest matches you're confident about.`,
        model: "gpt-4",
        temperature: 0.3,
      });

      // Parse AI response
      try {
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const matches = JSON.parse(jsonMatch[0]);

          for (const match of matches) {
            const sku = skus.find((s) => s.id === match.skuId);
            if (sku && match.confidence > 50) {
              candidates.push({
                msdsId: msds.id,
                skuId: match.skuId,
                strategy: "AI",
                confidenceScore: match.confidence,
                evidence: {
                  casNumberMatch: false,
                  productNameMatch: match.reason?.includes("name") || false,
                  manufacturerMatch:
                    match.reason?.includes("manufacturer") || false,
                  chemicalCompositionMatch:
                    match.reason?.includes("chemical") || false,
                  historicalLinkMatch: false,
                  aiAnalysis: {
                    similarity: match.confidence / 100,
                    suggestedMatch: true,
                    confidence: match.confidence / 100,
                    reasoning: match.reason,
                  },
                },
                matchedFields: [
                  {
                    fieldName: "AI Analysis",
                    msdsValue: msds.productName,
                    skuValue: sku.name,
                    matchType: "AI",
                    confidence: match.confidence / 100,
                  },
                ],
              });
            }
          }
        }
      } catch (parseError) {
        console.warn(
          "[IntelligentMatchingService] Failed to parse AI response:",
          parseError,
        );
      }
    } catch (error) {
      console.warn(
        "[IntelligentMatchingService] AI matching not available:",
        error,
      );
      // Return empty array if AI is not available
    }

    return candidates;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalize CAS number
   */
  private normalizeCAS(cas: string): string {
    return cas.replace(/[-\s]/g, "").trim();
  }

  /**
   * Normalize UN number
   */
  private normalizeUN(un: string): string {
    return un.replace(/UN\s*/i, "").trim();
  }

  /**
   * Normalize chemical formula
   */
  private normalizeFormula(formula: string): string {
    return formula.replace(/\s+/g, "").toUpperCase();
  }

  /**
   * Extract CAS number from SKU
   */
  private extractCASFromSKU(sku: SKU): string | null {
    // Check in description
    const casMatch = sku.materialDescription?.match(/\b\d{2,7}-\d{2}-\d\b/);
    if (casMatch) return casMatch[0];

    // Check in specifications
    if (sku.specifications) {
      const specCAS = (sku.specifications as any).casNumber;
      if (specCAS) return specCAS;
    }

    return null;
  }

  /**
   * Extract formula from SKU
   */
  private extractFormulaFromSKU(sku: SKU): string | null {
    // Check in description for common chemical formulas
    const formulaPattern = /[A-Z][a-z]?\d*([A-Z][a-z]?\d*)*/g;
    const match = sku.materialDescription?.match(formulaPattern);
    if (match && match[0].length > 2) return match[0];

    // Check in specifications
    if (sku.specifications) {
      const specFormula =
        (sku.specifications as any).formula ||
        (sku.specifications as any).molecularFormula;
      if (specFormula) return specFormula;
    }

    return null;
  }

  /**
   * Deduplicate matches
   */
  private deduplicateMatches(matches: MatchCandidate[]): MatchCandidate[] {
    const seen = new Set<string>();
    const unique: MatchCandidate[] = [];

    for (const match of matches) {
      const key = `${match.msdsId}-${match.skuId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      }
    }

    return unique;
  }
}

export const intelligentMatchingService = new IntelligentMatchingService();
