"use client";

/**
 * Facility Management Overview Page
 *
 * Main entry point for the Facility Management module.
 * Provides navigation to all facility management features including:
 * - Asset Management (EAM)
 * - Maintenance Management (CMMS)
 * - Space Management (CAFM)
 * - Energy & Sustainability
 * - IoT & Smart Buildings
 * - BIM Integration
 * - Digital Twin
 * - Licensing & Regulatory Compliance
 * - CAD/Drawing Management
 * - AI-Powered Predictive Maintenance
 */

import Link from "next/link";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  RiBuildingLine,
  RiDashboardLine,
  RiToolsLine,
  RiWrenchLine,
  RiFileListLine,
  RiBrainLine,
  RiLayoutGridLine,
  RiMapPinLine,
  RiFlashlightLine,
  RiLeafLine,
  RiGlobalLine,
  RiFileBillLine,
  RiSensorLine,
  RiHomeSmileLine,
  RiSettings3Line,
  Ri3dLine,
  RiMagicLine,
  RiFileDrawLine,
  RiFileTextLine,
  RiFilePaper2Line,
  RiShieldCheckLine,
  RiFireLine,
  RiGovernmentLine,
  RiCalendarCheckLine,
  RiFilePaperLine,
  RiBuilding2Line,
  RiUserStarLine,
  RiFileContractLine,
  RiStackLine,
  RiBarChartLine,
  RiFileChartLine,
  RiArrowRightLine,
  RiGitBranchLine,
} from "react-icons/ri";

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  category: string;
}

