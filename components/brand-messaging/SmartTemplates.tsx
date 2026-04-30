"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { MessagingType, MessagingContext } from "@/types/brand-messaging";

interface SmartTemplate {
  id: string;
  name: string;
  description: string;
  type: MessagingType;
  context: Partial<MessagingContext>;
  icon: string;
  category: "module" | "feature" | "action" | "state";
  usage: number;
}

interface SmartTemplatesProps {
  onSelectTemplate: (template: SmartTemplate) => void;
  selectedModule?: string;
}

const TEMPLATES: SmartTemplate[] = [
  {
    id: "wms-header",
    name: "Warehouse Header",
    description: "Philosophical header for warehouse operations",
    type: "module_header",
    context: { moduleId: "wms", moduleName: "Warehouse Management" },
    icon: "📦",
    category: "module",
    usage: 0,
  },
  {
    id: "empty-inventory",
    name: "Empty Inventory",
    description: "Optimistic message when inventory is empty",
    type: "empty_state",
    context: {
      moduleId: "wms",
      metadata: { items: "inventory", potential: "Your first shipment awaits" },
    },
    icon: "📭",
    category: "state",
    usage: 0,
  },
  {
    id: "shipment-success",
    name: "Shipment Created",
    description: "Success message after creating shipment",
    type: "success_message",
    context: { action: "Create Shipment", entityType: "shipment" },
    icon: "✅",
    category: "action",
    usage: 0,
  },
  {
    id: "feature-routing",
    name: "Intelligent Routing",
    description: "Feature description for routing",
    type: "feature_description",
    context: {
      featureName: "Intelligent Routing",
      metadata: { benefit: "Optimize delivery routes" },
    },
    icon: "🎯",
    category: "feature",
    usage: 0,
  },
];

export const SmartTemplates: React.FC<SmartTemplatesProps> = ({
  onSelectTemplate,
  selectedModule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule =
      !selectedModule || t.context.moduleId === selectedModule;
    return matchesCategory && matchesSearch && matchesModule;
  });

  const categories = ["all", "module", "feature", "action", "state"];

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Smart Templates</h3>
          <p className="text-sm text-slate-400">
            Pre-configured message templates
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search templates..."
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <motion.button
            key={template.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTemplate(template)}
            className="text-left p-4 bg-slate-900/50 rounded-lg border border-slate-600 hover:border-blue-500 transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{template.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-white mb-1">
                  {template.name}
                </div>
                <div className="text-xs text-slate-400">
                  {template.description}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Type: {template.type} • {template.category}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm">No templates found</div>
        </div>
      )}
    </div>
  );
};
