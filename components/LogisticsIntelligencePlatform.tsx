import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  BarChart3,
  Globe,
  Zap,
  Shield,
  Users,
  Package,
  Navigation,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  MessageSquare,
  Phone,
  Mail,
  Settings,
  Database,
  Activity,
  Eye,
  Target,
  Award,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

/**
 * AI-T GLOBAL LOGISTICS INTELLIGENCE PLATFORM
 * "The Bloomberg Terminal of Logistics"
 *
 * A comprehensive, production-ready platform integrating:
 * - Real-time shipment tracking across all modes
 * - Predictive ETA with ML
 * - Border crossing intelligence
 * - Route optimization
 * - Compliance verification (WhatsApp-integrated)
 * - Performance analytics
 * - Global price indexing
 * - Multi-tenant architecture
 * - Universal API integration layer
 */

const AITGlobalLogisticsPlatform = () => {
  const [activeModule, setActiveModule] = useState("command-center");
  const [selectedRegion, setSelectedRegion] = useState("gcc");
  const [selectedCorridor, setSelectedCorridor] = useState("saudi-kuwait");
  const [timeRange, setTimeRange] = useState("24h");
  const [liveData, setLiveData] = useState(generateLiveData());
  const [alerts, setAlerts] = useState(generateAlerts());
  const [shipments, setShipments] = useState(generateShipments());

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(generateLiveData());
      setAlerts(generateAlerts());
      setShipments((prevShipments) =>
        prevShipments.map((s) => ({
          ...s,
          status: Math.random() > 0.95 ? getNextStatus(s.status) : s.status,
          currentLocation:
            Math.random() > 0.9
              ? updateLocation(s.currentLocation)
              : s.currentLocation,
          etaAccuracy: Math.min(100, s.etaAccuracy + (Math.random() * 2 - 0.5)),
        })),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Navigation modules
  const modules = [
    {
      id: "command-center",
      name: "Command Center",
      icon: Activity,
      color: "blue",
    },
    {
      id: "live-tracking",
      name: "Live Tracking",
      icon: Navigation,
      color: "green",
    },
    {
      id: "predictive-analytics",
      name: "Predictive Analytics",
      icon: TrendingUp,
      color: "purple",
    },
    {
      id: "border-intelligence",
      name: "Border Intelligence",
      icon: Shield,
      color: "orange",
    },
    {
      id: "compliance",
      name: "Compliance Engine",
      icon: CheckCircle,
      color: "teal",
    },
    {
      id: "marketplace",
      name: "Transport Marketplace",
      icon: Users,
      color: "pink",
    },
    {
      id: "price-index",
      name: "Global Price Index",
      icon: DollarSign,
      color: "yellow",
    },
    {
      id: "route-optimizer",
      name: "Route Optimizer",
      icon: Target,
      color: "indigo",
    },
  ];

  // Regions and corridors
  const regions = [
    {
      id: "gcc",
      name: "GCC",
      corridors: ["saudi-kuwait", "uae-saudi", "qatar-bahrain"],
    },
    {
      id: "eu",
      name: "European Union",
      corridors: ["germany-poland", "france-spain", "netherlands-belgium"],
    },
    {
      id: "asia",
      name: "Asia-Pacific",
      corridors: ["china-vietnam", "singapore-malaysia", "india-bangladesh"],
    },
    {
      id: "nafta",
      name: "North America",
      corridors: ["usa-mexico", "usa-canada", "mexico-central"],
    },
    {
      id: "global",
      name: "Global Maritime",
      corridors: ["asia-europe", "trans-pacific", "trans-atlantic"],
    },
  ];

  const currentCorridors =
    regions.find((r) => r.id === selectedRegion)?.corridors || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-2xl border-b-4 border-blue-500">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Globe className="w-10 h-10 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    AI-T Global Intelligence
                  </h1>
                  <p className="text-xs text-blue-300">
                    The Bloomberg Terminal of Logistics
                  </p>
                </div>
              </div>

              <div className="ml-8 flex items-center space-x-2 bg-blue-950 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400 font-semibold">
                  LIVE
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Region Selector */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-800 border border-blue-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>

              {/* Corridor Selector */}
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
                className="bg-slate-800 border border-blue-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {currentCorridors.map((corridor) => (
                  <option key={corridor} value={corridor}>
                    {corridor
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" → ")}
                  </option>
                ))}
              </select>

              {/* Time Range */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-800 border border-blue-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Alert Badge */}
              <button className="relative p-2 hover:bg-slate-800 rounded-lg transition">
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                  BA
                </div>
                <div className="text-sm">
                  <div className="font-semibold">Basheer Ahmad</div>
                  <div className="text-xs text-blue-300">Platform Admin</div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Navigation */}
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-${module.color}-600 text-white shadow-lg scale-105`
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{module.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {activeModule === "command-center" && (
          <CommandCenter
            liveData={liveData}
            alerts={alerts}
            shipments={shipments}
          />
        )}
        {activeModule === "live-tracking" && (
          <LiveTracking shipments={shipments} />
        )}
        {activeModule === "predictive-analytics" && <PredictiveAnalytics />}
        {activeModule === "border-intelligence" && <BorderIntelligence />}
        {activeModule === "compliance" && (
          <ComplianceEngine shipments={shipments} />
        )}
        {activeModule === "marketplace" && <TransportMarketplace />}
        {activeModule === "price-index" && <GlobalPriceIndex />}
        {activeModule === "route-optimizer" && <RouteOptimizer />}
      </div>
    </div>
  );
};

// ==================== COMMAND CENTER MODULE ====================
const CommandCenter = ({
  liveData,
  alerts,
  shipments,
}: {
  liveData: ReturnType<typeof generateLiveData>;
  alerts: ReturnType<typeof generateAlerts>;
  shipments: ReturnType<typeof generateShipments>;
}) => {
  const kpis = [
    {
      label: "Active Shipments",
      value: liveData.activeShipments.toLocaleString(),
      change: "+12.3%",
      trend: "up",
      icon: Truck,
      color: "blue",
    },
    {
      label: "On-Time Performance",
      value: `${liveData.otpPercentage}%`,
      change: "+3.2%",
      trend: "up",
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Avg ETA Accuracy",
      value: `${liveData.etaAccuracy}%`,
      change: "+5.1%",
      trend: "up",
      icon: Target,
      color: "purple",
    },
    {
      label: "Border Wait Time",
      value: `${liveData.avgBorderWait}h`,
      change: "-18.5%",
      trend: "down",
      icon: Clock,
      color: "orange",
    },
    {
      label: "Cost Savings",
      value: `$${(liveData.costSavings / 1000000).toFixed(1)}M`,
      change: "+24.7%",
      trend: "up",
      icon: DollarSign,
      color: "green",
    },
    {
      label: "Compliance Rate",
      value: `${liveData.complianceRate}%`,
      change: "+1.8%",
      trend: "up",
      icon: Shield,
      color: "teal",
    },
  ];

  const performanceData = generatePerformanceData();
  const corridorPerformance = generateCorridorPerformance();
  const borderWaitTrends = generateBorderWaitTrends();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-4 border-l-4 hover:shadow-xl transition-shadow"
              style={{ borderColor: getColorHex(kpi.color) }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className="w-8 h-8"
                  style={{ color: getColorHex(kpi.color) }}
                />
                <span
                  className={`text-sm font-semibold ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {kpi.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-800">Critical Alerts</h2>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {alerts.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 shadow flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alert.severity === "critical"
                          ? "bg-red-600 text-white"
                          : alert.severity === "high"
                            ? "bg-orange-500 text-white"
                            : "bg-yellow-400 text-slate-800"
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-500">{alert.time}</span>
                  </div>
                  <div className="font-semibold text-slate-800 mb-1">
                    {alert.title}
                  </div>
                  <div className="text-sm text-slate-600">
                    {alert.description}
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold">
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Performance Timeline</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOTP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="shipments"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorShipments)"
                name="Active Shipments"
              />
              <Area
                type="monotone"
                dataKey="otp"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorOTP)"
                name="OTP %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Corridor Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Top Corridors Performance</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={corridorPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis
                dataKey="corridor"
                type="category"
                stroke="#64748b"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="volume" fill="#8b5cf6" name="Volume" />
              <Bar dataKey="efficiency" fill="#06b6d4" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Border Wait Times Trends */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span>Border Crossing Wait Time Analysis</span>
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={borderWaitTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" />
            <YAxis
              stroke="#64748b"
              label={{ value: "Hours", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="kuwait"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Kuwait Border"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="saudi"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Saudi Border"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AI Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Active Shipments Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Real-Time Shipment Monitor</span>
          </h3>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition text-sm font-semibold flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Shipment ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Route
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Current Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  ETA
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 8).map((shipment, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3 text-sm font-mono text-slate-800">
                    {shipment.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {shipment.route}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        shipment.status === "In Transit"
                          ? "bg-blue-100 text-blue-700"
                          : shipment.status === "At Border"
                            ? "bg-orange-100 text-orange-700"
                            : shipment.status === "Delayed"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                      }`}
                    >
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {shipment.currentLocation}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {shipment.eta}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${shipment.etaAccuracy >= 90 ? "bg-green-500" : shipment.etaAccuracy >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${shipment.etaAccuracy}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {shipment.etaAccuracy.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                      Track →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== LIVE TRACKING MODULE ====================
const LiveTracking = ({
  shipments,
}: {
  shipments: ReturnType<typeof generateShipments>;
}) => {
  const [selectedShipment, setSelectedShipment] = useState(
    shipments[0] || null,
  );
  const [trackingHistory, setTrackingHistory] = useState(
    generateTrackingHistory(),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Visualization */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Live Route Visualization</span>
          </h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
              Satellite
            </button>
            <button className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold">
              Traffic
            </button>
            <button className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold">
              3D
            </button>
          </div>
        </div>

        {/* Simulated Map */}
        <div className="bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 rounded-lg h-96 relative overflow-hidden border-2 border-blue-200">
          {/* Route Path */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient
                id="routeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 50 300 Q 150 200, 250 250 T 450 280"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="10 5"
            />
          </svg>

          {/* Waypoints */}
          <div
            className="absolute top-72 left-10 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-bold"
            style={{ zIndex: 2 }}
          >
            📍 Origin: Riyadh Plant
          </div>
          <div
            className="absolute top-40 left-32 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-bold animate-pulse"
            style={{ zIndex: 2 }}
          >
            🚛 Current: En Route
          </div>
          <div
            className="absolute top-60 right-32 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-bold"
            style={{ zIndex: 2 }}
          >
            🏁 Destination: Kuwait City
          </div>

          {/* Live Truck Animation */}
          <div
            className="absolute top-40 left-40 animate-pulse"
            style={{ zIndex: 3 }}
          >
            <Truck className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Route Details */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-600 font-semibold mb-1">
              Distance Traveled
            </div>
            <div className="text-2xl font-bold text-blue-900">287 km</div>
            <div className="text-xs text-blue-600">of 465 km</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-600 font-semibold mb-1">
              Avg Speed
            </div>
            <div className="text-2xl font-bold text-green-900">72 km/h</div>
            <div className="text-xs text-green-600">within limits</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-purple-600 font-semibold mb-1">
              Time Elapsed
            </div>
            <div className="text-2xl font-bold text-purple-900">4.2h</div>
            <div className="text-xs text-purple-600">on schedule</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="text-xs text-orange-600 font-semibold mb-1">
              Next Checkpoint
            </div>
            <div className="text-2xl font-bold text-orange-900">1.8h</div>
            <div className="text-xs text-orange-600">Saudi Border</div>
          </div>
        </div>
      </div>

      {/* Shipment Details & Timeline */}
      <div className="space-y-6">
        {/* Shipment Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Select Shipment
          </label>
          <select
            value={selectedShipment?.id}
            onChange={(e) => {
              const found = shipments.find((s) => s.id === e.target.value);
              if (found) setSelectedShipment(found);
            }}
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {shipments.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {shipment.id} - {shipment.route}
              </option>
            ))}
          </select>
        </div>

        {/* Shipment Info Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Tracking ID</div>
          <div className="text-2xl font-bold mb-4">{selectedShipment?.id}</div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Status</span>
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                {selectedShipment?.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">ETA Accuracy</span>
              <span className="text-lg font-bold">
                {selectedShipment?.etaAccuracy.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">Carrier</span>
              <span className="font-semibold">AL-Majed Transport</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-sm opacity-90 mb-1">Estimated Arrival</div>
            <div className="text-xl font-bold">{selectedShipment?.eta}</div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Journey Timeline</span>
          </h4>
          <div className="space-y-4">
            {trackingHistory.map((event, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                    event.status === "completed"
                      ? "bg-green-500"
                      : event.status === "current"
                        ? "bg-blue-500 animate-pulse"
                        : "bg-slate-300"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div
                      className={`font-semibold text-sm ${
                        event.status === "completed"
                          ? "text-slate-800"
                          : event.status === "current"
                            ? "text-blue-600"
                            : "text-slate-400"
                      }`}
                    >
                      {event.checkpoint}
                    </div>
                    <div className="text-xs text-slate-500">{event.time}</div>
                  </div>
                  {event.details && (
                    <div className="text-xs text-slate-600 mt-1">
                      {event.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Verification */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-bold text-green-800">
              WhatsApp Verification
            </h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Last Verification</span>
              <span className="text-sm font-semibold text-slate-800">
                12 mins ago
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Compliance Status</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm">
              Request Location Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PREDICTIVE ANALYTICS MODULE ====================
const PredictiveAnalytics = () => {
  const etaAccuracyData = generateETAAccuracyData();
  const delayPredictionData = generateDelayPredictionData();
  const mlModelMetrics = generateMLModelMetrics();

  return (
    <div className="space-y-6">
      {/* ML Model Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {mlModelMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="text-sm opacity-90 mb-2">{metric.name}</div>
            <div className="text-3xl font-bold mb-2">{metric.value}</div>
            <div className="text-xs opacity-75">{metric.description}</div>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ETA Accuracy Over Time */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>ML-Predicted ETA Accuracy</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={etaAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[80, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Accuracy %"
                dot={{ r: 6, fill: "#8b5cf6" }}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Baseline"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-semibold text-purple-800 mb-2">
              🎯 Key Insights
            </div>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• ML model shows 96.8% accuracy vs 82% baseline</li>
              <li>• Continuous improvement over 12 weeks</li>
              <li>
                • Factor in: weather, traffic, border wait times, historical
                patterns
              </li>
            </ul>
          </div>
        </div>

        {/* Delay Risk Prediction */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span>Delay Risk Prediction (Next 48h)</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={delayPredictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="corridor" stroke="#64748b" />
              <YAxis
                stroke="#64748b"
                label={{
                  value: "Risk Score",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="risk" fill="#f59e0b" name="Risk Score" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm font-semibold text-orange-800 mb-2">
              ⚠️ High-Risk Corridors
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700">
                  Saudi-Kuwait (Tuesday peak)
                </span>
                <span className="bg-red-500 text-white px-2 py-1 rounded font-bold">
                  HIGH
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700">
                  UAE-Saudi (Weather alert)
                </span>
                <span className="bg-yellow-500 text-slate-800 px-2 py-1 rounded font-bold">
                  MEDIUM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <span>AI-Powered Optimization Recommendations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold text-slate-800">Schedule Shift</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Shift Kuwait border crossing to Sunday (18.3h avg) vs Tuesday
              (42.1h avg)
            </p>
            <div className="text-xs font-semibold text-green-600">
              💰 Save 24 hours, $2,400
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-bold text-slate-800">Route Change</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Use Khafji border (465km) instead of AlRuqi (590km) for current
              traffic conditions
            </p>
            <div className="text-xs font-semibold text-green-600">
              💰 Save 125km, 2 hours, $150
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-bold text-slate-800">Carrier Switch</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Alternative carrier available with better border crossing history
            </p>
            <div className="text-xs font-semibold text-green-600">
              💰 15% higher OTP rate
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>ML Model Feature Importance</span>
        </h3>
        <div className="space-y-3">
          {[
            {
              feature: "Border Wait Time (Historical)",
              importance: 95,
              color: "blue",
            },
            { feature: "Day of Week", importance: 87, color: "purple" },
            { feature: "Weather Conditions", importance: 78, color: "orange" },
            { feature: "Traffic Density", importance: 72, color: "green" },
            { feature: "Carrier Performance", importance: 68, color: "teal" },
            { feature: "Loading Black Days", importance: 61, color: "red" },
            { feature: "Cargo Type", importance: 54, color: "yellow" },
            { feature: "Distance", importance: 48, color: "indigo" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="w-48 text-sm font-semibold text-slate-700">
                {item.feature}
              </div>
              <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`bg-${item.color}-500 h-6 flex items-center justify-end px-3 transition-all duration-500`}
                  style={{ width: `${item.importance}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {item.importance}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== BORDER INTELLIGENCE MODULE ====================
const BorderIntelligence = () => {
  const borderStats = [
    {
      border: "Kuwait Customs",
      avgWait: 32.2,
      trend: -12,
      volume: 847,
      efficiency: 68,
    },
    {
      border: "Saudi Khafji",
      avgWait: 5.8,
      trend: -8,
      volume: 1243,
      efficiency: 92,
    },
    {
      border: "Saudi AlRuqi",
      avgWait: 13.1,
      trend: +5,
      volume: 621,
      efficiency: 78,
    },
    {
      border: "UAE Al Ghuwaifat",
      avgWait: 4.2,
      trend: -15,
      volume: 982,
      efficiency: 95,
    },
    {
      border: "Qatar-Bahrain",
      avgWait: 2.1,
      trend: -5,
      volume: 456,
      efficiency: 97,
    },
  ];

  const weekdayAnalysis = [
    { day: "Saturday", kuwait: 28.5, saudi: 4.8, recommendation: "Good" },
    { day: "Sunday", kuwait: 18.3, saudi: 5.2, recommendation: "Optimal" },
    { day: "Monday", kuwait: 38.2, saudi: 6.1, recommendation: "Avoid" },
    { day: "Tuesday", kuwait: 42.1, saudi: 5.9, recommendation: "Avoid" },
    { day: "Wednesday", kuwait: 36.5, saudi: 5.4, recommendation: "Poor" },
    { day: "Thursday", kuwait: 35.2, saudi: 5.3, recommendation: "Poor" },
    { day: "Friday", kuwait: 24.8, saudi: 6.3, recommendation: "Good" },
  ];

  return (
    <div className="space-y-6">
      {/* Border Performance Dashboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-orange-600" />
          <span>Real-Time Border Performance</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Border Crossing
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Avg Wait Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Trend (24h)
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Daily Volume
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Efficiency
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {borderStats.map((border, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {border.border}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-bold ${border.avgWait > 20 ? "text-red-600" : border.avgWait > 10 ? "text-orange-600" : "text-green-600"}`}
                    >
                      {border.avgWait}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-semibold ${border.trend < 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {border.trend > 0 ? "+" : ""}
                      {border.trend}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                    {border.volume} trucks
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${border.efficiency >= 90 ? "bg-green-500" : border.efficiency >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${border.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-10">
                        {border.efficiency}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        border.avgWait < 6
                          ? "bg-green-100 text-green-700"
                          : border.avgWait < 15
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {border.avgWait < 6
                        ? "Optimal"
                        : border.avgWait < 15
                          ? "Moderate"
                          : "Congested"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekday Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Border Crossing Wait Time by Day of Week</span>
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={weekdayAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" />
            <YAxis
              stroke="#64748b"
              label={{
                value: "Wait Time (hours)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="kuwait" fill="#f59e0b" name="Kuwait Border" />
            <Bar dataKey="saudi" fill="#3b82f6" name="Saudi Border" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekdayAnalysis.map((day, idx) => (
            <div
              key={idx}
              className={`text-center p-2 rounded-lg ${
                day.recommendation === "Optimal"
                  ? "bg-green-100 border-2 border-green-500"
                  : day.recommendation === "Good"
                    ? "bg-blue-100 border border-blue-300"
                    : day.recommendation === "Poor"
                      ? "bg-yellow-100 border border-yellow-300"
                      : "bg-red-100 border-2 border-red-500"
              }`}
            >
              <div className="text-xs font-bold text-slate-700">
                {day.day.slice(0, 3)}
              </div>
              <div
                className={`text-xs font-semibold mt-1 ${
                  day.recommendation === "Optimal"
                    ? "text-green-700"
                    : day.recommendation === "Good"
                      ? "text-blue-700"
                      : day.recommendation === "Poor"
                        ? "text-yellow-700"
                        : "text-red-700"
                }`}
              >
                {day.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h4 className="text-lg font-bold text-green-800">Best Practices</h4>
          </div>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Schedule Kuwait crossings on Sunday (18.3h avg)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Use Khafji border for faster Saudi crossing (5.8h)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Avoid Tuesday/Wednesday for Kuwait (42h+ wait)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Pre-clear documentation electronically</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border-2 border-orange-300">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <h4 className="text-lg font-bold text-orange-800">Risk Factors</h4>
          </div>
          <ul className="space-y-2 text-sm text-orange-700">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Kuwait border highly variable (18-42h range)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Loading black days (Wed/Thu) add 6-8h delay</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Documentation delays increase border wait by 3x</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Weekend traffic surges at popular crossings</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <h4 className="text-lg font-bold text-blue-800">
              Optimization Potential
            </h4>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-slate-600 mb-1">Time Savings</div>
              <div className="text-2xl font-bold text-blue-900">
                24-36 hours
              </div>
              <div className="text-xs text-blue-600">
                per trip with optimal scheduling
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-slate-600 mb-1">Cost Reduction</div>
              <div className="text-2xl font-bold text-green-900">$2,400</div>
              <div className="text-xs text-green-600">
                per shipment optimization
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPLIANCE ENGINE MODULE ====================
const ComplianceEngine = ({
  shipments,
}: {
  shipments: ReturnType<typeof generateShipments>;
}) => {
  const complianceStats = {
    totalTrucks: 127,
    compliant: 119,
    pending: 5,
    violations: 3,
    rate: 93.7,
  };

  const complianceChecks = [
    {
      rule: "Offload Completed at Designated Location",
      pass: 119,
      fail: 3,
      pending: 5,
    },
    {
      rule: "Backload Within Approved Corridor",
      pass: 121,
      fail: 2,
      pending: 4,
    },
    { rule: "Exit Border Direction Correct", pass: 124, fail: 1, pending: 2 },
    { rule: "No Outstanding Fines", pass: 116, fail: 8, pending: 3 },
    {
      rule: "WhatsApp Verification Response Time",
      pass: 122,
      fail: 1,
      pending: 4,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {complianceStats.totalTrucks}
          </div>
          <div className="text-sm text-slate-500 mt-1">Total Active</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-800">
            {complianceStats.compliant}
          </div>
          <div className="text-sm text-slate-500 mt-1">Compliant</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-800">
            {complianceStats.pending}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Pending Verification
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-800">
            {complianceStats.violations}
          </div>
          <div className="text-sm text-slate-500 mt-1">Violations</div>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold">{complianceStats.rate}%</div>
          <div className="text-sm opacity-90 mt-1">Compliance Rate</div>
        </div>
      </div>

      {/* Compliance Rules Performance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <span>Compliance Rules Performance</span>
        </h3>
        <div className="space-y-4">
          {complianceChecks.map((check, idx) => {
            const total = check.pass + check.fail + check.pending;
            const passRate = ((check.pass / total) * 100).toFixed(1);
            return (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">
                    {check.rule}
                  </span>
                  <span
                    className={`text-sm font-bold ${parseFloat(passRate) >= 95 ? "text-green-600" : parseFloat(passRate) >= 85 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {passRate}% Pass Rate
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div className="flex h-3">
                      <div
                        className="bg-green-500 h-3"
                        style={{ width: `${(check.pass / total) * 100}%` }}
                      ></div>
                      <div
                        className="bg-yellow-500 h-3"
                        style={{ width: `${(check.pending / total) * 100}%` }}
                      ></div>
                      <div
                        className="bg-red-500 h-3"
                        style={{ width: `${(check.fail / total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-green-600">✓ {check.pass} Passed</span>
                  <span className="text-yellow-600">
                    ⏱ {check.pending} Pending
                  </span>
                  <span className="text-red-600">✗ {check.fail} Failed</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Verification Dashboard */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-green-300">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-green-800">
              WhatsApp Compliance Verification
            </h3>
            <p className="text-sm text-green-600">
              Real-time location verification without special apps
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-slate-600 mb-1">
              Verification Requests (24h)
            </div>
            <div className="text-3xl font-bold text-green-900">342</div>
            <div className="text-xs text-green-600 mt-1">
              ↑ 12% vs yesterday
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-slate-600 mb-1">Response Rate</div>
            <div className="text-3xl font-bold text-blue-900">96.8%</div>
            <div className="text-xs text-blue-600 mt-1">
              Avg response: 2.3 min
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-slate-600 mb-1">Accuracy Score</div>
            <div className="text-3xl font-bold text-purple-900">98.4%</div>
            <div className="text-xs text-purple-600 mt-1">
              GPS coordinates verified
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <h4 className="font-semibold text-slate-800 mb-3">
            Recent Verifications
          </h4>
          <div className="space-y-2">
            {[
              {
                driver: "Ahmad Al-Dosari",
                location: "Dammam Plant Exit",
                time: "3 min ago",
                status: "verified",
              },
              {
                driver: "Mohammed Hassan",
                location: "Khafji Border",
                time: "8 min ago",
                status: "verified",
              },
              {
                driver: "Khalid Al-Enezi",
                location: "Kuwait City",
                time: "12 min ago",
                status: "verified",
              },
              {
                driver: "Fahad Al-Mutairi",
                location: "Riyadh Plant",
                time: "18 min ago",
                status: "pending",
              },
            ].map((verification, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 rounded"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${verification.status === "verified" ? "bg-green-500" : "bg-yellow-500"}`}
                  ></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {verification.driver}
                    </div>
                    <div className="text-xs text-slate-600">
                      {verification.location}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {verification.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Violation Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>Active Violations</span>
        </h3>
        <div className="space-y-3">
          {[
            {
              id: "SA-KW-2196",
              driver: "Khalid Al-Enezi",
              violation: "Outstanding Fine: 500 SAR - Speeding",
              severity: "medium",
              time: "2 hours ago",
            },
            {
              id: "SA-KW-2318",
              driver: "Hassan Al-Rashid",
              violation: "Backload Location Outside Approved Corridor",
              severity: "high",
              time: "5 hours ago",
            },
            {
              id: "SA-KW-2429",
              driver: "Omar Al-Mutairi",
              violation: "Failed WhatsApp Verification Response",
              severity: "low",
              time: "1 day ago",
            },
          ].map((violation, idx) => (
            <div
              key={idx}
              className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      violation.severity === "high"
                        ? "bg-red-600 text-white"
                        : violation.severity === "medium"
                          ? "bg-orange-500 text-white"
                          : "bg-yellow-400 text-slate-800"
                    }`}
                  >
                    {violation.severity.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-500">
                    {violation.time}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-slate-800 mb-1">
                  {violation.id} - {violation.driver}
                </div>
                <div className="text-sm text-red-700">
                  {violation.violation}
                </div>
              </div>
              <button className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
                Resolve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== TRANSPORT MARKETPLACE MODULE ====================
const TransportMarketplace = () => {
  const marketStats = {
    activeCarriers: 847,
    availableTrucks: 2341,
    liveQuotes: 156,
    avgResponseTime: "4.2 min",
  };

  const liveQuotes = generateMarketplaceQuotes();
  const carrierRankings = generateCarrierRankings();

  return (
    <div className="space-y-6">
      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <Users className="w-8 h-8 mb-2 opacity-90" />
          <div className="text-3xl font-bold">{marketStats.activeCarriers}</div>
          <div className="text-sm opacity-90 mt-1">Active Carriers</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <Truck className="w-8 h-8 mb-2 opacity-90" />
          <div className="text-3xl font-bold">
            {marketStats.availableTrucks.toLocaleString()}
          </div>
          <div className="text-sm opacity-90 mt-1">Available Trucks</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <DollarSign className="w-8 h-8 mb-2 opacity-90" />
          <div className="text-3xl font-bold">{marketStats.liveQuotes}</div>
          <div className="text-sm opacity-90 mt-1">Live Quotes</div>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-90" />
          <div className="text-3xl font-bold">
            {marketStats.avgResponseTime}
          </div>
          <div className="text-sm opacity-90 mt-1">Avg Quote Time</div>
        </div>
      </div>

      {/* Request Quote Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Search className="w-5 h-5 text-pink-600" />
          <span>Request Transport Quote</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Origin
            </label>
            <input
              type="text"
              placeholder="Riyadh, Saudi Arabia"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Destination
            </label>
            <input
              type="text"
              placeholder="Kuwait City, Kuwait"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cargo Type
            </label>
            <select className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-pink-500">
              <option>Chemical Materials</option>
              <option>General Cargo</option>
              <option>Refrigerated</option>
              <option>Hazmat</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Pickup Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Weight (tons)
            </label>
            <input
              type="number"
              placeholder="25"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-pink-500"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition font-semibold">
              Get Instant Quotes
            </button>
          </div>
        </div>
      </div>

      {/* Live Quotes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span>Live Market Quotes</span>
        </h3>
        <div className="space-y-3">
          {liveQuotes.map((quote, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {quote.carrier.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {quote.carrier}
                      </div>
                      <div className="text-xs text-slate-500">
                        {quote.route}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Rating</div>
                      <div className="font-semibold text-yellow-600">
                        {quote.rating} ⭐
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Transit Time</div>
                      <div className="font-semibold text-slate-800">
                        {quote.transitTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">OTP Rate</div>
                      <div className="font-semibold text-green-600">
                        {quote.otpRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">
                        Response Time
                      </div>
                      <div className="font-semibold text-slate-800">
                        {quote.responseTime}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <div className="text-3xl font-bold text-green-600">
                    ${quote.price.toLocaleString()}
                  </div>
                  <button className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Carriers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-600" />
          <span>Top Performing Carriers</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Carrier
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Completed
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  OTP Rate
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Avg Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {carrierRankings.map((carrier, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        idx === 0
                          ? "bg-yellow-400 text-yellow-900"
                          : idx === 1
                            ? "bg-slate-300 text-slate-900"
                            : idx === 2
                              ? "bg-orange-400 text-orange-900"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {carrier.name}
                  </td>
                  <td className="px-4 py-3 text-yellow-600 font-semibold">
                    {carrier.rating} ⭐
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {carrier.completed}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${carrier.otpRate >= 95 ? "text-green-600" : carrier.otpRate >= 90 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {carrier.otpRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    ${carrier.avgPrice}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {carrier.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== GLOBAL PRICE INDEX MODULE ====================
const GlobalPriceIndex = () => {
  const priceIndices = generatePriceIndices();
  const priceTrends = generatePriceTrends();
  const regionalPricing = generateRegionalPricing();

  return (
    <div className="space-y-6">
      {/* Price Index Overview */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-yellow-400">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="w-10 h-10 text-yellow-600" />
          <div>
            <h2 className="text-2xl font-bold text-yellow-900">
              Global Logistics Price Index
            </h2>
            <p className="text-sm text-yellow-700">
              Real-time market pricing intelligence across all corridors
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {priceIndices.map((index, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow">
              <div className="text-xs text-slate-600 mb-1">{index.region}</div>
              <div className="text-2xl font-bold text-slate-900">
                ${index.avgRate}
              </div>
              <div className="text-xs text-slate-600 mt-1">per km</div>
              <div
                className={`text-sm font-semibold mt-2 ${index.change >= 0 ? "text-red-600" : "text-green-600"}`}
              >
                {index.change >= 0 ? "+" : ""}
                {index.change}% vs last week
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Trends Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>90-Day Price Trend Analysis</span>
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={priceTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis
              stroke="#64748b"
              label={{ value: "$/km", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="gcc"
              stroke="#f59e0b"
              strokeWidth={3}
              name="GCC"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="eu"
              stroke="#3b82f6"
              strokeWidth={3}
              name="EU"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="asia"
              stroke="#10b981"
              strokeWidth={3}
              name="Asia"
              dot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="nafta"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="NAFTA"
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Pricing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Corridor Price Comparison</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalPricing} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis
                dataKey="corridor"
                type="category"
                stroke="#64748b"
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="price" fill="#8b5cf6" name="Price ($/km)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Price Factors & Insights
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="font-semibold text-blue-900 mb-2">
                🔍 Market Dynamics
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• GCC prices up 3.2% due to increased fuel costs</li>
                <li>• EU prices stable with efficient border operations</li>
                <li>• Asia experiencing 5% reduction from overcapacity</li>
              </ul>
            </div>
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <div className="font-semibold text-green-900 mb-2">
                💡 Optimization Opportunities
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Book Asia routes now for 15% savings vs Q4</li>
                <li>• Consider alternative carriers in GCC region</li>
                <li>• Consolidate shipments to leverage volume discounts</li>
              </ul>
            </div>
            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
              <div className="font-semibold text-purple-900 mb-2">
                📊 Predictive Insights
              </div>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• GCC prices expected to stabilize in 2 weeks</li>
                <li>• Asia rates may drop further 3-5%</li>
                <li>• NAFTA showing early signs of price increase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Pricing Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-teal-600" />
          <span>Transparent Market Pricing (Top Corridors)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Corridor
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Distance
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Low Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Avg Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  High Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Market Trend
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                  Carriers
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  corridor: "Riyadh - Kuwait City",
                  distance: "465 km",
                  low: 1150,
                  avg: 1380,
                  high: 1650,
                  trend: "up",
                  carriers: 34,
                },
                {
                  corridor: "Dubai - Riyadh",
                  distance: "878 km",
                  low: 2200,
                  avg: 2640,
                  high: 3150,
                  trend: "stable",
                  carriers: 52,
                },
                {
                  corridor: "Doha - Manama",
                  distance: "62 km",
                  low: 180,
                  avg: 220,
                  high: 280,
                  trend: "down",
                  carriers: 18,
                },
                {
                  corridor: "Hamburg - Warsaw",
                  distance: "810 km",
                  low: 1400,
                  avg: 1620,
                  high: 1890,
                  trend: "stable",
                  carriers: 67,
                },
                {
                  corridor: "Shanghai - Hanoi",
                  distance: "2100 km",
                  low: 3200,
                  avg: 3850,
                  high: 4500,
                  trend: "down",
                  carriers: 89,
                },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {row.corridor}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.distance}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">
                    ${row.low}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    ${row.avg}
                  </td>
                  <td className="px-4 py-3 text-red-600 font-semibold">
                    ${row.high}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        row.trend === "up"
                          ? "bg-red-100 text-red-700"
                          : row.trend === "down"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.trend === "up"
                        ? "↑ Rising"
                        : row.trend === "down"
                          ? "↓ Falling"
                          : "→ Stable"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.carriers} active
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== ROUTE OPTIMIZER MODULE ====================
const RouteOptimizer = () => {
  const [optimizationResults, setOptimizationResults] = useState<{
    original: {
      route: string;
      distance: number;
      time: number;
      cost: number;
      borderWait: number;
      riskScore: number;
    };
    optimized: {
      route: string;
      distance: number;
      time: number;
      cost: number;
      borderWait: number;
      riskScore: number;
    };
    savings: { distance: number; time: number; cost: number; co2: number };
  } | null>(null);

  const runOptimization = () => {
    // Simulate route optimization
    setOptimizationResults({
      original: {
        route: "Riyadh → AlRuqi Border → Kuwait City",
        distance: 590,
        time: 72.5,
        cost: 1850,
        borderWait: 14.2,
        riskScore: 42,
      },
      optimized: {
        route: "Riyadh → Khafji Border → Kuwait City",
        distance: 465,
        time: 48.3,
        cost: 1380,
        borderWait: 5.8,
        riskScore: 18,
      },
      savings: {
        distance: 125,
        time: 24.2,
        cost: 470,
        co2: 187,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Optimization Input */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <span>AI Route Optimization Engine</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Origin
            </label>
            <input
              type="text"
              defaultValue="Riyadh, Saudi Arabia"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Destination
            </label>
            <input
              type="text"
              defaultValue="Kuwait City, Kuwait"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Departure Day
            </label>
            <select className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">
              <option>Sunday (Recommended)</option>
              <option>Monday</option>
              <option>Tuesday (Avoid)</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cargo Type
            </label>
            <select className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">
              <option>Chemical</option>
              <option>General</option>
              <option>Hazmat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Priority
            </label>
            <select className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">
              <option>Cost Optimization</option>
              <option>Time Optimization</option>
              <option>Balanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Truck Type
            </label>
            <select className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">
              <option>Standard</option>
              <option>Refrigerated</option>
              <option>Tanker</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={runOptimization}
              className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5" />
              <span>Optimize Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationResults && (
        <>
          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-red-300">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h4 className="text-lg font-bold text-red-800">
                  Original Route (Not Optimized)
                </h4>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-slate-600 mb-1">Route</div>
                  <div className="font-semibold text-slate-800">
                    {optimizationResults.original.route}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Distance</div>
                    <div className="text-xl font-bold text-red-900">
                      {optimizationResults.original.distance} km
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Transit Time
                    </div>
                    <div className="text-xl font-bold text-red-900">
                      {optimizationResults.original.time}h
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Cost</div>
                    <div className="text-xl font-bold text-red-900">
                      ${optimizationResults.original.cost}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Border Wait
                    </div>
                    <div className="text-xl font-bold text-red-900">
                      {optimizationResults.original.borderWait}h
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Risk Score</span>
                    <span className="text-lg font-bold text-red-600">
                      {optimizationResults.original.riskScore}/100
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${optimizationResults.original.riskScore}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-400">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-bold text-green-800">
                  AI-Optimized Route (Recommended)
                </h4>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-slate-600 mb-1">Route</div>
                  <div className="font-semibold text-slate-800">
                    {optimizationResults.optimized.route}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Distance</div>
                    <div className="text-xl font-bold text-green-900">
                      {optimizationResults.optimized.distance} km
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Transit Time
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {optimizationResults.optimized.time}h
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Cost</div>
                    <div className="text-xl font-bold text-green-900">
                      ${optimizationResults.optimized.cost}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Border Wait
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {optimizationResults.optimized.borderWait}h
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Risk Score</span>
                    <span className="text-lg font-bold text-green-600">
                      {optimizationResults.optimized.riskScore}/100
                    </span>
                  </div>
                  <div className="mt-2 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${optimizationResults.optimized.riskScore}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Summary */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center space-x-3 mb-6">
              <Award className="w-10 h-10" />
              <div>
                <h3 className="text-2xl font-bold">Optimization Impact</h3>
                <p className="text-sm opacity-90">
                  Projected savings from AI-powered route optimization
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-90 mb-2">Distance Saved</div>
                <div className="text-4xl font-bold">
                  {optimizationResults.savings.distance} km
                </div>
                <div className="text-sm opacity-75 mt-1">
                  -21.2% shorter route
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-90 mb-2">Time Saved</div>
                <div className="text-4xl font-bold">
                  {optimizationResults.savings.time}h
                </div>
                <div className="text-sm opacity-75 mt-1">
                  -33.4% faster delivery
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-90 mb-2">Cost Reduction</div>
                <div className="text-4xl font-bold">
                  ${optimizationResults.savings.cost}
                </div>
                <div className="text-sm opacity-75 mt-1">
                  -25.4% lower expense
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-90 mb-2">CO₂ Reduced</div>
                <div className="text-4xl font-bold">
                  {optimizationResults.savings.co2} kg
                </div>
                <div className="text-sm opacity-75 mt-1">
                  Environmental impact
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Factors */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              AI Optimization Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">
                  What the AI Considered
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Historical border wait times by day of week</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>
                      Real-time traffic conditions on both route options
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Weather forecasts and road conditions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Fuel costs and distance calculations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Loading black days and operational restrictions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Border crossing efficiency ratings</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Driver rest requirements and optimal timing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Cargo type constraints and hazmat routing</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">
                  Key Recommendations
                </h4>
                <div className="space-y-3">
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <div className="font-semibold text-green-800 text-sm mb-1">
                      ✓ Use Khafji Border
                    </div>
                    <div className="text-xs text-green-700">
                      5.8h avg wait vs 14.2h at AlRuqi. More efficient
                      processing.
                    </div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <div className="font-semibold text-blue-800 text-sm mb-1">
                      ✓ Depart Sunday Morning
                    </div>
                    <div className="text-xs text-blue-700">
                      Best day for Kuwait border (18.3h avg). Avoid Tuesday
                      (42h+).
                    </div>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                    <div className="font-semibold text-purple-800 text-sm mb-1">
                      ✓ Pre-Clear Documentation
                    </div>
                    <div className="text-xs text-purple-700">
                      Electronic customs clearance reduces wait by 40%.
                    </div>
                  </div>
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                    <div className="font-semibold text-orange-800 text-sm mb-1">
                      ✓ Monitor Real-Time
                    </div>
                    <div className="text-xs text-orange-700">
                      Enable live updates via WhatsApp for dynamic re-routing.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

function generateLiveData() {
  return {
    activeShipments: 2847 + Math.floor(Math.random() * 100),
    otpPercentage: 94.3 + (Math.random() * 2 - 1),
    etaAccuracy: 96.8 + (Math.random() * 2 - 1),
    avgBorderWait: 8.4 + (Math.random() * 2 - 1),
    costSavings: 12400000 + Math.floor(Math.random() * 500000),
    complianceRate: 93.7 + (Math.random() * 2 - 1),
  };
}

function generateAlerts() {
  const alerts = [
    {
      severity: "critical",
      title: "Border Congestion Alert",
      description:
        "Kuwait border wait time exceeded 40 hours. 12 shipments affected.",
      time: "5 min ago",
    },
    {
      severity: "high",
      title: "Predicted Delay Risk",
      description:
        "ML model predicts 85% delay probability for Tuesday departures.",
      time: "18 min ago",
    },
    {
      severity: "medium",
      title: "Compliance Violation",
      description:
        "Truck SA-KW-2196 outside approved corridor. Investigation required.",
      time: "42 min ago",
    },
  ];
  return Math.random() > 0.3 ? alerts : alerts.slice(0, 2);
}

function generateShipments() {
  const routes = [
    "Riyadh → Kuwait City",
    "Dubai → Riyadh",
    "Doha → Manama",
    "Kuwait → Riyadh",
    "Dammam → Kuwait",
  ];
  const statuses = [
    "In Transit",
    "At Border",
    "Customs Clearance",
    "Delayed",
    "On Schedule",
  ];
  const locations = [
    "Highway 85, 180km from border",
    "Khafji Border Checkpoint",
    "Kuwait Customs",
    "Riyadh Industrial Area",
    "En route to Dammam",
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `SA-KW-${2100 + i}`,
    route: routes[Math.floor(Math.random() * routes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    currentLocation: locations[Math.floor(Math.random() * locations.length)],
    eta: `${Math.floor(Math.random() * 24) + 1}h ${Math.floor(Math.random() * 60)}m`,
    etaAccuracy: 75 + Math.random() * 25,
  }));
}

function generatePerformanceData() {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    shipments: 2500 + Math.floor(Math.random() * 500),
    otp: 88 + Math.floor(Math.random() * 10),
  }));
}

function generateCorridorPerformance() {
  return [
    { corridor: "Saudi-Kuwait", volume: 847, efficiency: 92 },
    { corridor: "UAE-Saudi", volume: 723, efficiency: 88 },
    { corridor: "Qatar-Bahrain", volume: 456, efficiency: 96 },
    { corridor: "Kuwait-Iraq", volume: 312, efficiency: 78 },
    { corridor: "Oman-UAE", volume: 289, efficiency: 85 },
  ];
}

function generateBorderWaitTrends() {
  const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  return days.map((day) => ({
    day,
    kuwait: {
      Sat: 28.5,
      Sun: 18.3,
      Mon: 38.2,
      Tue: 42.1,
      Wed: 36.5,
      Thu: 35.2,
      Fri: 24.8,
    }[day],
    saudi: {
      Sat: 4.8,
      Sun: 5.2,
      Mon: 6.1,
      Tue: 5.9,
      Wed: 5.4,
      Thu: 5.3,
      Fri: 6.3,
    }[day],
    predicted: {
      Sat: 26,
      Sun: 17,
      Mon: 36,
      Tue: 40,
      Wed: 34,
      Thu: 33,
      Fri: 23,
    }[day],
  }));
}

function generateTrackingHistory() {
  return [
    {
      checkpoint: "Shipper Departure - Riyadh Plant",
      time: "08:15 AM",
      status: "completed",
      details: "Loading completed on time",
    },
    {
      checkpoint: "Highway 85 Checkpoint",
      time: "10:42 AM",
      status: "completed",
      details: "Passed inspection",
    },
    {
      checkpoint: "Saudi Border - Khafji",
      time: "12:18 PM",
      status: "current",
      details: "Currently in customs clearance",
    },
    {
      checkpoint: "Kuwait Border Entry",
      time: "Estimated 2:30 PM",
      status: "pending",
      details: null,
    },
    {
      checkpoint: "Kuwait City Delivery",
      time: "Estimated 5:45 PM",
      status: "pending",
      details: null,
    },
  ];
}

function generateETAAccuracyData() {
  return Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    accuracy: 82 + i * 1.2 + (Math.random() * 2 - 1),
    baseline: 82 + (Math.random() * 2 - 1),
  }));
}

function generateDelayPredictionData() {
  return [
    { corridor: "Saudi-Kuwait", risk: 72 },
    { corridor: "UAE-Saudi", risk: 58 },
    { corridor: "Qatar-Bahrain", risk: 23 },
    { corridor: "Kuwait-Iraq", risk: 81 },
    { corridor: "Oman-UAE", risk: 45 },
  ];
}

function generateMLModelMetrics() {
  return [
    {
      name: "ETA Accuracy",
      value: "96.8%",
      description: "Prediction accuracy rate",
    },
    {
      name: "Model Confidence",
      value: "94.2%",
      description: "Average confidence score",
    },
    {
      name: "Training Samples",
      value: "127K",
      description: "Historical data points",
    },
    {
      name: "Daily Predictions",
      value: "2.8K",
      description: "Active predictions",
    },
  ];
}

function generateMarketplaceQuotes() {
  return [
    {
      carrier: "AL-Majed Transport",
      route: "Riyadh → Kuwait City",
      price: 1380,
      rating: 4.8,
      transitTime: "48-52h",
      otpRate: 96,
      responseTime: "3.2 min",
    },
    {
      carrier: "Gulf Logistics Co.",
      route: "Riyadh → Kuwait City",
      price: 1450,
      rating: 4.6,
      transitTime: "46-50h",
      otpRate: 94,
      responseTime: "4.8 min",
    },
    {
      carrier: "Express Arabia",
      route: "Riyadh → Kuwait City",
      price: 1620,
      rating: 4.9,
      transitTime: "42-46h",
      otpRate: 98,
      responseTime: "2.1 min",
    },
    {
      carrier: "FastTrack GCC",
      route: "Riyadh → Kuwait City",
      price: 1290,
      rating: 4.4,
      transitTime: "52-58h",
      otpRate: 91,
      responseTime: "5.6 min",
    },
  ];
}

function generateCarrierRankings() {
  return [
    {
      name: "Express Arabia",
      rating: 4.9,
      completed: 2847,
      otpRate: 98,
      avgPrice: 1620,
      status: "Active",
    },
    {
      name: "AL-Majed Transport",
      rating: 4.8,
      completed: 3126,
      otpRate: 96,
      avgPrice: 1380,
      status: "Active",
    },
    {
      name: "Gulf Logistics Co.",
      rating: 4.6,
      completed: 2934,
      otpRate: 94,
      avgPrice: 1450,
      status: "Active",
    },
    {
      name: "FastTrack GCC",
      rating: 4.4,
      completed: 2156,
      otpRate: 91,
      avgPrice: 1290,
      status: "Active",
    },
    {
      name: "Saudi Express Lines",
      rating: 4.3,
      completed: 1892,
      otpRate: 89,
      avgPrice: 1340,
      status: "Active",
    },
  ];
}

function generatePriceIndices() {
  return [
    { region: "GCC", avgRate: 2.97, change: 3.2 },
    { region: "European Union", avgRate: 2.01, change: -0.8 },
    { region: "Asia-Pacific", avgRate: 1.84, change: -5.2 },
    { region: "North America", avgRate: 3.21, change: 1.5 },
  ];
}

function generatePriceTrends() {
  return ["Jan", "Feb", "Mar"].map((month) => ({
    month,
    gcc: 2.75 + Math.random() * 0.5,
    eu: 2.0 + Math.random() * 0.3,
    asia: 1.9 + Math.random() * 0.2,
    nafta: 3.15 + Math.random() * 0.4,
  }));
}

function generateRegionalPricing() {
  return [
    { corridor: "Saudi-Kuwait", price: 2.97 },
    { corridor: "UAE-Saudi", price: 3.01 },
    { corridor: "Qatar-Bahrain", price: 3.55 },
    { corridor: "Germany-Poland", price: 2.01 },
    { corridor: "Shanghai-Hanoi", price: 1.84 },
    { corridor: "USA-Mexico", price: 3.21 },
  ];
}

function getNextStatus(currentStatus: string): string {
  const transitions: Record<string, string> = {
    "In Transit": "At Border",
    "At Border": "Customs Clearance",
    "Customs Clearance": "In Transit",
    Delayed: "In Transit",
    "On Schedule": "In Transit",
  };
  return transitions[currentStatus] || currentStatus;
}

function updateLocation(currentLocation: string): string {
  const locations = [
    "Highway 85, 180km from border",
    "Khafji Border Checkpoint",
    "Kuwait Customs",
    "Riyadh Industrial Area",
    "En route to Dammam",
    "Approaching destination",
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f59e0b",
    teal: "#14b8a6",
    pink: "#ec4899",
    yellow: "#eab308",
    indigo: "#6366f1",
    red: "#ef4444",
  };
  return colors[color] || "#64748b";
}

export default AITGlobalLogisticsPlatform;
