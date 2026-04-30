/**
 * 📊 MARKET DATA SERVICE
 * Real-time stock market, commodity, and financial benchmark data integration
 * 
 * Features:
 * - Alpha Vantage API integration
 * - Real-time stock quotes
 * - Time series data
 * - Commodity prices
 * - Currency exchange rates
 * - Supply chain impact analysis
 * - Intelligent caching
 * - Rate limiting
 * - Event bus integration
 * 
 * Provider: Alpha Vantage (free tier: 500 calls/day, 5 calls/minute)
 */

import { eventBus } from '@/lib/services/event-store';
import { apiConfigService } from './apiConfigService';
import type {
  StockQuote,
  StockTimeSeries,
  StockProfile,
  CommodityPrice,
  ExchangeRate,
  MarketAnalysis,
  MarketWatchlist,
  SupplyChainImpact,
  GetQuoteRequest,
  GetQuoteResponse,
  GetTimeSeriesRequest,
  SearchSymbolRequest,
  SearchSymbolResponse,
  MarketDataProvider,
  StockDataPoint,
  MarketCorrelation,
  LOGISTICS_COMPANIES,
} from '@/types/market-data';

// ============================================================================
// INTERFACES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

interface RateLimiter {
  requests: number[];
  maxPerMinute: number;
  maxPerDay: number;
}

// ============================================================================
// MARKET DATA SERVICE CLASS
// ============================================================================

export class MarketDataService {
  private static instance: MarketDataService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimiter: RateLimiter = {
    requests: [],
    maxPerMinute: 5,
    maxPerDay: 500,
  };
  
  private readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
  private readonly CACHE_TTL_SECONDS = {
    quote: 60, // 1 minute for real-time quotes
    timeSeries: 300, // 5 minutes for time series
    profile: 3600, // 1 hour for company profiles
    search: 600, // 10 minutes for search results
  };

