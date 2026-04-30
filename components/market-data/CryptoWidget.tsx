/**
 * 🪙 CRYPTOCURRENCY WIDGET
 * Live crypto prices with sparklines
 * 100% FREE - CoinGecko API (No key required!)
 * 
 * Beautiful design with:
 * - Real-time prices
 * - 24h changes
 * - Sparkline charts
 * - Market cap
 * - Volume data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Sparkline } from './Sparkline';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  sparkline7d: number[];
  icon: string;
}

export function CryptoWidget() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalData, setGlobalData] = useState<any>(null);

  useEffect(() => {
    fetchCrypto();
    const interval = setInterval(fetchCrypto, 60000); // Every 1 minute
    return () => clearInterval(interval);
  }, []);

  const fetchCrypto = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/market-data/crypto?coins=bitcoin,ethereum,ripple,cardano,polkadot');
      if (response.ok) {
        const data = await response.json();
        
        const formatted = data.map((crypto: any) => ({
          ...crypto,
          icon: getCryptoIcon(crypto.symbol),
        }));
        
        setCryptos(formatted);
      }
    } catch (error) {
      console.error('Error fetching crypto:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCryptoIcon = (symbol: string): string => {
    const icons: Record<string, string> = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'XRP': '✕',
      'ADA': '₳',
      'DOT': '●',
      'SOL': '◎',
      'MATIC': '⬡',
    };
    return icons[symbol] || '○';
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatMarketCap = (cap: number): string => {
    if (cap >= 1_000_000_000_000) {
      return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
    } else if (cap >= 1_000_000_000) {
      return `$${(cap / 1_000_000_000).toFixed(2)}B`;
    } else if (cap >= 1_000_000) {
      return `$${(cap / 1_000_000).toFixed(2)}M`;
    }
    return `$${cap.toFixed(0)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Cryptocurrency Market
            </CardTitle>
            <CardDescription>
              Live crypto prices • 100% free data via CoinGecko
            </CardDescription>
          </div>
          <Button onClick={fetchCrypto} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-900 dark:text-purple-100">
              Relevant for blockchain-based supply chain tracking and crypto payments
            </span>
          </div>
        </div>

        {loading && cryptos.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading crypto data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cryptos.map((crypto) => {
              const isPositive = crypto.changePercent24h >= 0;
              const sparklineColor = isPositive ? '#22c55e' : '#ef4444';

              return (
                <div
                  key={crypto.id}
                  className="rounded-lg border p-4 hover:shadow-lg transition-all hover:border-purple-500/50 space-y-3 bg-gradient-to-br from-transparent to-purple-500/5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {crypto.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{crypto.name}</h3>
                          <Badge variant="info" className="text-xs">
                            {crypto.symbol}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rank by Market Cap
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPrice(crypto.currentPrice)}
                      </div>
                      <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {isPositive ? '+' : ''}{crypto.changePercent24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  {crypto.sparkline7d.length > 0 && (
                    <div className="py-2">
                      <Sparkline
                        data={crypto.sparkline7d}
                        width={400}
                        height={50}
                        color={sparklineColor}
                        fillColor={isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                        showFill={true}
                        strokeWidth={2}
                        className="w-full"
                      />
                      <div className="text-xs text-center text-muted-foreground mt-1">
                        7-day trend
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Market Cap</div>
                      <div className="font-semibold">{formatMarketCap(crypto.marketCap)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Volume 24h</div>
                      <div className="font-semibold">{formatMarketCap(crypto.volume24h)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">24h Range</div>
                      <div className="font-semibold text-xs">
                        {formatPrice(crypto.low24h)} - {formatPrice(crypto.high24h)}
                      </div>
                    </div>
                  </div>

                  {/* Supply Chain Relevance */}
                  {crypto.symbol === 'BTC' && (
                    <div className="pt-3 border-t">
                      <div className="text-xs font-medium mb-1">Supply Chain Use Cases:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">Cross-border payments</Badge>
                        <Badge variant="secondary" className="text-xs">Smart contracts</Badge>
                        <Badge variant="secondary" className="text-xs">Blockchain tracking</Badge>
                      </div>
                    </div>
                  )}
                  {crypto.symbol === 'ETH' && (
                    <div className="pt-3 border-t">
                      <div className="text-xs font-medium mb-1">Supply Chain Use Cases:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="info" className="text-xs">Smart contracts</Badge>
                        <Badge variant="info" className="text-xs">DeFi logistics</Badge>
                        <Badge variant="info" className="text-xs">NFT tracking</Badge>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          💎 Powered by CoinGecko API • 100% Free • Auto-refreshes every 60 seconds
        </div>
      </CardContent>
    </Card>
  );
}

export default CryptoWidget;
