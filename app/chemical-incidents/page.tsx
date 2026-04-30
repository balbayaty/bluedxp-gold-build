/**
 * Chemical Incident Management
 * Spill reporting, exposure tracking, emergency response, and investigation
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import {
  ChemicalIncident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/chemical";
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
} from "recharts";

type TabType = "overview" | "report" | "investigation" | "response" | "trends";

export default function ChemicalIncidentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [incidents, setIncidents] = useState<ChemicalIncident[]>([]);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    // TODO: Load from API
    setIncidents([]);
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    {
      id: "report" as TabType,
      label: "Report Incident",
      icon: "ri-file-add-line",
    },
    {
      id: "investigation" as TabType,
      label: "Investigations",
      icon: "ri-search-line",
    },
    {
      id: "response" as TabType,
      label: "Emergency Response",
      icon: "ri-alarm-line",
    },
    {
      id: "trends" as TabType,
      label: "Trends & Analysis",
      icon: "ri-line-chart-line",
    },
  ];

  return (
    <PageTemplate
      title="Chemical Incidents"
      description="Incident reporting, investigation, emergency response, and trend analysis"
      icon="ri-alert-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IncidentsOverviewTab incidents={incidents} />
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IncidentReportTab onReport={() => loadIncidents()} />
            </motion.div>
          )}

          {activeTab === "investigation" && (
            <motion.div
              key="investigation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IncidentsInvestigationTab incidents={incidents} />
            </motion.div>
          )}

          {activeTab === "response" && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmergencyResponseTab />
            </motion.div>
          )}

          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <IncidentsTrendsTab incidents={incidents} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// INCIDENTS OVERVIEW TAB
// ============================================================================

interface IncidentsOverviewTabProps {
  incidents: ChemicalIncident[];
}

function IncidentsOverviewTab({ incidents }: IncidentsOverviewTabProps) {
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "Critical",
  ).length;
  const openIncidents = incidents.filter(
    (i) => i.status === "Reported" || i.status === "Under Investigation",
  ).length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === "Resolved",
  ).length;

  const incidentsByType = incidents.reduce(
    (acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    },
    {} as Record<IncidentType, number>,
  );

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Total Incidents</p>
          <p className="text-2xl font-bold">{totalIncidents}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">{criticalIncidents}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Open</p>
          <p className="text-2xl font-bold text-yellow-400">{openIncidents}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-400">
            {resolvedIncidents}
          </p>
        </div>
      </div>

      {/* Incidents by Type */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Incidents by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(incidentsByType).map(([type, count]) => (
            <div key={type} className="p-3 rounded-lg bg-gray-700">
              <p className="text-sm text-gray-400">{type}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent Incidents</h3>
        {incidents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No incidents reported
          </p>
        ) : (
          <div className="space-y-2">
            {incidents.slice(0, 10).map((incident) => (
              <div
                key={incident.id}
                className={`p-4 rounded-lg border ${
                  incident.severity === "Critical"
                    ? "bg-red-900/20 border-red-500/30"
                    : incident.severity === "High"
                      ? "bg-orange-900/20 border-orange-500/30"
                      : "bg-gray-700 border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{incident.chemicalName}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {incident.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {incident.location} •{" "}
                      {new Date(incident.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        incident.severity === "Critical"
                          ? "bg-red-900/30 text-red-400"
                          : incident.severity === "High"
                            ? "bg-orange-900/30 text-orange-400"
                            : incident.severity === "Medium"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {incident.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INCIDENT REPORT TAB
// ============================================================================

interface IncidentReportTabProps {
  onReport: () => void;
}

function IncidentReportTab({ onReport }: IncidentReportTabProps) {
  const [formData, setFormData] = useState({
    type: "" as IncidentType | "",
    severity: "" as IncidentSeverity | "",
    chemicalName: "",
    casNumber: "",
    location: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].slice(0, 5),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // TODO: Submit to API
    setTimeout(() => {
      setSubmitting(false);
      onReport();
      setFormData({
        type: "" as IncidentType | "",
        severity: "" as IncidentSeverity | "",
        chemicalName: "",
        casNumber: "",
        location: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].slice(0, 5),
      });
    }, 1000);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Report Chemical Incident</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Incident Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as IncidentType,
                })
              }
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            >
              <option value="">Select type...</option>
              <option value="Spill">Spill</option>
              <option value="Exposure">Exposure</option>
              <option value="Fire">Fire</option>
              <option value="Explosion">Explosion</option>
              <option value="Environmental Release">
                Environmental Release
              </option>
              <option value="Near Miss">Near Miss</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Severity *
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as IncidentSeverity,
                })
              }
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            >
              <option value="">Select severity...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chemical Name *
            </label>
            <input
              type="text"
              value={formData.chemicalName}
              onChange={(e) =>
                setFormData({ ...formData, chemicalName: e.target.value })
              }
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              CAS Number
            </label>
            <input
              type="text"
              value={formData.casNumber}
              onChange={(e) =>
                setFormData({ ...formData, casNumber: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Submitting...
            </>
          ) : (
            <>
              <i className="ri-file-add-line mr-2"></i>
              Submit Incident Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS
// ============================================================================

function IncidentsInvestigationTab({
  incidents,
}: {
  incidents: ChemicalIncident[];
}) {
  const underInvestigation = incidents.filter(
    (i) => i.status === "Under Investigation",
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Active Investigations</h3>
      {underInvestigation.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No active investigations
        </p>
      ) : (
        <div className="space-y-2">
          {underInvestigation.map((incident) => (
            <div
              key={incident.id}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <p className="font-semibold">{incident.chemicalName}</p>
              <p className="text-sm text-gray-400 mt-1">
                {incident.description}
              </p>
              {incident.investigation && (
                <div className="mt-3 space-y-2">
                  {incident.investigation.findings && (
                    <div>
                      <p className="text-sm font-semibold text-gray-400">
                        Findings:
                      </p>
                      <ul className="text-sm text-gray-300 mt-1">
                        {incident.investigation.findings.map((finding, idx) => (
                          <li key={idx}>• {finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmergencyResponseTab() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">
        Emergency Response Procedures
      </h3>
      <p className="text-gray-400">
        Emergency response procedures and protocols coming soon...
      </p>
    </div>
  );
}

function IncidentsTrendsTab({ incidents }: { incidents: ChemicalIncident[] }) {
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      total: Math.floor(Math.random() * 10),
      critical: Math.floor(Math.random() * 3),
      high: Math.floor(Math.random() * 5),
    };
  });

  const incidentsByType = incidents.reduce(
    (acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    },
    {} as Record<IncidentType, number>,
  );

  return (
    <div className="space-y-6">
      {/* Trends Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Incident Trends (Last 12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              stackId="1"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="2"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorCritical)"
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="2"
              stroke="#f59e0b"
              fillOpacity={0.6}
              fill="#f59e0b"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Incidents by Type */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Incidents by Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={Object.entries(incidentsByType).map(([type, count]) => ({
              type,
              count,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="type" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-gray-400 mb-1">Total Incidents</p>
          <p className="text-2xl font-bold text-red-400">{incidents.length}</p>
        </div>
        <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-gray-400 mb-1">Critical Incidents</p>
          <p className="text-2xl font-bold text-orange-400">
            {incidents.filter((i) => i.severity === "Critical").length}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-gray-400 mb-1">Avg Response Time</p>
          <p className="text-2xl font-bold text-yellow-400">5 min</p>
        </div>
      </div>
    </div>
  );
}
