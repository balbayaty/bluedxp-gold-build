/**
 * 🌍 ENHANCED MARKET DATA TYPES
 * Comprehensive global benchmarks, indices, and indicators
 * Focused on Middle East, Supply Chain, and Global Markets
 */

// ============================================================================
// MIDDLE EAST CURRENCIES
// ============================================================================

export const MIDDLE_EAST_CURRENCIES = {
  SAR: { name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦', symbol: 'ر.س' },
  AED: { name: 'UAE Dirham', country: 'United Arab Emirates', flag: '🇦🇪', symbol: 'د.إ' },
  KWD: { name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼', symbol: 'د.ك' },
  QAR: { name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦', symbol: 'ر.ق' },
  BHD: { name: 'Bahraini Dinar', country: 'Bahrain', flag: '🇧🇭', symbol: 'د.ب' },
  OMR: { name: 'Omani Rial', country: 'Oman', flag: '🇴🇲', symbol: 'ر.ع' },
  JOD: { name: 'Jordanian Dinar', country: 'Jordan', flag: '🇯🇴', symbol: 'د.ا' },
  EGP: { name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬', symbol: '£' },
  IQD: { name: 'Iraqi Dinar', country: 'Iraq', flag: '🇮🇶', symbol: 'ع.د' },
  LBP: { name: 'Lebanese Pound', country: 'Lebanon', flag: '🇱🇧', symbol: 'ل.ل' },
} as const;

export const GLOBAL_CURRENCIES = {
  USD: { name: 'US Dollar', country: 'United States', flag: '🇺🇸', symbol: '$' },
  EUR: { name: 'Euro', country: 'Eurozone', flag: '🇪🇺', symbol: '€' },
  GBP: { name: 'British Pound', country: 'United Kingdom', flag: '🇬🇧', symbol: '£' },
  JPY: { name: 'Japanese Yen', country: 'Japan', flag: '🇯🇵', symbol: '¥' },
  CNY: { name: 'Chinese Yuan', country: 'China', flag: '🇨🇳', symbol: '¥' },
  CHF: { name: 'Swiss Franc', country: 'Switzerland', flag: '🇨🇭', symbol: 'Fr' },
  CAD: { name: 'Canadian Dollar', country: 'Canada', flag: '🇨🇦', symbol: '$' },
  AUD: { name: 'Australian Dollar', country: 'Australia', flag: '🇦🇺', symbol: '$' },
  INR: { name: 'Indian Rupee', country: 'India', flag: '🇮🇳', symbol: '₹' },
  SGD: { name: 'Singapore Dollar', country: 'Singapore', flag: '🇸🇬', symbol: '$' },
} as const;

// ============================================================================
// GLOBAL MARKET INDICES
// ============================================================================

export interface GlobalMarketIndex {
  id: string;
  name: string;
  symbol: string;
  category: 'stock_market' | 'freight' | 'commodity' | 'economic' | 'supply_chain';
  region: 'global' | 'us' | 'europe' | 'asia' | 'middle_east';
  description: string;
  icon: string;
  supplyChainRelevance: 'high' | 'medium' | 'low';
}

export const GLOBAL_INDICES: GlobalMarketIndex[] = [
  // Stock Market Indices
  {
    id: 'sp500',
    name: 'S&P 500',
    symbol: '^GSPC',
    category: 'stock_market',
    region: 'us',
    description: 'US large-cap stock market index',
    icon: '📈',
    supplyChainRelevance: 'medium',
  },
  {
    id: 'dow',
    name: 'Dow Jones Industrial',
    symbol: '^DJI',
    category: 'stock_market',
    region: 'us',
    description: '30 prominent US companies',
    icon: '📊',
    supplyChainRelevance: 'medium',
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ Composite',
    symbol: '^IXIC',
    category: 'stock_market',
    region: 'us',
    description: 'Technology-heavy stock index',
    icon: '💻',
    supplyChainRelevance: 'low',
  },
  
  // Freight & Shipping Indices
  {
    id: 'baltic_dry',
    name: 'Baltic Dry Index',
    symbol: 'BDI',
    category: 'freight',
    region: 'global',
    description: 'Dry bulk shipping rates indicator',
    icon: '🚢',
    supplyChainRelevance: 'high',
  },
  {
    id: 'baltic_capesize',
    name: 'Baltic Capesize Index',
    symbol: 'BCI',
    category: 'freight',
    region: 'global',
    description: 'Large dry bulk vessels (150,000+ DWT)',
    icon: '⚓',
    supplyChainRelevance: 'high',
  },
  {
    id: 'baltic_panamax',
    name: 'Baltic Panamax Index',
    symbol: 'BPI',
    category: 'freight',
    region: 'global',
    description: 'Medium dry bulk vessels (60,000-80,000 DWT)',
    icon: '🛳️',
    supplyChainRelevance: 'high',
  },
  {
    id: 'shanghai_containerized',
    name: 'Shanghai Containerized Freight Index',
    symbol: 'SCFI',
    category: 'freight',
    region: 'asia',
    description: 'Container shipping rates from Shanghai',
    icon: '📦',
    supplyChainRelevance: 'high',
  },
  {
    id: 'wca_container',
    name: 'WCA World Container Index',
    symbol: 'WCI',
    category: 'freight',
    region: 'global',
    description: 'Global container freight rates',
    icon: '🌍',
    supplyChainRelevance: 'high',
  },
  
  // Economic Indicators
  {
    id: 'us_cpi',
    name: 'US Consumer Price Index',
    symbol: 'CPI',
    category: 'economic',
    region: 'us',
    description: 'Inflation indicator',
    icon: '💰',
    supplyChainRelevance: 'high',
  },
  {
    id: 'us_ppi',
    name: 'US Producer Price Index',
    symbol: 'PPI',
    category: 'economic',
    region: 'us',
    description: 'Wholesale inflation',
    icon: '🏭',
    supplyChainRelevance: 'high',
  },
  {
    id: 'pmi_manufacturing',
    name: 'Manufacturing PMI',
    symbol: 'PMI',
    category: 'economic',
    region: 'global',
    description: 'Manufacturing activity indicator',
    icon: '🔧',
    supplyChainRelevance: 'high',
  },
  
  // Supply Chain Specific
  {
    id: 'cass_freight',
    name: 'Cass Freight Index',
    symbol: 'CFI',
    category: 'supply_chain',
    region: 'us',
    description: 'Freight volumes and expenditures',
    icon: '🚚',
    supplyChainRelevance: 'high',
  },
  {
    id: 'logistics_managers',
    name: 'Logistics Managers Index',
    symbol: 'LMI',
    category: 'supply_chain',
    region: 'us',
    description: 'Logistics and supply chain activity',
    icon: '📋',
    supplyChainRelevance: 'high',
  },
];

// ============================================================================
// ENHANCED EXCHANGE RATE WITH INDICATORS
// ============================================================================

export interface EnhancedExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  
  // Enhanced indicators
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  strength: number; // 0-100
  momentum: 'accelerating' | 'decelerating' | 'stable';
  
  // Technical indicators
  sma7: number; // 7-day Simple Moving Average
  sma30: number; // 30-day Simple Moving Average
  rsi: number; // Relative Strength Index (0-100)
  
  // Visual indicators
  sparkline: number[]; // Last 30 days mini chart data
  supplyChainImpact: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// MARKET SENTIMENT
// ============================================================================

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to +100
  confidence: number; // 0-100
  factors: SentimentFactor[];
  recommendation: string;
}

export interface SentimentFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

// ============================================================================
// SUPPLY CHAIN BENCHMARKS
// ============================================================================

export interface SupplyChainBenchmark {
  id: string;
  name: string;
  category: 'cost' | 'time' | 'quality' | 'efficiency' | 'sustainability';
  value: number;
  unit: string;
  benchmark: number;
  percentile: number; // Your performance vs industry (0-100)
  trend: 'improving' | 'declining' | 'stable';
  icon: string;
}

export const SUPPLY_CHAIN_BENCHMARKS: SupplyChainBenchmark[] = [
  {
    id: 'freight_cost_per_kg',
    name: 'Freight Cost per KG',
    category: 'cost',
    value: 0,
    unit: 'USD/kg',
    benchmark: 2.5,
    percentile: 0,
    trend: 'stable',
    icon: '💵',
  },
  {
    id: 'order_fulfillment_time',
    name: 'Order Fulfillment Time',
    category: 'time',
    value: 0,
    unit: 'days',
    benchmark: 3.5,
    percentile: 0,
    trend: 'stable',
    icon: '⏱️',
  },
  {
    id: 'on_time_delivery',
    name: 'On-Time Delivery Rate',
    category: 'quality',
    value: 0,
    unit: '%',
    benchmark: 95,
    percentile: 0,
    trend: 'stable',
    icon: '✅',
  },
  {
    id: 'warehouse_utilization',
    name: 'Warehouse Utilization',
    category: 'efficiency',
    value: 0,
    unit: '%',
    benchmark: 85,
    percentile: 0,
    trend: 'stable',
    icon: '🏢',
  },
  {
    id: 'carbon_per_shipment',
    name: 'Carbon per Shipment',
    category: 'sustainability',
    value: 0,
    unit: 'kg CO2',
    benchmark: 15,
    percentile: 0,
    trend: 'stable',
    icon: '🌱',
  },
];

// ============================================================================
// REGION PREFERENCES
// ============================================================================

export type MarketRegion = 'global' | 'middle_east' | 'north_america' | 'europe' | 'asia_pacific';

export interface RegionPreference {
  region: MarketRegion;
  currencies: string[];
  indices: string[];
  enabled: boolean;
}
