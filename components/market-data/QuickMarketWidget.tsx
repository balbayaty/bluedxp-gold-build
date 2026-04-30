/**
 * ⚡ QUICK MARKET WIDGET
 * Compact widget for embedding in ANY dashboard
 * Shows key market metrics at a glance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Link from 'next/link';

export function QuickMarketWidget() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchQuickData();
    const interval = setInterval(fetchQuickData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuickData = async () => {
    try {
      const [stocks, crypto, currency] = await Promise.all([
        fetch('/api/market-data/quotes?symbols=FDX').then(r => r.json()),
        fetch('/api/market-data/crypto?coins=bitcoin').then(r => r.json()),
        fetch('/api/market-data/exchange-rate?from=USD&to=SAR').then(r => r.json()),
      ]);

      setData({ stocks, crypto, currency });
    } catch (error) {
      console.error('Error fetching quick market data:', error);
    }
  };

  if (!data) return null;

  const stock = data.stocks?.quotes?.[0];
  const btc = data.crypto?.[0];
  const sar = data.currency;

  return (
    <Link href="/market-data" className="block">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Live Market Data
          </h3>
          <span className="text-xs text-cyan-400">View All →</span>
        </div>
        <div className="space-y-2">
          {stock && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">FedEx</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">${stock.price?.toFixed(2)}</span>
                <span className={stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {stock.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
              </div>
            </div>
          )}
          {btc && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Bitcoin</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">${btc.currentPrice?.toLocaleString()}</span>
                <span className={btc.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {btc.changePercent24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
              </div>
            </div>
          )}
          {sar && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">USD/SAR</span>
              <span className="text-white font-medium">{sar.rate?.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default QuickMarketWidget;
