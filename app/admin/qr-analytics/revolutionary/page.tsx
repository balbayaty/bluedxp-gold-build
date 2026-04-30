"use client";

/**
 * Revolutionary QR Features Showcase
 * Mind-Blowing Interactive Demo
 * Future-Ready (2024-2040)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QRNetworkDashboard,
  QRVoiceDashboard,
  QRAgentsDashboard,
  QRGamificationDashboard,
  QRSupplyChainDashboard,
  QRDigitalTwinDashboard,
  QRSemanticSearchDashboard,
} from "@/components/qr/revolutionary";

export default function RevolutionaryQRShowcase() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "overview", name: "Overview", icon: "ri-dashboard-3-line" },
    { id: "network", name: "Network Intelligence", icon: "ri-node-tree" },
    { id: "voice", name: "Voice Control", icon: "ri-mic-line" },
    { id: "agents", name: "AI Agents", icon: "ri-robot-line" },
    { id: "gamification", name: "Gamification", icon: "ri-trophy-line" },
    { id: "supply-chain", name: "Supply Chain", icon: "ri-truck-line" },
    { id: "digital-twin", name: "Digital Twin", icon: "ri-cpu-line" },
    { id: "search", name: "Semantic Search", icon: "ri-search-line" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Revolutionary QR Intelligence
              </h1>
              <p className="text-xl text-gray-300">
                The Most Advanced QR System in Existence (2024-2040)
              </p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
            >
              <i className="ri-qr-code-line text-4xl"></i>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {[
              {
                label: "QR Networks",
                value: "∞",
                icon: "ri-node-tree",
                color: "purple",
              },
              {
                label: "AI Agents",
                value: "8",
                icon: "ri-robot-line",
                color: "blue",
              },
              {
                label: "Voice Commands",
                value: "100+",
                icon: "ri-mic-line",
                color: "green",
              },
              {
                label: "Achievements",
                value: "50+",
                icon: "ri-trophy-line",
                color: "yellow",
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <i
                    className={`${stat.icon} text-3xl text-${stat.color}-400`}
                  ></i>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                    className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
                  >
                    {stat.value}
                  </motion.div>
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.name}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && <OverviewTab key="overview" />}
          {activeTab === "network" && <QRNetworkDashboard key="network" />}
          {activeTab === "voice" && <QRVoiceDashboard key="voice" />}
          {activeTab === "agents" && <QRAgentsDashboard key="agents" />}
          {activeTab === "gamification" && (
            <QRGamificationDashboard key="gamification" />
          )}
          {activeTab === "supply-chain" && (
            <QRSupplyChainDashboard key="supply-chain" />
          )}
          {activeTab === "digital-twin" && (
            <QRDigitalTwinDashboard key="digital-twin" />
          )}
          {activeTab === "search" && <QRSemanticSearchDashboard key="search" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewTab() {
  const features = [
    {
      title: "Network Intelligence",
      description: "Connect QR codes in intelligent networks",
      icon: "ri-node-tree",
      color: "purple",
      stats: { networks: 12, relationships: 156, nodes: 89 },
    },
    {
      title: "Voice Control",
      description: "Hands-free QR operations via voice",
      icon: "ri-mic-line",
      color: "green",
      stats: { commands: 234, languages: 5, accuracy: "98%" },
    },
    {
      title: "AI Agents",
      description: "Autonomous agents managing QR codes",
      icon: "ri-robot-line",
      color: "blue",
      stats: { agents: 8, tasks: 1247, insights: 89 },
    },
    {
      title: "Gamification",
      description: "Engaging achievements and leaderboards",
      icon: "ri-trophy-line",
      color: "yellow",
      stats: { achievements: 50, users: 234, points: "1.2M" },
    },
    {
      title: "Supply Chain",
      description: "End-to-end supply chain optimization",
      icon: "ri-truck-line",
      color: "orange",
      stats: { paths: 45, savings: "$2.3M", efficiency: "94%" },
    },
    {
      title: "Digital Twin",
      description: "Predictive digital replicas",
      icon: "ri-cpu-line",
      color: "cyan",
      stats: { twins: 67, simulations: 234, accuracy: "96%" },
    },
    {
      title: "Semantic Search",
      description: "Natural language QR discovery",
      icon: "ri-search-line",
      color: "pink",
      stats: { searches: 1234, results: "98%", speed: "<100ms" },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div
                className={`w-12 h-12 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mr-4`}
              >
                <i
                  className={`${feature.icon} text-2xl text-${feature.color}-400`}
                ></i>
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
            </div>
            <p className="text-gray-400 mb-4">{feature.description}</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(feature.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {value}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{key}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Demo Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-8 border border-purple-500/30"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 bg-green-400 rounded-full"
          />
          Live System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Active Networks</div>
            <div className="text-2xl font-bold text-green-400">12</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">AI Agents Working</div>
            <div className="text-2xl font-bold text-blue-400">8</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">
              Voice Commands Today
            </div>
            <div className="text-2xl font-bold text-purple-400">234</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
