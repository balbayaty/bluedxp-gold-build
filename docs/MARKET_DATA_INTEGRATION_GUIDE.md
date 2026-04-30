# 📊 Market Data Integration Guide

## Overview

The Market Data Integration provides real-time financial market data, commodity prices, currency exchange rates, and supply chain impact analysis. This guide explains how to set up, use, and extend the market data capabilities.

---

## 🚀 Features

### ✅ Implemented Features

1. **Stock Market Data**
   - Real-time stock quotes
   - Historical time series data
   - Company profiles
   - Symbol search
   - Focus on logistics & supply chain companies

2. **Commodity Prices**
   - Energy commodities (oil, gas)
   - Metals (gold, silver, copper)
   - Agriculture commodities
   - Chemical pricing

3. **Currency Exchange**
   - Real-time exchange rates
   - Multiple currency pairs
   - Historical exchange data

4. **Supply Chain Impact Analysis**
   - Automated impact assessment
   - Risk severity scoring
   - Actionable recommendations
   - Correlation analysis

5. **Knowledge Base Integration**
   - Automatic insight capture
   - Market trend analysis
   - Daily summaries
   - Event-driven learning

6. **Dashboard & Widgets**
   - Live stock widget
   - Commodity prices widget
   - Interactive dashboard
   - Auto-refresh capabilities

---

## 🔧 Setup & Configuration

### Step 1: Get Alpha Vantage API Key

1. **Sign up for free account**: Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. **Get your API key**: Free tier provides:
   - 500 API calls per day
   - 5 API calls per minute
   - No credit card required

### Step 2: Add API Key to Environment

Add to your `.env.local` file:

```bash
# Alpha Vantage API Key for Market Data
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Or use public env var (accessible in browser)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### Step 3: Verify Installation

The integration is automatically activated when the API key is present. If no API key is configured, the service will use mock data for testing.

---

## 📖 Usage Guide

### Accessing the Dashboard

Navigate to: **`/market-data`**

The dashboard provides:
- **Overview Tab**: Combined view of stocks, commodities, and exchange rates
- **Stocks Tab**: Detailed logistics company stock data
- **Commodities Tab**: Energy and materials pricing
- **Impact Analysis Tab**: Supply chain impact assessments

### Using Widgets in Other Pages

#### Live Stock Widget

```typescript
import { LiveStockWidget } from '@/components/market-data/LiveStockWidget';

// Basic usage
<LiveStockWidget />

// Customized
<LiveStockWidget 
  symbols={['FDX', 'UPS', 'CHRW']}
  autoRefresh={true}
  refreshInterval={60}
  showProfile={true}
  compactMode={false}
/>
```

#### Commodity Prices Widget

```typescript
import { CommodityPricesWidget } from '@/components/market-data/CommodityPricesWidget';

<CommodityPricesWidget 
  autoRefresh={true}
  refreshInterval={300}
/>
```

### API Endpoints

#### Get Stock Quotes
```bash
GET /api/market-data/quotes?symbols=FDX,UPS,CHRW&includeProfile=true
```

Response:
```json
{
  "quotes": [
    {
      "symbol": "FDX",
      "name": "FedEx Corporation",
      "price": 245.50,
      "change": 3.25,
      "changePercent": 1.34,
      "volume": 2500000,
      ...
    }
  ],
  "timestamp": "2025-01-07T10:30:00Z",
  "cacheHit": false
}
```

#### Get Time Series Data
```bash
GET /api/market-data/timeseries?symbol=FDX&interval=daily
```

#### Search Symbols
```bash
GET /api/market-data/search?query=fedex
```

#### Get Logistics Companies
```bash
GET /api/market-data/logistics
```

#### Get Commodity Prices
```bash
GET /api/market-data/commodities?symbols=CL=F,GC=F
```

#### Get Exchange Rate
```bash
GET /api/market-data/exchange-rate?from=USD&to=EUR
```

#### Analyze Supply Chain Impact
```bash
GET /api/market-data/supply-chain-impact?symbol=FDX
```

---

## 🏗️ Architecture

### Service Layer

**`lib/services/market-data/marketDataService.ts`**
- Singleton service managing all market data operations
- Rate limiting (5 calls/min, 500 calls/day)
- Intelligent caching (1-60 minute TTL)
- Automatic fallback to mock data
- Event bus integration

**`lib/services/market-data/marketDataKnowledgeBase.ts`**
- Captures market insights automatically
- Stores historical context
- Generates daily summaries
- Integrates with platform Knowledge Base

### API Routes

Located in: `app/api/market-data/`

- `quotes/route.ts` - Stock quotes
- `timeseries/route.ts` - Historical data
- `search/route.ts` - Symbol search
- `logistics/route.ts` - Logistics companies
- `commodities/route.ts` - Commodity prices
- `exchange-rate/route.ts` - Currency exchange
- `supply-chain-impact/route.ts` - Impact analysis

### Types

**`types/market-data.ts`**
- Complete TypeScript type definitions
- Provider configurations
- Request/response interfaces
- Constants for symbols and companies

### Components

Located in: `components/market-data/`

- `LiveStockWidget.tsx` - Real-time stock quotes widget
- `CommodityPricesWidget.tsx` - Commodity prices widget

### Dashboard Page

**`app/market-data/page.tsx`**
- Full-featured market data dashboard
- Tabbed interface
- Auto-refresh capabilities
- Responsive design

---

## 🔄 Data Flow

```
User Request
    ↓