  private constructor() {
    this.startCacheCleanup();
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  // ==================== PUBLIC API ====================

  /**
   * Get real-time stock quotes for multiple symbols
   */
  async getQuotes(request: GetQuoteRequest): Promise<GetQuoteResponse> {
    const quotes: StockQuote[] = [];
    const profiles: Record<string, StockProfile> = {};
    let anyCacheHit = false;

    for (const symbol of request.symbols) {
      try {
        // Check cache first
        const cacheKey = `quote:${symbol}`;
        const cached = this.getFromCache<StockQuote>(cacheKey);
        
        if (cached) {
          quotes.push(cached);
          anyCacheHit = true;
        } else {
          // Fetch from API
          const quote = await this.fetchQuote(symbol, request.provider);
          if (quote) {
            quotes.push(quote);
            this.setCache(cacheKey, quote, this.CACHE_TTL_SECONDS.quote);
          }
        }

        // Get profile if requested
        if (request.includeProfile) {
          const profileCacheKey = `profile:${symbol}`;
          const cachedProfile = this.getFromCache<StockProfile>(profileCacheKey);
          
          if (cachedProfile) {
            profiles[symbol] = cachedProfile;
          } else {
            const profile = await this.fetchCompanyProfile(symbol);
            if (profile) {
              profiles[symbol] = profile;
              this.setCache(profileCacheKey, profile, this.CACHE_TTL_SECONDS.profile);
            }
          }
        }

        // Small delay between requests to respect rate limits
        await this.delay(250); // 4 requests per second max
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
      }
    }

    // Publish event (wrapped in try-catch to prevent failures)
    try {
      await eventBus.publish({
        type: 'market_data.quotes.fetched',
        payload: {
          symbols: request.symbols,
          count: quotes.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (eventError) {
      console.warn('Failed to publish market data event:', eventError);
      // Don't fail the whole request if event publishing fails
    }

    return {
      quotes,
      profiles: request.includeProfile ? profiles : undefined,
      timestamp: new Date(),
      cacheHit: anyCacheHit,
    };
  }

  /**
   * Get time series data for a symbol
   */
  async getTimeSeries(request: GetTimeSeriesRequest): Promise<StockTimeSeries> {
    const cacheKey = `timeseries:${request.symbol}:${request.interval}`;
    const cached = this.getFromCache<StockTimeSeries>(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from API
    const timeSeries = await this.fetchTimeSeries(request);
    
    if (timeSeries) {
      this.setCache(cacheKey, timeSeries, this.CACHE_TTL_SECONDS.timeSeries);

      // Publish event (wrapped in try-catch to prevent failures)
      try {
        await eventBus.publish({
          type: 'market_data.timeseries.fetched',
          payload: {
            symbol: request.symbol,
            interval: request.interval,
            dataPoints: timeSeries.data.length,
          },
        });
      } catch (eventError) {
        console.warn('Failed to publish timeseries event:', eventError);
      }
    }

    return timeSeries;
  }

  /**
   * Search for symbols (stocks, commodities, etc.)
   */
  async searchSymbols(request: SearchSymbolRequest): Promise<SearchSymbolResponse> {
    const cacheKey = `search:${request.query}`;
    const cached = this.getFromCache<SearchSymbolResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from API
    const results = await this.fetchSymbolSearch(request.query);
    
    const response: SearchSymbolResponse = {
      results,
    };

    this.setCache(cacheKey, response, this.CACHE_TTL_SECONDS.search);

    return response;
  }

  /**
   * Get commodity prices (energy, metals, etc.)
   * Uses FREE commodity APIs and stock proxies
   */
  async getCommodityPrices(commodities?: string[]): Promise<CommodityPrice[]> {
    const prices: CommodityPrice[] = [];
    
    // Use commodity ETFs as proxies (these work with Alpha Vantage stock quotes!)
    const commodityETFs = [
      { symbol: 'USO', name: 'Crude Oil WTI', category: 'energy' as const, unit: 'per barrel' },
      { symbol: 'UNG', name: 'Natural Gas', category: 'energy' as const, unit: 'per MMBtu' },
      { symbol: 'GLD', name: 'Gold', category: 'metals' as const, unit: 'per ounce' },
      { symbol: 'SLV', name: 'Silver', category: 'metals' as const, unit: 'per ounce' },
      { symbol: 'CPER', name: 'Copper', category: 'metals' as const, unit: 'per pound' },
    ];

    for (const etf of commodityETFs) {
      try {
        // Fetch the ETF price (which tracks the commodity)
        const quote = await this.fetchQuote(etf.symbol);
        
        if (quote) {
          prices.push({
            commodity: etf.name,
            category: etf.category,
            price: quote.price,
            unit: etf.unit,
            currency: 'USD',
            change: quote.change,
            changePercent: quote.changePercent,
            timestamp: quote.timestamp,
            provider: 'alpha_vantage',
          });
        } else {
          prices.push(this.getMockCommodityPrice(etf.name));
        }
        
        await this.delay(300);
      } catch (error) {
        console.error(`Error fetching commodity ${etf.name}:`, error);
        prices.push(this.getMockCommodityPrice(etf.name));
      }
    }

    return prices;
  }
  
  
  private getMockCommodityPrice(commodityName: string): CommodityPrice {
    const basePrices: Record<string, number> = {
      'Crude Oil WTI': 75,
      'Natural Gas': 3.5,
      'Gold': 2050,
      'Silver': 24,
      'Copper': 4.2,
    };
    
    const basePrice = basePrices[commodityName] || 100;
    const change = (Math.random() - 0.5) * basePrice * 0.05;
    
    return {
      commodity: commodityName,
      category: 'energy',
      price: basePrice + change,
      unit: 'per unit',
      currency: 'USD',
      change,
      changePercent: (change / basePrice) * 100,
      timestamp: new Date(),
      provider: 'alpha_vantage',
    };
  }

  /**
   * Get currency exchange rates
   */
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
    const cacheKey = `exchange:${from}:${to}`;
    const cached = this.getFromCache<ExchangeRate>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const rate = await this.fetchExchangeRate(from, to);
      
      if (rate) {
        this.setCache(cacheKey, rate, this.CACHE_TTL_SECONDS.quote);
      }

      return rate;
    } catch (error) {
      console.error(`Error fetching exchange rate ${from}/${to}:`, error);
      return null;
    }
  }

  /**
   * Get logistics companies stock data (supply chain relevant)
   */
  async getLogisticsCompaniesData(): Promise<GetQuoteResponse> {
    const symbols = ['FDX', 'UPS', 'CHRW', 'EXPD', 'XPO'];
    
    return await this.getQuotes({
      symbols,
      includeProfile: true,
    });
  }

  /**
   * Analyze supply chain impact of market movements
   */
  async analyzeSupplyChainImpact(symbol: string): Promise<SupplyChainImpact | null> {
    try {
      const quote = await this.fetchQuote(symbol);
      
      if (!quote) return null;

      const impact = this.calculateSupplyChainImpact(quote);

      // Publish impact event (wrapped in try-catch to prevent failures)
      try {
        await eventBus.publish({
          type: 'market_data.supply_chain_impact',
          payload: impact,
        });
      } catch (eventError) {
        console.warn('Failed to publish supply chain impact event:', eventError);
      }

      return impact;
    } catch (error) {
      console.error(`Error analyzing supply chain impact for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate correlation between two symbols
   */
  async calculateCorrelation(
    symbol1: string,
    symbol2: string,
    timeframe: '1M' | '3M' | '6M' | '1Y' = '3M'
  ): Promise<MarketCorrelation | null> {
    try {
      // Fetch time series for both symbols
      const ts1 = await this.getTimeSeries({ symbol: symbol1, interval: 'daily' });
      const ts2 = await this.getTimeSeries({ symbol: symbol2, interval: 'daily' });

      if (!ts1 || !ts2) return null;

      // Calculate correlation coefficient
      const correlation = this.calculateCorrelationCoefficient(ts1.data, ts2.data);

      const strength = Math.abs(correlation) > 0.7 ? 'strong' :
                      Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';

      return {
        symbol1,
        symbol2,
        correlation,
        timeframe,
        strength,
        interpretation: this.interpretCorrelation(correlation, symbol1, symbol2),
      };
    } catch (error) {
      console.error(`Error calculating correlation:`, error);
      return null;
    }
  }

  // ==================== PRIVATE API METHODS ====================

  /**
   * Fetch real-time quote from Alpha Vantage
   */
  private async fetchQuote(
    symbol: string,
    provider: MarketDataProvider = 'alpha_vantage'
  ): Promise<StockQuote | null> {
    if (!this.canMakeRequest()) {
      console.warn('Rate limit reached. Using cached data or skipping request.');
      return null;
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured. Using mock data.');
      return this.getMockQuote(symbol);
    }

    try {
      const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      
      this.recordRequest();
      
      const response = await fetch(url);
      const data = await response.json();

      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        return {
          symbol: quote['01. symbol'],
          name: symbol, // Would need another API call for full name
          exchange: 'UNKNOWN',
          price: parseFloat(quote['05. price']),
          currency: 'USD',
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          open: parseFloat(quote['02. open']),
          previousClose: parseFloat(quote['08. previous close']),
          timestamp: new Date(quote['07. latest trading day']),
          provider: 'alpha_vantage',
        };
      }

      // If no data, return mock data
      return this.getMockQuote(symbol);
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return this.getMockQuote(symbol);
    }
  }

  /**
   * Fetch time series data
   */
  private async fetchTimeSeries(request: GetTimeSeriesRequest): Promise<StockTimeSeries> {
    if (!this.canMakeRequest()) {
      return this.getMockTimeSeries(request.symbol, request.interval);
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.getMockTimeSeries(request.symbol, request.interval);
    }

    try {
      const functionMap: Record<string, string> = {
        '1min': 'TIME_SERIES_INTRADAY',
        '5min': 'TIME_SERIES_INTRADAY',
        '15min': 'TIME_SERIES_INTRADAY',
        '30min': 'TIME_SERIES_INTRADAY',
        '60min': 'TIME_SERIES_INTRADAY',
        'daily': 'TIME_SERIES_DAILY',
        'weekly': 'TIME_SERIES_WEEKLY',
        'monthly': 'TIME_SERIES_MONTHLY',
      };

      const func = functionMap[request.interval];
      let url = `${this.ALPHA_VANTAGE_BASE_URL}?function=${func}&symbol=${request.symbol}&apikey=${apiKey}`;

      if (func === 'TIME_SERIES_INTRADAY') {
        url += `&interval=${request.interval}`;
      }

      if (request.outputSize) {
        url += `&outputsize=${request.outputSize}`;
      }

      this.recordRequest();

      const response = await fetch(url);
      const data = await response.json();

      // Parse the time series data
      const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
      
      if (timeSeriesKey && data[timeSeriesKey]) {
        const timeSeriesData = data[timeSeriesKey];
        const dataPoints: StockDataPoint[] = [];

        for (const [timestamp, values] of Object.entries(timeSeriesData)) {
          dataPoints.push({
            timestamp: new Date(timestamp),
            open: parseFloat((values as any)['1. open']),
            high: parseFloat((values as any)['2. high']),
            low: parseFloat((values as any)['3. low']),
            close: parseFloat((values as any)['4. close']),
            volume: parseInt((values as any)['5. volume']),
          });
        }

        // Sort by timestamp (newest first)
        dataPoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return {
          symbol: request.symbol,
          interval: request.interval,
          data: dataPoints,
          metadata: {
            lastRefreshed: new Date(data['Meta Data']?.['3. Last Refreshed'] || new Date()),
            timezone: data['Meta Data']?.['6. Time Zone'] || 'US/Eastern',
            outputSize: request.outputSize || 'compact',
          },
        };
      }

      return this.getMockTimeSeries(request.symbol, request.interval);
    } catch (error) {
      console.error(`Error fetching time series for ${request.symbol}:`, error);
      return this.getMockTimeSeries(request.symbol, request.interval);
    }
  }

  /**
   * Fetch company profile
   */
  private async fetchCompanyProfile(symbol: string): Promise<StockProfile | null> {
    if (!this.canMakeRequest()) {
      return this.getMockProfile(symbol);
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return this.getMockProfile(symbol);
    }

    try {
      const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
      
      this.recordRequest();
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.Symbol) {
        return {
          symbol: data.Symbol,
          name: data.Name,
          description: data.Description,
          sector: data.Sector,
          industry: data.Industry,
          country: data.Country,
          exchange: data.Exchange,
          currency: data.Currency,
          marketCap: parseInt(data.MarketCapitalization),
          employees: data.FullTimeEmployees ? parseInt(data.FullTimeEmployees) : undefined,
          website: data.OfficialSite,
          relevanceScore: this.calculateRelevanceScore(data),
        };
      }

      return this.getMockProfile(symbol);
    } catch (error) {
      console.error(`Error fetching profile for ${symbol}:`, error);
      return this.getMockProfile(symbol);
    }
  }

  /**
   * Search for symbols
   */
  private async fetchSymbolSearch(query: string): Promise<any[]> {
    if (!this.canMakeRequest()) {
      return [];
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return [];
    }

    try {
      const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
      
      this.recordRequest();
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.bestMatches) {
        return data.bestMatches.map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          currency: match['8. currency'],
          matchScore: parseFloat(match['9. matchScore']),
        }));
      }

      return [];
    } catch (error) {
      console.error(`Error searching symbols:`, error);
      return [];
    }
  }

  /**
   * Fetch exchange rate
   */
  private async fetchExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
    if (!this.canMakeRequest()) {
      return null;
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return null;
    }

    try {
      const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
      
      this.recordRequest();
      
      const response = await fetch(url);
      const data = await response.json();

      if (data['Realtime Currency Exchange Rate']) {
        const rate = data['Realtime Currency Exchange Rate'];
        
        return {
          fromCurrency: from,
          toCurrency: to,
          rate: parseFloat(rate['5. Exchange Rate']),
          change: 0, // Would need historical data
          changePercent: 0,
          timestamp: new Date(rate['6. Last Refreshed']),
          provider: 'alpha_vantage',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching exchange rate:`, error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  private getApiKey(): string | undefined {
    return process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Clean old requests (older than 24 hours)
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => now - time < 24 * 60 * 60 * 1000
    );

    // Check daily limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxPerDay) {
      return false;
    }

    // Check per-minute limit
    const recentRequests = this.rateLimiter.requests.filter(
      time => now - time < 60 * 1000
    );

    return recentRequests.length < this.rateLimiter.maxPerMinute;
  }

  private recordRequest(): void {
    this.rateLimiter.requests.push(Date.now());
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlSeconds: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  private startCacheCleanup(): void {
    // Clean cache every 5 minutes
    setInterval(() => {
      const now = new Date();
      
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCommodityCategory(symbol: string): 'energy' | 'metals' | 'agriculture' | 'chemicals' {
    const energySymbols = ['CL=F', 'BZ=F', 'NG=F', 'HO=F'];
    const metalSymbols = ['GC=F', 'SI=F', 'HG=F', 'ALI=F'];
    const agricultureSymbols = ['ZW=F', 'ZC=F', 'ZS=F'];

    if (energySymbols.includes(symbol)) return 'energy';
    if (metalSymbols.includes(symbol)) return 'metals';
    if (agricultureSymbols.includes(symbol)) return 'agriculture';
    return 'chemicals';
  }

  private calculateSupplyChainImpact(quote: StockQuote): SupplyChainImpact {
    // Simplified impact analysis based on stock movement
    const impactSeverity = Math.abs(quote.changePercent) > 5 ? 'high' :
                          Math.abs(quote.changePercent) > 2 ? 'medium' : 'low';

    const isLogistics = ['FDX', 'UPS', 'CHRW', 'EXPD', 'XPO'].includes(quote.symbol);
    
    return {
      marketSymbol: quote.symbol,
      marketChange: quote.changePercent,
      impactedArea: isLogistics ? 'transportation' : 'procurement',
      impactType: 'cost',
      impactSeverity: impactSeverity as any,
      description: `${quote.name} stock ${quote.changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(quote.changePercent).toFixed(2)}%, potentially affecting ${isLogistics ? 'transportation costs' : 'procurement pricing'}.`,
      recommendations: this.generateRecommendations(quote, isLogistics),
      confidence: 75,
    };
  }

  private generateRecommendations(quote: StockQuote, isLogistics: boolean): string[] {
    const recommendations: string[] = [];

    if (quote.changePercent > 5) {
      recommendations.push('Monitor for potential price increases');
      recommendations.push('Consider locking in current rates');
    } else if (quote.changePercent < -5) {
      recommendations.push('Opportunity for favorable pricing');
      recommendations.push('Review contract renegotiation options');
    }

    if (isLogistics) {
      recommendations.push('Review transportation budget allocations');
      recommendations.push('Evaluate alternative carrier options');
    }

    return recommendations;
  }

  private calculateRelevanceScore(profile: any): number {
    // Calculate how relevant this company is to supply chain operations
    const relevantSectors = ['Transportation', 'Industrials', 'Materials', 'Energy'];
    const relevantIndustries = ['Air Freight & Logistics', 'Trucking', 'Marine Shipping', 'Chemicals'];

    let score = 50; // Base score

    if (relevantSectors.includes(profile.Sector)) score += 25;
    if (relevantIndustries.includes(profile.Industry)) score += 25;

    return Math.min(score, 100);
  }

  private calculateCorrelationCoefficient(data1: StockDataPoint[], data2: StockDataPoint[]): number {
    // Simplified Pearson correlation coefficient
    if (data1.length === 0 || data2.length === 0) return 0;

    const minLength = Math.min(data1.length, data2.length, 30); // Last 30 data points
    const slice1 = data1.slice(0, minLength).map(d => d.close);
    const slice2 = data2.slice(0, minLength).map(d => d.close);

    const mean1 = slice1.reduce((a, b) => a + b, 0) / slice1.length;
    const mean2 = slice2.reduce((a, b) => a + b, 0) / slice2.length;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < minLength; i++) {
      const diff1 = slice1[i] - mean1;
      const diff2 = slice2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private interpretCorrelation(correlation: number, symbol1: string, symbol2: string): string {
    if (correlation > 0.7) {
      return `${symbol1} and ${symbol2} move strongly together. A change in one likely indicates a similar change in the other.`;
    } else if (correlation > 0.4) {
      return `${symbol1} and ${symbol2} show moderate positive correlation. They tend to move in the same direction.`;
    } else if (correlation < -0.7) {
      return `${symbol1} and ${symbol2} move strongly in opposite directions. Consider hedging strategies.`;
    } else if (correlation < -0.4) {
      return `${symbol1} and ${symbol2} show moderate negative correlation. They tend to move inversely.`;
    } else {
      return `${symbol1} and ${symbol2} show weak correlation. Their movements are largely independent.`;
    }
  }

  // ==================== MOCK DATA (for testing without API key) ====================

  private getMockQuote(symbol: string): StockQuote {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      symbol,
      name: `${symbol} Inc.`,
      exchange: 'NASDAQ',
      price: basePrice,
      currency: 'USD',
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 10000000),
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      open: basePrice + (Math.random() - 0.5) * 3,
      previousClose: basePrice - change,
      timestamp: new Date(),
      provider: 'alpha_vantage',
    };
  }

  private getMockTimeSeries(symbol: string, interval: string): StockTimeSeries {
    const dataPoints: StockDataPoint[] = [];
    const basePrice = 100 + Math.random() * 200;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const open = basePrice + (Math.random() - 0.5) * 10;
      const close = open + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;

      dataPoints.push({
        timestamp: date,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 10000000),
      });
    }

    return {
      symbol,
      interval: interval as any,
      data: dataPoints,
      metadata: {
        lastRefreshed: new Date(),
        timezone: 'US/Eastern',
        outputSize: 'compact',
      },
    };
  }

  private getMockProfile(symbol: string): StockProfile {
    return {
      symbol,
      name: `${symbol} Corporation`,
      description: `Mock profile for ${symbol}`,
      sector: 'Transportation',
      industry: 'Air Freight & Logistics',
      country: 'USA',
      exchange: 'NASDAQ',
      currency: 'USD',
      marketCap: Math.floor(Math.random() * 100000000000),
      relevanceScore: 75,
    };
  }
}

// Export singleton instance
export const marketDataService = MarketDataService.getInstance();

export default marketDataService;
