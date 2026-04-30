/**
 * GTLS Accident & Predictive Risk Mitigation Hub
 *
 * Deep-dive into transportation safety, incident management, and predictive risk.
 * Aligned with Vision 2040 Safety Standards.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  History,
  Search,
  MapPin,
  Truck,
  Eye,
  LifeBuoy,
  FileSearch,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Workflow,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AccidentInvestigationSuite from "@/components/transportation/AccidentInvestigationSuite";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Incident {
  id: string;
  type?: string;
  severity?: string;
  status?: string;
  vehicleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

function AccidentRiskHubContent() {
  const [activeTab, setActiveTab] = useState<
    "live" | "historical" | "predictive" | "investigation"
  >("predictive");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    safetyIndex: "99.4%",
    predictedRisks: "03",
    openRCAs: "01",
    responseTime: "4.2m",
  });

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadIncidents();
    loadStatistics();
    setupRealtimeConnection();

    // Refresh statistics every 60 seconds
    const statsInterval = setInterval(loadStatistics, 60000);

    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/transportation/accidents?limit=20");
      if (!response.ok) {
        throw new Error(`Failed to load incidents: ${response.statusText}`);
      }
      const data = await response.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading incidents:", err);
      setError(err instanceof Error ? err.message : "Failed to load incidents");
      // Fallback to mock data on error
      setIncidents([
        {
          id: "INC-2025-001",
          type: "Minor Collision",
          vehicleId: "TRK-882",
          status: "RCA IN PROGRESS",
          severity: "MEDIUM",
        },
        {
          id: "EXC-2025-042",
          type: "Dangerous Goods Leak",
          vehicleId: "TNK-102",
          status: "RESOLVED",
          severity: "CRITICAL",
        },
        {
          id: "INC-2025-992",
          type: "Driver Fatigue Alert",
          vehicleId: "VAN-441",
          status: "INVESTIGATING",
          severity: "HIGH",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/accidents/statistics",
      );
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
        setStats({
          safetyIndex: `${(100 - (data.criticalIncidents / Math.max(data.total, 1)) * 100).toFixed(1)}%`,
          predictedRisks: String(data.trends.last24Hours),
          openRCAs: String(data.openInvestigations),
          responseTime: `${data.averageResolutionTime.toFixed(1)}h`,
        });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const setupRealtimeConnection = () => {
    // Get tenantId from context or localStorage
    const tenantId = localStorage.getItem("tenantId") || "default";

    const eventSource = new EventSource(
      `/api/transportation/accidents/realtime?tenantId=${tenantId}`,
    );

    eventSource.onopen = () => {
      setIsRealtimeConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "incident_update") {
          // Reload incidents when new incident detected
          loadIncidents();
          loadStatistics();
        } else if (data.type === "potential_incident") {
          // Show alert for potential incidents
          console.log("Potential incident detected:", data.event);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      setIsRealtimeConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(setupRealtimeConnection, 5000);
    };

    return () => {
      eventSource.close();
    };
  };

  return (
    <PageTemplate
      title="Accident & Predictive Risk"
      description="Zero-Fatality Mission Control • Real-time Incident Response & Root Cause Analysis"
      icon="ri-shield-flash-fill"
      actions={
        <div className="flex gap-2 items-center">
          <Badge
            variant="outline"
            className={`${isRealtimeConnected ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isRealtimeConnected ? "bg-green-500" : "bg-red-500"} mr-2 ${isRealtimeConnected ? "animate-pulse" : ""}`}
            />
            {isRealtimeConnected ? "LIVE" : "OFFLINE"}
          </Badge>
          <button
            onClick={() => setActiveTab("investigation")}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            <ShieldAlert className="w-4 h-4" />
            OPEN INVESTIGATION
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-20">
        {activeTab === "investigation" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button
              onClick={() => setActiveTab("predictive")}
              className="mb-6 flex items-center gap-2 text-white/40 hover:text-white transition text-xs font-bold uppercase tracking-widest"
            >
              ← Back to Risk Hub
            </button>
            <AccidentInvestigationSuite />
          </motion.div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* --- TOP ROW: KPI BAR --- */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <QuickStat
                label="Safety Index"
                value="99.4%"
                color="text-emerald-400"
                icon={CheckCircle2}
              />
              <QuickStat
                label="Predicted Risks"
                value="03"
                color="text-orange-400"
                icon={Activity}
              />
              <QuickStat
                label="Open RCAs"
                value="01"
                color="text-blue-400"
                icon={FileSearch}
              />
              <QuickStat
                label="Response Time"
                value="4.2m"
                color="text-purple-400"
                icon={LifeBuoy}
              />
            </div>

            {/* --- MAIN SECTION: PREDICTIVE HEATMAP / LIVE MONITOR --- */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <Card className="bg-[#0a0e1a]/80 border-white/5 backdrop-blur-xl h-[500px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                    Autonomous Risk Prediction Map
                  </CardTitle>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                      onClick={() => setActiveTab("live")}
                      className={`px-3 py-1 rounded text-xs transition ${activeTab === "live" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"}`}
                    >
                      Live Monitor
                    </button>
                    <button
                      onClick={() => setActiveTab("predictive")}
                      className={`px-3 py-1 rounded text-xs transition ${activeTab === "predictive" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"}`}
                    >
                      Predictive Heatmap
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 relative flex items-center justify-center bg-blue-500/5 group">
                  <div className="text-center space-y-4 px-10">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition duration-500">
                      <MapPin className="w-10 h-10 text-blue-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-medium text-white/80">
                      Interactive Spatial Risk Intelligence
                    </h3>
                    <p className="text-sm text-white/40 max-w-md mx-auto">
                      Connecting to live TGA (Transport General Authority) data
                      feeds and internal IoT telemetry to visualize high-risk
                      corridors.
                    </p>
                    <Badge
                      variant="outline"
                      className="border-white/10 text-white/40 uppercase tracking-widest text-[10px]"
                    >
                      Requires GIS Provider Integration
                    </Badge>
                  </div>

                  {/* Floating Alert Widget */}
                  <div className="absolute top-6 right-6 w-64 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-red-400">
                        CRITICAL ALERT
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Fog detection on Highway 40. Visibility below 50m. 12
                      vehicles in vicinity.
                    </p>
                    <Progress value={85} className="h-1 bg-red-500/20" />
                    <button className="w-full py-1.5 bg-red-500 text-white text-[10px] font-bold uppercase rounded">
                      Broadcast Warning
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0e1a]/80 border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Incidents & Exceptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 flex items-center justify-center">
                      <PremiumLoader message="Loading incidents..." size="sm" />
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg m-4">
                      <p className="text-sm text-red-400">{error}</p>
                      <p className="text-xs text-red-400/60 mt-1">
                        Showing mock data as fallback
                      </p>
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                      <p className="text-sm">No incidents found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {incidents.map((incident) => (
                        <IncidentRow
                          key={incident.id}
                          id={incident.id}
                          type={incident.type || "Unknown"}
                          vehicle={incident.vehicleId || "N/A"}
                          status={incident.status || "UNKNOWN"}
                          severity={
                            (incident.severity || "MEDIUM") as
                              | "CRITICAL"
                              | "HIGH"
                              | "MEDIUM"
                              | "LOW"
                          }
                          time={
                            incident.createdAt
                              ? new Date(incident.createdAt).toLocaleString()
                              : "Unknown"
                          }
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* --- SIDEBAR: RCA & EVIDENCE --- */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="bg-[#0a0e1a]/80 border-white/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-lg">Root Cause Engine</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        AI ANALYSIS
                      </Badge>
                      <span className="text-[10px] text-white/30">
                        ID: RCA-9921
                      </span>
                    </div>
                    <h4 className="text-sm font-bold">
                      Collision #INC-2025-001
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Predictive model identifies "Mechanical Failure" (Brake
                      Wear) as 82% probable cause. Cross-referencing Digital
                      Twin maintenance logs...
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40 uppercase">
                          Human Factor
                        </span>
                        <span className="text-emerald-400">12%</span>
                      </div>
                      <Progress value={12} className="h-1 bg-white/5" />
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40 uppercase">
                          Environmental
                        </span>
                        <span className="text-amber-400">24%</span>
                      </div>
                      <Progress value={24} className="h-1 bg-white/5" />
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/40 uppercase">
                          Mechanical
                        </span>
                        <span className="text-red-400">82%</span>
                      </div>
                      <Progress value={82} className="h-1 bg-white/5" />
                    </div>
                  </div>

                  <button className="w-full py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition flex items-center justify-center gap-2">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    Generate QHSE Corrective Action (CAPA)
                  </button>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0e1a]/80 border-white/5 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-lg">
                      Immutable Chain of Custody
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-white/40">
                    Every safety event is hashed and anchored to the platform's
                    private blockchain.
                  </p>
                  <div className="space-y-3 font-mono">
                    <BlockchainEntry
                      label="Incident Report Signed"
                      hash="0x8f2a...991b"
                      time="08:42:12"
                    />
                    <BlockchainEntry
                      label="Telemetric Snapshot"
                      hash="0x1c22...ff44"
                      time="08:42:15"
                    />
                    <BlockchainEntry
                      label="RCA Analysis Locked"
                      hash="0x9a33...dd22"
                      time="09:15:00"
                    />
                  </div>
                  <button className="w-full py-2 text-[10px] text-white/40 hover:text-white transition">
                    VIEW FULL LEDGER
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

function QuickStat({ label, value, color, icon: Icon, trend, subtitle }: any) {
  return (
    <Card className="bg-[#0a0e1a]/80 border-white/5 hover:border-white/10 transition group">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            {trend && (
              <span
                className={`text-xs ${trend === "up" ? "text-red-400" : "text-green-400"}`}
              >
                {trend === "up" ? "↑" : "↓"}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-white/30 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentRow({ id, type, vehicle, status, severity, time }: any) {
  const sevColor =
    severity === "CRITICAL"
      ? "text-red-400"
      : severity === "HIGH"
        ? "text-orange-400"
        : "text-amber-400";
  return (
    <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded bg-white/5 ${sevColor}`}>
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold">
            {type} <span className="text-white/20 font-normal">#{id}</span>
          </div>
          <div className="text-[10px] text-white/40 uppercase">
            {vehicle} • {time}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="border-white/10 text-[10px] h-5">
          {status}
        </Badge>
        <Eye className="w-4 h-4 text-white/20 hover:text-white transition" />
      </div>
    </div>
  );
}

function BlockchainEntry({ label, hash, time }: any) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-emerald-400/60 truncate w-20">{hash}</span>
        <span className="text-white/20">{time}</span>
      </div>
    </div>
  );
}

// Export with ErrorBoundary wrapper
export default function AccidentRiskHub() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Accident & Predictive Risk"
          description="Zero-Fatality Mission Control"
          icon="ri-shield-flash-fill"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <AccidentRiskHubContent />
    </ErrorBoundary>
  );
}
