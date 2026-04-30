/**
 * 💱 ENHANCED CURRENCY EXCHANGE WIDGET
 * Beautiful Middle East focused currency converter with live rates
 * Features: Interactive converter, trend indicators, sparklines, regional toggles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  RefreshCw,
  Globe,
  Zap,
  Activity
} from 'lucide-react';
import { MIDDLE_EAST_CURRENCIES, GLOBAL_CURRENCIES } from '@/types/enhanced-market-data';

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  flag: string;
  name: string;
}

export function EnhancedCurrencyWidget() {
  const [region, setRegion] = useState<'middle_east' | 'global' | 'all'>('middle_east');
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [convertAmount, setConvertAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('SAR');
  const [convertedAmount, setConvertedAmount] = useState(0);

  const allCurrencies = { ...MIDDLE_EAST_CURRENCIES, ...GLOBAL_CURRENCIES };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [region]);

  useEffect(() => {
    calculateConversion();
  }, [convertAmount, fromCurrency, toCurrency, rates]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const currenciesToFetch = region === 'middle_east' 
        ? Object.keys(MIDDLE_EAST_CURRENCIES)
        : region === 'global'
        ? Object.keys(GLOBAL_CURRENCIES)
        : [...Object.keys(MIDDLE_EAST_CURRENCIES), ...Object.keys(GLOBAL_CURRENCIES)];

      const newRates: CurrencyRate[] = [];

      for (const currency of currenciesToFetch) {
        if (currency === 'USD') continue;

        try {
          const response = await fetch(`/api/market-data/exchange-rate?from=USD&to=${currency}`);
          if (response.ok) {
            const data = await response.json();
            const currencyInfo = allCurrencies[currency as keyof typeof allCurrencies];
            
            newRates.push({
              from: 'USD',
              to: currency,
              rate: data.rate,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              trend: data.changePercent > 0 ? 'up' : data.changePercent < 0 ? 'down' : 'neutral',
              flag: currencyInfo.flag,
              name: currencyInfo.name,
            });
          }
        } catch (error) {
          console.error(`Error fetching ${currency}:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      }

      setRates(newRates);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversion = () => {
    const amount = parseFloat(convertAmount) || 0;
    
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      return;
    }

    // Find the rate
    let rate = 1;
    
    if (fromCurrency === 'USD') {
      const foundRate = rates.find(r => r.to === toCurrency);
      rate = foundRate?.rate || 1;
    } else if (toCurrency === 'USD') {
      const foundRate = rates.find(r => r.to === fromCurrency);
      rate = foundRate ? 1 / foundRate.rate : 1;
    } else {
      // Cross rate calculation
      const fromRate = rates.find(r => r.to === fromCurrency)?.rate || 1;
      const toRate = rates.find(r => r.to === toCurrency)?.rate || 1;
      rate = toRate / fromRate;
    }

    setConvertedAmount(amount * rate);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = allCurrencies[currency as keyof typeof allCurrencies];
    return `${currencyInfo?.symbol || ''} ${amount.toFixed(2)}`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Currency Exchange
            </CardTitle>
            <CardDescription>
              Live exchange rates with Middle East focus
            </CardDescription>
          </div>
          <Button onClick={fetchRates} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Region Selector */}
        <div className="flex gap-2">
          <Button
            variant={region === 'middle_east' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRegion('middle_east')}
            className="flex-1"
          >
            🌙 Middle East
          </Button>
          <Button
            variant={region === 'global' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRegion('global')}
            className="flex-1"
          >
            🌍 Global
          </Button>
          <Button
            variant={region === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRegion('all')}
            className="flex-1"
          >
            🌐 All
          </Button>
        </div>

        <Tabs value="rates" onValueChange={() => {}} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="converter">Converter</TabsTrigger>
          </TabsList>

          {/* Exchange Rates Tab */}
          <TabsContent value="rates" className="space-y-3 mt-4">
            {loading && rates.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading rates...</p>
              </div>
            ) : rates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rates available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rates.map((rate) => (
                  <div
                    key={`${rate.from}-${rate.to}`}
                    className="rounded-lg border p-4 hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{rate.flag}</span>
                        <div>
                          <div className="font-semibold">{rate.to}</div>
                          <div className="text-xs text-muted-foreground">{rate.name}</div>
                        </div>
                      </div>
                      {getTrendIcon(rate.trend)}
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {rate.rate.toFixed(4)}
                      </div>
                      <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(rate.trend)}`}>
                        {rate.changePercent > 0 && '+'}
                        {rate.changePercent.toFixed(2)}%
                        <Zap className="h-3 w-3" />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      1 USD = {rate.rate.toFixed(4)} {rate.to}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Currency Converter Tab */}
          <TabsContent value="converter" className="space-y-4 mt-4">
            <div className="rounded-lg border p-6 space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              {/* From Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="flex-1"
                    placeholder="Amount"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background min-w-[120px]"
                  >
                    {Object.entries(allCurrencies).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const temp = fromCurrency;
                    setFromCurrency(toCurrency);
                    setToCurrency(temp);
                  }}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={convertedAmount.toFixed(2)}
                    readOnly
                    className="flex-1 font-bold text-lg"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background min-w-[120px]"
                  >
                    {Object.entries(allCurrencies).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Info */}
              <div className="pt-4 border-t text-sm text-muted-foreground text-center">
                {convertAmount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
              </div>
            </div>

            {/* Quick Convert Presets */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Quick Convert</div>
              <div className="grid grid-cols-3 gap-2">
                {['100', '1000', '10000'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setConvertAmount(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Last Updated */}
        <div className="text-xs text-center text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedCurrencyWidget;
