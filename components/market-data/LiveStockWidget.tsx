/**
 * 📊 LIVE STOCK WIDGET
 * Real-time stock market data widget for dashboards
 * 
 * Features:
 * - Live stock quotes
 * - Auto-refresh
 * - Color-coded changes
 * - Supply chain relevant companies
 * - Responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { StockQuote } from '@/types/market-data';

interface LiveStockWidgetProps {
  symbols?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  showProfile?: boolean;
  compactMode?: boolean;
}

export function LiveStockWidget({
  symbols = ['FDX', 'UPS', 'CHRW', 'EXPD', 'XPO'],
  autoRefresh = true,
  refreshInterval = 60,
  showProfile = false,
  compactMode = false,
}: LiveStockWidgetProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const symbolsQuery = symbols.join(',');
      const response = await fetch(
        `/api/market-data/quotes?symbols=${symbolsQuery}&includeProfile=${showProfile}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
      setLastUpdate(new Date());
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentStr = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
    return `${changeStr} (${percentStr})`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toString();
  };

  if (loading && quotes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Market Data
          </CardTitle>
          <CardDescription>Loading stock quotes...</CardDescription>
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
            <Activity className="h-5 w-5" />
            Live Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={fetchQuotes}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compactMode) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Market Data
            </CardTitle>
            <Button
              onClick={fetchQuotes}
              variant="ghost"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {quotes.map((quote) => (
            <div
              key={quote.symbol}
              className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent/50 transition-colors"
            >
              <div>
                <div className="font-semibold text-sm">{quote.symbol}</div>
                <div className="text-xs text-muted-foreground">{formatPrice(quote.price)}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-medium flex items-center gap-1 ${
                  quote.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {quote.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(quote.changePercent).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
          {lastUpdate && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
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
              <Activity className="h-5 w-5" />
              Live Market Data
            </CardTitle>
            <CardDescription>
              Supply chain logistics companies
            </CardDescription>
          </div>
          <Button
            onClick={fetchQuotes}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div
              key={quote.symbol}
              className="rounded-lg border p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{quote.symbol}</h3>
                    <Badge variant="info" className="text-xs">
                      {quote.exchange}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{quote.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatPrice(quote.price)}
                  </div>
                  <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                    quote.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {quote.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatChange(quote.change, quote.changePercent)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Open</div>
                  <div className="font-medium">{formatPrice(quote.open)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">High</div>
                  <div className="font-medium">{formatPrice(quote.high)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Low</div>
                  <div className="font-medium">{formatPrice(quote.low)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Volume</div>
                  <div className="font-medium">{formatVolume(quote.volume)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lastUpdate && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Last updated: {lastUpdate.toLocaleString()}
          </div>
        )}

        {autoRefresh && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Auto-refreshing every {refreshInterval} seconds
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LiveStockWidget;
