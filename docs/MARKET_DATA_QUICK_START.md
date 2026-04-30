# 🚀 Market Data Integration - Quick Start

## Get Started in 3 Steps

### Step 1: Get Your Free API Key

1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Get instant API key (no credit card required)

**Free Tier Includes:**
- 500 API calls per day
- 5 API calls per minute
- All features unlocked

---

### Step 2: Add API Key to Your App

Create or edit `.env.local` file in your project root:

```bash
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

**Note**: Without an API key, the app will use mock data (perfect for testing!)

---

### Step 3: View the Dashboard

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: **http://localhost:3000/market-data**

3. You're done! 🎉

---

## What You Get

### 📊 Live Stock Data
- FedEx (FDX)
- UPS
- C.H. Robinson (CHRW)
- Expeditors (EXPD)
- XPO Logistics

**Auto-refreshes every 60 seconds**

### 💰 Commodity Prices
- Crude Oil (WTI & Brent)
- Natural Gas
- Gold & Silver
- Copper & Aluminum

**Auto-refreshes every 5 minutes**

### 💱 Currency Exchange
- USD to EUR
- USD to GBP
- USD to SAR
- More on demand

### 🎯 Supply Chain Impact
- Automatic analysis
- Risk assessment
- Recommendations
- Confidence scoring

---

## Using Widgets in Your Pages

### Stock Widget

```typescript
import { LiveStockWidget } from '@/components/market-data/LiveStockWidget';

<LiveStockWidget />
```

### Commodity Widget

```typescript
import { CommodityPricesWidget } from '@/components/market-data/CommodityPricesWidget';

<CommodityPricesWidget />
```

---

## API Endpoints

### Get Stock Quotes
```bash
GET http://localhost:3000/api/market-data/quotes?symbols=FDX,UPS
```

### Get Logistics Companies
```bash
GET http://localhost:3000/api/market-data/logistics
```

### Get Supply Chain Impact
```bash
GET http://localhost:3000/api/market-data/supply-chain-impact?symbol=FDX
```

---

## Features Overview

| Feature | Status | Auto-Refresh |
|---------|--------|--------------|
| Stock Quotes | ✅ Live | 60 seconds |
| Commodity Prices | ✅ Live | 5 minutes |
| Exchange Rates | ✅ Live | 60 seconds |
| Time Series | ✅ Live | On demand |
| Impact Analysis | ✅ Live | Real-time |
| Knowledge Base | ✅ Active | Event-driven |

---

## Next Steps

1. **Explore the Dashboard**: `/market-data`
2. **Read Full Guide**: `docs/MARKET_DATA_INTEGRATION_GUIDE.md`
3. **Add Custom Symbols**: Modify widget props
4. **Subscribe to Events**: Use Event Bus integration
5. **Build Custom Analytics**: Extend the service

---

## Need Help?

- **Full Documentation**: See `MARKET_DATA_INTEGRATION_GUIDE.md`
- **Alpha Vantage Docs**: https://www.alphavantage.co/documentation/
- **Issues**: Check browser console for errors

---

## That's It! 🎉

You now have live market data integration in your app!

**View it at**: http://localhost:3000/market-data
