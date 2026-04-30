/**
 * 📊 MARKET DATA TYPES
 * Real-time stock market, commodity, and financial benchmark data
 * Supports multiple data providers and benchmark sources
 * 
 * Integration with:
 * - Alpha Vantage (Stock Market)
 * - Commodity APIs
 * - Currency Exchange
 * - Industry Benchmarks
 */

// ============================================================================
// DATA PROVIDERS
// ============================================================================

export type MarketDataProvider = 
  | 'alpha_vantage'
  | 'yahoo_finance'
  | 'finnhub'
  | 'iex_cloud'
  | 'quandl'
  | 'bloomberg'
  | 'reuters'
  | 'custom';

export type DataCategory =
  | 'stocks'
  | 'commodities'
  | 'currencies'
  | 'indices'
  | 'crypto'
  | 'bonds'
  | 'futures'
  | 'options';

export type IndustryBenchmark =
  | 'gartner_supply_chain'
  | 'baltic_dry_index'
  | 'shanghai_containerized_freight'
  | 'wca_world_container_index'
  | 'freight_rate_index'
  | 'chemical_pricing_index'
  | 'sustainability_index'
  | 'custom_benchmark';

// ============================================================================
// STOCK MARKET DATA
// ============================================================================

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  provider: MarketDataProvider;
}

export interface StockTimeSeries {
  symbol: string;
  interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly';
  data: StockDataPoint[];
  metadata: {
    lastRefreshed: Date;
    timezone: string;
    outputSize: 'compact' | 'full';
  };
}

export interface StockDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  currency: string;
  marketCap: number;
  employees?: number;
  website?: string;
  ceo?: string;
  relevanceScore?: number; // How relevant to supply chain
}

// ============================================================================
// COMMODITY DATA
// ============================================================================

export interface CommodityPrice {
  commodity: string;
  category: 'energy' | 'metals' | 'agriculture' | 'chemicals';
  price: number;
  unit: string;
  currency: string;
  change: number;
  changePercent: number;
  timestamp: Date;
  provider: MarketDataProvider;
}

export interface CommodityTimeSeries {
  commodity: string;
  interval: 'daily' | 'weekly' | 'monthly';
  data: CommodityDataPoint[];
}

export interface CommodityDataPoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

// ============================================================================
// CURRENCY EXCHANGE
// ============================================================================

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  provider: MarketDataProvider;
}

export interface CurrencyTimeSeries {
  fromCurrency: string;
  toCurrency: string;
  interval: 'daily' | 'weekly' | 'monthly';
  data: ExchangeRateDataPoint[];
}

export interface ExchangeRateDataPoint {
  timestamp: Date;
  rate: number;
  high?: number;
  low?: number;
}

// ============================================================================
// MARKET INDICES
// ============================================================================

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  constituents?: string[]; // Stock symbols
}

// ============================================================================
// INDUSTRY BENCHMARKS
// ============================================================================

