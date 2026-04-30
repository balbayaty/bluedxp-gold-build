/**
 * 📊 COMPREHENSIVE MARKET INTELLIGENCE DASHBOARD
 * Real-time market data with cross-module integration
 * 
 * Features:
 * - Live stock quotes with sparklines
 * - Commodity prices (oil, gas, metals)
 * - Middle East & Global currencies
 * - Global market indices (Baltic Dry, CPI, PMI, etc.)
 * - Supply chain benchmarks
 * - LPI (Logistics Performance Index)
 * - Cross-module impact analysis
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, Info, TrendingUp } from 'lucide-react';

// Import all widgets
import { EnhancedStockWidget } from '@/components/market-data/EnhancedStockWidget';
import { CommodityPricesWidget } from '@/components/market-data/CommodityPricesWidget';
import { EnhancedCurrencyWidget } from '@/components/market-data/EnhancedCurrencyWidget';
import { GlobalIndicesWidget } from '@/components/market-data/GlobalIndicesWidget';
import { SupplyChainBenchmarksWidget } from '@/components/market-data/SupplyChainBenchmarksWidget';
import { LPIWidget } from '@/components/market-data/LPIWidget';
import { CrossModuleImpactWidget } from '@/components/market-data/CrossModuleImpactWidget';
import { CryptoWidget } from '@/components/market-data/CryptoWidget';
import { MarketHeroSection } from '@/components/market-data/MarketHeroSection';
import { MarketOverviewChart } from '@/components/market-data/MarketOverviewChart';
import { InflationHeatMap } from '@/components/market-data/InflationHeatMap';
import { EconomicCalendarWidget } from '@/components/market-data/EconomicCalendarWidget';
import { SaudiArabiaWidget } from '@/components/market-data/SaudiArabiaWidget';

export default function MarketDataPage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Stunning Hero Section */}
      <MarketHeroSection />

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-11">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="intelligence">🧠 AI Insights</TabsTrigger>
          <TabsTrigger value="saudi">🇸🇦 Saudi</TabsTrigger>
          <TabsTrigger value="stocks">📈 Stocks</TabsTrigger>
          <TabsTrigger value="commodities">⛽ Commodities</TabsTrigger>
          <TabsTrigger value="crypto">🪙 Crypto</TabsTrigger>
          <TabsTrigger value="currencies">💱 Currencies</TabsTrigger>
          <TabsTrigger value="indices">🌍 Indices</TabsTrigger>
          <TabsTrigger value="lpi">🏆 LPI</TabsTrigger>
          <TabsTrigger value="benchmarks">🎯 Benchmarks</TabsTrigger>
          <TabsTrigger value="impact">🔗 Impact</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Stunning Dashboard */}
        <TabsContent value="overview" className="space-y-6">
          {/* Beautiful Chart */}
          <MarketOverviewChart type="area" height={300} />

          {/* Main Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedStockWidget 
              symbols={['FDX', 'UPS', 'CHRW']}
              autoRefresh={true}
              refreshInterval={60}
              showSparklines={true}
            />
            <CryptoWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CommodityPricesWidget 
              autoRefresh={true}
              refreshInterval={300}
            />
            <EnhancedCurrencyWidget />
          </div>

          {/* Inflation Heat Map */}
          <InflationHeatMap />

          {/* Economic Calendar */}
          <EconomicCalendarWidget />

          {/* Cross-Module Impact Preview */}
          <CrossModuleImpactWidget />
        </TabsContent>

        {/* AI Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Brain className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-bold text-lg mb-2">🧠 AI-Powered Intelligence</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This tab shows insights learned from YOUR actual operational data. The AI discovered correlations between market movements and YOUR specific business metrics.
                  </p>
                  <Button onClick={() => window.open('/market-data/intelligence', '_blank')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Open Full Intelligence Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saudi Arabia Tab */}
        <TabsContent value="saudi" className="space-y-6">
          <ComprehensiveSaudiWidget />
        </TabsContent>

        {/* Stocks Tab */}
        <TabsContent value="stocks" className="space-y-6">
          <EnhancedStockWidget 
            symbols={['FDX', 'UPS', 'CHRW', 'EXPD', 'XPO']}
            autoRefresh={true}
            refreshInterval={60}
            showSparklines={true}
          />
        </TabsContent>

        {/* Commodities Tab */}
        <TabsContent value="commodities" className="space-y-6">
          <CommodityPricesWidget 
            autoRefresh={true}
            refreshInterval={300}
          />
        </TabsContent>

        {/* Crypto Tab */}
        <TabsContent value="crypto" className="space-y-6">
          <CryptoWidget />
        </TabsContent>

        {/* Currencies Tab */}
        <TabsContent value="currencies" className="space-y-6">
          <EnhancedCurrencyWidget />
        </TabsContent>

        {/* Indices Tab */}
        <TabsContent value="indices" className="space-y-6">
          <GlobalIndicesWidget />
        </TabsContent>

        {/* LPI Tab */}
        <TabsContent value="lpi" className="space-y-6">
          <LPIWidget />
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <SupplyChainBenchmarksWidget />
        </TabsContent>

        {/* Cross-Module Impact Tab */}
        <TabsContent value="impact" className="space-y-6">
          <CrossModuleImpactWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
