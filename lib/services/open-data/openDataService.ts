/**
 * Open Data Integration Service
 * Integrate with free public chemical databases and regulatory sources
 */

export interface OpenDataSource {
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  requiresAuth: boolean;
  rateLimit?: number;
  enabled: boolean;
}

export interface ChemicalDataResult {
  source: string;
  casNumber?: string;
  name?: string;
  properties?: Record<string, any>;
  hazards?: any[];
  regulatory?: any[];
  exposureLimits?: any;
  toxicology?: any;
  confidence: number;
}

export class OpenDataService {
  private sources: OpenDataSource[] = [
    {
      id: "pubchem",
      name: "PubChem",
      description: "NIH PubChem database - 111M+ compounds",
      apiUrl: "https://pubchem.ncbi.nlm.nih.gov/rest/pug",
      requiresAuth: false,
      rateLimit: 5, // requests per second
      enabled: true,
    },
    {
      id: "epa-comptox",
      name: "EPA CompTox Chemicals Dashboard",
      description:
        "EPA database - 875K+ chemicals with properties and bioassay data",
      apiUrl: "https://api.epa.gov/comptox",
      requiresAuth: false,
      enabled: true,
    },
    {
      id: "osha",
      name: "OSHA Occupational Chemical Database",
      description: "OSHA chemical identification, properties, exposure limits",
      apiUrl: "https://www.osha.gov/chemicaldata",
      requiresAuth: false,
      enabled: true,
    },
    {
      id: "cas-safety",
      name: "CAS Chemical Safety Library",
      description: "Free database of hazardous reaction information",
      apiUrl: "https://www.cas.org/resources/chemical-safety-library",
      requiresAuth: false,
      enabled: true,
    },
    {
      id: "gestis",
      name: "GESTIS Substance Database",
      description: "Safe handling of hazardous substances (EU)",
      apiUrl: "https://gestis-database.dguv.de",
      requiresAuth: false,
      enabled: true,
    },
  ];

  /**
   * Search chemical across all open data sources
   */
  async searchChemical(
    query: string,
    options?: {
      byCAS?: boolean;
      byName?: boolean;
      sources?: string[];
      useCache?: boolean;
    },
  ): Promise<ChemicalDataResult[]> {
    // Check cache first
    if (options?.useCache !== false) {
      const cached = await openDataCacheService.get(query);
      if (cached) {
        return cached;
      }
    }

    const enabledSources = this.sources.filter(
      (s) => s.enabled && (!options?.sources || options.sources.includes(s.id)),
    );

    const results = await Promise.allSettled(
      enabledSources.map((source) =>
        this.searchInSource(source, query, options),
      ),
    );

    const chemicalResults = results
      .filter(
        (r): r is PromiseFulfilledResult<ChemicalDataResult> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value)
      .filter((r) => r.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence);

    // Cache results
    if (chemicalResults.length > 0 && options?.useCache !== false) {
      const avgConfidence =
        chemicalResults.reduce((sum, r) => sum + r.confidence, 0) /
        chemicalResults.length;
      await openDataCacheService.set(
        query,
        chemicalResults,
        "multi-source",
        Math.round(avgConfidence),
      );
    }

    return chemicalResults;
  }

  /**
   * Search in specific source
   */
  private async searchInSource(
    source: OpenDataSource,
    query: string,
    options?: { byCAS?: boolean; byName?: boolean },
  ): Promise<ChemicalDataResult> {
    try {
      switch (source.id) {
        case "pubchem":
          return await this.searchPubChem(query, options);
        case "epa-comptox":
          return await this.searchEPACompTox(query, options);
        case "osha":
          return await this.searchOSHA(query, options);
        default:
          return {
            source: source.name,
            confidence: 0,
          };
      }
    } catch (error) {
      console.error(`Error searching ${source.name}:`, error);
      return {
        source: source.name,
        confidence: 0,
      };
    }
  }

