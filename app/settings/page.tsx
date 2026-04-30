"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";

interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  items: Array<{
    name: string;
    href: string;
    icon: string;
    description: string;
    badge?: string;
  }>;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: "system",
    name: "System Configuration",
    description: "Core system settings and parameters",
    icon: "ri-settings-3-line",
    color: "cyan",
    items: [
      {
        name: "Parameters",
        href: "/settings/parameters",
        icon: "ri-settings-4-line",
        description: "System parameters and configuration",
      },
      {
        name: "Warehouse",
        href: "/settings/warehouse",
        icon: "ri-warehouse-line",
        description: "Warehouse configuration and setup",
      },
      {
        name: "Workflow",
        href: "/settings/workflow",
        icon: "ri-flow-chart-line",
        description: "Workflow automation and rules",
      },
    ],
  },
  {
    id: "users",
    name: "User Management",
    description: "Users, roles, and permissions",
    icon: "ri-user-settings-line",
    color: "blue",
    items: [
      {
        name: "Users",
        href: "/settings/users",
        icon: "ri-user-line",
        description: "Manage users and access",
      },
      {
        name: "Roles & Permissions",
        href: "/users",
        icon: "ri-shield-user-line",
        description: "Role-based access control",
      },
    ],
  },
  {
    id: "notifications",
    name: "Notifications & Alerts",
    description: "Configure notifications and alerts",
    icon: "ri-notification-line",
    color: "purple",
    items: [
      {
        name: "Notifications",
        href: "/settings/notifications",
        icon: "ri-notification-3-line",
        description: "Notification rules and preferences",
      },
      {
        name: "Templates",
        href: "/settings/templates",
        icon: "ri-file-text-line",
        description: "Email and document templates",
      },
    ],
  },
  {
    id: "ai",
    name: "AI & Intelligence",
    description: "AI configuration and agents",
    icon: "ri-brain-line",
    color: "pink",
    items: [
      {
        name: "AI Settings",
        href: "/settings/ai",
        icon: "ri-robot-line",
        description: "AI API keys and configuration",
        badge: "NEW",
      },
      {
        name: "LLM Providers",
        href: "/llm-providers",
        icon: "ri-brain-line",
        description: "View and manage all LLM providers",
        badge: "NEW",
      },
      {
        name: "Agent Showcase",
        href: "/agents/showcase",
        icon: "ri-presentation-line",
        description: "🚀 Mind-blowing AI Agent Demonstrations",
        badge: "NEW",
      },
      {
        name: "Intelligent Orchestration",
        href: "/intelligent-orchestration/process-mining",
        icon: "ri-magic-line",
        description: "AI-powered process intelligence",
      },
    ],
  },
  {
    id: "localization",
    name: "Localization",
    description: "Currency, language, and regional settings",
    icon: "ri-global-line",
    color: "green",
    items: [
      {
        name: "Currency",
        href: "/settings/currency",
        icon: "ri-money-dollar-circle-line",
        description: "Currency settings and symbols",
      },
    ],
  },
  {
    id: "billing",
    name: "Billing & Subscription",
    description: "Manage subscription, payments, and usage",
    icon: "ri-money-dollar-circle-line",
    color: "green",
    items: [
      {
        name: "Subscription & Plans",
        href: "/billing",
        icon: "ri-vip-crown-line",
        description: "View and upgrade your subscription",
      },
      {
        name: "Usage & Limits",
        href: "/billing?tab=usage",
        icon: "ri-bar-chart-line",
        description: "Monitor resource usage and limits",
      },
      {
        name: "Invoices & History",
        href: "/billing?tab=invoices",
        icon: "ri-file-list-3-line",
        description: "View invoices and payment history",
      },
      {
        name: "Payment Methods",
        href: "/billing?tab=payment",
        icon: "ri-bank-card-line",
        description: "Manage payment methods",
      },
    ],
  },
  {
    id: "accessibility",
    name: "Accessibility & UX",
    description: "AI-powered adaptive interface and accessibility features",
    icon: "ri-accessible-line",
    color: "purple",
    items: [
      {
        name: "Adaptive Accessibility",
        href: "/settings/accessibility",
        icon: "ri-user-settings-line",
        description: "ML-powered personalized accessibility settings",
        badge: "AI",
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = settingsCategories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.items.length > 0);

  const stats = [
    {
      label: "Settings Categories",
      value: settingsCategories.length,
      icon: "ri-folder-line",
      tooltip: "Total settings categories",
      trend: "neutral" as const,
    },
    {
      label: "Total Settings",
      value: settingsCategories.reduce((sum, cat) => sum + cat.items.length, 0),
      icon: "ri-settings-line",
      tooltip: "Total settings pages",
      trend: "neutral" as const,
    },
  ];

  const colorClasses = {
    cyan: "from-cyan-500 to-blue-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    pink: "from-pink-500 to-rose-600",
    green: "from-green-500 to-emerald-600",
  };

  return (
    <PageTemplate
      title="Settings"
      description="Configure system settings, users, notifications, AI, and localization preferences"
      shortDescription="System configuration and preferences"
      icon="ri-settings-3-line"
      systemInfo={{
        sap: "System Configuration",
        oracle: "Settings Management",
        manhattan: "System Settings",
      }}
      examples={[
        "Configure system parameters",
        "Manage users and permissions",
        "Set up notifications",
        "Configure AI settings",
        "Manage currency and localization",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>
      }
    >
      {/* Settings Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            {/* Category Header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${colorClasses[category.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <i className={`${category.icon} text-white text-xl`}></i>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">
                  {category.name}
                </h2>
                <p className="text-sm text-[#9ca3af]">{category.description}</p>
              </div>
            </div>

            {/* Settings Items Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: categoryIndex * 0.1 + itemIndex * 0.05 }}
                  onClick={() => router.push(item.href)}
                  className="group relative bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/50 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${colorClasses[category.color as keyof typeof colorClasses]}/20 border border-${category.color}-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <i
                        className={`${item.icon} text-${category.color}-400 text-lg`}
                      ></i>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#9ca3af] line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open</span>
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Need Help?
            </h3>
            <p className="text-sm text-[#9ca3af]">
              Check our documentation or contact support
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip content="View Documentation" position="top">
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                <i className="ri-book-open-line"></i>
                <span>Docs</span>
              </button>
            </Tooltip>
            <Tooltip content="Contact Support" position="top">
              <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <i className="ri-customer-service-line"></i>
                <span>Support</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </PageTemplate>
  );
}
