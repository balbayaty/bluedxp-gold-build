/**
 * Chemwatch API Integration Service
 * External SDS database integration for comprehensive chemical data
 */

export interface ChemwatchSDS {
  id: string;
  casNumber?: string;
  productName: string;
  supplier?: string;
  version?: string;
  revisionDate?: Date;
  fileUrl?: string;
  extractedData?: any;
  metadata: {
    source: "chemwatch";
    fetchedAt: Date;
    confidence: number;
  };
}

export interface ChemwatchConfig {
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ChemwatchService {
  private config: ChemwatchConfig;

  constructor(config?: ChemwatchConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.CHEMWATCH_API_KEY,
      apiUrl: config?.apiUrl || "https://api.chemwatch.net",
      timeout: config?.timeout || 30000,
      retries: config?.retries || 3,
    };
  }

  /**
   * Search for SDS by CAS number
   */
  async searchByCAS(casNumber: string): Promise<ChemwatchSDS[]> {
    if (!this.config.apiKey) {
      console.warn("Chemwatch API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/sds/search?cas=${encodeURIComponent(casNumber)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout!),
        },
      );

      if (!response.ok) {
        throw new Error(`Chemwatch API error: ${response.statusText}`);
      }

      const data = await response.json();

      return (data.results || []).map((item: any) => ({
        id:
          item.id ||
          `chemwatch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        casNumber: item.casNumber || casNumber,
        productName: item.productName || item.name || "Unknown",
        supplier: item.supplier,
        version: item.version,
        revisionDate: item.revisionDate
          ? new Date(item.revisionDate)
          : undefined,
        fileUrl: item.fileUrl || item.url,
        extractedData: item.extractedData,
        metadata: {
          source: "chemwatch",
          fetchedAt: new Date(),
          confidence: item.confidence || 85,
        },
      }));
    } catch (error: any) {
      console.error("Chemwatch search error:", error);
      return [];
    }
  }

  /**
   * Search for SDS by product name
   */
  async searchByName(productName: string): Promise<ChemwatchSDS[]> {
    if (!this.config.apiKey) {
      console.warn("Chemwatch API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/sds/search?name=${encodeURIComponent(productName)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout!),
        },
      );

      if (!response.ok) {
        throw new Error(`Chemwatch API error: ${response.statusText}`);
      }

      const data = await response.json();

      return (data.results || []).map((item: any) => ({
        id:
          item.id ||
          `chemwatch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        casNumber: item.casNumber,
        productName: item.productName || item.name || productName,
        supplier: item.supplier,
        version: item.version,
        revisionDate: item.revisionDate
          ? new Date(item.revisionDate)
          : undefined,
        fileUrl: item.fileUrl || item.url,
        extractedData: item.extractedData,
        metadata: {
          source: "chemwatch",
          fetchedAt: new Date(),
          confidence: item.confidence || 80,
        },
      }));
    } catch (error: any) {
      console.error("Chemwatch search error:", error);
      return [];
    }
  }

  /**
   * Fetch full SDS document
   */
  async fetchSDS(sdsId: string): Promise<ChemwatchSDS | null> {
    if (!this.config.apiKey) {
      console.warn("Chemwatch API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/sds/${encodeURIComponent(sdsId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout!),
        },
      );

      if (!response.ok) {
        throw new Error(`Chemwatch API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id || sdsId,
        casNumber: data.casNumber,
        productName: data.productName || data.name || "Unknown",
        supplier: data.supplier,
        version: data.version,
        revisionDate: data.revisionDate
          ? new Date(data.revisionDate)
          : undefined,
        fileUrl: data.fileUrl || data.url,
        extractedData: data.extractedData || data,
        metadata: {
          source: "chemwatch",
          fetchedAt: new Date(),
          confidence: data.confidence || 90,
        },
      };
    } catch (error: any) {
      console.error("Chemwatch fetch error:", error);
      return null;
    }
  }

  /**
   * Compare SDS with internal version
   */
  async compareSDS(
    externalSDS: ChemwatchSDS,
    internalSDS: any,
  ): Promise<{
    differences: Array<{
      field: string;
      external: any;
      internal: any;
    }>;
    similarity: number;
    recommendations: string[];
  }> {
    const differences: Array<{ field: string; external: any; internal: any }> =
      [];
    let matchingFields = 0;
    let totalFields = 0;

    // Compare key fields
    const fieldsToCompare = [
      "productName",
      "casNumber",
      "hazards",
      "storage",
      "transport",
      "compliance",
    ];

    fieldsToCompare.forEach((field) => {
      totalFields++;
      const externalValue = externalSDS.extractedData?.[field];
      const internalValue = internalSDS[field];

      if (JSON.stringify(externalValue) !== JSON.stringify(internalValue)) {
        differences.push({
          field,
          external: externalValue,
          internal: internalValue,
        });
      } else {
        matchingFields++;
      }
    });

    const similarity = (matchingFields / totalFields) * 100;

    const recommendations: string[] = [];
    if (similarity < 80) {
      recommendations.push(
        "Significant differences detected. Review external SDS for updates.",
      );
    }
    if (differences.some((d) => d.field === "hazards")) {
      recommendations.push(
        "Hazard information differs. Verify with latest regulatory data.",
      );
    }
    if (differences.some((d) => d.field === "compliance")) {
      recommendations.push(
        "Compliance status differs. Check regulatory requirements.",
      );
    }

    return {
      differences,
      similarity,
      recommendations,
    };
  }
}

export const chemwatchService = new ChemwatchService();
