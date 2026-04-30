/**
 * 🌍 GLOBAL MARKET INDICES WIDGET
 * Baltic Dry Index, CPI, PMI, and other supply chain relevant indices
 * Beautiful visualizations with trend indicators
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Ship, 
  DollarSign,
  Activity,
  RefreshCw,
  BarChart3,
  Package,
  Truck
} from 'lucide-react';
import { GLOBAL_INDICES } from '@/types/enhanced-market-data';
import type { GlobalMarketIndex } from '@/types/enhanced-market-data';

interface IndexData extends GlobalMarketIndex {
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export function GlobalIndicesWidget() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'freight' | 'stock_market' | 'economic' | 'supply_chain'>('all');
  const [selectedRelevance, setSelectedRelevance] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchIndices = async () => {
    setLoading(true);
    try {
      // Generate realistic index data (in production, this would fetch from APIs)
      const mockIndices: IndexData[] = GLOBAL_INDICES.map(index => {
        const baseValue = getBaseValue(index.id);
        const randomChange = (Math.random() - 0.5) * 10;
        const value = baseValue + randomChange;
        const change = randomChange;
        const changePercent = (change / baseValue) * 100;

        return {
          ...index,
          value,
          change,
          changePercent,
          trend: changePercent > 0.5 ? 'up' : changePercent < -0.5 ? 'down' : 'stable',
          lastUpdated: new Date(),
        };
      });

      setIndices(mockIndices);
    } catch (error) {
      console.error('Error fetching indices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBaseValue = (id: string): number => {
    const baseValues: Record<string, number> = {
      'sp500': 4500,
      'dow': 35000,
      'nasdaq': 14000,
      'baltic_dry': 1500,
      'baltic_capesize': 2000,
      'baltic_panamax': 1200,
      'shanghai_containerized': 1000,
      'wca_container': 2500,
      'us_cpi': 305,
      'us_ppi': 280,
      'pmi_manufacturing': 52,
      'cass_freight': 110,
      'logistics_managers': 55,
    };
    return baseValues[id] || 100;
  };

  const formatValue = (value: number, id: string): string => {
    if (id.includes('pmi') || id.includes('logistics')) {
      return value.toFixed(1);
    }
    if (value > 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'freight':
        return <Ship className="h-5 w-5 text-blue-500" />;
      case 'stock_market':
        return <BarChart3 className="h-5 w-5 text-green-500" />;
      case 'economic':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'supply_chain':
        return <Package className="h-5 w-5 text-purple-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRelevanceBadge = (relevance: string) => {
    const colors = {
      high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    };
    return colors[relevance as keyof typeof colors] || colors.low;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const filteredIndices = indices.filter(index => {
    if (selectedCategory !== 'all' && index.category !== selectedCategory) return false;
    if (selectedRelevance !== 'all' && index.supplyChainRelevance !== selectedRelevance) return false;
    return true;
  });

  const groupedIndices = filteredIndices.reduce((acc, index) => {
    if (!acc[index.category]) {
      acc[index.category] = [];
    }
    acc[index.category].push(index);
    return acc;
  }, {} as Record<string, IndexData[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Global Market Indices
            </CardTitle>
            <CardDescription>
              Key supply chain and economic indicators
            </CardDescription>
          </div>
          <Button onClick={fetchIndices} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'info'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Badge>
            <Badge
              variant={selectedCategory === 'freight' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('freight')}
            >
              🚢 Freight
            </Badge>
            <Badge
              variant={selectedCategory === 'supply_chain' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('supply_chain')}
            >
              📦 Supply Chain
            </Badge>
            <Badge
              variant={selectedCategory === 'economic' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('economic')}
            >
              💰 Economic
            </Badge>
            <Badge
              variant={selectedCategory === 'stock_market' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('stock_market')}
            >
              📈 Stock Market
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge
            variant={selectedRelevance === 'all' ? 'default' : 'info'}
            className="cursor-pointer"
            onClick={() => setSelectedRelevance('all')}
          >
            All Relevance
          </Badge>
          <Badge
            variant={selectedRelevance === 'high' ? 'default' : 'info'}
            className="cursor-pointer"
            onClick={() => setSelectedRelevance('high')}
          >
            High Impact
          </Badge>
        </div>

        {/* Indices Grid */}
        {loading && indices.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading indices...</p>
          </div>
        ) : Object.keys(groupedIndices).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No indices match your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedIndices).map(([category, categoryIndices]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <h3 className="font-semibold capitalize">{category.replace('_', ' ')}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryIndices.length} indices
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryIndices.map((index) => (
                    <div
                      key={index.id}
                      className="rounded-lg border p-4 hover:shadow-md transition-all hover:border-primary/50 space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{index.icon}</span>
                            <div className="font-semibold text-sm">{index.name}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{index.description}</div>
                        </div>
                        <Badge variant="default" className={`text-xs ${getRelevanceBadge(index.supplyChainRelevance)}`}>
                          {index.supplyChainRelevance}
                        </Badge>
                      </div>

                      {/* Value */}
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {formatValue(index.value, index.id)}
                        </div>
                        <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(index.trend)}`}>
                          {index.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                          {index.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                          {index.trend === 'stable' && <Activity className="h-4 w-4" />}
                          {index.changePercent > 0 && '+'}
                          {index.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                        <span>Symbol: {index.symbol}</span>
                        <span>{index.region.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default GlobalIndicesWidget;
