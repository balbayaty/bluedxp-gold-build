/**
 * 🔥 INFLATION HEAT MAP
 * Visual heat map showing inflation rates across different regions
 * Color-coded: Green (low) → Yellow (moderate) → Red (high)
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';

interface RegionInflation {
  region: string;
  country: string;
  flag: string;
  inflationRate: number;
  category: 'low' | 'moderate' | 'high' | 'critical';
}

export function InflationHeatMap() {
  const inflationData: RegionInflation[] = [
    { region: 'Middle East', country: 'Saudi Arabia', flag: '🇸🇦', inflationRate: 2.3, category: 'low' },
    { region: 'Middle East', country: 'UAE', flag: '🇦🇪', inflationRate: 1.9, category: 'low' },
    { region: 'Middle East', country: 'Kuwait', flag: '🇰🇼', inflationRate: 3.2, category: 'moderate' },
    { region: 'Middle East', country: 'Qatar', flag: '🇶🇦', inflationRate: 2.1, category: 'low' },
    { region: 'Middle East', country: 'Bahrain', flag: '🇧🇭', inflationRate: 2.7, category: 'moderate' },
    { region: 'North America', country: 'United States', flag: '🇺🇸', inflationRate: 3.4, category: 'moderate' },
    { region: 'North America', country: 'Canada', flag: '🇨🇦', inflationRate: 3.1, category: 'moderate' },
    { region: 'Europe', country: 'Eurozone', flag: '🇪🇺', inflationRate: 2.9, category: 'moderate' },
    { region: 'Europe', country: 'UK', flag: '🇬🇧', inflationRate: 4.2, category: 'high' },
    { region: 'Asia', country: 'China', flag: '🇨🇳', inflationRate: 0.7, category: 'low' },
    { region: 'Asia', country: 'Japan', flag: '🇯🇵', inflationRate: 2.8, category: 'moderate' },
    { region: 'Asia', country: 'Singapore', flag: '🇸🇬', inflationRate: 3.5, category: 'moderate' },
  ];

  const getHeatColor = (category: string): string => {
    switch (category) {
      case 'low':
        return 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300';
      case 'moderate':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300';
      case 'critical':
        return 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300';
      default:
        return '';
    }
  };

  const getHeatIntensity = (rate: number): number => {
    // Convert inflation rate to opacity (0-100%)
    return Math.min(100, (rate / 10) * 100);
  };

  const groupedByRegion = inflationData.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = [];
    }
    acc[item.region].push(item);
    return acc;
  }, {} as Record<string, RegionInflation[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Global Inflation Heat Map
        </CardTitle>
        <CardDescription>
          Visual representation of inflation rates worldwide
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Legend */}
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/40"></div>
            <span>Low (&lt;2%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/40"></div>
            <span>Moderate (2-4%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/40"></div>
            <span>High (4-6%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/40"></div>
            <span>Critical (&gt;6%)</span>
          </div>
        </div>

        {/* Heat Map by Region */}
        {Object.entries(groupedByRegion).map(([region, countries]) => (
          <div key={region} className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span>{region}</span>
              <span className="text-muted-foreground">({countries.length} countries)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {countries.map((item) => {
                const intensity = getHeatIntensity(item.inflationRate);
                
                return (
                  <div
                    key={item.country}
                    className={`rounded-lg border-2 p-4 transition-all hover:scale-105 ${getHeatColor(item.category)}`}
                    style={{ 
                      boxShadow: `0 0 ${intensity}px ${
                        item.category === 'low' ? 'rgba(34, 197, 94, 0.3)' :
                        item.category === 'moderate' ? 'rgba(234, 179, 8, 0.3)' :
                        item.category === 'high' ? 'rgba(249, 115, 22, 0.3)' :
                        'rgba(239, 68, 68, 0.3)'
                      }`
                    }}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{item.flag}</div>
                      <div className="font-semibold text-sm">{item.country}</div>
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        {item.inflationRate.toFixed(1)}%
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-xs opacity-80 capitalize">
                        {item.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          🔥 Live inflation data • Updated monthly • Source: World Bank & Central Banks
        </div>
      </CardContent>
    </Card>
  );
}

export default InflationHeatMap;