const facilityFeatures: FeatureCard[] = [
  // Dashboard
  {
    title: "Facility Dashboard",
    description:
      "Comprehensive overview of all facility operations, KPIs, and insights",
    icon: RiDashboardLine,
    href: "/facility/dashboard",
    color: "from-cyan-500 to-blue-500",
    category: "Overview",
  },

  // Asset Management
  {
    title: "Asset Management",
    description:
      "Track, manage, and optimize all facility assets throughout their lifecycle",
    icon: RiToolsLine,
    href: "/facility/assets",
    color: "from-blue-500 to-indigo-500",
    category: "Assets",
  },

  // Maintenance Management
  {
    title: "Maintenance Management",
    description:
      "Schedule, track, and optimize preventive and corrective maintenance",
    icon: RiWrenchLine,
    href: "/facility/maintenance",
    color: "from-orange-500 to-red-500",
    category: "Maintenance",
  },
  {
    title: "Work Orders",
    description: "Create, assign, and track maintenance work orders",
    icon: RiFileListLine,
    href: "/facility/work-orders",
    color: "from-orange-500 to-red-500",
    category: "Maintenance",
  },
  {
    title: "Predictive Maintenance",
    description:
      "AI-powered predictive maintenance with ML-based failure predictions",
    icon: RiBrainLine,
    href: "/facility/predictive-maintenance",
    color: "from-purple-500 to-pink-500",
    category: "Maintenance",
  },

  // Space Management
  {
    title: "Space Management",
    description: "Optimize space utilization and manage floor plans",
    icon: RiLayoutGridLine,
    href: "/facility/spaces",
    color: "from-green-500 to-emerald-500",
    category: "Space",
  },

  // Energy & Sustainability
  {
    title: "Energy Management",
    description: "Monitor and optimize energy consumption across facilities",
    icon: RiFlashlightLine,
    href: "/facility/energy",
    color: "from-yellow-500 to-orange-500",
    category: "Energy",
  },
  {
    title: "Sustainability & ESG",
    description: "Track sustainability metrics and ESG compliance",
    icon: RiLeafLine,
    href: "/facility/sustainability",
    color: "from-green-500 to-teal-500",
    category: "Energy",
  },
  {
    title: "Carbon Footprint",
    description: "Monitor and reduce carbon emissions",
    icon: RiGlobalLine,
    href: "/facility/carbon-footprint",
    color: "from-teal-500 to-cyan-500",
    category: "Energy",
  },
  {
    title: "Utility Bills",
    description: "Manage and analyze utility bills with AI-powered insights",
    icon: RiFileBillLine,
    href: "/facility/utility-bills",
    color: "from-yellow-500 to-amber-500",
    category: "Energy",
  },

  // IoT & Smart Buildings
  {
    title: "IoT Devices",
    description: "Monitor and manage IoT sensors and connected devices",
    icon: RiSensorLine,
    href: "/facility/iot",
    color: "from-indigo-500 to-purple-500",
    category: "IoT",
  },
  {
    title: "Smart Buildings",
    description: "Intelligent building automation and optimization",
    icon: RiHomeSmileLine,
    href: "/facility/smart-buildings",
    color: "from-purple-500 to-pink-500",
    category: "IoT",
  },
  {
    title: "Building Automation",
    description: "Automated control systems for HVAC, lighting, and security",
    icon: RiSettings3Line,
    href: "/facility/building-automation",
    color: "from-indigo-500 to-blue-500",
    category: "IoT",
  },

  // BIM & Digital Twin
  {
    title: "BIM Marketplace",
    description: "Access and collaborate on Building Information Models",
    icon: Ri3dLine,
    href: "/facility/bim",
    color: "from-violet-500 to-purple-500",
    category: "BIM",
  },
  {
    title: "Digital Twin",
    description: "Real-time digital representation of physical facilities",
    icon: RiMagicLine,
    href: "/facility/digital-twin",
    color: "from-pink-500 to-rose-500",
    category: "BIM",
  },

  // CAD & Drawings
  {
    title: "CAD & Drawings",
    description: "Manage CAD files, drawings, and technical documentation",
    icon: RiFileDrawLine,
    href: "/facility/cad",
    color: "from-slate-500 to-gray-500",
    category: "Documentation",
  },

  // Licensing & Regulatory
  {
    title: "Licenses & Permits",
    description: "Track licenses, permits, and regulatory documents",
    icon: RiFilePaper2Line,
    href: "/facility/licenses",
    color: "from-blue-500 to-cyan-500",
    category: "Compliance",
  },
  {
    title: "Regulatory Compliance",
    description: "Ensure compliance with all regulatory requirements",
    icon: RiShieldCheckLine,
    href: "/facility/regulatory",
    color: "from-green-500 to-emerald-500",
    category: "Compliance",
  },
  {
    title: "Civil Defense",
    description: "Civil Defense integration and compliance management",
    icon: RiFireLine,
    href: "/facility/civil-defense",
    color: "from-red-500 to-orange-500",
    category: "Compliance",
  },
  {
    title: "Abalady Integration",
    description: "Abalady platform integration for facility management",
    icon: RiGovernmentLine,
    href: "/facility/abalady",
    color: "from-blue-600 to-indigo-600",
    category: "Compliance",
  },

  // Analytics
  {
    title: "Analytics",
    description: "Advanced analytics and insights for facility operations",
    icon: RiBarChartLine,
    href: "/facility/analytics",
    color: "from-cyan-500 to-teal-500",
    category: "Analytics",
  },
  {
    title: "The Sentinel",
    description:
      "Autonomous Facility Nervous System - Live dependency graph & failure analysis",
    icon: RiGitBranchLine,
    href: "/facility/sentinel",
    color: "from-rose-500 to-pink-500",
    category: "Analytics",
  },
];

const categoryColors: Record<string, string> = {
  Overview: "bg-cyan-500/10 border-cyan-500/20",
  Assets: "bg-blue-500/10 border-blue-500/20",
  Maintenance: "bg-orange-500/10 border-orange-500/20",
  Space: "bg-green-500/10 border-green-500/20",
  Energy: "bg-yellow-500/10 border-yellow-500/20",
  IoT: "bg-indigo-500/10 border-indigo-500/20",
  BIM: "bg-violet-500/10 border-violet-500/20",
  Documentation: "bg-slate-500/10 border-slate-500/20",
  Compliance: "bg-emerald-500/10 border-emerald-500/20",
  Analytics: "bg-teal-500/10 border-teal-500/20",
};

