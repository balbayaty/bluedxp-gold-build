"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import { ComplianceStandard } from "@/types/showcase";

export default function ComplianceMatrix() {
  const [selectedStandard, setSelectedStandard] =
    useState<ComplianceStandard | null>(null);
  const [showModal, setShowModal] = useState(false);

  const standards: ComplianceStandard[] = [
    {
      id: "sbc801",
      name: "Saudi Building Code 801",
      code: "SBC801",
      category: "BUILDING",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Warehouse classification",
        "Fire safety systems",
        "Structural requirements",
        "Accessibility standards",
      ],
    },
    {
      id: "nfpa30",
      name: "NFPA 30",
      code: "NFPA-30",
      category: "FIRE",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Flammable liquid storage",
        "Fire suppression systems",
        "Ventilation requirements",
        "Emergency response procedures",
      ],
    },
    {
      id: "nfpa704",
      name: "NFPA 704",
      code: "NFPA-704",
      category: "CHEMICAL",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Hazard identification",
        "Material safety data sheets",
        "Labeling requirements",
        "Storage compatibility",
      ],
    },
    {
      id: "iso14001",
      name: "ISO 14001",
      code: "ISO-14001",
      category: "ENVIRONMENTAL",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Environmental management",
        "Waste reduction",
        "Resource efficiency",
        "Compliance monitoring",
      ],
    },
    {
      id: "iso45001",
      name: "ISO 45001",
      code: "ISO-45001",
      category: "SAFETY",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Occupational health & safety",
        "Risk assessment",
        "Incident management",
        "Continuous improvement",
      ],
    },
    {
      id: "osha",
      name: "OSHA Standards",
      code: "OSHA",
      category: "SAFETY",
      status: "COMPLIANT",
      lastCheck: new Date(),
      requirements: [
        "Workplace safety",
        "Hazard communication",
        "Personal protective equipment",
        "Training requirements",
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "NON_COMPLIANT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "BUILDING":
        return "bg-blue-500/20 text-blue-400";
      case "FIRE":
        return "bg-red-500/20 text-red-400";
      case "CHEMICAL":
        return "bg-purple-500/20 text-purple-400";
      case "SAFETY":
        return "bg-yellow-500/20 text-yellow-400";
      case "ENVIRONMENTAL":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

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
              Compliance Standards Matrix
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Multi-standard compliance monitoring across SBC801, NFPA, ISO, and
            more
          </p>
        </motion.div>

        {/* Compliance Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standards.map((standard, index) => (
            <motion.div
              key={standard.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
              onClick={() => {
                setSelectedStandard(standard);
                setShowModal(true);
              }}
              whileHover={{ y: -8 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {standard.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(standard.category)}`}
                    >
                      {standard.category}
                    </span>
                  </div>
                  <div className="text-sm text-cyan-400 font-mono mb-3">
                    {standard.code}
                  </div>
                </div>
                <i className="ri-arrow-right-line text-2xl text-[#9ca3af] group-hover:text-cyan-400 transition-colors"></i>
              </div>

              <div
                className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(standard.status)} mb-4`}
              >
                {standard.status}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-[#9ca3af] mb-2">
                  Key Requirements:
                </div>
                {standard.requirements.slice(0, 3).map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-white"
                  >
                    <i className="ri-checkbox-circle-line text-green-400"></i>
                    <span>{req}</span>
                  </div>
                ))}
                {standard.requirements.length > 3 && (
                  <div className="text-xs text-cyan-400 mt-2">
                    +{standard.requirements.length - 3} more requirements
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-[#9ca3af]">
                  Last checked:{" "}
                  {new Date(standard.lastCheck).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compliance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8"
        >
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {standards.length}
              </div>
              <div className="text-sm text-[#9ca3af]">Total Standards</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {standards.filter((s) => s.status === "COMPLIANT").length}
              </div>
              <div className="text-sm text-[#9ca3af]">Compliant</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-sm text-[#9ca3af]">Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-sm text-[#9ca3af]">Monitoring</div>
            </div>
          </div>
        </motion.div>

        {/* Standard Details Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedStandard(null);
          }}
          title={selectedStandard?.name || ""}
          size="lg"
        >
          {selectedStandard && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Standard Code
                  </div>
                  <div className="text-white font-mono">
                    {selectedStandard.code}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Category</div>
                  <div className="text-white">{selectedStandard.category}</div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                  <div
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(selectedStandard.status)}`}
                  >
                    {selectedStandard.status}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Last Checked
                  </div>
                  <div className="text-white">
                    {new Date(selectedStandard.lastCheck).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-white mb-3">
                  Requirements
                </div>
                <div className="space-y-2">
                  {selectedStandard.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <div className="flex-1">
                        <div className="text-sm text-white">{req}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-[#9ca3af]">
                  This standard is automatically monitored and checked in
                  real-time across all three systems (WMS, Hazalyze, AI Vision).
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
