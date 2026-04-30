/**
 * SDS Aggregator Service
 * Aggregate SDS data from multiple external sources
 */

import { ChemwatchService, ChemwatchSDS } from "./chemwatchService";
import { msdsService } from "@/lib/services/chemical/msdsService";

export interface AggregatedSDS {
  casNumber?: string;
  productName: string;
  sources: Array<{
    source: string;
    sds: any;
    confidence: number;
    fetchedAt: Date;
  }>;
  bestMatch?: {
    source: string;
    sds: any;
    confidence: number;
    reason: string;
  };
  recommendations: string[];
}

export class SDSAggregator {
  private chemwatch: ChemwatchService;

  constructor() {
    this.chemwatch = new ChemwatchService();
  }

  /**
   * Aggregate SDS from all available sources
   */
  async aggregateSDS(
    casNumber?: string,
    productName?: string,
  ): Promise<AggregatedSDS> {
    const sources: AggregatedSDS["sources"] = [];
    const recommendations: string[] = [];

    // Search Chemwatch
    if (casNumber) {
      const chemwatchResults = await this.chemwatch.searchByCAS(casNumber);
      chemwatchResults.forEach((sds) => {
        sources.push({
          source: "chemwatch",
          sds,
          confidence: sds.metadata.confidence,
          fetchedAt: sds.metadata.fetchedAt,
        });
      });
    } else if (productName) {
      const chemwatchResults = await this.chemwatch.searchByName(productName);
      chemwatchResults.forEach((sds) => {
        sources.push({
          source: "chemwatch",
          sds,
          confidence: sds.metadata.confidence,
          fetchedAt: sds.metadata.fetchedAt,
        });
      });
    }

    // Get internal MSDS if available
    if (casNumber) {
      try {
        const internalMSDS = await msdsService.getMSDSByCAS(casNumber);
        if (internalMSDS) {
          sources.push({
            source: "internal",
            sds: internalMSDS,
            confidence: 100,
            fetchedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error fetching internal MSDS:", error);
      }
    }

    // Determine best match
    const bestMatch = this.selectBestMatch(sources);

    // Generate recommendations
    if (sources.length === 0) {
      recommendations.push(
        "No SDS found in external databases. Consider manual upload.",
      );
    } else if (sources.length === 1) {
      recommendations.push("Single source found. Verify data accuracy.");
    } else {
      recommendations.push(
        "Multiple sources found. Compare and verify consistency.",
      );
    }

    if (bestMatch && bestMatch.confidence < 80) {
      recommendations.push("Low confidence match. Manual review recommended.");
    }

    return {
      casNumber,
      productName: productName || bestMatch?.sds.productName || "Unknown",
      sources,
      bestMatch,
      recommendations,
    };
  }

  /**
   * Select best match from aggregated sources
   */
  private selectBestMatch(
    sources: AggregatedSDS["sources"],
  ): AggregatedSDS["bestMatch"] | undefined {
    if (sources.length === 0) return undefined;

    // Prefer internal source if available
    const internalSource = sources.find((s) => s.source === "internal");
    if (internalSource) {
      return {
        source: "internal",
        sds: internalSource.sds,
        confidence: internalSource.confidence,
        reason: "Internal database - most trusted source",
      };
    }

    // Select highest confidence external source
    const sorted = [...sources].sort((a, b) => b.confidence - a.confidence);
    const best = sorted[0];

    return {
      source: best.source,
      sds: best.sds,
      confidence: best.confidence,
      reason: `Highest confidence match from ${best.source}`,
    };
  }

  /**
   * Compare SDS from multiple sources
   */
  async compareSources(casNumber: string): Promise<{
    sources: string[];
    differences: Record<string, any>;
    consistency: number;
  }> {
    const aggregated = await this.aggregateSDS(casNumber);

    if (aggregated.sources.length < 2) {
      return {
        sources: aggregated.sources.map((s) => s.source),
        differences: {},
        consistency: 100,
      };
    }

    // Compare all sources
    const differences: Record<string, any> = {};
    let matchingFields = 0;
    let totalFields = 0;

    const baseSDS = aggregated.sources[0].sds;
    aggregated.sources.slice(1).forEach((source) => {
      const fieldsToCompare = [
        "productName",
        "casNumber",
        "hazards",
        "storage",
      ];

      fieldsToCompare.forEach((field) => {
        totalFields++;
        const baseValue = baseSDS.extractedData?.[field] || baseSDS[field];
        const sourceValue =
          source.sds.extractedData?.[field] || source.sds[field];

        if (JSON.stringify(baseValue) !== JSON.stringify(sourceValue)) {
          if (!differences[field]) {
            differences[field] = [];
          }
          differences[field].push({
            source: source.source,
            value: sourceValue,
          });
        } else {
          matchingFields++;
        }
      });
    });

    const consistency = (matchingFields / totalFields) * 100;

    return {
      sources: aggregated.sources.map((s) => s.source),
      differences,
      consistency,
    };
  }
}

export const sdsAggregator = new SDSAggregator();