  /**
   * Search PubChem database
   */
  private async searchPubChem(
    query: string,
    options?: { byCAS?: boolean; byName?: boolean },
  ): Promise<ChemicalDataResult> {
    try {
      // PubChem REST API
      const searchType = options?.byCAS ? "cid" : "name";
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${searchType}/${encodeURIComponent(query)}/JSON`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return { source: "PubChem", confidence: 0 };
      }

      const data = await response.json();

      // Extract relevant data
      const compound = data.PC_Compounds?.[0];
      if (!compound) {
        return { source: "PubChem", confidence: 0 };
      }

      return {
        source: "PubChem",
        name: query,
        properties: this.extractPubChemProperties(compound),
        confidence: 85,
      };
    } catch (error) {
      console.error("PubChem search error:", error);
      return { source: "PubChem", confidence: 0 };
    }
  }

  /**
   * Search EPA CompTox
   */
  private async searchEPACompTox(
    query: string,
    options?: { byCAS?: boolean; byName?: boolean },
  ): Promise<ChemicalDataResult> {
    try {
      // EPA CompTox Chemicals Dashboard API
      // Public API endpoint (no key required for basic queries)
      const searchType = options?.byCAS ? "dtxsid" : "name";
      const url = `https://api.epa.gov/comptox/v1/chemicals/search?${searchType}=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        // Try alternative endpoint
        const altUrl = `https://comptox.epa.gov/dashboard-api/chemicals/search?query=${encodeURIComponent(query)}`;
        const altResponse = await fetch(altUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!altResponse.ok) {
          return {
            source: "EPA CompTox",
            name: query,
            properties: {},
            confidence: 0,
          };
        }

        const data = await altResponse.json();
        return this.extractEPACompToxData(data, query);
      }

      const data = await response.json();
      return this.extractEPACompToxData(data, query);
    } catch (error) {
      console.error("EPA CompTox search error:", error);
      return { source: "EPA CompTox", confidence: 0 };
    }
  }

  /**
   * Extract data from EPA CompTox response
   */
  private extractEPACompToxData(data: any, query: string): ChemicalDataResult {
    const properties: Record<string, any> = {};

    if (data.results && data.results.length > 0) {
      const result = data.results[0];

      // Extract properties
      if (result.molecularWeight) {
        properties.molecularWeight = result.molecularWeight;
      }
      if (result.smiles) {
        properties.smiles = result.smiles;
      }
      if (result.inchi) {
        properties.inchi = result.inchi;
      }
      if (result.formula) {
        properties.formula = result.formula;
      }
      if (result.exposureLimits) {
        properties.exposureLimits = result.exposureLimits;
      }
      if (result.toxicity) {
        properties.toxicity = result.toxicity;
      }
    }

    return {
      source: "EPA CompTox",
      name: query,
      casNumber: data.casNumber,
      properties,
      confidence: data.results && data.results.length > 0 ? 85 : 0,
    };
  }

  /**
   * Search OSHA database
   */
  private async searchOSHA(
    query: string,
    options?: { byCAS?: boolean; byName?: boolean },
  ): Promise<ChemicalDataResult> {
    try {
      // OSHA Chemical Database - Public web API
      // OSHA provides a searchable database at https://www.osha.gov/chemicaldata
      // For programmatic access, we'll use their search endpoint
      const searchParam = options?.byCAS ? "cas" : "name";
      const url = `https://www.osha.gov/chemicaldata/api/search?${searchParam}=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        // Fallback: Try direct chemical data endpoint
        const fallbackUrl = `https://www.osha.gov/chemicaldata/${encodeURIComponent(query)}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!fallbackResponse.ok) {
          return {
            source: "OSHA",
            name: query,
            exposureLimits: {},
            confidence: 0,
          };
        }

        const data = await fallbackResponse.json();
        return this.extractOSHAData(data, query);
      }

      const data = await response.json();
      return this.extractOSHAData(data, query);
    } catch (error) {
      console.error("OSHA search error:", error);
      return { source: "OSHA", confidence: 0 };
    }
  }

  /**
   * Extract data from OSHA response
   */
  private extractOSHAData(data: any, query: string): ChemicalDataResult {
    const exposureLimits: Record<string, any> = {};

    if (data.exposureLimits) {
      if (data.exposureLimits.pel) {
        exposureLimits.pel = data.exposureLimits.pel;
      }
      if (data.exposureLimits.tlv) {
        exposureLimits.tlv = data.exposureLimits.tlv;
      }
      if (data.exposureLimits.rel) {
        exposureLimits.rel = data.exposureLimits.rel;
      }
    }

    return {
      source: "OSHA",
      name: query,
      casNumber: data.casNumber,
      exposureLimits,
      hazards: data.hazards,
      confidence: data.found ? 90 : 0,
    };
  }

  /**
   * Extract properties from PubChem compound
   */
  private extractPubChemProperties(compound: any): Record<string, any> {
    const properties: Record<string, any> = {};

    // Extract molecular weight
    if (compound.props) {
      compound.props.forEach((prop: any) => {
        if (prop.urn?.label === "Molecular Weight") {
          properties.molecularWeight = prop.value?.fval || prop.value?.ival;
        }
        if (prop.urn?.label === "Canonical SMILES") {
          properties.smiles = prop.value?.sval;
        }
        if (prop.urn?.label === "Isomeric SMILES") {
          properties.isomericSmiles = prop.value?.sval;
        }
      });
    }

    return properties;
  }

  /**
   * Get chemical properties from multiple sources
   */
  async getChemicalProperties(casNumber: string): Promise<{
    properties: Record<string, any>;
    sources: string[];
    confidence: number;
  }> {
    const results = await this.searchChemical(casNumber, { byCAS: true });

    // Merge properties from all sources
    const mergedProperties: Record<string, any> = {};
    const sources: string[] = [];

    results.forEach((result) => {
      if (result.properties) {
        Object.assign(mergedProperties, result.properties);
      }
      if (result.exposureLimits) {
        mergedProperties.exposureLimits = result.exposureLimits;
      }
      if (result.hazards) {
        mergedProperties.hazards = result.hazards;
      }
      sources.push(result.source);
    });

    const avgConfidence =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;

    return {
      properties: mergedProperties,
      sources,
      confidence: avgConfidence,
    };
  }

  /**
   * Get regulatory information
   */
  async getRegulatoryInfo(casNumber: string): Promise<{
    regulations: any[];
    sources: string[];
  }> {
    const results = await this.searchChemical(casNumber, { byCAS: true });

    const regulations: any[] = [];
    const sources: string[] = [];

    results.forEach((result) => {
      if (result.regulatory) {
        regulations.push(...result.regulatory);
      }
      sources.push(result.source);
    });

    return { regulations, sources };
  }

  /**
   * Get exposure limits from multiple sources
   */
  async getExposureLimits(casNumber: string): Promise<{
    limits: Record<string, any>;
    sources: string[];
  }> {
    const results = await this.searchChemical(casNumber, { byCAS: true });

    const limits: Record<string, any> = {};
    const sources: string[] = [];

    results.forEach((result) => {
      if (result.exposureLimits) {
        Object.assign(limits, result.exposureLimits);
      }
      sources.push(result.source);
    });

    return { limits, sources };
  }

  /**
   * Get enabled sources
   */
  getEnabledSources(): OpenDataSource[] {
    return this.sources.filter((s) => s.enabled);
  }

  /**
   * Enable/disable source
   */
  setSourceEnabled(sourceId: string, enabled: boolean): void {
    const source = this.sources.find((s) => s.id === sourceId);
    if (source) {
      source.enabled = enabled;
    }
  }
}

export const openDataService = new OpenDataService();
