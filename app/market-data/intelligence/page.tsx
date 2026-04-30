/**
 * 🧠 INTELLIGENT MARKET ANALYTICS DASHBOARD
 * Insights you've NEVER seen before!
 * 
 * What makes this special:
 * - Learns from YOUR data
 * - Discovers hidden correlations
 * - Predicts YOUR specific costs
 * - Tells you WHEN to act
 * - Simulates scenarios for YOUR business
 * - Personalized to YOUR operations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';

export default function IntelligentMarketAnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState('insights');

  // Mock data - in production, these come from the intelligent analytics service
  const correlations = [
    {
      market: 'Crude Oil Price',
      operational: 'Your Freight Costs',
      correlation: 87,
      lag: 14,
      confidence: 92,
      insight: 'When oil rises 10%, YOUR costs increase 12% in 2 weeks',
      action: 'Lock contracts when oil < $75',
      savings: 45000,
    },
    {
      market: 'FedEx Stock',
      operational: 'Your Delivery Performance',
      correlation: 73,
      lag: 5,
      confidence: 85,
      insight: 'FedEx stock predicts YOUR delays 5 days in advance!',
      action: 'Monitor FedEx stock daily',
      savings: 0,
    },
    {
      market: 'USD/SAR Rate',
      operational: 'Your Inventory Value',
      correlation: 91,
      lag: 0,
      confidence: 95,
      insight: 'SAR moves = immediate $100K+ impact on YOUR inventory',
      action: 'Hedge currency exposure',
      savings: 67000,
    },
    {
      market: 'Baltic Dry Index',
      operational: 'Your Sea Freight Lead Time',
      correlation: 68,
      lag: 21,
      confidence: 78,
      insight: 'BDI predicts YOUR shipping delays 3 weeks ahead',
      action: 'Switch to air when BDI > 1800',
      savings: 28000,
    },
  ];

  const predictiveAlerts = [
    {
      title: '⚠️ Freight Cost Spike Predicted',
      description: 'AI predicts 15% increase in YOUR freight costs in next 14 days',
      confidence: 87,
      impact: 'high',
      cost: -45000,
      timing: '14 days',
      actions: ['Book shipments NOW', 'Lock rates', 'Consider alternatives'],
    },
    {
      title: '💰 Currency Arbitrage Opportunity',
      description: 'SAR undervalued - Buy NOW based on YOUR procurement patterns',
      confidence: 82,
      impact: 'medium',
      cost: 28000,
      timing: 'Now',
      actions: ['Accelerate SAR purchases', 'Contact Saudi suppliers', 'Lock rates'],
    },
    {
      title: '🚨 Carrier Risk Alert',
      description: 'FedEx stock drop predicts YOUR delays in 5 days',
      confidence: 91,
      impact: 'critical',
      cost: -75000,
      timing: '5 days',
      actions: ['Reroute critical shipments', 'Notify customers', 'Activate backups'],
    },
  ];

  const optimalTiming = [
    {
      action: 'Book Sea Freight',
      timing: 'now',
      reason: 'BDI at optimal level for YOUR business',
      savings: 45000,
      confidence: 89,
      color: 'green',
    },
    {
      action: 'Purchase Metals',
      timing: 'wait',
      reason: 'YOUR data shows better prices in 2-3 weeks',
      savings: 28000,
      confidence: 76,
      color: 'yellow',
    },
    {
      action: 'Hedge SAR Exposure',
      timing: 'urgent',
      reason: '$2.3M of YOUR inventory at risk',
      savings: 67000,
      confidence: 91,
      color: 'red',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-12 w-12" />
            <div>
              <h1 className="text-4xl font-bold">Intelligent Market Analytics</h1>
              <p className="text-white/90">Insights learned from YOUR data that you've never seen before</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm opacity-90">Correlations Found</div>
              <div className="text-3xl font-bold">4</div>
              <div className="text-xs">From YOUR data</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm opacity-90">Predicted Savings</div>
              <div className="text-3xl font-bold">$168K</div>
              <div className="text-xs">Next 30 days</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm opacity-90">Active Alerts</div>
              <div className="text-3xl font-bold">3</div>
              <div className="text-xs">Actionable now</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm opacity-90">AI Confidence</div>
              <div className="text-3xl font-bold">87%</div>
              <div className="text-xs">High accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">🧠 AI Insights</TabsTrigger>
          <TabsTrigger value="correlations">🔗 Correlations</TabsTrigger>
          <TabsTrigger value="timing">⏰ Optimal Timing</TabsTrigger>
          <TabsTrigger value="simulator">🎮 Simulator</TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {predictiveAlerts.map((alert, idx) => (
            <Card key={idx} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-2">{alert.description}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={alert.impact === 'critical' ? 'error' : alert.impact === 'high' ? 'warning' : 'info'}>
                      {alert.impact.toUpperCase()}
                    </Badge>
                    <div className={`text-2xl font-bold ${alert.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {alert.cost > 0 ? '+' : ''}{(alert.cost / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span>Confidence: <strong>{alert.confidence}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Timing: <strong>{alert.timing}</strong></span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Recommended Actions:</div>
                  <ul className="space-y-1">
                    {alert.actions.map((action, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full" variant="primary">
                  <Target className="h-4 w-4 mr-2" />
                  Take Action Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Hidden Correlations Discovered from YOUR Data</CardTitle>
              <CardDescription>
                AI analyzed your operational data and found these market correlations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {correlations.map((corr, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{corr.market} → {corr.operational}</div>
                      <div className="text-sm text-muted-foreground mt-1">{corr.insight}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{corr.correlation}%</div>
                      <div className="text-xs text-muted-foreground">Correlation</div>
                    </div>
                  </div>

                  <Progress value={corr.correlation} className="h-2" />

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Time Lag</div>
                      <div className="font-semibold">{corr.lag} days</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Confidence</div>
                      <div className="font-semibold">{corr.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Potential Savings</div>
                      <div className="font-semibold text-green-600">
                        {corr.savings > 0 ? `$${(corr.savings / 1000).toFixed(0)}K` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Action:</span>
                      <span className="text-muted-foreground">{corr.action}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimal Timing Tab */}
        <TabsContent value="timing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimal Action Timing (Based on YOUR Patterns)</CardTitle>
              <CardDescription>
                AI tells you exactly WHEN to act for maximum benefit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {optimalTiming.map((item, idx) => {
                const colors = {
                  green: 'border-green-500 bg-green-50 dark:bg-green-950',
                  yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
                  red: 'border-red-500 bg-red-50 dark:bg-red-950',
                };

                return (
                  <div key={idx} className={`rounded-lg border-2 p-4 ${colors[item.color as keyof typeof colors]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-lg">{item.action}</div>
                        <div className="text-sm text-muted-foreground mt-1">{item.reason}</div>
                      </div>
                      <Badge variant={
                        item.timing === 'now' ? 'success' :
                        item.timing === 'urgent' ? 'error' :
                        'warning'
                      } className="text-lg px-4 py-2">
                        {item.timing.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Potential Savings</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${(item.savings / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">AI Confidence</div>
                        <div className="text-2xl font-bold">{item.confidence}%</div>
                      </div>
                    </div>

                    <Button className="w-full mt-3" variant="primary">
                      <Zap className="h-4 w-4 mr-2" />
                      Execute Action
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Simulator</CardTitle>
              <CardDescription>
                See exactly how market changes affect YOUR business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <h3 className="font-bold text-lg mb-4">Scenario: Oil Price Rises 20%</h3>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Total Impact on YOUR Business</div>
                    <div className="text-5xl font-bold text-red-600">-$285K</div>
                    <div className="text-sm text-muted-foreground mt-1">Over next 30 days</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">TMS (YOUR freight)</span>
                      <span className="font-bold text-red-600">-$180K</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">Procurement (YOUR materials)</span>
                      <span className="font-bold text-red-600">-$60K</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">WMS (YOUR energy)</span>
                      <span className="font-bold text-red-600">-$45K</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">AI Recommendations:</div>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Lock fuel surcharges TODAY (save $180K)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Switch to rail freight (30% less fuel)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Consolidate shipments (reduce frequency)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <BarChart3 className="h-5 w-5 mr-2" />
                Run Custom Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">How This Works</h4>
              <p className="text-sm text-muted-foreground">
                This AI engine analyzes YOUR actual operational data (shipments, inventory, costs) and correlates it with global market data to discover patterns unique to YOUR business. Every insight is based on YOUR historical performance, not generic industry averages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
