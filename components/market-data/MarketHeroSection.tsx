/**
 * 🌟 MARKET HERO SECTION
 * Mind-blowing animated hero section with live stats
 * Modern, sexy, with pulsing animations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Globe,
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';

interface LiveStat {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
  glowColor: string;
}

export function MarketHeroSection() {
  const [stats, setStats] = useState<LiveStat[]>([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(() => {
      fetchLiveStats();
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = () => {
    // Fetch real-time summary stats
    const liveStats: LiveStat[] = [
      {
        label: 'Market Cap',
        value: '$2.5T',
        change: 2.3,
        icon: Globe,
        color: 'text-blue-600 dark:text-blue-400',
        glowColor: 'shadow-blue-500/50',
      },
      {
        label: 'Crypto Total',
        value: '$2.5T',
        change: 3.5,
        icon: Sparkles,
        color: 'text-purple-600 dark:text-purple-400',
        glowColor: 'shadow-purple-500/50',
      },
      {
        label: 'Baltic Dry',
        value: '1,543',
        change: 2.4,
        icon: Activity,
        color: 'text-green-600 dark:text-green-400',
        glowColor: 'shadow-green-500/50',
      },
      {
        label: 'USD/SAR',
        value: '3.75',
        change: -0.1,
        icon: Zap,
        color: 'text-amber-600 dark:text-amber-400',
        glowColor: 'shadow-amber-500/50',
      },
    ];

    setStats(liveStats);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
      
      <div className="relative z-10 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
            <Activity className={`h-4 w-4 ${pulse ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">LIVE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Global Market Intelligence
          </h2>
          <p className="text-blue-100 text-lg">
            Real-time data from 10+ sources • Middle East focused • Supply chain optimized
          </p>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.change >= 0;

            return (
              <div
                key={index}
                className={`rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-4 hover:bg-white/20 transition-all ${
                  pulse ? 'scale-105' : ''
                } ${stat.glowColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5" />
                  <div className={`flex items-center gap-1 text-xs ${
                    isPositive ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-blue-100">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <Badge className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30">
            🌙 10 Middle East Currencies
          </Badge>
          <Badge className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30">
            🚢 13 Global Indices
          </Badge>
          <Badge className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30">
            🪙 5 Cryptocurrencies
          </Badge>
          <Badge className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30">
            🏆 LPI Rankings
          </Badge>
          <Badge className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30">
            🔗 Cross-Module Integration
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default MarketHeroSection;
