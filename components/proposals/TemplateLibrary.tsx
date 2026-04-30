/**
 * Comprehensive Template Library Component
 * Beautiful UI for browsing and selecting proposal templates
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  PROPOSAL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  searchTemplates,
} from "@/data/proposals/templates";
import type { ProposalTemplate } from "@/types/proposals";

interface TemplateLibraryProps {
  onSelectTemplate?: (template: ProposalTemplate) => void;
  showCreateButton?: boolean;
}

export default function TemplateLibrary({
  onSelectTemplate,
  showCreateButton = true,
}: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProposalTemplate | null>(null);
  const [templates, setTemplates] =
    useState<ProposalTemplate[]>(PROPOSAL_TEMPLATES);

  useEffect(() => {
    if (searchQuery) {
      setTemplates(searchTemplates(searchQuery));
    } else if (selectedCategory) {
      setTemplates(
        PROPOSAL_TEMPLATES.filter((t) => t.category === selectedCategory),
      );
    } else {
      setTemplates(PROPOSAL_TEMPLATES);
    }
  }, [searchQuery, selectedCategory]);

  const handleSelectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Library
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Choose from {PROPOSAL_TEMPLATES.length} ready-made templates
          </p>
        </div>
        {showCreateButton && (
          <Link
            href="/proposals/universal/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="ri-add-line mr-2" />
            Create from Scratch
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All Templates
          </button>
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <i className={`${category.icon} mr-2`} />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? "border-blue-600 shadow-lg"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                {template.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>

              {/* Template Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="ri-file-list-3-line" />
                  <span>{template.sections.length} sections</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="ri-folder-line" />
                  <span>
                    {TEMPLATE_CATEGORIES[
                      template.category as keyof typeof TEMPLATE_CATEGORIES
                    ]?.name || template.category}
                  </span>
                </div>
                {template.usageCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <i className="ri-bar-chart-line" />
                    <span>Used {template.usageCount} times</span>
                  </div>
                )}
              </div>

              {/* Sections Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Sections:
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 4).map((section) => (
                    <span
                      key={section.id}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                    >
                      {section.title}
                    </span>
                  ))}
                  {template.sections.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      +{template.sections.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTemplate(template);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-arrow-right-line mr-2" />
                Use Template
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-file-search-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No templates found matching your search.
          </p>
        </div>
      )}

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Template Preview: {selectedTemplate.name}
            </h3>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="ri-close-line text-xl" />
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedTemplate.description}
            </p>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sections:
              </p>
              <div className="space-y-2">
                {selectedTemplate.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                  >
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {section.title}
                    </span>
                    {section.required && (
                      <span className="ml-auto px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Link
                href={`/proposals/universal/new?template=${selectedTemplate.id}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                <i className="ri-file-add-line mr-2" />
                Create Proposal
              </Link>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
