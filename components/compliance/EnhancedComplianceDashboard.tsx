"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ComplianceDashboard,
  ComplianceRecord,
  ComplianceViolation,
  ComplianceFinding,
  ComplianceAction,
  RegulatoryAuthority,
  ComplianceCategory,
} from "@/types/compliance";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";
import ComplianceOverview from "./ComplianceOverview";
import ComplianceByCategory from "./ComplianceByCategory";
import ComplianceByAuthority from "./ComplianceByAuthority";
import ComplianceTrends from "./ComplianceTrends";
import ComplianceAlerts from "./ComplianceAlerts";
import ComplianceCalendar from "./ComplianceCalendar";
import IntelligentRecommendations from "./IntelligentRecommendations";
import RiskPrediction from "./RiskPrediction";
import DocumentTemplates from "./DocumentTemplates";
import ComplianceReports from "./ComplianceReports";
import ComplianceMap from "./ComplianceMap";
import ComplianceScoring from "./ComplianceScoring";

interface EnhancedComplianceDashboardProps {
  tenantId: string;
}

export default function EnhancedComplianceDashboard({
  tenantId,
}: EnhancedComplianceDashboardProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    | "overview"
    | "authorities"
    | "categories"
    | "tools"
    | "calendar"
    | "intelligence"
    | "templates"
    | "reports"
    | "map"
  >("overview");
  const [authorityHierarchy, setAuthorityHierarchy] = useState<
    RegulatoryAuthorityNode[]
  >([]);
  const [selectedAuthority, setSelectedAuthority] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadDashboard();
    loadAuthorityHierarchy();
  }, [tenantId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await complianceService.generateDashboard(tenantId);
      setDashboard(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorityHierarchy = async () => {
    try {
      const roots = authorityHierarchyService.getRootNodes();
      setAuthorityHierarchy(roots);
    } catch (error) {
      console.error("Error loading authority hierarchy:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No compliance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Compliance Management
          </h1>
          <p className="text-gray-400 mt-1">
            Comprehensive compliance monitoring and management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadDashboard()}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 transition-colors"
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
          {
            id: "authorities",
            label: "Authorities",
            icon: "ri-government-line",
          },
          { id: "categories", label: "Categories", icon: "ri-folder-line" },
          { id: "calendar", label: "Calendar", icon: "ri-calendar-line" },
          {
            id: "intelligence",
            label: "AI Intelligence",
            icon: "ri-brain-line",
          },
          { id: "tools", label: "Tools", icon: "ri-tools-line" },
          { id: "templates", label: "Templates", icon: "ri-file-text-line" },
          { id: "reports", label: "Reports", icon: "ri-file-chart-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              selectedView === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          <ComplianceOverview dashboard={dashboard} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceTrends
              trends={dashboard.complianceTrend}
              dashboard={dashboard}
            />
            <ComplianceAlerts
              alerts={dashboard.criticalAlerts}
              dashboard={dashboard}
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Recent Activity
            </h2>

            <div className="space-y-4">
              {/* Recent Violations */}
              {dashboard.recentViolations &&
                dashboard.recentViolations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Recent Violations
                    </h3>
                    <div className="space-y-2">
                      {dashboard.recentViolations
                        .slice(0, 5)
                        .map((violation) => (
                          <div
                            key={violation.id}
                            className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                          >
                            <div>
                              <p className="text-white text-sm">
                                {violation.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  violation.detectedAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                violation.severity === "CRITICAL"
                                  ? "bg-red-500/20 text-red-400"
                                  : violation.severity === "HIGH"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {violation.severity}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Recent Findings */}
              {dashboard.recentFindings &&
                dashboard.recentFindings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Recent Findings
                    </h3>
                    <div className="space-y-2">
                      {dashboard.recentFindings.slice(0, 5).map((finding) => (
                        <div
                          key={finding.id}
                          className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                        >
                          <div>
                            <p className="text-white text-sm">
                              {finding.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {finding.type} • {finding.severity}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              finding.status === "RESOLVED"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {finding.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Pending Actions */}
              {dashboard.recentActions &&
                dashboard.recentActions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Pending Actions
                    </h3>
                    <div className="space-y-2">
                      {dashboard.recentActions.slice(0, 5).map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                        >
                          <div>
                            <p className="text-white text-sm">{action.title}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {action.dueDate
                                ? `Due: ${new Date(action.dueDate).toLocaleDateString()}`
                                : "No due date"}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              action.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400"
                                : action.status === "IN_PROGRESS"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {action.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Authorities View */}
      {selectedView === "authorities" && (
        <div className="space-y-6">
          <ComplianceByAuthority dashboard={dashboard} />

          {/* Authority Hierarchy */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Regulatory Authority Hierarchy
            </h2>

            <div className="space-y-4">
              {authorityHierarchy.map((authority) => (
                <AuthorityHierarchyNode
                  key={authority.id}
                  authority={authority}
                  selected={selectedAuthority === authority.id}
                  onSelect={() => setSelectedAuthority(authority.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories View */}
      {selectedView === "categories" && (
        <ComplianceByCategory dashboard={dashboard} />
      )}

      {/* Calendar View */}
      {selectedView === "calendar" && (
        <ComplianceCalendar tenantId={tenantId} />
      )}

      {/* Intelligence View */}
      {selectedView === "intelligence" && (
        <div className="space-y-6">
          <ComplianceScoring tenantId={tenantId} />
          <RiskPrediction tenantId={tenantId} />
          <IntelligentRecommendations tenantId={tenantId} />
        </div>
      )}

      {/* Tools View */}
      {selectedView === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard
            title="Requirement Builder"
            description="Build custom compliance requirements"
            icon="ri-file-add-line"
            color="cyan"
            onClick={() =>
              (window.location.href = "/compliance/tools/requirement-builder")
            }
          />
          <ToolCard
            title="Compliance Checker"
            description="Perform comprehensive compliance checks"
            icon="ri-shield-check-line"
            color="green"
            onClick={() => {
              router.push(`/compliance/checker?tenantId=${tenantId}`);
            }}
          />
          <ToolCard
            title="Document Manager"
            description="Manage compliance documents"
            icon="ri-folder-upload-line"
            color="blue"
            onClick={() => {
              router.push(`/compliance/documents?tenantId=${tenantId}`);
            }}
          />
          <ToolCard
            title="Risk Analyzer"
            description="Analyze compliance risks"
            icon="ri-alert-line"
            color="orange"
            onClick={() => {
              router.push(`/compliance/risk-analyzer?tenantId=${tenantId}`);
            }}
          />
          <ToolCard
            title="Local Knowledge"
            description="Browse local regulations and knowledge"
            icon="ri-book-open-line"
            color="purple"
            onClick={() =>
              (window.location.href = "/compliance/tools/knowledge")
            }
          />
          <ToolCard
            title="Compliance Calendar"
            description="View deadlines and renewals"
            icon="ri-calendar-line"
            color="indigo"
            onClick={() => setSelectedView("calendar")}
          />
          <ToolCard
            title="AI Intelligence"
            description="Risk prediction and recommendations"
            icon="ri-brain-line"
            color="pink"
            onClick={() => setSelectedView("intelligence")}
          />
          <ToolCard
            title="Compliance Simulator"
            description="Simulate compliance scenarios"
            icon="ri-flask-line"
            color="rose"
            onClick={() => {
              router.push(`/compliance/simulator?tenantId=${tenantId}`);
            }}
          />
          <ToolCard
            title="Compliance Map"
            description="Visual compliance mapping"
            icon="ri-map-line"
            color="teal"
            onClick={() => setSelectedView("map")}
          />
        </div>
      )}

      {/* Templates View */}
      {selectedView === "templates" && <DocumentTemplates />}

      {/* Reports View */}
      {selectedView === "reports" && <ComplianceReports tenantId={tenantId} />}

      {/* Map View */}
      {selectedView === "map" && <ComplianceMap tenantId={tenantId} />}
    </div>
  );
}

// Authority Hierarchy Node Component
interface AuthorityHierarchyNodeProps {
  authority: RegulatoryAuthorityNode;
  selected: boolean;
  onSelect: () => void;
}

function AuthorityHierarchyNode({
  authority,
  selected,
  onSelect,
}: AuthorityHierarchyNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const children = authorityHierarchyService.getChildren(authority.id);

  return (
    <div>
      <div
        onClick={onSelect}
        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
          selected
            ? "bg-cyan-500/20 border-cyan-500/30"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-gray-400 hover:text-white"
              >
                <i
                  className={`ri-arrow-${expanded ? "down" : "right"}-s-line`}
                ></i>
              </button>
            )}
            <div>
              <h3 className="text-white font-medium">{authority.name}</h3>
              <p className="text-sm text-gray-400">
                {authority.code} • Level {authority.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
              {authority.type}
            </span>
            {authority.status === "ACTIVE" && (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </div>
        </div>
        {authority.description && (
          <p className="text-sm text-gray-400 mt-2">{authority.description}</p>
        )}
      </div>

      {expanded && children.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {children.map((child) => (
            <AuthorityHierarchyNode
              key={child.id}
              authority={child}
              selected={false}
              onSelect={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Tool Card Component
interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

function ToolCard({ title, description, icon, color, onClick }: ToolCardProps) {
  const colorClasses = {
    cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30",
    green:
      "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30",
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30",
    orange:
      "bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30",
    purple:
      "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30",
    pink: "bg-pink-500/20 border-pink-500/30 text-pink-400 hover:bg-pink-500/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-xl border cursor-pointer transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          <i className={`${icon} text-2xl`}></i>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
