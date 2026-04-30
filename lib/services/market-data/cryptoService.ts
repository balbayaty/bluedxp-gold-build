/**
 * 🪙 CRYPTOCURRENCY INTEGRATION
 * CoinGecko API - 100% FREE, NO API KEY REQUIRED!
 * 
 * Features:
 * - Bitcoin, Ethereum, and other crypto prices
 * - 24h price changes
 * - Market cap data
 * - Trading volume
 * - Supply chain payment relevance
 */

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply: number;
  lastUpdated: Date;
  sparkline7d: number[];
}

export class CryptoService {
  private static instance: CryptoService;
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Get crypto prices - 100% FREE, NO API KEY!
   */
  async getCryptoPrices(
    coins: string[] = ['bitcoin', 'ethereum', 'ripple', 'cardano', 'polkadot']
  ): Promise<CryptoPrice[]> {
    const cacheKey = `crypto:${coins.join(',')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const idsParam = coins.join(',');
      const url = `${this.COINGECKO_API}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('CoinGecko API error');
      }

      const data = await response.json();

      const prices: CryptoPrice[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        change24h: coin.price_change_24h,
        changePercent24h: coin.price_change_percentage_24h,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        lastUpdated: new Date(coin.last_updated),
        sparkline7d: coin.sparkline_in_7d?.price?.slice(-30) || [],
      }));

      this.setCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Return mock data as fallback
      return this.getMockCryptoPrices(coins);
    }
  }

  /**
   * Get global crypto market data
   */
  async getGlobalCryptoData(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    marketCapChange24h: number;
  }> {
    try {
      const url = `${this.COINGECKO_API}/global`;
      const response = await fetch(url);
      const data = await response.json();

      return {
        totalMarketCap: data.data.total_market_cap.usd,
        totalVolume24h: data.data.total_volume.usd,
        btcDominance: data.data.market_cap_percentage.btc,
        marketCapChange24h: data.data.market_cap_change_percentage_24h_usd,
      };
    } catch (error) {
      console.error('Error fetching global crypto data:', error);
      return {
        totalMarketCap: 2_500_000_000_000,
        totalVolume24h: 100_000_000_000,
        btcDominance: 52,
        marketCapChange24h: 2.5,
      };
    }
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getMockCryptoPrices(coins: string[]): CryptoPrice[] {
    const mockData: Record<string, Partial<CryptoPrice>> = {
      bitcoin: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: 45000,
        marketCap: 880_000_000_000,
        volume24h: 25_000_000_000,
        changePercent24h: 2.5,
      },
      ethereum: {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        currentPrice: 2400,
        marketCap: 290_000_000_000,
        volume24h: 15_000_000_000,
        changePercent24h: 3.2,
      },
      ripple: {
        id: 'ripple',
        symbol: 'XRP',
        name: 'Ripple',
        currentPrice: 0.65,
        marketCap: 35_000_000_000,
        volume24h: 1_500_000_000,
        changePercent24h: -1.2,
      },
    };

    return coins.map(coin => {
      const mock = mockData[coin] || mockData.bitcoin;
      const basePrice = mock.currentPrice || 100;
      const change = (basePrice * (mock.changePercent24h || 0)) / 100;

      return {
        id: mock.id || coin,
        symbol: mock.symbol || coin.substring(0, 3).toUpperCase(),
        name: mock.name || coin,
        currentPrice: basePrice,
        marketCap: mock.marketCap || 1_000_000_000,
        volume24h: mock.volume24h || 100_000_000,
        change24h: change,
        changePercent24h: mock.changePercent24h || 0,
        high24h: basePrice * 1.05,
        low24h: basePrice * 0.95,
        circulatingSupply: 19_000_000,
        totalSupply: 21_000_000,
        lastUpdated: new Date(),
        sparkline7d: Array.from({ length: 30 }, (_, i) => 
          basePrice * (0.9 + Math.random() * 0.2)
        ),
      };
    });
  }
}

export const cryptoService = CryptoService.getInstance();
export default cryptoService;
