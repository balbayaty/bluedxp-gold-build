"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiBriefcase,
  FiBarChart,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
  FiAward,
  FiTarget,
  FiX,
  FiPlay,
  FiSkipForward,
} from "react-icons/fi";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import RoleBasedPath from "@/components/onboarding/RoleBasedPath";
import QuickStartWizard from "@/components/onboarding/QuickStartWizard";
import type { OnboardingPath } from "@/types/onboarding";

const ONBOARDING_PATHS: OnboardingPath[] = [
  {
    id: "executive",
    name: "Executive Path",
    description:
      "High-level overview and strategic insights for decision makers",
    role: ["SYSTEM_ADMIN", "BUSINESS_DEVELOPMENT_MANAGER"],
    estimatedTime: 15,
    icon: "👔",
    color: "blue",
    achievements: ["Executive Explorer", "Strategic Thinker", "Decision Maker"],
    steps: [
      {
        id: "overview",
        title: "Platform Overview",
        description: "Understand the comprehensive capabilities of BlueDXP",
        icon: "🚀",
        position: "center",
      },
      {
        id: "dashboard",
        title: "Executive Dashboard",
        description: "Access high-level KPIs and strategic insights",
        icon: "📊",
        position: "center",
      },
      {
        id: "metrics",
        title: "Key Metrics & KPIs",
        description: "Learn about critical business metrics",
        icon: "📈",
        position: "center",
      },
      {
        id: "insights",
        title: "Strategic Insights",
        description: "Discover AI-powered strategic recommendations",
        icon: "💡",
        position: "center",
      },
      {
        id: "roi",
        title: "ROI Calculator",
        description: "Calculate potential return on investment",
        icon: "💰",
        position: "center",
      },
    ],
  },
  {
    id: "operations",
    name: "Operations Path",
    description: "Day-to-day operations, workflows, and process management",
    role: [
      "OPERATIONS_MANAGER",
      "WAREHOUSE_HEAD",
      "WAREHOUSE_SUPERVISOR",
      "WAREHOUSE_OPERATOR",
    ],
    estimatedTime: 30,
    icon: "⚙️",
    color: "cyan",
    achievements: ["Operations Master", "Workflow Expert", "Process Optimizer"],
    steps: [
      {
        id: "navigation",
        title: "Dashboard Navigation",
        description: "Learn how to navigate the platform efficiently",
        icon: "🧭",
        position: "center",
      },
      {
        id: "modules",
        title: "Module Overview",
        description: "Explore all available modules and their capabilities",
        icon: "📦",
        position: "center",
      },
      {
        id: "workflows",
        title: "Core Workflows",
        description: "Master essential operational workflows",
        icon: "🔄",
        position: "center",
      },
      {
        id: "monitoring",
        title: "Real-Time Monitoring",
        description: "Monitor operations in real-time",
        icon: "📡",
        position: "center",
      },
      {
        id: "actions",
        title: "Quick Actions",
        description: "Learn about quick action shortcuts",
        icon: "⚡",
        position: "center",
      },
    ],
  },
  {
    id: "analyst",
    name: "Analyst Path",
    description: "Data analysis, reporting, and business intelligence",
    role: ["INVENTORY_SPECIALIST", "QUALITY_MANAGER"],
    estimatedTime: 25,
    icon: "📊",
    color: "purple",
    achievements: ["Data Analyst", "Report Master", "Insight Generator"],
    steps: [
      {
        id: "analytics",
        title: "Analytics Dashboard",
        description: "Explore powerful analytics capabilities",
        icon: "📊",
        position: "center",
      },
      {
        id: "reports",
        title: "Report Generation",
        description: "Create and customize reports",
        icon: "📄",
        position: "center",
      },
      {
        id: "visualization",
        title: "Data Visualization",
        description: "Visualize data with advanced charts",
        icon: "📈",
        position: "center",
      },
      {
        id: "export",
        title: "Export Capabilities",
        description: "Export data in various formats",
        icon: "💾",
        position: "center",
      },
      {
        id: "queries",
        title: "Custom Queries",
        description: "Build custom data queries",
        icon: "🔍",
        position: "center",
      },
    ],
  },
  {
    id: "comprehensive",
    name: "Comprehensive Path",
    description: "Full platform exploration for administrators",
    role: ["SYSTEM_ADMIN"],
    estimatedTime: 60,
    icon: "🚀",
    color: "green",
    achievements: ["Platform Master", "Admin Expert", "System Architect"],
    steps: [
      {
        id: "architecture",
        title: "Platform Architecture",
        description: "Understand the platform architecture",
        icon: "🏗️",
        position: "center",
      },
      {
        id: "all-modules",
        title: "All Modules Overview",
        description: "Explore all 30+ modules",
        icon: "📦",
        position: "center",
      },
      {
        id: "integrations",
        title: "Integration Capabilities",
        description: "Learn about integration options",
        icon: "🔗",
        position: "center",
      },
      {
        id: "security",
        title: "Security & Compliance",
        description: "Understand security features",
        icon: "🛡️",
        position: "center",
      },
      {
        id: "advanced",
        title: "Advanced Features",
        description: "Explore advanced platform features",
        icon: "⚡",
        position: "center",
      },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/onboarding");
      return;
    }

    const userPath =
      ONBOARDING_PATHS.find((path) => path.role.includes(user.role as any)) ||
      ONBOARDING_PATHS[0];
    setSelectedPath(userPath);
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (showWizard && selectedPath) {
    return (
      <QuickStartWizard
        path={selectedPath}
        onComplete={() => {
          setShowWizard(false);
          router.push("/dashboard");
        }}
        onBack={() => setShowWizard(false)}
      />
    );
  }

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepIndex]));
    if (stepIndex < (selectedPath?.steps.length || 0) - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("onboarding-path", selectedPath?.id || "");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome to BlueDXP
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Let's get you started with a personalized onboarding experience
          </p>
        </motion.div>

        {/* Progress Tracker */}
        <OnboardingProgress userId={user.id} />

        {/* Path Selection */}
        {!selectedPath && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {ONBOARDING_PATHS.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedPath(path)}
                className="p-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="text-4xl mb-4">{path.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {path.name}
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  {path.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {path.estimatedTime} min
                  </span>
                  <FiArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Selected Path Details */}
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <RoleBasedPath path={selectedPath} />
          </motion.div>
        )}

        {/* CTA */}
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <button
              onClick={() => setShowWizard(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-lg transition-all shadow-2xl shadow-blue-500/50 flex items-center gap-2 mx-auto"
            >
              Start {selectedPath.name}
              <FiArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