function FacilityOverviewContent() {
  const categories = Array.from(
    new Set(facilityFeatures.map((f) => f.category)),
  );

  return (
    <div className="space-y-8">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <RiBuildingLine className="w-8 h-8 text-cyan-500" />
            <span className="text-2xl font-bold text-white">12</span>
          </div>
          <p className="text-sm text-gray-400">Total Facilities</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <RiToolsLine className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">1,234</span>
          </div>
          <p className="text-sm text-gray-400">Total Assets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <RiFileListLine className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-white">45</span>
          </div>
          <p className="text-sm text-gray-400">Active Work Orders</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <RiSensorLine className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-bold text-white">89</span>
          </div>
          <p className="text-sm text-gray-400">IoT Devices</p>
        </motion.div>
      </div>

      {/* Features by Category */}
      {categories.map((category, categoryIndex) => {
        const categoryFeatures = facilityFeatures.filter(
          (f) => f.category === category,
        );

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-lg ${categoryColors[category]}`}
              >
                <h2 className="text-xl font-semibold text-white">{category}</h2>
              </div>
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-sm text-gray-400">
                {categoryFeatures.length} features
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.href}
                    href={feature.href}
                    className="group"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: categoryIndex * 0.1 + index * 0.05,
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <RiArrowRightLine className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-gray-400 line-clamp-2">
                        {feature.description}
                      </p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: categories.length * 0.1 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <RiBuildingLine className="w-6 h-6 text-cyan-500" />
          <h3 className="text-lg font-semibold text-white">
            Facility Management System
          </h3>
        </div>
        <p className="text-gray-400 mb-4">
          Comprehensive Integrated Workplace Management System (IWMS) with 400+
          integration capabilities. Manage assets, maintenance, space, energy,
          IoT devices, BIM models, and regulatory compliance all in one unified
          platform.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
            EAM
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
            CMMS
          </span>
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
            CAFM
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
            IWMS
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
            IoT
          </span>
          <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-medium border border-pink-500/20">
            Digital Twin
          </span>
          <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
            BIM
          </span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
            AI-Powered
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default function FacilityOverviewPage() {
  return (
    <ErrorBoundary>
      <PageTemplate
        title="Facility Management"
        description="Comprehensive Integrated Workplace Management System (IWMS) with Asset Management (EAM), Maintenance Management (CMMS), Space Management (CAFM), Energy & Sustainability, IoT & Smart Buildings, BIM Integration, Digital Twin, Licensing & Regulatory Compliance, CAD/Drawing Management, and AI-Powered Predictive Maintenance. 400+ integration capabilities."
        shortDescription="Comprehensive IWMS with EAM, CMMS, CAFM, IoT, BIM, and AI"
        icon="ri-building-line"
        systemInfo={{
          sap: "Facility Management",
          oracle: "IWMS",
          manhattan: "Facility Management",
        }}
        examples={[
          "Manage assets throughout their complete lifecycle",
          "Schedule and track preventive maintenance",
          "Optimize space utilization with floor plans",
          "Monitor energy consumption and sustainability",
          "Integrate IoT devices and smart building systems",
          "View and collaborate on BIM models",
          "Track licenses and regulatory compliance",
          "AI-powered predictive maintenance",
        ]}
        stats={[
          {
            label: "Features",
            value: facilityFeatures.length,
            icon: "ri-grid-line",
            tooltip: "Total facility management features",
            trend: "neutral" as const,
          },
          {
            label: "Categories",
            value: Array.from(new Set(facilityFeatures.map((f) => f.category)))
              .length,
            icon: "ri-folder-line",
            tooltip: "Feature categories",
            trend: "neutral" as const,
          },
          {
            label: "Integrations",
            value: "400+",
            icon: "ri-plug-line",
            tooltip: "Available integrations",
            trend: "up" as const,
          },
        ]}
      >
        <FacilityOverviewContent />
      </PageTemplate>
    </ErrorBoundary>
  );
}