API Route (/api/market-data/*)
    ↓
Market Data Service
    ↓
Check Cache → Cache Hit? → Return Cached Data
    ↓ (Cache Miss)
Rate Limit Check
    ↓
Alpha Vantage API Call
    ↓
Process & Transform Data
    ↓
Store in Cache (TTL: 1-60 min)
    ↓
Publish Event to Event Bus
    ↓
Knowledge Base captures insight
    ↓
Return Data to Client
```

---

## 📊 Supply Chain Relevant Companies

### Logistics & Transportation

| Symbol | Company | Description |
|--------|---------|-------------|
| FDX | FedEx Corporation | Global shipping and logistics |
| UPS | United Parcel Service | Package delivery and supply chain management |
| CHRW | C.H. Robinson Worldwide | Third-party logistics provider |
| EXPD | Expeditors International | Freight forwarding and logistics |
| XPO | XPO Logistics | Transportation and logistics services |
| MAERSKB.CO | A.P. Moller - Maersk | Container shipping and logistics |
| DSV.CO | DSV A/S | Transport and logistics services |
| KNX.DE | Kuehne + Nagel | Global logistics provider |

### Commodities Impact

| Commodity | Symbol | Impact on Supply Chain |
|-----------|--------|------------------------|
| Crude Oil (WTI) | CL=F | Transportation fuel costs |
| Crude Oil (Brent) | BZ=F | International shipping costs |
| Natural Gas | NG=F | Energy costs, heating |
| Gold | GC=F | Currency hedge, precious metals |
| Silver | SI=F | Electronics, materials |
| Copper | HG=F | Construction, electrical |

---

## 🎯 Impact Analysis

### How It Works

1. **Data Collection**: Real-time stock prices fetched
2. **Change Analysis**: Calculate price movements and volatility
3. **Impact Assessment**: Determine affected supply chain areas
4. **Severity Scoring**: Rate impact (low, medium, high, critical)
5. **Recommendations**: Generate actionable advice
6. **Knowledge Capture**: Store insights for future reference

### Impact Severity Levels

| Level | Threshold | Description | Action |
|-------|-----------|-------------|--------|
| **Low** | < 2% change | Minimal impact | Monitor trends |
| **Medium** | 2-5% change | Moderate impact | Review budgets |
| **High** | 5-10% change | Significant impact | Adjust contracts |
| **Critical** | > 10% change | Immediate impact | Execute contingencies |

---

## 🔔 Event Bus Integration

### Published Events

```typescript
// Quote fetched
'market_data.quotes.fetched'
{
  symbols: string[],
  count: number,
  timestamp: Date
}

// Time series fetched
'market_data.timeseries.fetched'
{
  symbol: string,
  interval: string,
  dataPoints: number
}

// Price update
'market_data.price.updated'
{
  symbol: string,
  oldPrice: number,
  newPrice: number,
  change: number
}

// Supply chain impact
'market_data.supply_chain_impact'
{
  symbol: string,
  severity: string,
  impact: SupplyChainImpact
}

// Alert
'alerts.supply_chain.market_impact'
{
  severity: 'high' | 'critical',
  symbol: string,
  impact: SupplyChainImpact
}
```

### Subscribing to Events

```typescript
import { eventBus } from '@/lib/services/event-store';

// Subscribe to market impacts
eventBus.subscribe('market_data.supply_chain_impact', async (event) => {
  console.log('Supply chain impact:', event.data);
  // Your custom logic here
});
```

---

## 🚀 Advanced Usage

### Custom Symbol Monitoring

```typescript
import { marketDataService } from '@/lib/services/market-data/marketDataService';

// Monitor custom symbols
const customSymbols = ['CUSTOM1', 'CUSTOM2', 'CUSTOM3'];

const quotes = await marketDataService.getQuotes({
  symbols: customSymbols,
  includeProfile: true,
});

console.log('Custom quotes:', quotes);
```

### Correlation Analysis

```typescript
// Analyze correlation between two stocks
const correlation = await marketDataService.calculateCorrelation(
  'FDX',  // Symbol 1
  'UPS',  // Symbol 2
  '3M'    // Timeframe
);

console.log(`Correlation: ${correlation.correlation}`);
console.log(`Strength: ${correlation.strength}`);
console.log(`Interpretation: ${correlation.interpretation}`);
```

### Daily Summary Generation

```typescript
import { marketDataKnowledgeBase } from '@/lib/services/market-data/marketDataKnowledgeBase';

// Generate daily summary
const summary = await marketDataKnowledgeBase.generateDailySummary();

console.log(summary.content);
```

---

## 🛠️ Extending the Integration

### Adding New Data Providers

1. Update `types/market-data.ts`:
```typescript
export type MarketDataProvider = 
  | 'alpha_vantage'
  | 'yahoo_finance'
  | 'finnhub'
  | 'your_provider'; // Add here
```

2. Implement provider adapter in service
3. Update configuration
4. Add API credentials

### Adding New Commodity Types

Update `COMMODITY_SYMBOLS` in `types/market-data.ts`:

```typescript
export const COMMODITY_SYMBOLS = {
  // Add your commodity
  NEW_COMMODITY: 'SYMBOL',
};
```

### Custom Impact Analysis

Extend the `calculateSupplyChainImpact` method in `marketDataService.ts`:

```typescript
private calculateSupplyChainImpact(quote: StockQuote): SupplyChainImpact {
  // Your custom logic here
}
```

---

## 📈 Performance & Optimization

### Caching Strategy

| Data Type | Cache TTL | Reason |
|-----------|-----------|--------|
| Real-time quotes | 60 seconds | Balance freshness & API limits |
| Time series | 5 minutes | Historical data changes slowly |
| Company profiles | 1 hour | Rarely changes |
| Search results | 10 minutes | User behavior patterns |

### Rate Limiting

- **Per Minute**: 5 requests (Alpha Vantage free tier)
- **Per Day**: 500 requests
- **Automatic queuing**: Requests are delayed if limit reached
- **Graceful degradation**: Falls back to mock data

### Best Practices

1. **Use caching**: Always check cache before API call
2. **Batch requests**: Fetch multiple symbols in one request
3. **Sensible refresh**: Don't refresh more than every 60 seconds
4. **Handle failures**: Implement proper error handling
5. **Monitor usage**: Track API call count

---

## 🧪 Testing

### Without API Key (Mock Data)

The service automatically provides mock data when no API key is configured. Perfect for development and testing.

### With API Key

1. Add key to `.env.local`
2. Restart development server
3. Navigate to `/market-data`
4. Verify real data is loading

### Testing Components

```typescript
import { render } from '@testing-library/react';
import { LiveStockWidget } from '@/components/market-data/LiveStockWidget';

test('renders live stock widget', () => {
  const { getByText } = render(<LiveStockWidget />);
  expect(getByText(/Live Market Data/i)).toBeInTheDocument();
});
```

---

## 🔍 Troubleshooting

### No Data Showing

1. **Check API key**: Verify key is in `.env.local`
2. **Check rate limits**: You may have exceeded limits
3. **Check browser console**: Look for error messages
4. **Check network tab**: Verify API calls are being made

### Slow Performance

1. **Enable caching**: Ensure caching is enabled in config
2. **Reduce refresh frequency**: Increase `refreshInterval`
3. **Limit symbols**: Fetch only necessary symbols
4. **Check API response time**: Alpha Vantage may be slow

### API Errors

```
Error: Failed to fetch quotes
```

**Solution**: 
- Verify API key is correct
- Check internet connection
- Verify Alpha Vantage service status
- Check rate limits haven't been exceeded

---

## 📚 Additional Resources

### Alpha Vantage Documentation
- [API Documentation](https://www.alphavantage.co/documentation/)
- [FAQ](https://www.alphavantage.co/support/#support)
- [API Key](https://www.alphavantage.co/support/#api-key)

### Alternative Providers (Future)
- **Yahoo Finance**: yfinance library
- **Finnhub**: Real-time financial data
- **IEX Cloud**: Stock market data
- **Quandl**: Financial and economic data

---

## 🎯 Future Enhancements

### Planned Features

- [ ] **Advanced Charts**: Interactive price charts with indicators
- [ ] **Alerts System**: Price alerts and notifications
- [ ] **Portfolio Tracking**: Track multiple watchlists
- [ ] **Predictive Analytics**: ML-based price predictions
- [ ] **News Integration**: Financial news and sentiment analysis
- [ ] **More Providers**: Yahoo Finance, Finnhub, Bloomberg
- [ ] **Benchmark Comparisons**: Gartner, Baltic Dry Index
- [ ] **Export Capabilities**: Download data as CSV/Excel
- [ ] **Mobile Widgets**: Mobile-optimized views
- [ ] **Real-time WebSocket**: Live streaming data

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check Alpha Vantage API status
4. Review code comments in service files

---

## ✅ Summary

You now have a fully functional market data integration that:
- ✅ Fetches real-time stock quotes
- ✅ Tracks commodity prices
- ✅ Monitors currency exchange rates
- ✅ Analyzes supply chain impacts
- ✅ Integrates with Knowledge Base
- ✅ Publishes events to Event Bus
- ✅ Provides interactive dashboard
- ✅ Includes reusable widgets
- ✅ Handles rate limiting & caching
- ✅ Falls back gracefully to mock data

**Ready to use!** Navigate to `/market-data` to see it in action.
