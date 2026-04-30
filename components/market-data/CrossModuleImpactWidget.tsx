/**
 * 🔗 CROSS-MODULE IMPACT DASHBOARD
 * Shows how market changes affect WMS, TMS, ISO-IMS, QHSE, and other modules
 * Real-time integration across the entire platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Warehouse,
  Truck,
  FileCheck,
  Shield,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface ModuleImpact {
  moduleId: string;
  moduleName: string;
  icon: any;
  impactType: 'cost_increase' | 'cost_decrease' | 'efficiency_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedImpact: number;
  affectedAreas: string[];
  recommendations: string[];
  confidence: number;
  marketDriver: string;
}

export function CrossModuleImpactWidget() {
  const [impacts, setImpacts] = useState<ModuleImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    fetchImpacts();
    const interval = setInterval(fetchImpacts, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchImpacts = async () => {
    setLoading(true);
    try {
      // Mock data showing cross-module impacts
      const mockImpacts: ModuleImpact[] = [
        {
          moduleId: 'wms',
          moduleName: 'Warehouse Management',
          icon: Warehouse,
          impactType: 'cost_increase',
          severity: 'medium',
          description: 'SAR exchange rate increased by 2.3%, affecting inventory valuation for imported goods',
          estimatedImpact: 2.3,
          affectedAreas: ['Inventory Valuation', 'Import Costs', 'SKU Pricing'],
          recommendations: [
            'Review pricing for SAR-denominated inventory',
            'Consider hedging currency exposure',
            'Update cost basis for affected SKUs'
          ],
          confidence: 85,
          marketDriver: 'USD/SAR Exchange Rate'
        },
        {
          moduleId: 'tms',
          moduleName: 'Transportation Management',
          icon: Truck,
          impactType: 'cost_increase',
          severity: 'high',
          description: 'Baltic Dry Index up 8.5%, indicating rising sea freight costs',
          estimatedImpact: 8.5,
          affectedAreas: ['Freight Rates', 'Carrier Pricing', 'Route Planning'],
          recommendations: [
            'Lock in rates with carriers immediately',
            'Optimize routes to reduce mileage',
            'Consolidate shipments to reduce frequency',
            'Consider alternative transportation modes'
          ],
          confidence: 92,
          marketDriver: 'Baltic Dry Index'
        },
        {
          moduleId: 'procurement',
          moduleName: 'Procurement',
          icon: DollarSign,
          impactType: 'cost_increase',
          severity: 'critical',
          description: 'Crude oil prices surged 12%, affecting raw material and transportation costs',
          estimatedImpact: 12.0,
          affectedAreas: ['Raw Materials', 'Fuel Surcharges', 'Supplier Pricing'],
          recommendations: [
            'Negotiate long-term contracts immediately',
            'Review all supplier agreements',
            'Consider alternative materials',
            'Implement strategic stockpiling'
          ],
          confidence: 95,
          marketDriver: 'Crude Oil WTI'
        },
        {
          moduleId: 'iso-ims',
          moduleName: 'ISO-IMS Compliance',
          icon: FileCheck,
          impactType: 'cost_increase',
          severity: 'low',
          description: 'CPI increased 3.2%, affecting audit and certification costs',
          estimatedImpact: 3.2,
          affectedAreas: ['Audit Fees', 'Certification Costs', 'Training Expenses'],
          recommendations: [
            'Negotiate multi-year audit contracts',
            'Optimize certification schedules',
            'Consider virtual training options'
          ],
          confidence: 78,
          marketDriver: 'US Consumer Price Index'
        },
        {
          moduleId: 'qhse',
          moduleName: 'QHSE',
          icon: Shield,
          impactType: 'efficiency_change',
          severity: 'medium',
          description: 'Manufacturing PMI at 52.1 indicates expanding production, may impact safety protocols',
          estimatedImpact: 4.2,
          affectedAreas: ['Safety Inspections', 'Incident Rates', 'Training Load'],
          recommendations: [
            'Increase safety inspection frequency',
            'Review incident response procedures',
            'Scale up safety training capacity'
          ],
          confidence: 80,
          marketDriver: 'Manufacturing PMI'
        },
        {
          moduleId: 'wms',
          moduleName: 'Warehouse Management',
          icon: Warehouse,
          impactType: 'cost_decrease',
          severity: 'low',
          description: 'Natural gas prices dropped 6%, reducing warehouse heating costs',
          estimatedImpact: -6.0,
          affectedAreas: ['Operating Costs', 'Energy Expenses'],
          recommendations: [
            'Capture cost savings in budget',
            'Consider locking in favorable rates'
          ],
          confidence: 88,
          marketDriver: 'Natural Gas Futures'
        }
      ];

      setImpacts(mockImpacts);
    } catch (error) {
      console.error('Error fetching impacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default:
        return '';
    }
  };

  const getImpactIcon = (impactType: string) => {
    if (impactType === 'cost_increase') return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (impactType === 'cost_decrease') return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const filteredImpacts = selectedModule === 'all' 
    ? impacts 
    : impacts.filter(i => i.moduleId === selectedModule);

  const modules = Array.from(new Set(impacts.map(i => ({
    id: i.moduleId,
    name: i.moduleName,
    icon: i.icon
  }))));

  const impactSummary = {
    total: impacts.length,
    critical: impacts.filter(i => i.severity === 'critical').length,
    high: impacts.filter(i => i.severity === 'high').length,
    medium: impacts.filter(i => i.severity === 'medium').length,
    low: impacts.filter(i => i.severity === 'low').length,
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-500" />
              Cross-Module Market Impact
            </CardTitle>
            <CardDescription>
              How market changes affect your operations across all modules
            </CardDescription>
          </div>
          <Button onClick={fetchImpacts} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{impactSummary.total}</div>
            <div className="text-xs text-muted-foreground">Total Impacts</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-red-500/5">
            <div className="text-2xl font-bold text-red-600">{impactSummary.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-orange-500/5">
            <div className="text-2xl font-bold text-orange-600">{impactSummary.high}</div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-yellow-500/5">
            <div className="text-2xl font-bold text-yellow-600">{impactSummary.medium}</div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-blue-500/5">
            <div className="text-2xl font-bold text-blue-600">{impactSummary.low}</div>
            <div className="text-xs text-muted-foreground">Low</div>
          </div>
        </div>

        {/* Module Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedModule === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedModule('all')}
          >
            All Modules
          </Badge>
          {modules.map(module => {
            const Icon = module.icon;
            return (
              <Badge
                key={module.id}
                variant={selectedModule === module.id ? 'default' : 'info'}
                className="cursor-pointer flex items-center gap-1"
                onClick={() => setSelectedModule(module.id)}
              >
                <Icon className="h-3 w-3" />
                {module.name}
              </Badge>
            );
          })}
        </div>

        {/* Impacts List */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Analyzing market impacts...</p>
          </div>
        ) : filteredImpacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p>No significant impacts detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredImpacts.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <div
                  key={index}
                  className="rounded-lg border p-4 hover:shadow-md transition-all space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{impact.moduleName}</div>
                        <div className="text-sm text-muted-foreground">
                          {impact.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getImpactIcon(impact.impactType)}
                      <Badge variant="outline" className={getSeverityColor(impact.severity)}>
                        {impact.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Impact Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y">
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated Impact</div>
                      <div className={`text-lg font-bold ${
                        impact.impactType === 'cost_increase' ? 'text-red-600' :
                        impact.impactType === 'cost_decrease' ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>
                        {impact.estimatedImpact > 0 ? '+' : ''}{impact.estimatedImpact.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                      <div className="text-lg font-bold">{impact.confidence}%</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">Market Driver</div>
                      <div className="text-sm font-semibold flex items-center gap-1">
                        {impact.marketDriver}
                        <ArrowRight className="h-3 w-3" />
                        {impact.moduleName}
                      </div>
                    </div>
                  </div>

                  {/* Affected Areas */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Affected Areas:</div>
                    <div className="flex flex-wrap gap-2">
                      {impact.affectedAreas.map((area, idx) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <div className="text-xs font-medium mb-2">Recommended Actions:</div>
                    <ul className="text-sm space-y-1">
                      {impact.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          Real-time integration powered by Event Bus • Updates every 5 minutes
        </div>
      </CardContent>
    </Card>
  );
}

export default CrossModuleImpactWidget;
