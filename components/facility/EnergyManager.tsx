"use client";

/**
 * Energy Manager Component
 *
 * Comprehensive energy management with:
 * - Real-time energy monitoring
 * - Carbon footprint tracking
 * - ESG scoring
 * - SBTi integration
 * - Energy optimization
 * - Sustainability metrics
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiFlashlightLine,
  RiLeafLine,
  RiBarChartLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiFocus2Line,
  RiShieldCheckLine,
  RiDownloadLine,
  RiCalendarLine,
} from "react-icons/ri";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function EnergyManager() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [energyData, setEnergyData] = useState<
    Array<{ month: string; consumption: number; cost: number; carbon: number }>
  >([]);
  const [esgData, setEsgData] = useState({
    overall: 0,
    rating: "D" as
      | "AAA"
      | "AA"
      | "A"
      | "BBB"
      | "BB"
      | "B"
      | "CCC"
      | "CC"
      | "C"
      | "D",
    environmental: 0,
    social: 0,
    governance: 0,
  });
  const [currentStats, setCurrentStats] = useState({
    monthlyConsumption: 0,
    monthlyCost: 0,
    carbonEmissions: 0,
    trend: 0,
  });
  const [optimization, setOptimization] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        setLoading(true);
        const facilityId = "facility-1"; // In real app, get from context/params

        const response = await fetch(
          `/api/facility/energy?facilityId=${facilityId}&includeSustainability=true&includeOptimization=true`,
        );
        const result = await response.json();

        if (result.success) {
          // Process energy consumption data
          if (result.data && result.data.length > 0) {
            // Group by month for chart
            const energyByMonth: Record<
              string,
              { consumption: number; cost: number; carbon: number }
            > = {};

            result.data.slice(-6).forEach((record: any) => {
              const date = new Date(record.period?.start || record.timestamp);
              const monthKey = date.toLocaleDateString("en-US", {
                month: "short",
              });
              if (!energyByMonth[monthKey]) {
                energyByMonth[monthKey] = {
                  consumption: 0,
                  cost: 0,
                  carbon: 0,
                };
              }
              energyByMonth[monthKey].consumption +=
                record.electricity?.consumption || record.consumption || 0;
              energyByMonth[monthKey].cost += record.cost || 0;
              energyByMonth[monthKey].carbon +=
                record.carbonFootprint?.emissions || 0;
            });

            const energyArray = Object.entries(energyByMonth).map(
              ([month, data]) => ({ month, ...data }),
            );

            setEnergyData(
              energyArray.length > 0
                ? energyArray
                : [
                    { month: "Jan", consumption: 0, cost: 0, carbon: 0 },
                    { month: "Feb", consumption: 0, cost: 0, carbon: 0 },
                  ],
            );

            // Get current month stats
            const now = new Date();
            const currentMonthStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              1,
            );
            const currentMonthData = result.data.filter((e: any) => {
              const date = new Date(e.period?.start || e.timestamp);
              return date >= currentMonthStart;
            });

            const currentConsumption = currentMonthData.reduce(
              (sum: number, e: any) =>
                sum + (e.electricity?.consumption || e.consumption || 0),
              0,
            );
            const currentCost = currentMonthData.reduce(
              (sum: number, e: any) => sum + (e.cost || 0),
              0,
            );
            const currentCarbon = currentMonthData.reduce(
              (sum: number, e: any) =>
                sum + (e.carbonFootprint?.emissions || 0),
              0,
            );

            setCurrentStats({
              monthlyConsumption: currentConsumption,
              monthlyCost: currentCost,
              carbonEmissions: currentCarbon,
              trend: result.stats?.trend || 0,
            });
          }

          // Process ESG data
          if (result.sustainability?.esgScore) {
            const esg = result.sustainability.esgScore;
            setEsgData({
              overall: esg.overall || 0,
              rating: esg.rating || "D",
              environmental: esg.environmental?.score || 0,
              social: esg.social?.score || 0,
              governance: esg.governance?.score || 0,
            });
          }

          // Process optimization recommendations
          if (result.optimization && Array.isArray(result.optimization)) {
            setOptimization(result.optimization);
          }
        }
      } catch (error) {
        console.error("Error fetching energy data:", error);
        // Keep default/empty data on error
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading energy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiFlashlightLine className="h-8 w-8 text-primary" />
            Energy & Sustainability
          </h1>
          <p className="text-muted-foreground mt-1">
            Energy management, carbon tracking, and ESG reporting
          </p>
        </div>
        <Button variant="outline" size="lg" className="gap-2">
          <RiDownloadLine className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.monthlyConsumption.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">kWh</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentStats.monthlyCost.toLocaleString()}
            </div>
            <p
              className={`text-xs mt-1 flex items-center gap-1 ${
                currentStats.trend < 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {currentStats.trend < 0 ? (
                <RiArrowDownLine className="h-3 w-3" />
              ) : (
                <RiArrowUpLine className="h-3 w-3" />
              )}
              {Math.abs(currentStats.trend).toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carbon Emissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(currentStats.carbonEmissions).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">kg CO₂</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ESG Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{esgData.overall}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rating: <Badge variant="success">{esgData.rating}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
          <TabsTrigger value="esg">ESG & SBTi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Energy Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="consumption"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Consumption (kWh)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost & Carbon Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      name="Cost ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="carbon"
                      stroke="#ef4444"
                      name="Carbon (kg CO₂)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed consumption data will appear here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carbon">
          <Card>
            <CardHeader>
              <CardTitle>Carbon Footprint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Carbon footprint tracking will appear here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiShieldCheckLine className="h-5 w-5" />
                ESG Performance & SBTi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Environmental
                  </label>
                  <p className="text-2xl font-bold">
                    {esgData.environmental}/100
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Social
                  </label>
                  <p className="text-2xl font-bold">{esgData.social}/100</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Governance
                  </label>
                  <p className="text-2xl font-bold">{esgData.governance}/100</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <RiFocus2Line className="h-4 w-4" />
                  SBTi Targets
                </h3>
                <p className="text-muted-foreground">
                  SBTi targets and progress will appear here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
