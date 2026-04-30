"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiList,
  FiSearch,
  FiZap,
  FiShield,
  FiCpu,
  FiGlobe,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
import type { ModuleDefinition } from "@/lib/modules/registry";

interface ModuleShowcaseProps {
  modules: ModuleDefinition[];
}

const CATEGORY_COLORS: Record<string, string> = {
  operations: "from-blue-500 to-cyan-500",
  intelligence: "from-purple-500 to-pink-500",
  compliance: "from-green-500 to-emerald-500",
  integration: "from-orange-500 to-red-500",
  enterprise: "from-indigo-500 to-blue-500",
  other: "from-slate-500 to-gray-500",
};

const CATEGORY_ICONS: Record<string, any> = {
  operations: FiGrid,
  intelligence: FiCpu,
  compliance: FiShield,
  integration: FiGlobe,
  enterprise: FiZap,
  other: FiGrid,
};

export default function ModuleShowcase({ modules }: ModuleShowcaseProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<ModuleDefinition | null>(
    null,
  );

  const categories = Array.from(
    new Set(modules.map((m) => m.category || "other")),
  );

  const filteredModules = modules.filter((module) => {
    const matchesCategory =
      selectedCategory === "all" || module.category === selectedCategory;
    const matchesSearch =
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FiGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition-colors ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FiList className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All ({modules.length})
        </button>
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category] || FiGrid;
          const count = modules.filter((m) => m.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Modules Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => setSelectedModule(module)}
              className="group p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[module.category || "other"]} flex items-center justify-center text-2xl`}
                >
                  {module.routes?.[0]?.icon || "📦"}
                </div>
                {module.enabled && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    Active
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {module.name}
              </h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {module.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 capitalize">
                  {module.category || "other"}
                </span>
                <FiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
              onClick={() => setSelectedModule(module)}
              className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[module.category || "other"]} flex items-center justify-center text-2xl flex-shrink-0`}
                >
                  {module.routes?.[0]?.icon || "📦"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {module.name}
                    </h3>
                    {module.enabled && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{module.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-500 capitalize">
                      {module.category || "other"}
                    </span>
                    {module.version && (
                      <span className="text-xs text-slate-500">
                        v{module.version}
                      </span>
                    )}
                  </div>
                </div>
                <FiArrowRight className="w-6 h-6 text-slate-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Module Detail Modal */}
      <AnimatePresence>
        {selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedModule(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-700 p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[selectedModule.category || "other"]} flex items-center justify-center text-2xl`}
                  >
                    {selectedModule.routes?.[0]?.icon || "📦"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedModule.name}
                    </h2>
                    <p className="text-slate-400 capitalize">
                      {selectedModule.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-300 mb-6">
                {selectedModule.description}
              </p>
              {selectedModule.routes && selectedModule.routes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Routes
                  </h3>
                  <div className="space-y-2">
                    {selectedModule.routes.map((route, i) => (
                      <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-sm text-slate-300">
                          {route.path}
                        </div>
                        {route.title && (
                          <div className="text-xs text-slate-500 mt-1">
                            {route.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
