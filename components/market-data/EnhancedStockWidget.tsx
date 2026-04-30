/**
 * 📊 ENHANCED STOCK WIDGET WITH SPARKLINES
 * Beautiful stock quotes with mini charts and advanced indicators
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Sparkline } from './Sparkline';
import type { StockQuote } from '@/types/market-data';

interface EnhancedStockWidgetProps {
  symbols?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  showSparklines?: boolean;
}

export function EnhancedStockWidget({
  symbols = ['FDX', 'UPS', 'CHRW', 'EXPD', 'XPO'],
  autoRefresh = true,
  refreshInterval = 60,
  showSparklines = true,
}: EnhancedStockWidgetProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const symbolsQuery = symbols.join(',');
      const response = await fetch(
        `/api/market-data/quotes?symbols=${symbolsQuery}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);

      // Generate sparkline data (mock historical prices)
      if (showSparklines) {
        const newSparklines: Record<string, number[]> = {};
        for (const quote of data.quotes || []) {
          newSparklines[quote.symbol] = generateMockSparkline(quote.price, 30);
        }
        setSparklineData(newSparklines);
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();

    if (autoRefresh) {
      const interval = setInterval(fetchQuotes, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [symbols.join(','), autoRefresh, refreshInterval]);

  const generateMockSparkline = (currentPrice: number, points: number): number[] => {
    const data: number[] = [];
    let price = currentPrice * (0.95 + Math.random() * 0.1); // Start slightly varied

    for (let i = 0; i < points; i++) {
      data.push(price);
      price = price * (0.98 + Math.random() * 0.04); // Random walk
    }

    return data;
  };

  const getStrengthIndicator = (changePercent: number): { label: string; color: string; icon: any } => {
    if (Math.abs(changePercent) > 5) {
      return { 
        label: 'Strong Move', 
        color: changePercent > 0 ? 'text-green-600' : 'text-red-600',
        icon: Zap
      };
    } else if (Math.abs(changePercent) > 2) {
      return { 
        label: 'Active', 
        color: changePercent > 0 ? 'text-green-600' : 'text-red-600',
        icon: Activity
      };
    }
    return { 
      label: 'Stable', 
      color: 'text-gray-600',
      icon: Activity
    };
  };

  const getMarketCapBadge = (marketCap?: number): string => {
    if (!marketCap) return 'N/A';
    if (marketCap > 200_000_000_000) return 'Mega Cap';
    if (marketCap > 10_000_000_000) return 'Large Cap';
    if (marketCap > 2_000_000_000) return 'Mid Cap';
    return 'Small Cap';
  };

  if (loading && quotes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Stock Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Stock Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">Error Loading Data</span>
            </div>
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button onClick={fetchQuotes} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Enhanced Stock Market Data
            </CardTitle>
            <CardDescription>
              Logistics companies with trend visualization
            </CardDescription>
          </div>
          <Button onClick={fetchQuotes} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {quotes.map((quote) => {
          const strength = getStrengthIndicator(quote.changePercent);
          const StrengthIcon = strength.icon;
          const sparkline = sparklineData[quote.symbol] || [];
          const sparklineColor = quote.changePercent >= 0 ? '#22c55e' : '#ef4444';

          return (
            <div
              key={quote.symbol}
              className="rounded-lg border p-4 hover:shadow-lg transition-all hover:border-primary/50 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{quote.symbol}</h3>
                    <Badge variant="info" className="text-xs">
                      {quote.exchange}
                    </Badge>
                    <Badge variant="info" className="text-xs">
                      {getMarketCapBadge(quote.marketCap)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{quote.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    ${quote.price.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                    quote.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {quote.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              {showSparklines && sparkline.length > 0 && (
                <div className="py-2">
                  <Sparkline
                    data={sparkline}
                    width={400}
                    height={40}
                    color={sparklineColor}
                    fillColor={quote.changePercent >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                    showFill={true}
                    strokeWidth={2}
                    className="w-full"
                  />
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-4 pt-3 border-t text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Open</div>
                  <div className="font-medium">${quote.open.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">High</div>
                  <div className="font-medium text-green-600">${quote.high.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Low</div>
                  <div className="font-medium text-red-600">${quote.low.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Volume</div>
                  <div className="font-medium">
                    {quote.volume >= 1000000 
                      ? `${(quote.volume / 1000000).toFixed(2)}M`
                      : `${(quote.volume / 1000).toFixed(0)}K`
                    }
                  </div>
                </div>
              </div>

              {/* Strength Indicator */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <StrengthIcon className={`h-4 w-4 ${strength.color}`} />
                  <span className={`text-sm font-medium ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Supply Chain Relevance: High
                </div>
              </div>
            </div>
          );
        })}

        {/* Last Updated */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          Auto-refreshing every {refreshInterval} seconds • Last update: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedStockWidget;
