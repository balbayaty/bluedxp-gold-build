/**
 * Proposal Template Selector
 *
 * Interactive component for selecting and customizing proposal templates
 * Works with all modules
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  proposalType: string;
  thumbnail?: string;
  sections: string[];
  estimatedTime: number; // minutes
  winRate?: number; // percentage
  usageCount?: number;
}

interface ProposalTemplateSelectorProps {
  moduleId: string;
  proposalType?: string;
  onSelectTemplate?: (template: ProposalTemplate) => void;
  onCustomize?: (template: ProposalTemplate) => void;
}

const DEFAULT_TEMPLATES: ProposalTemplate[] = [
  {
    id: "wms-warehousing",
    name: "Warehousing Services",
    description:
      "Comprehensive warehousing proposal with storage, handling, and fulfillment",
    moduleId: "wms",
    proposalType: "WMS_WAREHOUSING",
    sections: [
      "Cover",
      "Executive Summary",
      "Company Profile",
      "Services",
      "Pricing",
      "Terms",
    ],
    estimatedTime: 15,
    winRate: 72,
    usageCount: 1250,
  },
  {
    id: "tms-transportation",
    name: "Transportation Services",
    description:
      "Complete transportation proposal with routes, fleet, and performance metrics",
    moduleId: "tms",
    proposalType: "TMS_TRANSPORTATION",
    sections: [
      "Cover",
      "Executive Summary",
      "Routes",
      "Fleet",
      "Pricing",
      "SLA",
      "Terms",
    ],
    estimatedTime: 20,
    winRate: 68,
    usageCount: 980,
  },
  {
    id: "marketplace-service",
    name: "Marketplace Service",
    description:
      "Professional marketplace service proposal with ratings and reviews",
    moduleId: "marketplace",
    proposalType: "MARKETPLACE_SERVICE",
    sections: [
      "Cover",
      "Executive Summary",
      "Services",
      "Provider Profile",
      "Pricing",
      "Terms",
    ],
    estimatedTime: 12,
    winRate: 75,
    usageCount: 2100,
  },
  {
    id: "maas-manufacturing",
    name: "MaaS Manufacturing",
    description:
      "Manufacturing as a Service proposal with pillars and capabilities",
    moduleId: "maas",
    proposalType: "MAAS_MANUFACTURING",
    sections: [
      "Cover",
      "Executive Summary",
      "Pillars",
      "Capabilities",
      "Pricing",
      "Terms",
    ],
    estimatedTime: 18,
    winRate: 70,
    usageCount: 450,
  },
  {
    id: "complete-supply-chain",
    name: "Complete Supply Chain",
    description: "End-to-end supply chain solution proposal",
    moduleId: "proposals-rfq",
    proposalType: "COMPLETE_SUPPLY_CHAIN",
    sections: [
      "Cover",
      "Executive Summary",
      "Journey Analysis",
      "Services",
      "Implementation",
      "Pricing",
      "Terms",
    ],
    estimatedTime: 30,
    winRate: 65,
    usageCount: 320,
  },
];

export default function ProposalTemplateSelector({
  moduleId,
  proposalType,
  onSelectTemplate,
  onCustomize,
}: ProposalTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProposalTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter templates by module and type
  const filteredTemplates = DEFAULT_TEMPLATES.filter((template) => {
    const matchesModule = template.moduleId === moduleId;
    const matchesType = !proposalType || template.proposalType === proposalType;
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesModule && matchesType && matchesSearch;
  });

  const handleSelect = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    onSelectTemplate?.(template);
  };

  const handleCustomize = (template: ProposalTemplate) => {
    onCustomize?.(template);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-lg"
              }`}
              onClick={() => handleSelect(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                {template.winRate && (
                  <div className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-sm font-medium">
                    {template.winRate}% win
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <i className="ri-time-line" />
                  <span>{template.estimatedTime} min</span>
                </div>
                {template.usageCount && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <i className="ri-user-line" />
                    <span>{template.usageCount} uses</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(template);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Use Template
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCustomize(template);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <i className="ri-edit-line" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <i className="ri-file-search-line text-4xl mb-3" />
          <p>No templates found</p>
          <p className="text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
