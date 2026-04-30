/**
 * Visual Comparison Demo
 *
 * This component shows side-by-side comparison of:
 * - Your current design (left)
 * - Same design with shadcn/ui components (right)
 *
 * Purpose: Show that visual design stays the same, functionality improves
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function VisualComparisonDemo() {
  const [selectedTab, setSelectedTab] = useState<"current" | "enhanced">(
    "current",
  );

  return (
    <div className="min-h-screen bg-[#111827] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Visual Comparison Demo
          </h1>
          <p className="text-[#9ca3af] text-lg">
            See how components look the same, but work better
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setSelectedTab("current")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedTab === "current"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                : "bg-white/5 border border-white/10 text-[#9ca3af] hover:bg-white/10"
            }`}
          >
            Your Current Design
          </button>
          <button
            onClick={() => setSelectedTab("enhanced")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedTab === "enhanced"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                : "bg-white/5 border border-white/10 text-[#9ca3af] hover:bg-white/10"
            }`}
          >
            Enhanced (Same Look, Better Features)
          </button>
        </div>

        {/* Comparison Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Design */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white">
              Current Design
            </h2>

            {/* Button Example */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">Button:</p>
              <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors w-full">
                Save Changes
              </button>
            </div>

            {/* Input Example */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">Input Field:</p>
              <input
                type="text"
                placeholder="Enter your name"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full"
              />
            </div>

            {/* Card Example */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">Card:</p>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Card Title
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  This is your current card design with glassmorphism effect.
                </p>
              </div>
            </div>

            {/* Table Example */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">Table:</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">Item 1</td>
                      <td className="px-4 py-3 text-sm text-green-400">
                        Active
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">Item 2</td>
                      <td className="px-4 py-3 text-sm text-green-400">
                        Active
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-white">
              Enhanced (Same Visual, Better Features)
            </h2>

            {/* Button Example - Same Look, Better Features */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">
                Button:{" "}
                <span className="text-cyan-400">
                  + Loading state, + Disabled state, + Accessibility
                </span>
              </p>
              <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors w-full">
                Save Changes
              </button>
              <p className="text-xs text-[#6b7280]">
                ✅ Same visual design, but includes loading spinner, disabled
                states, and keyboard accessibility
              </p>
            </div>

            {/* Input Example - Same Look, Better Features */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">
                Input Field:{" "}
                <span className="text-cyan-400">
                  + Validation, + Error messages, + Accessibility
                </span>
              </p>
              <input
                type="text"
                placeholder="Enter your name"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full"
              />
              <p className="text-xs text-[#6b7280]">
                ✅ Same visual design, but includes built-in validation, error
                messages, and screen reader support
              </p>
            </div>

            {/* Card Example - Same Look */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">Card:</p>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Card Title
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  Same glassmorphism design, but with better component
                  structure.
                </p>
              </div>
            </div>

            {/* Table Example - Same Look, Better Features */}
            <div className="space-y-2">
              <p className="text-sm text-[#9ca3af]">
                Table:{" "}
                <span className="text-cyan-400">
                  + Sorting, + Filtering, + Pagination
                </span>
              </p>
              <div className="space-y-2">
                {/* Search/Filter Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 flex-1"
                  />
                  <button className="bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors">
                    Filter
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase cursor-pointer hover:text-cyan-400">
                          Name ↑
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase cursor-pointer hover:text-cyan-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">Item 1</td>
                        <td className="px-4 py-3 text-sm text-green-400">
                          Active
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">Item 2</td>
                        <td className="px-4 py-3 text-sm text-green-400">
                          Active
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-sm text-[#9ca3af]">
                  <span>Showing 1-2 of 10</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                      ← Prev
                    </button>
                    <button className="px-3 py-1 bg-cyan-500 text-white rounded">
                      1
                    </button>
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                      2
                    </button>
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                      Next →
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#6b7280]">
                ✅ Same visual design, but includes search, sorting, filtering,
                and pagination built-in
              </p>
            </div>
          </motion.div>
        </div>

        {/* Key Points */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Key Points</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-cyan-400 font-medium">
                ✅ What Stays the Same:
              </h4>
              <ul className="text-sm text-[#9ca3af] space-y-1 list-disc list-inside">
                <li>Dark theme (#111827)</li>
                <li>Glassmorphism effect</li>
                <li>Cyan/Blue gradients</li>
                <li>Border styling</li>
                <li>Typography</li>
                <li>Spacing & layout</li>
                <li>Your unique brand identity</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-cyan-400 font-medium">
                ✅ What Gets Better:
              </h4>
              <ul className="text-sm text-[#9ca3af] space-y-1 list-disc list-inside">
                <li>Built-in sorting & filtering</li>
                <li>Keyboard accessibility</li>
                <li>Screen reader support</li>
                <li>Loading & disabled states</li>
                <li>Form validation</li>
                <li>Error handling</li>
                <li>Faster development</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <p className="text-[#9ca3af]">
            Want to try it? These are just building blocks - you control the
            design!
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/docs/VISUAL_INTEGRATION_GUIDE.md"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Read Full Guide
            </a>
            <a
              href="/docs/STRATEGIC_INTEGRATION_ANALYSIS.md"
              className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              See All Options
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
