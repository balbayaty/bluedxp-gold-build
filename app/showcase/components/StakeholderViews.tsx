"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StakeholderView } from "@/types/showcase";

interface StakeholderViewsProps {
  selectedStakeholder: string;
  onSelect: (id: string) => void;
}

export default function StakeholderViews({
  selectedStakeholder,
  onSelect,
}: StakeholderViewsProps) {
  const stakeholders: StakeholderView[] = [
    {
      id: "qhse",
      name: "QHSE Team",
      role: "Quality, Health, Safety & Environment",
      icon: "ri-shield-check-line",
      description:
        "Comprehensive safety monitoring, compliance tracking, and risk management",
      features: [
        "Real-time safety compliance monitoring",
        "Automated incident reporting",
        "Risk assessment dashboards",
        "Regulatory compliance tracking",
        "Environmental impact monitoring",
      ],
      metrics: [
        "Safety Score",
        "Compliance Rate",
        "Incident Count",
        "Risk Level",
      ],
    },
    {
      id: "regulator",
      name: "Regulator",
      role: "Government & Regulatory Bodies",
      icon: "ri-government-line",
      description: "Transparent compliance reporting and audit trails",
      features: [
        "Automated compliance reports",
        "Real-time audit trails",
        "Standard-specific dashboards",
        "Documentation management",
        "Inspection readiness",
      ],
      metrics: [
        "Compliance Status",
        "Violations",
        "Audit Score",
        "Documentation",
      ],
    },
    {
      id: "insurer",
      name: "Insurer",
      role: "Insurance Providers",
      icon: "ri-shield-star-line",
      description:
        "Risk assessment and safety metrics for insurance underwriting",
      features: [
        "Risk scoring and assessment",
        "Safety performance metrics",
        "Claims prevention analytics",
        "Loss ratio tracking",
        "Premium optimization insights",
      ],
      metrics: ["Risk Score", "Safety Rating", "Claims History", "Loss Ratio"],
    },
    {
      id: "consultant",
      name: "Consultant",
      role: "Safety & Compliance Consultants",
      icon: "ri-user-star-line",
      description: "Advanced analytics and recommendations for clients",
      features: [
        "Deep-dive analytics",
        "Custom report generation",
        "Benchmarking tools",
        "Best practice recommendations",
        "Client portfolio management",
      ],
      metrics: ["Client Score", "Recommendations", "Benchmark", "ROI"],
    },
    {
      id: "manufacturer",
      name: "Manufacturer",
      role: "Chemical Manufacturers",
      icon: "ri-factory-line",
      description: "End-to-end visibility of products through the supply chain",
      features: [
        "Product traceability",
        "Batch tracking",
        "Quality compliance",
        "Storage condition monitoring",
        "Delivery performance",
      ],
      metrics: [
        "Traceability",
        "Quality Score",
        "Storage Compliance",
        "Delivery Rate",
      ],
    },
    {
      id: "landlord",
      name: "Landlord",
      role: "Warehouse Facility Owners",
      icon: "ri-building-line",
      description: "Facility compliance and tenant management",
      features: [
        "Building code compliance (SBC801)",
        "Tenant safety monitoring",
        "Facility utilization",
        "Maintenance tracking",
        "Insurance compliance",
      ],
      metrics: [
        "Building Compliance",
        "Tenant Safety",
        "Utilization",
        "Maintenance",
      ],
    },
    {
      id: "contractor",
      name: "Contractor",
      role: "Construction & Maintenance",
      icon: "ri-tools-line",
      description: "Project safety and compliance during construction",
      features: [
        "Site safety monitoring",
        "Material compliance",
        "Work permit management",
        "Incident tracking",
        "Progress reporting",
      ],
      metrics: ["Safety Score", "Permits", "Incidents", "Progress"],
    },
  ];

  const selected =
    stakeholders.find((s) => s.id === selectedStakeholder) || stakeholders[0];

  return (
    <div className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Stakeholder-Specific Views
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Tailored dashboards for every stakeholder in the ecosystem
          </p>
        </motion.div>

        {/* Stakeholder Selector */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {stakeholders.map((stakeholder) => (
            <motion.button
              key={stakeholder.id}
              onClick={() => onSelect(stakeholder.id)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedStakeholder === stakeholder.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50"
                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white border border-white/10"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className={`${stakeholder.icon} text-lg`}></i>
              <span>{stakeholder.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Selected Stakeholder View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <i className={`${selected.icon} text-3xl text-white`}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-2">
                  {selected.name}
                </h3>
                <div className="text-lg text-cyan-400 mb-3">
                  {selected.role}
                </div>
                <p className="text-[#9ca3af]">{selected.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Features */}
              <div>
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-star-line text-cyan-400"></i>
                  Key Features
                </h4>
                <div className="space-y-3">
                  {selected.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span className="text-white">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-bar-chart-line text-cyan-400"></i>
                  Key Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selected.metrics.map((metric, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="text-2xl font-bold text-cyan-400 mb-1">
                        {Math.floor(Math.random() * 100)}
                      </div>
                      <div className="text-sm text-[#9ca3af]">{metric}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Demo Button */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <motion.button
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="ri-eye-line"></i>
                View {selected.name} Dashboard
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
