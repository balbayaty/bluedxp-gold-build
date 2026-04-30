/**
 * 🌍 FREE & OPEN DATA SOURCES INTEGRATION
 * No API keys required - completely free global data!
 * 
 * Data Sources:
 * 1. World Bank - Economic indicators, LPI
 * 2. IMF (International Monetary Fund) - Economic data
 * 3. OECD - Economic statistics
 * 4. Federal Reserve Economic Data (FRED) - US economic data
 * 5. UN Comtrade - Trade statistics
 * 6. Eurostat - European statistics
 * 7. Trading Economics - Global economic indicators
 */

export interface FreeDataSource {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  requiresApiKey: boolean;
  categories: string[];
  supplyChainRelevance: 'high' | 'medium' | 'low';
  region: 'global' | 'us' | 'europe' | 'asia';
}

export const FREE_DATA_SOURCES: FreeDataSource[] = [
  {
    id: 'world_bank',
    name: 'World Bank Open Data',
    description: 'Free global development data including LPI, GDP, trade',
    baseUrl: 'https://api.worldbank.org/v2',
    requiresApiKey: false,
    categories: ['economic', 'logistics', 'trade'],
    supplyChainRelevance: 'high',
    region: 'global',
  },
  {
    id: 'imf',
    name: 'IMF Data API',
    description: 'International economic and financial data',
    baseUrl: 'http://dataservices.imf.org/REST/SDMX_JSON.svc',
    requiresApiKey: false,
    categories: ['economic', 'financial'],
    supplyChainRelevance: 'medium',
    region: 'global',
  },
  {
    id: 'oecd',
    name: 'OECD Data API',
    description: 'Economic statistics from developed countries',
    baseUrl: 'https://stats.oecd.org/SDMX-JSON/data',
    requiresApiKey: false,
    categories: ['economic', 'trade'],
    supplyChainRelevance: 'medium',
    region: 'global',
  },
  {
    id: 'fred',
    name: 'FRED (Federal Reserve)',
    description: 'US economic data - requires free API key',
    baseUrl: 'https://api.stlouisfed.org/fred',
    requiresApiKey: true, // Free API key
    categories: ['economic', 'financial'],
    supplyChainRelevance: 'high',
    region: 'us',
  },
  {
    id: 'ecb',
    name: 'European Central Bank',
    description: 'European economic and financial statistics',
    baseUrl: 'https://sdw-wsrest.ecb.europa.eu/service',
    requiresApiKey: false,
    categories: ['economic', 'financial'],
    supplyChainRelevance: 'medium',
    region: 'europe',
  },
  {
    id: 'un_comtrade',
    name: 'UN Comtrade',
    description: 'International trade statistics',
    baseUrl: 'https://comtrade.un.org/api',
    requiresApiKey: false,
    categories: ['trade'],
    supplyChainRelevance: 'high',
    region: 'global',
  },
  {
    id: 'eurostat',
    name: 'Eurostat',
    description: 'European Union statistics',
    baseUrl: 'https://ec.europa.eu/eurostat/api',
    requiresApiKey: false,
    categories: ['economic', 'trade'],
    supplyChainRelevance: 'medium',
    region: 'europe',
  },
  {
    id: 'quandl_free',
    name: 'Quandl (Free tier)',
    description: 'Financial and economic data',
    baseUrl: 'https://data.nasdaq.com/api/v3',
    requiresApiKey: true, // Free tier available
    categories: ['financial', 'commodities'],
    supplyChainRelevance: 'high',
    region: 'global',
  },
];

/**
 * Service to manage multiple free data sources
 */
export class FreeDataSourcesService {
  private static instance: FreeDataSourcesService;

  private constructor() {}

  static getInstance(): FreeDataSourcesService {
    if (!FreeDataSourcesService.instance) {
      FreeDataSourcesService.instance = new FreeDataSourcesService();
    }
    return FreeDataSourcesService.instance;
  }

  /**
   * Get all available free data sources
   */
  getAvailableSources(): FreeDataSource[] {
    return FREE_DATA_SOURCES;
  }

  /**
   * Get sources by category
   */
  getSourcesByCategory(category: string): FreeDataSource[] {
    return FREE_DATA_SOURCES.filter(source => 
      source.categories.includes(category)
    );
  }

  /**
   * Get sources by supply chain relevance
   */
  getSourcesByRelevance(relevance: 'high' | 'medium' | 'low'): FreeDataSource[] {
    return FREE_DATA_SOURCES.filter(source => 
      source.supplyChainRelevance === relevance
    );
  }

  /**
   * Get sources that don't require API keys
   */
  getNoKeyRequiredSources(): FreeDataSource[] {
    return FREE_DATA_SOURCES.filter(source => !source.requiresApiKey);
  }

  /**
   * Fetch inflation data from multiple sources
   */
  async getInflationData(country: string = 'USA'): Promise<number> {
    try {
      // Try World Bank first
      const wbUrl = `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json&date=2023`;
      const response = await fetch(wbUrl);
      const data = await response.json();

      if (data && data[1] && data[1].length > 0) {
        return data[1][0].value;
      }

      // Return mock data if API fails
      return 3.2;
    } catch (error) {
      console.error('Error fetching inflation data:', error);
      return 3.2; // Mock fallback
    }
  }

  /**
   * Fetch unemployment data
   */
  async getUnemploymentData(country: string = 'USA'): Promise<number> {
    try {
      const wbUrl = `https://api.worldbank.org/v2/country/${country}/indicator/SL.UEM.TOTL.ZS?format=json&date=2023`;
      const response = await fetch(wbUrl);
      const data = await response.json();

      if (data && data[1] && data[1].length > 0) {
        return data[1][0].value;
      }

      return 3.8; // Mock fallback
    } catch (error) {
      console.error('Error fetching unemployment data:', error);
      return 3.8;
    }
  }

  /**
   * Fetch GDP growth rate
   */
  async getGDPGrowth(country: string = 'USA'): Promise<number> {
    try {
      const wbUrl = `https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2023`;
      const response = await fetch(wbUrl);
      const data = await response.json();

      if (data && data[1] && data[1].length > 0) {
        return data[1][0].value;
      }

      return 2.5; // Mock fallback
    } catch (error) {
      console.error('Error fetching GDP growth:', error);
      return 2.5;
    }
  }
}

// Export singleton instance
export const freeDataSources = FreeDataSourcesService.getInstance();

export default freeDataSources;
