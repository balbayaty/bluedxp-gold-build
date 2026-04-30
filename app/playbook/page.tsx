"use client";

/**
 * Feature Playbook Viewer
 * Interactive visualization of comprehensive feature playbooks
 * Path: /playbook
 */

import React, { useState } from "react";
import {
  masterPlaybooks,
  getPlaybookById,
  getPlaybookStats,
  masterTooltips,
  playbookSections,
  layerDepthSummary,
} from "@/data/playbookIndex";
import { FeaturePlaybook } from "@/types/featurePlaybook";

// Section configuration for navigation
const sections = [
  { id: "overview", name: "Overview", icon: "📋" },
  { id: "compliance", name: "Compliance & Governance", icon: "✅" },
  { id: "regulatory", name: "Regulatory & Legal", icon: "⚖️" },
  { id: "industry", name: "Industry Standards", icon: "🏭" },
  { id: "strategic", name: "Vision & Strategy", icon: "🎯" },
  { id: "market", name: "Market & Trends", icon: "📈" },
  { id: "technical", name: "Technical Architecture", icon: "🔧" },
  { id: "sales", name: "Sales & Business", icon: "💼" },
  { id: "implementation", name: "Implementation", icon: "🚀" },
  { id: "sustainability", name: "Sustainability & ESG", icon: "🌱" },
  { id: "documentation", name: "Documentation", icon: "📚" },
];

