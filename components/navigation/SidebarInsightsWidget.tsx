/**
 * SidebarInsightsWidget - Intelligent Rotating Insights for Sidebar Footer
 * 
 * A smart, dynamic widget that rotates through:
 * - Real-time KPIs and metrics
 * - SLA alerts and status
 * - Pending tasks/approvals count
 * - Industry benchmarks
 * - Motivational quotes (Arabic/English)
 * - System health indicators
 * - AI-generated insights
 * 
 * 4IR & 5IR Aligned • Human-Centric • Data-Driven
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InsightItem {
  id: string;
  type: "kpi" | "sla" | "pending" | "benchmark" | "quote" | "health" | "insight" | "tip";
  icon: string;
  title: string;
  value?: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: string;
  bgColor: string;
  priority?: "high" | "medium" | "low";
}

interface SidebarInsightsWidgetProps {
  sidebarOpen: boolean;
  isDarkMode: boolean;
}

// Motivational quotes (English & Arabic wisdom)
const QUOTES = [
  { text: "Excellence is not a destination but a continuous journey", author: "Arab Proverb" },
  { text: "الجودة ليست فعلاً، إنها عادة", author: "Aristotle (Arabic)" }, // Quality is not an act, it's a habit
  { text: "Data is the new oil of the digital economy", author: "Clive Humby" },
  { text: "من جد وجد", author: "Arab Proverb" }, // Who strives, finds
  { text: "Efficiency is doing things right; effectiveness is doing the right things", author: "Peter Drucker" },
  { text: "العلم نور", author: "Arab Proverb" }, // Knowledge is light
  { text: "In God we trust, all others bring data", author: "W. Edwards Deming" },
  { text: "الوقت كالسيف", author: "Arab Proverb" }, // Time is like a sword
  { text: "What gets measured gets managed", author: "Peter Drucker" },
  { text: "التميز عادة وليس فعلاً", author: "Aristotle" }, // Excellence is a habit
];

// Tips for users
const TIPS = [
  { text: "Press ⌘K for quick search", icon: "ri-search-line" },
  { text: "Use AI Copilot for instant help", icon: "ri-robot-line" },
  { text: "Check SLA dashboard weekly", icon: "ri-dashboard-line" },
  { text: "Review pending approvals daily", icon: "ri-checkbox-circle-line" },
  { text: "Export reports for stakeholders", icon: "ri-file-chart-line" },
];

export default function SidebarInsightsWidget({ sidebarOpen, isDarkMode }: SidebarInsightsWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Generate dynamic insights (in real app, this would come from APIs)
  const insights = useMemo<InsightItem[]>(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based greeting insight
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    const arabicGreeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";
    
    return [
      // KPI - Order Fulfillment
      {
        id: "kpi-1",
        type: "kpi",
        icon: "ri-shopping-cart-line",
        title: "Order Fulfillment",
        value: "98.5%",
        subtitle: "Today's rate",
        trend: "up",
        trendValue: "+2.3%",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
      },
      // SLA Alert
      {
        id: "sla-1",
        type: "sla",
        icon: "ri-timer-line",
        title: "SLA Status",
        value: "3",
        subtitle: "Items at risk",
        trend: "down",
        trendValue: "-2 from yesterday",
        color: "text-amber-400",
        bgColor: "bg-amber-500/20",
        priority: "medium",
      },
      // Pending Tasks
      {
        id: "pending-1",
        type: "pending",
        icon: "ri-checkbox-circle-line",
        title: "Pending Approvals",
        value: "7",
        subtitle: "Awaiting your action",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        priority: "high",
      },
      // Warehouse Utilization
      {
        id: "kpi-2",
        type: "kpi",
        icon: "ri-building-4-line",
        title: "Space Utilization",
        value: "84%",
        subtitle: "Across all warehouses",
        trend: "up",
        trendValue: "+5%",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
      },
      // Quote
      {
        id: "quote-1",
        type: "quote",
        icon: "ri-double-quotes-l",
        title: QUOTES[Math.floor(Math.random() * QUOTES.length)].text,
        subtitle: QUOTES[Math.floor(Math.random() * QUOTES.length)].author,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
      },
      // Benchmark
      {
        id: "benchmark-1",
        type: "benchmark",
        icon: "ri-bar-chart-grouped-line",
        title: "Industry Benchmark",
        value: "Top 15%",
        subtitle: "Logistics efficiency",
        trend: "up",
        trendValue: "Above average",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
      },
      // System Health
      {
        id: "health-1",
        type: "health",
        icon: "ri-heart-pulse-line",
        title: "System Health",
        value: "99.9%",
        subtitle: "All services operational",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
      },
      // AI Insight
      {
        id: "insight-1",
        type: "insight",
        icon: "ri-lightbulb-flash-line",
        title: "AI Insight",
        subtitle: "Optimize picking routes to save 12% time",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
      },
      // Tip
      {
        id: "tip-1",
        type: "tip",
        icon: TIPS[Math.floor(Math.random() * TIPS.length)].icon,
        title: "Quick Tip",
        subtitle: TIPS[Math.floor(Math.random() * TIPS.length)].text,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/20",
      },
      // Greeting
      {
        id: "greeting-1",
        type: "insight",
        icon: hour < 17 ? "ri-sun-line" : "ri-moon-line",
        title: greeting,
        subtitle: arabicGreeting,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
      },
      // Shipments Today
      {
        id: "kpi-3",
        type: "kpi",
        icon: "ri-truck-line",
        title: "Shipments Today",
        value: "142",
        subtitle: "On track for delivery",
        trend: "up",
        trendValue: "+18 from avg",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
      },
      // Inventory Accuracy
      {
        id: "kpi-4",
        type: "kpi",
        icon: "ri-stack-line",
        title: "Inventory Accuracy",
        value: "99.7%",
        subtitle: "Cycle count verified",
        trend: "neutral",
        color: "text-teal-400",
        bgColor: "bg-teal-500/20",
      },
    ];
  }, []);

  // Auto-rotate insights every 5 seconds (pause on hover)
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [insights.length, isHovered]);

  const currentInsight = insights[currentIndex];

  // Compact view when sidebar is collapsed
  if (!sidebarOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-t border-white/10 p-2"
      >
        <motion.div
          className={`w-10 h-10 mx-auto rounded-lg ${currentInsight.bgColor} flex items-center justify-center cursor-pointer`}
          whileHover={{ scale: 1.1 }}
          onClick={() => setCurrentIndex((prev) => (prev + 1) % insights.length)}
        >
          <i className={`${currentInsight.icon} ${currentInsight.color} text-lg`} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-white/10 p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsight.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`rounded-xl p-3 ${currentInsight.bgColor} border border-white/5 cursor-pointer group`}
          onClick={() => setCurrentIndex((prev) => (prev + 1) % insights.length)}
        >
          {/* Header with icon and type badge */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center`}>
                <i className={`${currentInsight.icon} ${currentInsight.color} text-base`} />
              </div>
              <div className="flex-1 min-w-0">
                {currentInsight.type === "quote" ? (
                  <div className={`text-xs ${currentInsight.color} italic line-clamp-2`}>
                    "{currentInsight.title}"
                  </div>
                ) : (
                  <div className="text-xs font-medium text-white/90 truncate">
                    {currentInsight.title}
                  </div>
                )}
              </div>
            </div>
            
            {/* Priority indicator */}
            {currentInsight.priority === "high" && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* Value (if present) */}
          {currentInsight.value && currentInsight.type !== "quote" && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-2xl font-bold ${currentInsight.color}`}>
                {currentInsight.value}
              </span>
              {currentInsight.trend && (
                <span className={`text-xs flex items-center gap-0.5 ${
                  currentInsight.trend === "up" ? "text-emerald-400" :
                  currentInsight.trend === "down" ? "text-red-400" :
                  "text-gray-400"
                }`}>
                  <i className={`ri-arrow-${currentInsight.trend === "up" ? "up" : currentInsight.trend === "down" ? "down" : "right"}-line text-xs`} />
                  {currentInsight.trendValue}
                </span>
              )}
            </div>
          )}

          {/* Subtitle */}
          {currentInsight.subtitle && (
            <div className={`text-xs ${currentInsight.type === "quote" ? "text-gray-400 text-right" : "text-gray-400"}`}>
              {currentInsight.type === "quote" ? `— ${currentInsight.subtitle}` : currentInsight.subtitle}
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-3 pt-2 border-t border-white/5">
            {insights.slice(0, 6).map((_, idx) => (
              <motion.div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex % 6
                    ? `${currentInsight.color.replace('text-', 'bg-')} scale-125`
                    : "bg-white/20"
                }`}
                whileHover={{ scale: 1.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </div>

          {/* Hover hint */}
          <div className="text-[9px] text-center text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Click for next insight
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
