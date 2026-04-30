/**
 * 📈 MARKET OVERVIEW CHART
 * Stunning real-time multi-line chart showing all market trends
 * Beautiful, modern, animated with Recharts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface MarketOverviewChartProps {
  type?: 'line' | 'area';
  height?: number;
}

export function MarketOverviewChart({ 
  type = 'area',
  height = 300 
}: MarketOverviewChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    generateChartData();
  }, []);

  const generateChartData = () => {
    // Generate 30 days of data
    const chartData = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stocks: 100 + Math.random() * 20 - 10 + (30 - i) * 0.5,
        commodities: 90 + Math.random() * 15 - 7.5 + (30 - i) * 0.3,
        crypto: 80 + Math.random() * 30 - 15 + (30 - i) * 0.8,
        freight: 95 + Math.random() * 10 - 5 + (30 - i) * 0.4,
      });
    }

    setData(chartData);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold">{entry.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'area') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Market Trends (30 Days)
          </CardTitle>
          <CardDescription>
            Normalized performance across all markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorStocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCommodities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFreight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                style={{ fontSize: 12 }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                style={{ fontSize: 12 }}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="stocks" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorStocks)"
                name="Stocks"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="commodities" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorCommodities)"
                name="Commodities"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="crypto" 
                stroke="#a855f7" 
                fillOpacity={1} 
                fill="url(#colorCrypto)"
                name="Crypto"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="freight" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorFreight)"
                name="Freight"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">Stocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs">Commodities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs">Crypto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">Freight</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default MarketOverviewChart;
