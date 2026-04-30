/**
 * Cross-Module Integration Map
 * Visual map showing how vision analysis triggers actions across all modules
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function IntegrationMapPage() {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const modules = [
    {
      id: "wms",
      name: "WMS",
      icon: "ri-box-3-line",
      color: "cyan",
      actions: [
        "Update Inventory",
        "Create Damage Report",
        "Update Stock Levels",
      ],
      href: "/inventory",
    },
    {
      id: "iso-ims",
      name: "ISO-IMS",
      icon: "ri-file-list-line",
      color: "blue",
      actions: ["Create NCR", "Create CAPA", "Link Documents"],
      href: "/ncr-management",
    },
    {
      id: "qhse",
      name: "QHSE",
      icon: "ri-shield-check-line",
      color: "green",
      actions: ["Create Incident", "Link Inspection", "Update Training"],
      href: "/incident-report",
    },
    {
      id: "tms",
      name: "TMS",
      icon: "ri-truck-line",
      color: "orange",
      actions: ["Update Carrier Score", "Create Shipment Note", "Link POD"],
      href: "/carriers",
    },
    {
      id: "liability",
      name: "Liability",
      icon: "ri-scales-3-line",
      color: "red",
      actions: ["Assess Liability", "Generate Claim", "Check Compliance"],
      href: "/liability/dashboard",
    },
    {
      id: "customer",
      name: "Customer",
      icon: "ri-customer-service-line",
      color: "purple",
      actions: ["Notify Customer", "Update Portal", "Send Alert"],
      href: "/customer-portal",
    },
  ];

  return (
    <PageTemplate
      title="🔗 Cross-Module Integration Map"
      description="Visual map showing how AI vision analysis triggers actions across all modules in the platform"
      icon="ri-node-tree"
    >
      <div className="space-y-6">
        {/* Central Vision Hub */}
        <div className="relative flex items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <i className="ri-eye-line text-5xl text-white"></i>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </div>
          </motion.div>

          {/* Module Connections */}
          {modules.map((module, idx) => {
            const angle = (idx * 360) / modules.length - 90;
            const radius = 200;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Connection Line */}
                <svg
                  className="absolute"
                  style={{
                    width: `${radius}px`,
                    height: "2px",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    transformOrigin: "0 0",
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2={radius}
                    y2="0"
                    stroke="rgba(139, 92, 246, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>

                {/* Module Card */}
                <motion.button
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedModule(module.id);
                    router.push(module.href);
                  }}
                  className={`bg-gradient-to-br from-${module.color}-500/20 to-${module.color}-600/20 border-2 border-${module.color}-500/50 rounded-xl p-4 w-40 hover:border-${module.color}-400 transition-all shadow-lg`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <i
                      className={`ri-${module.icon.split("-")[1]}-line text-3xl text-${module.color}-400`}
                    ></i>
                    <h4 className="text-white font-bold text-lg">
                      {module.name}
                    </h4>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: idx * 0.1 + 0.5, duration: 0.5 }}
                        className={`h-full bg-${module.color}-500`}
                      ></motion.div>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Module Details */}
        {selectedModule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            {(() => {
              const moduleDef = modules.find((m) => m.id === selectedModule);
              if (!moduleDef) return null;

              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <i
                        className={`ri-${moduleDef.icon.split("-")[1]}-line text-2xl text-${moduleDef.color}-400`}
                      ></i>
                      {moduleDef.name} Module Actions
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(moduleDef.href)}
                      className={`px-4 py-2 bg-${moduleDef.color}-500/20 hover:bg-${moduleDef.color}-500/30 border border-${moduleDef.color}-500/50 rounded-lg text-white text-sm transition-all flex items-center gap-2`}
                    >
                      Go to Module
                      <i className="ri-arrow-right-line"></i>
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {moduleDef.actions.map((action, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <i
                          className={`ri-checkbox-circle-line text-${moduleDef.color}-400`}
                        ></i>
                        <span className="text-white">{action}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Integration Flow */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">
            Complete Integration Flow
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Photo Uploaded",
                desc: "User uploads damage/incident photo",
                modules: [],
              },
              {
                step: 2,
                title: "AI Vision Analysis",
                desc: "V2 analyzes with V1 + learning",
                modules: ["AI Vision"],
              },
              {
                step: 3,
                title: "Pattern Matching",
                desc: "Matches against learned patterns",
                modules: ["Learning"],
              },
              {
                step: 4,
                title: "Liability Assessment",
                desc: "Determines fault and calculates claims",
                modules: ["Liability"],
              },
              {
                step: 5,
                title: "Cross-Module Actions",
                desc: "Triggers actions across modules",
                modules: ["WMS", "ISO-IMS", "QHSE", "TMS", "Customer"],
              },
              {
                step: 6,
                title: "Results Display",
                desc: "User sees complete analysis and actions",
                modules: [],
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">
                    {item.title}
                  </h4>
                  <p className="text-white/70 text-sm mb-2">{item.desc}</p>
                  {item.modules.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.modules.map((mod) => {
                        const modData = modules.find(
                          (m) => m.name === mod || m.id === mod.toLowerCase(),
                        );
                        return modData ? (
                          <motion.button
                            key={mod}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => router.push(modData.href)}
                            className={`px-2 py-1 bg-${modData.color}-500/20 hover:bg-${modData.color}-500/30 border border-${modData.color}-500/50 rounded text-${modData.color}-400 text-xs transition-all`}
                          >
                            {modData.name}
                          </motion.button>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {idx < 5 && (
                  <div className="pt-2">
                    <i className="ri-arrow-down-s-line text-purple-400 text-xl"></i>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
