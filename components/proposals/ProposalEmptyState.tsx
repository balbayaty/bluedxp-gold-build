/**
 * Proposal Empty State Component
 * Beautiful empty states with helpful guidance and actions
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ProposalEmptyStateProps {
  type:
    | "proposals"
    | "rfqs"
    | "templates"
    | "content-blocks"
    | "analytics"
    | "compliance";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: string;
  className?: string;
}

const EMPTY_STATE_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    icon: string;
    tips?: string[];
  }
> = {
  proposals: {
    title: "No Proposals Yet",
    description:
      "Create your first proposal to start winning more business. Our intelligent proposal builder makes it easy.",
    actionLabel: "Create Your First Proposal",
    actionHref: "/proposals/universal/new",
    icon: "ri-file-paper-2-line",
    tips: [
      "Use templates to get started quickly",
      "Add journey analysis to increase win rates by 20%",
      "Include case studies for similar customers",
      "Enable tracking to see engagement metrics",
    ],
  },
  rfqs: {
    title: "No RFQs Yet",
    description:
      "Start by creating a Request for Quotation to gather requirements and generate intelligent proposals.",
    actionLabel: "Create New RFQ",
    actionHref: "/proposals/rfq/new",
    icon: "ri-questionnaire-line",
    tips: [
      "RFQs help you understand customer needs",
      "Auto-generate proposals from RFQs",
      "Track RFQ to proposal conversion rates",
    ],
  },
  templates: {
    title: "No Templates Available",
    description:
      "Create reusable templates to speed up proposal generation and ensure consistency.",
    actionLabel: "Create Template",
    actionHref: "/proposals/templates/new",
    icon: "ri-layout-4-line",
    tips: [
      "Templates save time on repetitive proposals",
      "Use content blocks for reusable sections",
      "Share templates with your team",
    ],
  },
  "content-blocks": {
    title: "No Content Blocks Yet",
    description:
      "Create reusable content blocks that can be inserted into any proposal for consistency and efficiency.",
    actionLabel: "Create Content Block",
    actionHref: "/proposals/content-blocks/new",
    icon: "ri-stack-line",
    tips: [
      "Content blocks ensure brand consistency",
      "Get approval before using in proposals",
      "Track which blocks perform best",
    ],
  },
  analytics: {
    title: "No Analytics Data Yet",
    description:
      "Send your first proposal to start tracking engagement, conversion rates, and performance metrics.",
    actionLabel: "View Proposals",
    actionHref: "/proposals/list",
    icon: "ri-bar-chart-box-line",
    tips: [
      "Analytics help improve proposal quality",
      "Track section-by-section engagement",
      "Identify winning proposal patterns",
    ],
  },
  compliance: {
    title: "No Compliance Checks Yet",
    description:
      "Compliance checks are automatically performed when you create or update proposals.",
    actionLabel: "Create Proposal",
    actionHref: "/proposals/universal/new",
    icon: "ri-shield-check-line",
    tips: [
      "Compliance is checked automatically",
      "Address issues before sending",
      "Maintain regulatory compliance",
    ],
  },
};

export default function ProposalEmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className = "",
}: ProposalEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type] || {
    title: "No Items",
    description: "Get started by creating your first item.",
    actionLabel: "Create Item",
    actionHref: "/proposals",
    icon: "ri-add-circle-line",
  };

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel || config.actionLabel;
  const finalActionHref = actionHref || config.actionHref;
  const finalIcon = icon || config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center ${className}`}
    >
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6">
          <i
            className={`${finalIcon} text-4xl text-blue-600 dark:text-blue-400`}
          />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {finalTitle}
        </h3>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {finalDescription}
        </p>

        {/* Action Button */}
        {onAction ? (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {finalActionLabel}
          </button>
        ) : (
          <Link href={finalActionHref}>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl">
              {finalActionLabel}
            </button>
          </Link>
        )}

        {/* Tips */}
        {config.tips && config.tips.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              💡 Quick Tips:
            </p>
            <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {config.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <i className="ri-checkbox-circle-line text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
