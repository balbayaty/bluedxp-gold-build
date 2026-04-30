/**
 * 📊 MARKET DATA MODULE DEFINITION
 * Global market intelligence and benchmarks
 * Integrates with WMS, TMS, Finance, ISO-IMS, QHSE, Procurement
 */

import type { ModuleDefinition } from './registry';

export const marketDataModule: ModuleDefinition = {
  id: 'market-data',
  name: 'Market Data & Benchmarks',
  description: 'Real-time global market data, industry benchmarks, and supply chain intelligence',
  version: '1.0.0',
  category: 'analytics',
  standalone: true,
  
  // Dependencies - can work with these modules for enhanced features
  dependencies: [],
  
  // Routes
  routes: [
    {
      path: '/market-data',
      component: 'app/market-data/page.tsx',
      title: 'Market Data Dashboard',
      name: 'Market Data',
      icon: 'Activity',
      requiresAuth: true,
      roles: ['admin', 'manager', 'analyst', 'finance_manager'],
    },
  ],

  // API Endpoints
  apis: [
    {
      endpoint: '/api/market-data/quotes',
      method: 'GET',
      description: 'Get stock quotes',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/crypto',
      method: 'GET',
      description: 'Get cryptocurrency prices',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/currencies',
      method: 'GET',
      description: 'Get currency exchange rates',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/commodities',
      method: 'GET',
      description: 'Get commodity prices',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/lpi',
      method: 'GET',
      description: 'Get Logistics Performance Index',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/saudi-arabia',
      method: 'GET',
      description: 'Get comprehensive Saudi Arabia data',
      requiresAuth: false,
    },
    {
      endpoint: '/api/market-data/benchmarks',
      method: 'GET',
      description: 'Get supply chain benchmarks',
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
    {
      endpoint: '/api/market-data/cross-module-impact',
      method: 'GET',
      description: 'Get cross-module market impact analysis',
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
  ],

  // Widgets for dashboard
  widgets: [
    {
      id: 'live-stock-widget',
      name: 'Live Stock Prices',
      description: 'Real-time stock quotes for logistics companies',
      component: 'components/market-data/LiveStockWidget',
      size: 'medium',
      permissions: ['view_market_data'],
    },
    {
      id: 'crypto-widget',
      name: 'Cryptocurrency Prices',
      description: 'Live crypto prices from CoinGecko',
      component: 'components/market-data/CryptoWidget',
      size: 'medium',
      permissions: ['view_market_data'],
    },
    {
      id: 'currency-widget',
      name: 'Currency Exchange',
      description: 'Live exchange rates with Middle East focus',
      component: 'components/market-data/EnhancedCurrencyWidget',
      size: 'large',
      permissions: ['view_market_data'],
    },
    {
      id: 'saudi-widget',
      name: 'Saudi Arabia Intelligence',
      description: 'Comprehensive Saudi market data',
      component: 'components/market-data/ComprehensiveSaudiWidget',
      size: 'full',
      permissions: ['view_market_data'],
    },
    {
      id: 'benchmarks-widget',
      name: 'Supply Chain Benchmarks',
      description: 'Performance metrics vs industry',
      component: 'components/market-data/SupplyChainBenchmarksWidget',
      size: 'large',
      permissions: ['view_benchmarks'],
    },
    {
      id: 'cross-module-impact',
      name: 'Market Impact Analysis',
      description: 'How markets affect your operations',
      component: 'components/market-data/CrossModuleImpactWidget',
      size: 'large',
      permissions: ['view_market_data', 'view_analytics'],
    },
  ],

  // Settings
  settings: [
    {
      key: 'alpha_vantage_api_key',
      value: process.env.ALPHA_VANTAGE_API_KEY || '',
      type: 'string',
      description: 'Alpha Vantage API key for stock market data',
      required: false,
      default: '',
    },
    {
      key: 'fred_api_key',
      value: process.env.FRED_API_KEY || '',
      type: 'string',
      description: 'FRED API key for economic indicators',
      required: false,
      default: '',
    },
    {
      key: 'auto_refresh_enabled',
      value: true,
      type: 'boolean',
      description: 'Enable auto-refresh for market data',
      required: false,
      default: true,
    },
    {
      key: 'refresh_interval',
      value: 60,
      type: 'number',
      description: 'Auto-refresh interval in seconds',
      required: false,
      default: 60,
    },
    {
      key: 'middle_east_focus',
      value: true,
      type: 'boolean',
      description: 'Enable Middle East currency focus',
      required: false,
      default: true,
    },
  ],

  // Feature flags
  featureFlags: {
    stocks: true,
    crypto: true,
    currencies: true,
    commodities: true,
    indices: true,
    lpi: true,
    benchmarks: true,
    saudiArabia: true,
    crossModuleImpact: true,
    export: true,
  },

  enabled: true,

  // Integration points with other modules
  integrations: {
    wms: {
      events: ['market_data.currency.changed', 'market_data.commodity.changed'],
      description: 'Currency and commodity changes affect inventory valuation',
    },
    tms: {
      events: ['market_data.freight_index.changed', 'market_data.fuel.changed'],
      description: 'Freight indices and fuel prices affect transportation costs',
    },
    finance: {
      events: ['market_data.*'],
      description: 'All market data relevant for financial planning',
    },
    'iso-ims': {
      events: ['market_data.cpi.changed'],
      description: 'Inflation affects compliance and audit costs',
    },
    qhse: {
      events: ['market_data.pmi.changed'],
      description: 'Manufacturing activity affects safety resource needs',
    },
    procurement: {
      events: ['market_data.commodity.changed', 'market_data.currency.changed'],
      description: 'Commodity prices and exchange rates affect procurement costs',
    },
  },
};

export default marketDataModule;
