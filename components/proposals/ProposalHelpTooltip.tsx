/**
 * Proposal Help Tooltip
 *
 * Contextual help tooltips throughout the proposal system
 * User-friendly guidance for end users
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  examples?: string[];
  related?: string[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  "proposal-title": {
    title: "Proposal Title",
    description:
      "Enter a clear, descriptive title that summarizes your proposal.",
    tips: [
      "Be specific and descriptive",
      "Include the service or product name",
      "Keep it concise (50-100 characters)",
      "Make it customer-focused",
    ],
    examples: [
      "Warehousing Services Proposal - ABC Company",
      "Complete Supply Chain Solution for XYZ Corp",
      "Transportation Services - Q1 2025",
    ],
  },
  "customer-name": {
    title: "Customer Name",
    description:
      "Enter the name of the company or individual you're proposing to.",
    tips: [
      "Use the official company name",
      "Be consistent with how they refer to themselves",
      'Include location if relevant (e.g., "ABC Company - Riyadh")',
    ],
  },
  "valid-until": {
    title: "Valid Until",
    description:
      "Set the date when this proposal expires. Customers need to respond before this date.",
    tips: [
      "Default is 30 days from today",
      "Shorter validity (14-21 days) creates urgency",
      "Longer validity (45-60 days) gives more time",
      "Consider your sales cycle length",
    ],
  },
  "ai-insights": {
    title: "AI-Powered Insights",
    description:
      "These insights help improve your proposal's win probability. They're generated automatically based on best practices and historical data.",
    tips: [
      "Pay attention to CRITICAL and HIGH priority insights",
      "Each insight shows potential win rate increase",
      "Implement recommendations before generating proposal",
      "Insights update as you add more information",
    ],
  },
  "win-probability": {
    title: "Win Probability",
    description:
      "This percentage shows your chances of winning the deal based on proposal characteristics, historical data, and AI analysis.",
    tips: [
      "70%+ (Green): High probability - focus on closing",
      "50-69% (Yellow): Medium - work on improvements",
      "Below 50% (Red): Low - significant improvements needed",
      "Address low-probability factors to improve",
    ],
  },
  "generate-proposal": {
    title: "Generate Proposal",
    description:
      "Click this button to create your complete proposal with AI-enhanced content, sections, and recommendations.",
    tips: [
      "Fill in title and customer name first",
      "Review AI insights before generating",
      "Generation takes 10-30 seconds",
      "You can edit the proposal after generation",
    ],
  },
  "template-selector": {
    title: "Template Selector",
    description:
      "Choose from proven templates to start your proposal. Templates with high win rates are recommended.",
    tips: [
      "Templates save time and improve quality",
      "Look for templates with high win rates",
      "Filter by module or proposal type",
      "Customize templates to fit your needs",
    ],
  },
  collaboration: {
    title: "Collaboration",
    description:
      "Work with your team in real-time. Add comments, get feedback, and improve your proposal together.",
    tips: [
      "Invite team members early",
      "Use @mentions to notify specific people",
      "Comments appear in real-time",
      "Collaboration improves proposal quality",
    ],
  },
  export: {
    title: "Export Proposal",
    description:
      "Export your proposal in multiple formats for sending to customers or further editing.",
    tips: [
      "PDF is best for sending to customers",
      "DOCX allows further editing",
      "XLSX is great for data-heavy proposals",
      "HTML works well for web portals",
    ],
  },
};

interface ProposalHelpTooltipProps {
  helpKey: string;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
}

export default function ProposalHelpTooltip({
  helpKey,
  position = "top",
  children,
}: ProposalHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const helpContent = HELP_CONTENT[helpKey];

  if (!helpContent) {
    return children || null;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors cursor-help"
        aria-label="Help"
      >
        <i className="ri-question-line text-xs" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === "top" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "top" ? 10 : -10 }}
            className={`absolute z-50 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${
              position === "top"
                ? "bottom-full mb-2"
                : position === "bottom"
                  ? "top-full mt-2"
                  : position === "left"
                    ? "right-full mr-2"
                    : "left-full ml-2"
            }`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {helpContent.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {helpContent.description}
                </p>
              </div>

              {helpContent.tips && helpContent.tips.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-xs mb-2">
                    Tips:
                  </h5>
                  <ul className="space-y-1">
                    {helpContent.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                      >
                        <i className="ri-checkbox-circle-line text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {helpContent.examples && helpContent.examples.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-xs mb-2">
                    Examples:
                  </h5>
                  <ul className="space-y-1">
                    {helpContent.examples.map((example, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-500 dark:text-gray-500 italic"
                      >
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45 ${
                position === "top"
                  ? "bottom-0 left-4 -mb-1 border-t-0 border-r-0"
                  : position === "bottom"
                    ? "top-0 left-4 -mt-1 border-b-0 border-l-0"
                    : position === "left"
                      ? "right-0 top-4 -mr-1 border-l-0 border-b-0"
                      : "left-0 top-4 -ml-1 border-r-0 border-t-0"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