export default function PlaybookPage() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<FeaturePlaybook>(
    masterPlaybooks[0],
  );
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const priorityColors = {
    CRITICAL: "bg-red-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-yellow-500",
    LOW: "bg-green-500",
  };

  const statusColors = {
    production: "bg-emerald-500",
    beta: "bg-blue-500",
    development: "bg-purple-500",
    planned: "bg-slate-500",
    research: "bg-pink-500",
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                📖 Feature Playbook
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Comprehensive reference for development, sales, and compliance
              </p>
            </div>

            {/* Playbook Selector */}
            <select
              value={selectedPlaybook.id}
              onChange={(e) => {
                const pb = getPlaybookById(e.target.value);
                if (pb) setSelectedPlaybook(pb);
              }}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              {masterPlaybooks.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === section.id
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Feature Header Card */}
            <div className="mb-6 p-6 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-800/40">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedPlaybook.name}
                  </h2>
                  <p className="text-slate-300">
                    {selectedPlaybook.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${priorityColors[selectedPlaybook.priority]}`}
                  >
                    {selectedPlaybook.priority}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[selectedPlaybook.status]}`}
                  >
                    {selectedPlaybook.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <QuickStat
                  label="Phase"
                  value={`Phase ${selectedPlaybook.phase}`}
                  icon="🎯"
                />
                <QuickStat
                  label="Time Estimate"
                  value={selectedPlaybook.estimatedTime}
                  icon="⏱️"
                />
                <QuickStat
                  label="Complexity"
                  value={selectedPlaybook.complexity}
                  icon="📊"
                />
                <QuickStat
                  label="Version"
                  value={selectedPlaybook.version}
                  icon="🏷️"
                />
              </div>
            </div>

            {/* Section Content */}
            {activeSection === "overview" && (
              <OverviewSection playbook={selectedPlaybook} />
            )}
            {activeSection === "compliance" && (
              <ComplianceSection
                playbook={selectedPlaybook}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
              />
            )}
            {activeSection === "regulatory" && (
              <RegulatorySection
                playbook={selectedPlaybook}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
              />
            )}
            {activeSection === "industry" && (
              <IndustrySection playbook={selectedPlaybook} />
            )}
            {activeSection === "strategic" && (
              <StrategicSection playbook={selectedPlaybook} />
            )}
            {activeSection === "market" && (
              <MarketSection playbook={selectedPlaybook} />
            )}
            {activeSection === "technical" && (
              <TechnicalSection playbook={selectedPlaybook} />
            )}
            {activeSection === "sales" && (
              <SalesSection
                playbook={selectedPlaybook}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
              />
            )}
            {activeSection === "implementation" && (
              <ImplementationSection playbook={selectedPlaybook} />
            )}
            {activeSection === "sustainability" && (
              <SustainabilitySection playbook={selectedPlaybook} />
            )}
            {activeSection === "documentation" && (
              <DocumentationSection playbook={selectedPlaybook} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Stat Component
function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-700">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-white font-semibold capitalize">{value}</div>
    </div>
  );
}

// Section Card Component
function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 rounded-xl border border-slate-700 bg-slate-800/50 mb-4 ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Expandable Item Component
function ExpandableItem({
  id,
  title,
  subtitle,
  isExpanded,
  onToggle,
  children,
  badge,
}: {
  id: string;
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="text-left">
          <div className="text-white font-medium flex items-center gap-2">
            {title}
            {badge}
          </div>
          {subtitle && <div className="text-sm text-slate-400">{subtitle}</div>}
        </div>
        <span
          className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {isExpanded && (
        <div className="p-4 bg-slate-900/50 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

// Tag Component
function Tag({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-700 text-slate-300",
    cyan: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    green: "bg-green-500/20 text-green-400 border border-green-500/30",
    orange: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    purple: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    red: "bg-red-500/20 text-red-400 border border-red-500/30",
    blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

// ===== SECTION COMPONENTS =====

function OverviewSection({ playbook }: { playbook: FeaturePlaybook }) {
  return (
    <div className="space-y-4">
      <SectionCard title="🎯 Key Capabilities">
        <div className="grid grid-cols-2 gap-2">
          {playbook.capabilities.map((cap, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <span className="text-cyan-400">✓</span>
              {cap}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="⭐ Key Features">
        <div className="space-y-2">
          {playbook.keyFeatures.map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="text-purple-400 mt-0.5">▸</span>
              {feature}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="💎 Benefits">
        <div className="space-y-2">
          {playbook.benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="text-green-400 mt-0.5">✦</span>
              {benefit}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="🔗 Dependencies">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">
              Module Dependencies
            </div>
            <div className="flex flex-wrap gap-2">
              {playbook.moduleDependencies.map((dep, i) => (
                <Tag key={i} color="cyan">
                  {dep}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">
              Service Dependencies
            </div>
            <div className="space-y-1">
              {playbook.serviceDependencies.map((dep, i) => (
                <div
                  key={i}
                  className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded"
                >
                  {dep}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="🏷️ Tags">
        <div className="flex flex-wrap gap-2">
          {playbook.tags.map((tag, i) => (
            <Tag key={i} color="purple">
              {tag}
            </Tag>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ComplianceSection({
  playbook,
  expandedItems,
  toggleExpand,
}: {
  playbook: FeaturePlaybook;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const { compliance } = playbook;

  return (
    <div className="space-y-4">
      {/* Compliance Score */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
          <div className="text-sm text-cyan-300 mb-1">
            Compliance Score Impact
          </div>
          <div className="text-3xl font-bold text-cyan-400">
            {compliance.complianceScoreImpact}%
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="text-sm text-green-300 mb-1">Risk Reduction</div>
          <div className="text-3xl font-bold text-green-400">
            {compliance.riskReductionPercentage}%
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30">
          <div className="text-sm text-purple-300 mb-1">Standards Covered</div>
          <div className="text-3xl font-bold text-purple-400">
            {compliance.standards.length}
          </div>
        </div>
      </div>

      {/* Standards */}
      <SectionCard title="📜 Compliance Standards">
        {compliance.standards.map((standard, i) => (
          <ExpandableItem
            key={i}
            id={`standard-${i}`}
            title={standard.code}
            subtitle={standard.name}
            isExpanded={expandedItems.has(`standard-${i}`)}
            onToggle={toggleExpand}
            badge={
              <Tag
                color={standard.requirement === "mandatory" ? "red" : "green"}
              >
                {standard.requirement}
              </Tag>
            }
          >
            <div className="space-y-3 text-sm">
              <p className="text-slate-300">{standard.description}</p>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">
                  Compliance Contribution
                </div>
                <p className="text-slate-300">
                  {standard.complianceContribution}
                </p>
              </div>
              {standard.clausesAddressed && (
                <div>
                  <div className="text-slate-500 text-xs uppercase mb-1">
                    Clauses Addressed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {standard.clausesAddressed.map((clause, j) => (
                      <Tag key={j} color="blue">
                        {clause}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {standard.regions.map((region, j) => (
                  <Tag key={j} color="slate">
                    {region}
                  </Tag>
                ))}
              </div>
            </div>
          </ExpandableItem>
        ))}
      </SectionCard>

      {/* Certification Readiness */}
      <SectionCard title="🎓 Certification Readiness">
        <div className="space-y-4">
          {compliance.certificationReadiness.map((cert, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">
                  {cert.certification}
                </span>
                <span
                  className={`font-bold ${cert.readinessPercentage >= 80 ? "text-green-400" : cert.readinessPercentage >= 60 ? "text-yellow-400" : "text-red-400"}`}
                >
                  {cert.readinessPercentage}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${cert.readinessPercentage >= 80 ? "bg-green-500" : cert.readinessPercentage >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${cert.readinessPercentage}%` }}
                />
              </div>
              {cert.gapsToAddress.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">
                    Gaps to Address
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cert.gapsToAddress.map((gap, j) => (
                      <Tag key={j} color="orange">
                        {gap}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Governance Frameworks */}
      <SectionCard title="🏛️ Governance Frameworks">
        {compliance.governanceFrameworks.map((fw, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{fw.name}</span>
              <Tag color="purple">{fw.type}</Tag>
            </div>
            <p className="text-sm text-slate-400 mb-2">{fw.description}</p>
            <p className="text-sm text-cyan-400">{fw.featureContribution}</p>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function RegulatorySection({
  playbook,
  expandedItems,
  toggleExpand,
}: {
  playbook: FeaturePlaybook;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const { regulatory } = playbook;

  return (
    <div className="space-y-4">
      {/* Jurisdictional Coverage */}
      <SectionCard title="🌍 Jurisdictional Coverage">
        <div className="flex flex-wrap gap-2">
          {regulatory.jurisdictionalCoverage.map((region, i) => (
            <Tag key={i} color="cyan">
              {region.toUpperCase()}
            </Tag>
          ))}
        </div>
      </SectionCard>

      {/* Regulatory Bodies */}
      <SectionCard title="🏛️ Regulatory Bodies">
        <div className="grid grid-cols-2 gap-3">
          {regulatory.regulatoryBodies.map((body, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-cyan-400">{body.code}</span>
                <Tag color="slate">{body.jurisdiction}</Tag>
              </div>
              <div className="text-sm text-white mb-1">{body.name}</div>
              <div className="text-xs text-slate-400">
                {body.complianceSupport}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Laws */}
      <SectionCard title="⚖️ Applicable Laws">
        {regulatory.laws.map((law, i) => (
          <ExpandableItem
            key={i}
            id={`law-${i}`}
            title={law.code || law.name}
            subtitle={law.name}
            isExpanded={expandedItems.has(`law-${i}`)}
            onToggle={toggleExpand}
            badge={<Tag color="blue">{law.jurisdiction.toUpperCase()}</Tag>}
          >
            <div className="space-y-3 text-sm">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-500">Enacted:</span>
                  <span className="text-white ml-1">{law.yearEnacted}</span>
                </div>
                <div>
                  <span className="text-slate-500">Category:</span>
                  <span className="text-white ml-1">{law.category}</span>
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">
                  Key Provisions
                </div>
                <div className="flex flex-wrap gap-1">
                  {law.keyProvisions.map((prov, j) => (
                    <Tag key={j} color="purple">
                      {prov}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">
                  Penalties
                </div>
                <p className="text-red-400">{law.penalties}</p>
              </div>
              <div>
                <div className="text-slate-500 text-xs uppercase mb-1">
                  Feature Contribution
                </div>
                <p className="text-cyan-400">{law.featureContribution}</p>
              </div>
            </div>
          </ExpandableItem>
        ))}
      </SectionCard>

      {/* Upcoming Changes */}
      <SectionCard title="📅 Upcoming Regulatory Changes">
        {regulatory.upcomingChanges.map((change, i) => (
          <div
            key={i}
            className="p-4 bg-slate-800/50 rounded-lg mb-3 border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">
                {change.regulation}
              </span>
              <Tag
                color={
                  change.impact === "high"
                    ? "red"
                    : change.impact === "medium"
                      ? "orange"
                      : "green"
                }
              >
                {change.impact.toUpperCase()} IMPACT
              </Tag>
            </div>
            <div className="text-sm text-slate-400 mb-2">
              Expected: {change.expectedDate}
            </div>
            <div className="text-sm text-cyan-400">
              {change.preparationNeeded}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function IndustrySection({ playbook }: { playbook: FeaturePlaybook }) {
  const { industry } = playbook;

  return (
    <div className="space-y-4">
      <SectionCard title="📐 Technical Standards">
        <div className="space-y-3">
          {industry.standards.map((std, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-cyan-400">{std.code}</span>
                <Tag color="purple">{std.version}</Tag>
                <Tag color="slate">{std.category}</Tag>
              </div>
              <div className="text-white mb-1">{std.name}</div>
              <div className="text-sm text-slate-400 mb-2">
                {std.description}
              </div>
              <div className="text-sm text-cyan-400">
                {std.featureImplementation}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="🏢 Industry Authorities">
        <div className="grid grid-cols-2 gap-3">
          {industry.authorities.map((auth, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="font-medium text-white mb-1">{auth.name}</div>
              <Tag color="blue">{auth.type}</Tag>
              <div className="text-sm text-slate-400 mt-2">
                {auth.focusArea}
              </div>
              <div className="text-sm text-cyan-400 mt-1">
                {auth.featureAlignment}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="🏭 Industries Served">
        <div className="flex flex-wrap gap-2">
          {industry.verticalsServed.map((vert, i) => (
            <Tag key={i} color="green">
              {vert}
            </Tag>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="📋 Industry-Specific Requirements">
        {industry.industryRequirements.map((req, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="font-medium text-white mb-2">{req.industry}</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {req.requirements.map((r, j) => (
                <Tag key={j} color="orange">
                  {r}
                </Tag>
              ))}
            </div>
            <div className="text-sm text-cyan-400">{req.featureSupport}</div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function StrategicSection({ playbook }: { playbook: FeaturePlaybook }) {
  const { strategic } = playbook;

  return (
    <div className="space-y-4">
      {/* Industrial Revolution Alignment */}
      <SectionCard title="🏭 Industrial Revolution Alignment">
        <div className="grid grid-cols-2 gap-4">
          {strategic.industrialAlignment.map((ir, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  {ir.revolution}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">
                    {ir.alignmentScore}%
                  </div>
                  <div className="text-xs text-slate-500">Alignment</div>
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  style={{ width: `${ir.alignmentScore}%` }}
                />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">
                    Pillars Addressed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ir.pillarsAddressed.slice(0, 3).map((p, j) => (
                      <Tag key={j} color="cyan">
                        {p}
                      </Tag>
                    ))}
                    {ir.pillarsAddressed.length > 3 && (
                      <Tag color="slate">
                        +{ir.pillarsAddressed.length - 3} more
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Value Propositions */}
      <SectionCard title="💎 Value Propositions">
        {strategic.valuePropositions.map((vp, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag color="green">{vp.category.replace("-", " ")}</Tag>
              {vp.roiTimeframe && (
                <Tag color="cyan">ROI: {vp.roiTimeframe}</Tag>
              )}
            </div>
            <div className="text-white font-medium mb-2">{vp.statement}</div>
            {vp.quantifiedBenefit && (
              <div className="text-lg font-bold text-green-400 mb-2">
                {vp.quantifiedBenefit}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {vp.proofPoints.map((pp, j) => (
                <Tag key={j} color="slate">
                  {pp}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Market Differentiation */}
      <SectionCard title="🎯 Market Differentiation">
        <div className="space-y-2">
          {strategic.marketDifferentiation.map((diff, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="text-cyan-400">✦</span>
              {diff}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Competitive Moat */}
      <SectionCard title="🏰 Competitive Moat">
        <div className="space-y-2">
          {strategic.competitiveMoat.map((moat, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="text-purple-400">🛡️</span>
              {moat}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function MarketSection({ playbook }: { playbook: FeaturePlaybook }) {
  const { market } = playbook;

  return (
    <div className="space-y-4">
      {/* Market Opportunity */}
      <SectionCard title="💰 Market Opportunity">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
            <div className="text-xs text-green-300 uppercase mb-1">
              Total Addressable Market
            </div>
            <div className="text-xl font-bold text-green-400">
              {market.marketOpportunity.totalAddressableMarket}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
            <div className="text-xs text-cyan-300 uppercase mb-1">
              Serviceable Market
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {market.marketOpportunity.serviceableMarket}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-lg border border-purple-500/30">
            <div className="text-xs text-purple-300 uppercase mb-1">
              Growth Rate
            </div>
            <div className="text-xl font-bold text-purple-400">
              {market.marketOpportunity.growthRate}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Market Trends */}
      <SectionCard title="📈 Market Trends">
        {market.trends.map((trend, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{trend.name}</span>
              <div className="flex gap-2">
                <Tag
                  color={
                    trend.maturity === "growing"
                      ? "green"
                      : trend.maturity === "emerging"
                        ? "cyan"
                        : "slate"
                  }
                >
                  {trend.maturity}
                </Tag>
                <Tag
                  color={
                    trend.impact === "transformational" ? "purple" : "blue"
                  }
                >
                  {trend.impact}
                </Tag>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-2">{trend.description}</p>
            <p className="text-sm text-cyan-400">{trend.featureResponse}</p>
            {trend.statistics && (
              <div className="mt-2 flex flex-wrap gap-2">
                {trend.statistics.map((stat, j) => (
                  <Tag key={j} color="green">
                    {stat}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      {/* Competitive Landscape */}
      <SectionCard title="⚔️ Competitive Landscape">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">
              Key Competitors
            </div>
            <div className="flex flex-wrap gap-2">
              {market.competitiveLandscape.keyCompetitors.map((comp, i) => (
                <Tag key={i} color="red">
                  {comp}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase mb-2">
              Our Differentiators
            </div>
            <div className="space-y-1">
              {market.competitiveLandscape.ourDifferentiators.map((diff, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-green-400"
                >
                  <span>✓</span>
                  {diff}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Target Industries */}
      <SectionCard title="🏭 Target Industries">
        <div className="flex flex-wrap gap-2">
          {market.targetIndustries.map((ind, i) => (
            <Tag key={i} color="purple">
              {ind}
            </Tag>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function TechnicalSection({ playbook }: { playbook: FeaturePlaybook }) {
  const { technical } = playbook;

  return (
    <div className="space-y-4">
      {/* Architecture Patterns */}
      <SectionCard title="🏗️ Architecture Patterns">
        {technical.architecturePatterns.map((pattern, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-white">{pattern.name}</span>
              <Tag color="cyan">{pattern.type}</Tag>
            </div>
            <p className="text-sm text-slate-400 mb-2">{pattern.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-green-400 text-xs uppercase mb-1">
                  Benefits
                </div>
                <div className="space-y-1">
                  {pattern.benefits.map((b, j) => (
                    <div key={j} className="text-slate-300">
                      ✓ {b}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-orange-400 text-xs uppercase mb-1">
                  Trade-offs
                </div>
                <div className="space-y-1">
                  {pattern.tradeoffs.map((t, j) => (
                    <div key={j} className="text-slate-300">
                      ⚠ {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Technology Stack */}
      <SectionCard title="🔧 Technology Stack">
        <div className="grid grid-cols-2 gap-4">
          {technical.technologyStack.map((stack, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="font-medium text-cyan-400 uppercase text-sm mb-3">
                {stack.category}
              </div>
              <div className="space-y-2">
                {stack.technologies.map((tech, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div>
                      <span className="text-white">{tech.name}</span>
                      {tech.version && (
                        <span className="text-slate-500 ml-1">
                          v{tech.version}
                        </span>
                      )}
                    </div>
                    {tech.required && <Tag color="red">Required</Tag>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Performance Requirements */}
      <SectionCard title="⚡ Performance Requirements">
        <div className="grid grid-cols-2 gap-4">
          {technical.performanceRequirements.map((perf, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white capitalize">
                  {perf.metricType}
                </span>
                <Tag color="purple">{perf.slaTier}</Tag>
              </div>
              <div className="text-xl font-bold text-cyan-400">
                {perf.targetValue}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Security Requirements */}
      <SectionCard title="🔒 Security Requirements">
        {technical.securityRequirements.map((sec, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-white capitalize">
                {sec.domain}
              </span>
              <Tag
                color={
                  sec.criticality === "critical"
                    ? "red"
                    : sec.criticality === "high"
                      ? "orange"
                      : "slate"
                }
              >
                {sec.criticality}
              </Tag>
            </div>
            <p className="text-sm text-slate-300 mb-2">{sec.requirement}</p>
            <p className="text-sm text-cyan-400">{sec.implementation}</p>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function SalesSection({
  playbook,
  expandedItems,
  toggleExpand,
}: {
  playbook: FeaturePlaybook;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const { sales } = playbook;

  return (
    <div className="space-y-4">
      {/* Key Selling Points */}
      <SectionCard title="⭐ Key Selling Points">
        <div className="space-y-2">
          {sales.keySellingPoints.map((point, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg"
            >
              <span className="text-lg">🎯</span>
              <span className="text-white">{point}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Target Personas */}
      <SectionCard title="👥 Target Personas">
        {sales.targetPersonas.map((persona, i) => (
          <ExpandableItem
            key={i}
            id={`persona-${i}`}
            title={persona.name}
            subtitle={persona.jobTitles.join(", ")}
            isExpanded={expandedItems.has(`persona-${i}`)}
            onToggle={toggleExpand}
            badge={<Tag color="cyan">{persona.decisionRole}</Tag>}
          >
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-red-400 text-xs uppercase mb-1">
                  Pain Points
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.painPoints.map((pp, j) => (
                    <Tag key={j} color="red">
                      {pp}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-green-400 text-xs uppercase mb-1">
                  Goals
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.goals.map((g, j) => (
                    <Tag key={j} color="green">
                      {g}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-cyan-400 text-xs uppercase mb-1">
                  Key Messaging
                </div>
                <div className="space-y-1">
                  {persona.keyMessaging.map((msg, j) => (
                    <div key={j} className="text-slate-300">
                      • {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ExpandableItem>
        ))}
      </SectionCard>

      {/* Use Cases */}
      <SectionCard title="📋 Use Cases">
        {sales.useCases.map((uc, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-white">{uc.name}</span>
              {uc.industry && <Tag color="purple">{uc.industry}</Tag>}
            </div>
            <p className="text-sm text-slate-400 mb-2">{uc.scenario}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-red-400 text-xs uppercase mb-1">
                  Problem
                </div>
                <p className="text-slate-300">{uc.problemAddressed}</p>
              </div>
              <div>
                <div className="text-green-400 text-xs uppercase mb-1">
                  Solution
                </div>
                <p className="text-slate-300">{uc.solution}</p>
              </div>
            </div>
            {uc.roiMetrics && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {uc.roiMetrics.map((roi, j) => (
                    <Tag key={j} color="green">
                      {roi}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      {/* Objection Handling */}
      <SectionCard title="🛡️ Objection Handling">
        {sales.objectionHandling.map((oh, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="text-red-400 mb-2">❌ "{oh.objection}"</div>
            <div className="text-green-400">✓ {oh.response}</div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function ImplementationSection({ playbook }: { playbook: FeaturePlaybook }) {
  const { implementation } = playbook;

  return (
    <div className="space-y-4">
      {/* Implementation Phases */}
      <SectionCard title="🚀 Implementation Phases">
        <div className="relative">
          {implementation.phases.map((phase, i) => (
            <div key={i} className="flex gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {phase.phase}
              </div>
              <div className="flex-1 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{phase.name}</span>
                  <Tag color="cyan">{phase.duration}</Tag>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs uppercase mb-1">
                      Activities
                    </div>
                    {phase.activities.slice(0, 3).map((act, j) => (
                      <div key={j} className="text-slate-300">
                        • {act}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs uppercase mb-1">
                      Deliverables
                    </div>
                    {phase.deliverables.slice(0, 3).map((del, j) => (
                      <div key={j} className="text-slate-300">
                        • {del}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Prerequisites */}
      <SectionCard title="📋 Prerequisites">
        {implementation.prerequisites.map((prereq, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mb-2"
          >
            <div className="flex items-center gap-3">
              <Tag
                color={
                  prereq.category === "technical"
                    ? "cyan"
                    : prereq.category === "organizational"
                      ? "purple"
                      : "green"
                }
              >
                {prereq.category}
              </Tag>
              <span className="text-slate-300">{prereq.requirement}</span>
            </div>
            <Tag
              color={
                prereq.criticality === "blocking"
                  ? "red"
                  : prereq.criticality === "important"
                    ? "orange"
                    : "slate"
              }
            >
              {prereq.criticality}
            </Tag>
          </div>
        ))}
      </SectionCard>

      {/* Common Pitfalls */}
      <SectionCard title="⚠️ Common Pitfalls">
        {implementation.commonPitfalls.map((pitfall, i) => (
          <div
            key={i}
            className="p-4 bg-slate-800/50 rounded-lg mb-3 border-l-4 border-orange-500"
          >
            <div className="font-medium text-orange-400 mb-2">
              {pitfall.pitfall}
            </div>
            <div className="text-sm text-slate-400 mb-2">
              <span className="text-red-400">Impact:</span> {pitfall.impact}
            </div>
            <div className="text-sm text-green-400">
              <span className="text-white">Avoidance:</span> {pitfall.avoidance}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Success Metrics */}
      <SectionCard title="📊 Success Metrics">
        <div className="grid grid-cols-2 gap-3">
          {implementation.successMetrics.map((metric, i) => (
            <div
              key={i}
              className="p-3 bg-slate-800/50 rounded-lg flex items-center gap-2"
            >
              <span className="text-green-400">✓</span>
              <span className="text-slate-300">{metric}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SustainabilitySection({ playbook }: { playbook: FeaturePlaybook }) {
  const { sustainability } = playbook;

  return (
    <div className="space-y-4">
      {/* ESG Alignment */}
      <SectionCard title="🌱 ESG Alignment">
        <div className="grid grid-cols-3 gap-4">
          {sustainability.esgAlignment.map((esg, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-2xl mb-2">
                {esg.pillar === "environmental"
                  ? "🌍"
                  : esg.pillar === "social"
                    ? "👥"
                    : "🏛️"}
              </div>
              <div className="font-medium text-white capitalize mb-1">
                {esg.pillar}
              </div>
              <div className="text-sm text-slate-400 mb-2">{esg.aspect}</div>
              <div className="text-sm text-cyan-400">{esg.contribution}</div>
              {esg.sdgAlignment && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {esg.sdgAlignment.map((sdg, j) => (
                    <Tag key={j} color="green">
                      SDG {sdg}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Environmental Impacts */}
      <SectionCard title="🌿 Environmental Impacts">
        {sustainability.environmentalImpacts.map((impact, i) => (
          <div key={i} className="p-4 bg-slate-800/50 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag color="green">{impact.category}</Tag>
              <Tag color="cyan">{impact.type}</Tag>
            </div>
            <p className="text-slate-300 mb-2">{impact.description}</p>
            <p className="text-green-400">{impact.goalContribution}</p>
          </div>
        ))}
      </SectionCard>

      {/* Circular Economy */}
      <SectionCard title="♻️ Circular Economy">
        <div className="space-y-2">
          {sustainability.circularEconomy.map((ce, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">♻️</span>
              {ce}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Certifications */}
      <SectionCard title="🏆 Sustainability Certifications">
        <div className="flex flex-wrap gap-2">
          {sustainability.certifications.map((cert, i) => (
            <Tag key={i} color="green">
              {cert}
            </Tag>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DocumentationSection({ playbook }: { playbook: FeaturePlaybook }) {
  const { documentation } = playbook;

  return (
    <div className="space-y-4">
      {/* Documentation */}
      <SectionCard title="📚 Documentation">
        <div className="grid grid-cols-2 gap-4">
          {documentation.documentation.map((doc, i) => (
            <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{doc.title}</span>
                <Tag
                  color={
                    doc.status === "available"
                      ? "green"
                      : doc.status === "in-progress"
                        ? "cyan"
                        : "slate"
                  }
                >
                  {doc.status}
                </Tag>
              </div>
              <p className="text-sm text-slate-400 mb-2">{doc.description}</p>
              <div className="flex flex-wrap gap-1">
                {doc.targetAudience.map((aud, j) => (
                  <Tag key={j} color="purple">
                    {aud}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Training Programs */}
      <SectionCard title="🎓 Training Programs">
        {documentation.trainingPrograms.map((prog, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg mb-3"
          >
            <div>
              <div className="font-medium text-white">{prog.name}</div>
              <div className="text-sm text-slate-400">
                {prog.targetAudience}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag color="cyan">{prog.type}</Tag>
              <Tag color="slate">{prog.duration}</Tag>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Support */}
      <SectionCard title="🛟 Support Requirements">
        <div className="p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium text-white">Support Tier:</span>
            <Tag color="purple">{documentation.supportRequirements.tier}</Tag>
          </div>
          <div className="mb-4">
            <div className="text-sm text-slate-500 uppercase mb-2">
              Channels
            </div>
            <div className="flex flex-wrap gap-2">
              {documentation.supportRequirements.channels.map((ch, i) => (
                <Tag key={i} color="cyan">
                  {ch}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 uppercase mb-2">
              Response Times
            </div>
            <div className="space-y-2">
              {documentation.supportRequirements.responseTimes.map((rt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">{rt.priority}</span>
                  <div className="flex gap-4">
                    <span className="text-cyan-400">
                      Response: {rt.responseTime}
                    </span>
                    <span className="text-green-400">
                      Resolution: {rt.resolutionTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
