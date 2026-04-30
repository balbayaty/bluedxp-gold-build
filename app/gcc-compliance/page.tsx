'use client';

/**
 * GCC Compliance Intelligence Hub
 *
 * Comprehensive compliance management for Saudi Arabia and GCC transport operations.
 * World-first approach combining regulatory intelligence, real-time validation,
 * and predictive compliance monitoring.
 *
 * @module app/gcc-compliance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  Shield,
  Truck,
  XCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Globe,
  Scale,
  FileText,
  Zap,
  Award,
  BarChart3,
  Map,
  Building2,
  Users,
  Package,
  ThermometerSun,
  Navigation,
  QrCode,
  Phone,
  MessageSquare,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceMetrics {
  overallScore: number;
  shipmentsValidated: number;
  shipmentsCompliant: number;
  shipmentsWithWarnings: number;
  shipmentsNonCompliant: number;
  averageValidationTime: number;
  costSavingsFromPrevention: number;
}

interface ActiveValidation {
  id: string;
  shipmentId: string;
  bayanNumber: string;
  carrier: string;
  route: string;
  status: 'PENDING' | 'VALIDATED' | 'COMPLIANT' | 'WARNING' | 'FAILED';
  score: number;
  issues: string[];
  timestamp: Date;
}

interface TruckBanAlert {
  city: string;
  isRestricted: boolean;
  affectedShipments: number;
  nextWindow: Date | null;
  banHours: string;
}

interface RegulationUpdate {
  id: string;
  title: string;
  source: string;
  effectiveDate: Date;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function GCCCompliancePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Metrics State
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    overallScore: 0,
    shipmentsValidated: 0,
    shipmentsCompliant: 0,
    shipmentsWithWarnings: 0,
    shipmentsNonCompliant: 0,
    averageValidationTime: 0,
    costSavingsFromPrevention: 0,
  });

  // Active Validations
  const [validations, setValidations] = useState<ActiveValidation[]>([]);

  // Truck Ban Alerts
  const [truckBanAlerts, setTruckBanAlerts] = useState<TruckBanAlert[]>([]);

  // Regulation Updates
  const [regulationUpdates, setRegulationUpdates] = useState<RegulationUpdate[]>([]);

  // Billing Data
  const [billingData, setBillingData] = useState({
    totalApiCalls: 0,
    estimatedCost: 0,
    dataPointsRetrieved: 0,
    successRate: 0,
  });

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // Simulated data - in production, fetch from APIs
      setMetrics({
        overallScore: 94.7,
        shipmentsValidated: 1247,
        shipmentsCompliant: 1156,
        shipmentsWithWarnings: 67,
        shipmentsNonCompliant: 24,
        averageValidationTime: 2.3,
        costSavingsFromPrevention: 487500,
      });

      setValidations([
        {
          id: 'VAL-001',
          shipmentId: 'SHP-2026-0001',
          bayanNumber: 'BAYAN-2026-123456',
          carrier: 'Saudi Express Logistics',
          route: 'Riyadh → Jeddah',
          status: 'COMPLIANT',
          score: 98,
          issues: [],
          timestamp: new Date(),
        },
        {
          id: 'VAL-002',
          shipmentId: 'SHP-2026-0002',
          bayanNumber: 'BAYAN-2026-123457',
          carrier: 'Emirates Transport',
          route: 'Dubai → Riyadh',
          status: 'WARNING',
          score: 82,
          issues: ['Backload within 50km limit - verify'],
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          id: 'VAL-003',
          shipmentId: 'SHP-2026-0003',
          bayanNumber: 'BAYAN-2026-123458',
          carrier: 'Gulf Freight Co',
          route: 'Dammam → Bahrain',
          status: 'VALIDATED',
          score: 95,
          issues: [],
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          id: 'VAL-004',
          shipmentId: 'SHP-2026-0004',
          bayanNumber: 'BAYAN-2026-123459',
          carrier: 'Kuwait Logistics',
          route: 'Kuwait → Riyadh',
          status: 'FAILED',
          score: 45,
          issues: ['Weight exceeds limit', 'Insurance expired', 'Missing WASL registration'],
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
        },
      ]);

      setTruckBanAlerts([
        {
          city: 'Riyadh',
          isRestricted: true,
          affectedShipments: 12,
          nextWindow: new Date(Date.now() + 4 * 60 * 60 * 1000),
          banHours: '06:00 - 22:00',
        },
        {
          city: 'Jeddah',
          isRestricted: true,
          affectedShipments: 8,
          nextWindow: new Date(Date.now() + 5 * 60 * 60 * 1000),
          banHours: '07:00 - 21:00',
        },
        {
          city: 'Dammam',
          isRestricted: false,
          affectedShipments: 0,
          nextWindow: null,
          banHours: '06:00 - 21:00',
        },
        {
          city: 'Makkah',
          isRestricted: true,
          affectedShipments: 3,
          nextWindow: new Date(Date.now() + 8 * 60 * 60 * 1000),
          banHours: '24/7 Central Zone',
        },
      ]);

      setRegulationUpdates([
        {
          id: 'REG-001',
          title: 'TGA Backload Rules Update (October 2024)',
          source: 'Transport General Authority',
          effectiveDate: new Date('2024-10-01'),
          impact: 'HIGH',
          summary: 'Foreign carriers restricted to 50km radius from arrival point for backloads.',
        },
        {
          id: 'REG-002',
          title: 'WASL Integration Mandate',
          source: 'TGA / Ministry of Transport',
          effectiveDate: new Date('2024-01-01'),
          impact: 'HIGH',
          summary: 'All commercial vehicles must register with WASL and transmit real-time telematics.',
        },
        {
          id: 'REG-003',
          title: 'SFDA Cold Chain Requirements',
          source: 'Saudi Food & Drug Authority',
          effectiveDate: new Date('2024-06-01'),
          impact: 'MEDIUM',
          summary: 'Enhanced temperature monitoring requirements for pharmaceutical transport.',
        },
        {
          id: 'REG-004',
          title: 'GCC Unified Customs Declaration',
          source: 'GCC Secretariat',
          effectiveDate: new Date('2024-03-15'),
          impact: 'MEDIUM',
          summary: 'Simplified customs procedures for intra-GCC commercial traffic.',
        },
      ]);

      setBillingData({
        totalApiCalls: 45678,
        estimatedCost: 913.56,
        dataPointsRetrieved: 137034,
        successRate: 99.7,
      });

    } catch (error) {
      console.error('[GCC Compliance] Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-white">
            Loading GCC Compliance Intelligence...
          </h2>
          <p className="text-slate-400 mt-2">
            Initializing regulatory databases and validation engines
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  GCC Compliance Intelligence Hub
                </h1>
                <p className="text-slate-400 text-sm">
                  Saudi Arabia & GCC Transport Regulatory Platform • World-First Approach
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Activity className="h-3 w-3 mr-1" />
                System Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Compliance Score
              </CardTitle>
              <Award className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{metrics.overallScore}%</div>
              <Progress value={metrics.overallScore} className="mt-3 h-2" />
              <p className="text-xs text-slate-400 mt-2">
                +2.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Shipments Validated
              </CardTitle>
              <FileCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metrics.shipmentsValidated.toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                  {metrics.shipmentsCompliant} OK
                </Badge>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                  {metrics.shipmentsWithWarnings} ⚠
                </Badge>
                <Badge className="bg-red-500/20 text-red-400 border-0">
                  {metrics.shipmentsNonCompliant} ✗
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Avg. Validation Time
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metrics.averageValidationTime}s
              </div>
              <p className="text-xs text-slate-400 mt-2">
                8-step validation in real-time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Cost Savings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                SAR {(metrics.costSavingsFromPrevention / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Penalties prevented this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-emerald-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="validations" className="data-[state=active]:bg-emerald-600">
              <FileCheck className="h-4 w-4 mr-2" />
              Validations
            </TabsTrigger>
            <TabsTrigger value="truck-bans" className="data-[state=active]:bg-emerald-600">
              <Truck className="h-4 w-4 mr-2" />
              Truck Bans
            </TabsTrigger>
            <TabsTrigger value="regulations" className="data-[state=active]:bg-emerald-600">
              <FileText className="h-4 w-4 mr-2" />
              Regulations
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-emerald-600">
              <DollarSign className="h-4 w-4 mr-2" />
              API Billing
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-emerald-600">
              <Zap className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Validations */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Validations</CardTitle>
                  <CardDescription className="text-slate-400">
                    Pre-dispatch validation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validations.slice(0, 4).map((val) => (
                      <div
                        key={val.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            val.status === 'COMPLIANT' || val.status === 'VALIDATED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : val.status === 'WARNING'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {val.status === 'COMPLIANT' || val.status === 'VALIDATED' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : val.status === 'WARNING' ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{val.bayanNumber}</p>
                            <p className="text-xs text-slate-400">{val.route}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`${
                            val.score >= 90
                              ? 'border-emerald-500/50 text-emerald-400'
                              : val.score >= 70
                              ? 'border-yellow-500/50 text-yellow-400'
                              : 'border-red-500/50 text-red-400'
                          }`}>
                            {val.score}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Truck Ban Status */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Truck Ban Status</CardTitle>
                  <CardDescription className="text-slate-400">
                    Real-time city restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {truckBanAlerts.map((alert) => (
                      <div
                        key={alert.city}
                        className={`p-3 rounded-lg border ${
                          alert.isRestricted
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className={`h-4 w-4 ${
                              alert.isRestricted ? 'text-red-400' : 'text-emerald-400'
                            }`} />
                            <span className="font-medium text-white">{alert.city}</span>
                          </div>
                          <Badge variant={alert.isRestricted ? 'destructive' : 'default'}>
                            {alert.isRestricted ? 'RESTRICTED' : 'OPEN'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-slate-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {alert.banHours}
                          </span>
                          {alert.isRestricted && alert.nextWindow && (
                            <span className="text-emerald-400">
                              Opens in {Math.round((alert.nextWindow.getTime() - Date.now()) / (60 * 60 * 1000))}h
                            </span>
                          )}
                        </div>
                        {alert.affectedShipments > 0 && (
                          <p className="text-xs text-yellow-400 mt-1">
                            {alert.affectedShipments} shipments affected
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 8-Step Validation Engine */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Pre-Dispatch Validation Engine</CardTitle>
                <CardDescription className="text-slate-400">
                  8-step compliance validation for every shipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { step: 1, name: 'Carrier Eligibility', icon: Building2, desc: 'WASL, CR, Insurance' },
                    { step: 2, name: 'Backload Compliance', icon: Truck, desc: 'TGA Oct 2024 Rules' },
                    { step: 3, name: 'Equipment Match', icon: Package, desc: 'Facility Compatibility' },
                    { step: 4, name: 'Weight & Dimensions', icon: Scale, desc: 'TGA Limits' },
                    { step: 5, name: 'Truck Ban Window', icon: Clock, desc: 'City Restrictions' },
                    { step: 6, name: 'Document Check', icon: FileText, desc: 'Bayan, Permits' },
                    { step: 7, name: 'Permit Validity', icon: Award, desc: 'Hazmat, Oversized' },
                    { step: 8, name: 'Border Requirements', icon: Globe, desc: 'Cross-Border Docs' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm">
                          {item.step}
                        </div>
                        <item.icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="font-medium text-white text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validations Tab */}
          <TabsContent value="validations" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Validation History</CardTitle>
                    <CardDescription className="text-slate-400">
                      All pre-dispatch validations with detailed results
                    </CardDescription>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <FileCheck className="h-4 w-4 mr-2" />
                    New Validation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Shipment</TableHead>
                      <TableHead className="text-slate-400">Bayan #</TableHead>
                      <TableHead className="text-slate-400">Carrier</TableHead>
                      <TableHead className="text-slate-400">Route</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Score</TableHead>
                      <TableHead className="text-slate-400">Issues</TableHead>
                      <TableHead className="text-slate-400">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validations.map((val) => (
                      <TableRow key={val.id} className="border-slate-700">
                        <TableCell className="text-white font-medium">{val.shipmentId}</TableCell>
                        <TableCell className="text-slate-300">{val.bayanNumber}</TableCell>
                        <TableCell className="text-slate-300">{val.carrier}</TableCell>
                        <TableCell className="text-slate-300">{val.route}</TableCell>
                        <TableCell>
                          <Badge className={`${
                            val.status === 'COMPLIANT' || val.status === 'VALIDATED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : val.status === 'WARNING'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {val.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            val.score >= 90 ? 'text-emerald-400' :
                            val.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {val.score}%
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 max-w-xs truncate">
                          {val.issues.length > 0 ? val.issues.join(', ') : '-'}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {val.timestamp.toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Truck Bans Tab */}
          <TabsContent value="truck-bans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {truckBanAlerts.map((alert) => (
                <Card
                  key={alert.city}
                  className={`bg-slate-800/50 border-2 ${
                    alert.isRestricted
                      ? 'border-red-500/50'
                      : 'border-emerald-500/50'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {alert.city}
                      </CardTitle>
                      <Badge variant={alert.isRestricted ? 'destructive' : 'default'} className="text-lg px-3 py-1">
                        {alert.isRestricted ? 'BAN ACTIVE' : 'OPEN'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400">Ban Hours</p>
                      <p className="text-lg font-medium text-white">{alert.banHours}</p>
                    </div>
                    {alert.isRestricted && alert.nextWindow && (
                      <div>
                        <p className="text-sm text-slate-400">Next Available Window</p>
                        <p className="text-lg font-medium text-emerald-400">
                          {alert.nextWindow.toLocaleTimeString()} ({Math.round((alert.nextWindow.getTime() - Date.now()) / (60 * 60 * 1000))}h)
                        </p>
                      </div>
                    )}
                    {alert.affectedShipments > 0 && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-yellow-400 font-medium">
                          {alert.affectedShipments} shipments may be affected
                        </p>
                      </div>
                    )}
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                      View Exceptions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Regulations Tab */}
          <TabsContent value="regulations" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Regulatory Updates</CardTitle>
                <CardDescription className="text-slate-400">
                  Latest TGA, MOT, SFDA, and GCC regulatory changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regulationUpdates.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${
                              reg.impact === 'HIGH'
                                ? 'bg-red-500/20 text-red-400'
                                : reg.impact === 'MEDIUM'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {reg.impact} IMPACT
                            </Badge>
                            <span className="text-xs text-slate-400">{reg.source}</span>
                          </div>
                          <h4 className="font-medium text-white">{reg.title}</h4>
                          <p className="text-sm text-slate-400 mt-1">{reg.summary}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Effective</p>
                          <p className="text-sm text-white">{reg.effectiveDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Total API Calls (MTD)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {billingData.totalApiCalls.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Estimated Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    SAR {billingData.estimatedCost.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Data Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {billingData.dataPointsRetrieved.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-400">
                    {billingData.successRate}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">API Usage by Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Endpoint</TableHead>
                      <TableHead className="text-slate-400">Calls</TableHead>
                      <TableHead className="text-slate-400">Data Points</TableHead>
                      <TableHead className="text-slate-400">Avg Response</TableHead>
                      <TableHead className="text-slate-400">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-700">
                      <TableCell className="text-white font-mono">LOCATION_BY_SEQUENCE</TableCell>
                      <TableCell className="text-slate-300">28,456</TableCell>
                      <TableCell className="text-slate-300">85,368</TableCell>
                      <TableCell className="text-slate-300">145ms</TableCell>
                      <TableCell className="text-emerald-400">SAR 569.12</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700">
                      <TableCell className="text-white font-mono">LOCATION_BY_PLATE</TableCell>
                      <TableCell className="text-slate-300">12,234</TableCell>
                      <TableCell className="text-slate-300">36,702</TableCell>
                      <TableCell className="text-slate-300">178ms</TableCell>
                      <TableCell className="text-emerald-400">SAR 244.68</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-700">
                      <TableCell className="text-white font-mono">TRIP_HISTORY</TableCell>
                      <TableCell className="text-slate-300">4,988</TableCell>
                      <TableCell className="text-slate-300">14,964</TableCell>
                      <TableCell className="text-slate-300">320ms</TableCell>
                      <TableCell className="text-emerald-400">SAR 99.76</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/20">
                      <QrCode className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Bayan QR Generator</CardTitle>
                      <CardDescription className="text-slate-400">
                        Embed Bayan data in E-Waybill QR
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <Phone className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">TextLocate</CardTitle>
                      <CardDescription className="text-slate-400">
                        Request driver location via WhatsApp
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-yellow-500/20">
                      <Truck className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Backload Validator</CardTitle>
                      <CardDescription className="text-slate-400">
                        Check TGA Oct 2024 compliance
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/20">
                      <Package className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Equipment Matrix</CardTitle>
                      <CardDescription className="text-slate-400">
                        Check facility compatibility
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-red-500/20">
                      <Navigation className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Touchpoint Generator</CardTitle>
                      <CardDescription className="text-slate-400">
                        Generate journey touchpoints
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-cyan-500/20">
                      <Map className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Location Fusion</CardTitle>
                      <CardDescription className="text-slate-400">
                        Multi-source location intelligence
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-900/50 mt-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <span>BlueDXP GCC Compliance Intelligence</span>
              <Badge variant="outline" className="border-slate-600">
                v3.0
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span>Confidence Score: 97.2%</span>
              <span>•</span>
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