export interface BenchmarkData {
  benchmarkType: IndustryBenchmark;
  name: string;
  description: string;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  rank?: number; // If comparing multiple entities
  percentile?: number; // Performance percentile
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SupplyChainBenchmark extends BenchmarkData {
  benchmarkType: 'gartner_supply_chain';
  category: 'planning' | 'sourcing' | 'manufacturing' | 'delivery' | 'return';
  metrics: {
    perfectOrderRate?: number;
    cashToCashCycleTime?: number;
    supplyChainCost?: number;
    upside?: number;
    downside?: number;
  };
}

export interface FreightRateBenchmark extends BenchmarkData {
  benchmarkType: 'baltic_dry_index' | 'shanghai_containerized_freight' | 'wca_world_container_index';
  route?: string;
  mode?: 'sea' | 'air' | 'land';
  containerType?: '20ft' | '40ft' | '40ft_hc';
}

// ============================================================================
// MARKET ANALYSIS
// ============================================================================

export interface MarketAnalysis {
  symbol: string;
  category: DataCategory;
  technicalIndicators: {
    rsi?: number; // Relative Strength Index (0-100)
    macd?: { value: number; signal: number; histogram: number };
    movingAverages?: {
      sma20?: number;
      sma50?: number;
      sma200?: number;
      ema20?: number;
    };
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  sentiment: 'bullish' | 'bearish' | 'neutral';
  signals: MarketSignal[];
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  timestamp: Date;
}

export interface MarketSignal {
  type: 'technical' | 'fundamental' | 'sentiment';
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  reason: string;
  timestamp: Date;
}

// ============================================================================
// WATCHLIST & ALERTS
// ============================================================================

export interface MarketWatchlist {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistItem {
  symbol: string;
  category: DataCategory;
  addedAt: Date;
  notes?: string;
  alerts?: PriceAlert[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'change_percent' | 'volume_spike';
  condition: {
    threshold: number;
    operator: '>' | '<' | '>=' | '<=';
  };
  isActive: boolean;
  triggeredAt?: Date;
  notificationSent: boolean;
  createdAt: Date;
}

// ============================================================================
// CORRELATION & INSIGHTS
// ============================================================================

export interface MarketCorrelation {
  symbol1: string;
  symbol2: string;
  correlation: number; // -1 to 1
  timeframe: '1M' | '3M' | '6M' | '1Y';
  strength: 'strong' | 'moderate' | 'weak';
  interpretation: string;
}

export interface SupplyChainImpact {
  marketSymbol: string;
  marketChange: number;
  impactedArea: 'transportation' | 'warehousing' | 'procurement' | 'operations';
  impactType: 'cost' | 'capacity' | 'timing' | 'risk';
  impactSeverity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendations: string[];
  confidence: number;
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

export interface MarketDataConfig {
  provider: MarketDataProvider;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  caching: {
    enabled: boolean;
    ttlSeconds: number;
  };
  enabled: boolean;
}

export interface MarketDataProviderConfig {
  alphaVantage?: MarketDataConfig;
  yahooFinance?: MarketDataConfig;
  finnhub?: MarketDataConfig;
  iexCloud?: MarketDataConfig;
  custom?: MarketDataConfig[];
}

// ============================================================================
// SERVICE REQUESTS/RESPONSES
// ============================================================================

export interface GetQuoteRequest {
  symbols: string[];
  provider?: MarketDataProvider;
  includeProfile?: boolean;
}

export interface GetQuoteResponse {
  quotes: StockQuote[];
  profiles?: Record<string, StockProfile>;
  timestamp: Date;
  cacheHit: boolean;
}

export interface GetTimeSeriesRequest {
  symbol: string;
  interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly';
  outputSize?: 'compact' | 'full';
  provider?: MarketDataProvider;
}

export interface SearchSymbolRequest {
  query: string;
  categories?: DataCategory[];
  provider?: MarketDataProvider;
}

export interface SearchSymbolResponse {
  results: SymbolSearchResult[];
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: DataCategory;
  region: string;
  currency: string;
  matchScore: number;
}

// ============================================================================
// SUPPLY CHAIN RELEVANT COMPANIES
// ============================================================================

export const LOGISTICS_COMPANIES: StockProfile[] = [
  {
    symbol: 'FDX',
    name: 'FedEx Corporation',
    description: 'Global shipping and logistics',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'USA',
    exchange: 'NYSE',
    currency: 'USD',
    marketCap: 0,
    relevanceScore: 100,
  },
  {
    symbol: 'UPS',
    name: 'United Parcel Service',
    description: 'Package delivery and supply chain management',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'USA',
    exchange: 'NYSE',
    currency: 'USD',
    marketCap: 0,
    relevanceScore: 100,
  },
  {
    symbol: 'MAERSKB.CO',
    name: 'A.P. Moller - Maersk',
    description: 'Container shipping and logistics',
    sector: 'Transportation',
    industry: 'Marine Shipping',
    country: 'Denmark',
    exchange: 'CPH',
    currency: 'DKK',
    marketCap: 0,
    relevanceScore: 100,
  },
  {
    symbol: 'CHRW',
    name: 'C.H. Robinson Worldwide',
    description: 'Third-party logistics provider',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'USA',
    exchange: 'NASDAQ',
    currency: 'USD',
    marketCap: 0,
    relevanceScore: 95,
  },
  {
    symbol: 'EXPD',
    name: 'Expeditors International',
    description: 'Freight forwarding and logistics',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'USA',
    exchange: 'NASDAQ',
    currency: 'USD',
    marketCap: 0,
    relevanceScore: 95,
  },
  {
    symbol: 'XPO',
    name: 'XPO Logistics',
    description: 'Transportation and logistics services',
    sector: 'Transportation',
    industry: 'Trucking',
    country: 'USA',
    exchange: 'NYSE',
    currency: 'USD',
    marketCap: 0,
    relevanceScore: 90,
  },
  {
    symbol: 'DSV.CO',
    name: 'DSV A/S',
    description: 'Transport and logistics services',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'Denmark',
    exchange: 'CPH',
    currency: 'DKK',
    marketCap: 0,
    relevanceScore: 90,
  },
  {
    symbol: 'KNX.DE',
    name: 'Kuehne + Nagel',
    description: 'Global logistics provider',
    sector: 'Transportation',
    industry: 'Air Freight & Logistics',
    country: 'Switzerland',
    exchange: 'SWX',
    currency: 'CHF',
    marketCap: 0,
    relevanceScore: 90,
  },
];

export const COMMODITY_SYMBOLS = {
  // Energy
  CRUDE_OIL_WTI: 'CL=F',
  CRUDE_OIL_BRENT: 'BZ=F',
  NATURAL_GAS: 'NG=F',
  HEATING_OIL: 'HO=F',
  
  // Metals
  GOLD: 'GC=F',
  SILVER: 'SI=F',
  COPPER: 'HG=F',
  ALUMINUM: 'ALI=F',
  STEEL: 'STEEL',
  
  // Agriculture
  WHEAT: 'ZW=F',
  CORN: 'ZC=F',
  SOYBEANS: 'ZS=F',
  
  // Chemicals (representative)
  DOW_CHEMICAL: 'DOW',
  BASF: 'BAS.DE',
  DUPONT: 'DD',
};

export const MARKET_INDICES = {
  SP500: '^GSPC',
  DOW_JONES: '^DJI',
  NASDAQ: '^IXIC',
  FTSE_100: '^FTSE',
  DAX: '^GDAXI',
  NIKKEI: '^N225',
  BALTIC_DRY: 'BDI', // Baltic Dry Index
};
