/**
 * 💰 COMMODITY PRICES WIDGET
 * Real-time commodity prices (oil, gas, metals, etc.)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Fuel, TrendingUp, TrendingDown } from 'lucide-react';
import type { CommodityPrice } from '@/types/market-data';

interface CommodityPricesWidgetProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CommodityPricesWidget({
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes
}: CommodityPricesWidgetProps) {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/market-data/commodities');

      if (!response.ok) {
        throw new Error('Failed to fetch commodity prices');
      }

      const data = await response.json();
      setCommodities(data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching commodities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();

    if (autoRefresh) {
      const interval = setInterval(fetchCommodities, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      energy: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
      metals: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      agriculture: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      chemicals: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700';
  };

  if (loading && commodities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Commodity Prices
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Commodity Prices
            </CardTitle>
            <CardDescription>
              Energy, metals, and materials
            </CardDescription>
          </div>
          <Button
            onClick={fetchCommodities}
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
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commodities.map((commodity, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{commodity.commodity}</h3>
                    <Badge 
                      variant="info" 
                      className={`text-xs mt-1 ${getCategoryColor(commodity.category)}`}
                    >
                      {commodity.category}
                    </Badge>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  commodity.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {commodity.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(commodity.changePercent).toFixed(2)}%
                </div>
              </div>

              <div className="text-2xl font-bold mb-1">
                {commodity.price.toFixed(2)} {commodity.currency}
              </div>
              <div className="text-sm text-muted-foreground">
                per {commodity.unit}
              </div>
            </div>
          ))}
        </div>

        {lastUpdate && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Last updated: {lastUpdate.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CommodityPricesWidget;
