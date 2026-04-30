"use client";

/**
 * Facility Management Dashboard
 *
 * Comprehensive dashboard showcasing:
 * - Facility overview
 * - Asset status
 * - Maintenance alerts
 * - Energy consumption
 * - Compliance status
 * - IoT device status
 * - Space utilization
 * - AI-powered insights
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
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  RiBuildingLine,
  RiToolsLine,
  RiHammerLine,
  RiFlashlightLine,
  RiShieldCheckLine,
  RiSensorLine,
  RiLayoutGridLine,
  RiBrainLine,
  RiAlertLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiFileListLine,
  RiGovernmentLine,
  RiFireLine,
} from "react-icons/ri";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Default/fallback data structure - will be replaced with real API data
const defaultFacilityData = {
  totalFacilities: 12,
  activeFacilities: 10,
  totalAssets: 0,
  operationalAssets: 0,
  maintenanceAlerts: 0,
  workOrdersOpen: 0,
  workOrdersCompleted: 0,
  energyConsumption: {
    current: 0,
    previous: 0,
    trend: "down" as "up" | "down",
    percentage: 0,
  },
  complianceScore: 87,
  licensesExpiring: 3,
  iotDevices: {
    total: 0,
    online: 0,
    offline: 0,
  },
  spaceUtilization: 0,
  carbonFootprint: {
    current: 0,
    target: 1000,
    reduction: 0,
  },
};

function FacilityDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [facilityData, setFacilityData] = useState(defaultFacilityData);
  const [energyData, setEnergyData] = useState<
    Array<{ month: string; consumption: number; cost: number }>
  >([]);
  const [assetStatusData, setAssetStatusData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [maintenanceData, setMaintenanceData] = useState<
    Array<{
      month: string;
      preventive: number;
      corrective: number;
      emergency: number;
    }>
  >([]);
  const [complianceData, setComplianceData] = useState<
    Array<{ category: string; score: number; status: string }>
  >([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const facilityId = "facility-1"; // In real app, get from context/params

        // Fetch all data in parallel
        const [
          assetsRes,
          workOrdersRes,
          maintenanceRes,
          energyRes,
          spacesRes,
          iotRes,
        ] = await Promise.allSettled([
          fetch(`/api/facility/assets?facilityId=${facilityId}`),
          fetch(`/api/facility/work-orders?facilityId=${facilityId}`),
          fetch(`/api/facility/maintenance?facilityId=${facilityId}`),
          fetch(
            `/api/facility/energy?facilityId=${facilityId}&includeSustainability=true`,
          ),
          fetch(
            `/api/facility/spaces?facilityId=${facilityId}&includeUtilization=true`,
          ),
          fetch(`/api/facility/iot/devices?facilityId=${facilityId}`),
        ]);

        // Process assets
        let totalAssets = 0;
        let operationalAssets = 0;
        const assetStatusMap: Record<string, number> = {
          operational: 0,
          maintenance: 0,
          "out-of-service": 0,
        };

        if (assetsRes.status === "fulfilled" && assetsRes.value.ok) {
          const assetsData = await assetsRes.value.json();
          if (assetsData.success && assetsData.data) {
            totalAssets = assetsData.data.length;
            operationalAssets = assetsData.data.filter(
              (a: any) => a.status === "operational",
            ).length;
            assetsData.data.forEach((asset: any) => {
              const status = asset.status || "operational";
              assetStatusMap[status] = (assetStatusMap[status] || 0) + 1;
            });
          }
        }

        // Process work orders
        let workOrdersOpen = 0;
        let workOrdersCompleted = 0;
        if (workOrdersRes.status === "fulfilled" && workOrdersRes.value.ok) {
          const woData = await workOrdersRes.value.json();
          if (woData.success && woData.data) {
            workOrdersOpen = woData.data.filter(
              (wo: any) =>
                wo.status !== "completed" && wo.status !== "cancelled",
            ).length;
            workOrdersCompleted = woData.data.filter(
              (wo: any) => wo.status === "completed",
            ).length;
          }
        }

        // Process maintenance
        let maintenanceAlerts = 0;
        const maintenanceByMonth: Record<
          string,
          { preventive: number; corrective: number; emergency: number }
        > = {};

        if (maintenanceRes.status === "fulfilled" && maintenanceRes.value.ok) {
          const maintData = await maintenanceRes.value.json();
          if (maintData.success && maintData.data) {
            maintenanceAlerts = maintData.stats?.overdue || 0;

            // Group by month
            maintData.data.forEach((record: any) => {
              if (record.scheduledDate || record.completedDate) {
                const date = new Date(
                  record.scheduledDate || record.completedDate,
                );
                const monthKey = date.toLocaleDateString("en-US", {
                  month: "short",
                });
                if (!maintenanceByMonth[monthKey]) {
                  maintenanceByMonth[monthKey] = {
                    preventive: 0,
                    corrective: 0,
                    emergency: 0,
                  };
                }
                if (record.type === "preventive")
                  maintenanceByMonth[monthKey].preventive++;
                else if (record.type === "corrective")
                  maintenanceByMonth[monthKey].corrective++;
                else if (record.type === "emergency")
                  maintenanceByMonth[monthKey].emergency++;
              }
            });
          }
        }

        // Process energy
        let currentEnergy = 0;
        let previousEnergy = 0;
        const energyByMonth: Array<{
          month: string;
          consumption: number;
          cost: number;
        }> = [];

        if (energyRes.status === "fulfilled" && energyRes.value.ok) {
          const energyData = await energyRes.value.json();
          if (energyData.success && energyData.data) {
            // Get current and previous month
            const now = new Date();
            const currentMonthStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              1,
            );
            const previousMonthStart = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1,
            );

            const currentMonthData = energyData.data.filter((e: any) => {
              const date = new Date(e.period?.start || e.timestamp);
              return date >= currentMonthStart;
            });
            const previousMonthData = energyData.data.filter((e: any) => {
              const date = new Date(e.period?.start || e.timestamp);
              return date >= previousMonthStart && date < currentMonthStart;
            });

            currentEnergy = currentMonthData.reduce(
              (sum: number, e: any) =>
                sum + (e.electricity?.consumption || e.consumption || 0),
              0,
            );
            previousEnergy = previousMonthData.reduce(
              (sum: number, e: any) =>
                sum + (e.electricity?.consumption || e.consumption || 0),
              0,
            );

            // Group by month for chart
            const energyMap: Record<
              string,
              { consumption: number; cost: number }
            > = {};
            energyData.data.slice(-6).forEach((e: any) => {
              const date = new Date(e.period?.start || e.timestamp);
              const monthKey = date.toLocaleDateString("en-US", {
                month: "short",
              });
              if (!energyMap[monthKey]) {
                energyMap[monthKey] = { consumption: 0, cost: 0 };
              }
              energyMap[monthKey].consumption +=
                e.electricity?.consumption || e.consumption || 0;
              energyMap[monthKey].cost += e.cost || 0;
            });

            Object.entries(energyMap).forEach(([month, data]) => {
              energyByMonth.push({ month, ...data });
            });
          }
        }

        // Process spaces
        let spaceUtilization = 0;
        if (spacesRes.status === "fulfilled" && spacesRes.value.ok) {
          const spacesData = await spacesRes.value.json();
          if (spacesData.success && spacesData.stats) {
            spaceUtilization = spacesData.stats.averageUtilization || 0;
          }
        }

        // Process IoT
        let iotTotal = 0;
        let iotOnline = 0;
        let iotOffline = 0;
        if (iotRes.status === "fulfilled" && iotRes.value.ok) {
          const iotData = await iotRes.value.json();
          if (iotData.success && iotData.stats) {
            iotTotal = iotData.stats.total || 0;
            iotOnline = iotData.stats.online || 0;
            iotOffline = iotData.stats.offline || 0;
          }
        }

        // Calculate trends
        const energyTrend =
          previousEnergy > 0
            ? ((currentEnergy - previousEnergy) / previousEnergy) * 100
            : 0;
        const energyTrendDirection: "up" | "down" =
          energyTrend < 0 ? "down" : "up";

        // Update state
        setFacilityData({
          totalFacilities: 12, // Would come from facility service
          activeFacilities: 10,
          totalAssets,
          operationalAssets,
          maintenanceAlerts,
          workOrdersOpen,
          workOrdersCompleted,
          energyConsumption: {
            current: currentEnergy,
            previous: previousEnergy,
            trend: energyTrendDirection,
            percentage: Math.abs(energyTrend),
          },
          complianceScore: 87, // Would come from compliance service
          licensesExpiring: 3, // Would come from license service
          iotDevices: {
            total: iotTotal,
            online: iotOnline,
            offline: iotOffline,
          },
          spaceUtilization: Math.round(spaceUtilization),
          carbonFootprint: {
            current: 1250, // Would come from energy sustainability
            target: 1000,
            reduction: 12.5,
          },
        });

        // Set chart data
        setAssetStatusData([
          {
            name: "Operational",
            value: assetStatusMap.operational || 0,
            color: "#10b981",
          },
          {
            name: "Maintenance",
            value: assetStatusMap.maintenance || 0,
            color: "#f59e0b",
          },
          {
            name: "Out of Service",
            value: assetStatusMap["out-of-service"] || 0,
            color: "#ef4444",
          },
        ]);

        // Convert maintenance data to array format
        const maintenanceArray = Object.entries(maintenanceByMonth)
          .map(([month, data]) => ({ month, ...data }))
          .slice(-6);
        setMaintenanceData(
          maintenanceArray.length > 0
            ? maintenanceArray
            : [
                { month: "Jan", preventive: 0, corrective: 0, emergency: 0 },
                { month: "Feb", preventive: 0, corrective: 0, emergency: 0 },
              ],
        );

        // Set energy chart data
        setEnergyData(
          energyByMonth.length > 0
            ? energyByMonth
            : [
                { month: "Jan", consumption: 0, cost: 0 },
                { month: "Feb", consumption: 0, cost: 0 },
              ],
        );

        // Compliance data (would come from compliance service)
        setComplianceData([
          { category: "Licenses", score: 92, status: "good" },
          { category: "Permits", score: 88, status: "good" },
          { category: "Inspections", score: 85, status: "good" },
          { category: "Safety", score: 90, status: "good" },
          { category: "Environmental", score: 82, status: "fair" },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Keep default/fallback data on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading facility dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facility Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of all facilities, assets, and operations
          </p>
        </div>
        <Button>
          <RiBrainLine className="mr-2 h-4 w-4" />
          AI Insights
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facilities
            </CardTitle>
            <RiBuildingLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilityData.totalFacilities}
            </div>
            <p className="text-xs text-muted-foreground">
              {facilityData.activeFacilities} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <RiToolsLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilityData.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {facilityData.operationalAssets} operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
            <RiHammerLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilityData.workOrdersOpen}
            </div>
            <p className="text-xs text-muted-foreground">
              {facilityData.workOrdersCompleted} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Score
            </CardTitle>
            <RiShieldCheckLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilityData.complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {facilityData.licensesExpiring} licenses expiring soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {facilityData.maintenanceAlerts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiAlertLine className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">
                  Maintenance Alerts
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800"
              >
                {facilityData.maintenanceAlerts} alerts
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              {facilityData.maintenanceAlerts} assets require immediate
              attention
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Energy Consumption */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption</CardTitle>
            <CardDescription>
              Monthly energy consumption and cost trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {facilityData.energyConsumption.current.toLocaleString()}{" "}
                    kWh
                  </p>
                  <p className="text-sm text-muted-foreground">Current month</p>
                </div>
                <div className="text-right">
                  {facilityData.energyConsumption.trend === "down" ? (
                    <div className="flex items-center text-green-600">
                      <RiArrowDownLine className="h-4 w-4 mr-1" />
                      <span className="font-semibold">
                        {Math.abs(
                          facilityData.energyConsumption.percentage,
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <RiArrowUpLine className="h-4 w-4 mr-1" />
                      <span className="font-semibold">
                        {facilityData.energyConsumption.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    vs previous month
                  </p>
                </div>
              </div>
            </div>
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

        {/* Asset Status */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
            <CardDescription>
              Current status of all facility assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {assetStatusData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maintenance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Trends</CardTitle>
            <CardDescription>
              Preventive vs corrective maintenance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="preventive" fill="#10b981" name="Preventive" />
                <Bar dataKey="corrective" fill="#f59e0b" name="Corrective" />
                <Bar dataKey="emergency" fill="#ef4444" name="Emergency" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Scores</CardTitle>
            <CardDescription>
              Compliance performance by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="category" type="category" />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiFireLine className="h-5 w-5" />
              Civil Defense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fire safety compliance and inspections
            </p>
            <Button variant="outline" className="w-full">
              View Compliance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiGovernmentLine className="h-5 w-5" />
              Abalady
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Business licenses and permits
            </p>
            <Button variant="outline" className="w-full">
              Manage Licenses
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiFileListLine className="h-5 w-5" />
              CAD & Drawings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AutoCAD files, drawings, and specifications
            </p>
            <Button variant="outline" className="w-full">
              View Drawings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* IoT & Smart Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiSensorLine className="h-5 w-5" />
            IoT Devices & Smart Buildings
          </CardTitle>
          <CardDescription>Real-time monitoring and automation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold">
                {facilityData.iotDevices.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {facilityData.iotDevices.online}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-red-600">
                {facilityData.iotDevices.offline}
              </p>
            </div>
          </div>
          <Button variant="outline" className="mt-4">
            Manage IoT Devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FacilityDashboard() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-500">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <FacilityDashboardContent />
    </ErrorBoundary>
  );
}
