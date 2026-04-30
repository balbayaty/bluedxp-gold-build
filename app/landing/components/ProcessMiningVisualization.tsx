"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ProcessMiningVisualizationProps {
  language: "en" | "ar";
}

/**
 * Process Mining & Compliance Intelligence Visualization
 *
 * Interactive visualization showing:
 * - Process flow discovery
 * - Compliance monitoring
 * - Bottleneck identification
 * - Digital twin integration
 *
 * Aligned with BlueDXP Intelligent Orchestration capabilities
 */
export default function ProcessMiningVisualization({
  language,
}: ProcessMiningVisualizationProps) {
  const [activeView, setActiveView] = useState<
    "process" | "compliance" | "bottleneck" | "twin"
  >("process");
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const content = {
    en: {
      title: "Process Mining & Compliance Intelligence",
      subtitle:
        "Discover, analyze, and optimize your operational processes in real-time",
      views: {
        process: "Process Flow",
        compliance: "Compliance",
        bottleneck: "Bottlenecks",
        twin: "Digital Twin",
      },
      metrics: {
        efficiency: "Process Efficiency",
        compliance: "Compliance Rate",
        throughput: "Throughput",
        latency: "Avg Latency",
      },
    },
    ar: {
      title: "استخراج العمليات وذكاء الامتثال",
      subtitle: "اكتشف وحلل وحدد عملياتك التشغيلية في الوقت الفعلي",
      views: {
        process: "تدفق العملية",
        compliance: "الامتثال",
        bottleneck: "الاختناقات",
        twin: "التوأم الرقمي",
      },
      metrics: {
        efficiency: "كفاءة العملية",
        compliance: "معدل الامتثال",
        throughput: "الإنتاجية",
        latency: "متوسط زمن الاستجابة",
      },
    },
  };

  const t = content[language];

  // Mock process nodes - in real implementation, this would come from process mining service
  const processNodes = [
    { id: "start", label: "Start", x: 50, y: 50, type: "process" },
    { id: "receive", label: "Receive", x: 150, y: 50, type: "process" },
    {
      id: "quality",
      label: "Quality Check",
      x: 250,
      y: 50,
      type: "compliance",
    },
    { id: "putaway", label: "Putaway", x: 350, y: 50, type: "process" },
    { id: "storage", label: "Storage", x: 450, y: 50, type: "process" },
    { id: "pick", label: "Picking", x: 550, y: 50, type: "process" },
    { id: "ship", label: "Shipping", x: 650, y: 50, type: "process" },
    { id: "end", label: "End", x: 750, y: 50, type: "process" },
  ];

  const [metrics, setMetrics] = useState({
    efficiency: 87,
    compliance: 94,
    throughput: 1240,
    latency: 2.3,
  });

  useEffect(() => {
    // Simulate real-time metric updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        efficiency: Math.max(
          80,
          Math.min(95, prev.efficiency + (Math.random() - 0.5) * 2),
        ),
        compliance: Math.max(
          90,
          Math.min(98, prev.compliance + (Math.random() - 0.5) * 1),
        ),
        throughput: Math.max(
          1000,
          Math.min(1500, prev.throughput + (Math.random() - 0.5) * 50),
        ),
        latency: Math.max(
          1.5,
          Math.min(3.5, prev.latency + (Math.random() - 0.5) * 0.2),
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4">
          {language === "en" ? "Intelligent Orchestration" : "التنسيق الذكي"}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] max-w-[900px] mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Visualization Controls */}
      <div className="mb-8 bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/6 p-4 rounded-lg border border-[#05a4ff]/20 text-center">
        <div className="mb-2 text-sm font-semibold text-[#a0aec0]">
          {language === "en" ? "View Mode" : "وضع العرض"}
        </div>
        <div className="flex justify-center gap-2 flex-wrap">
          {(["process", "compliance", "bottleneck", "twin"] as const).map(
            (view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === view
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                    : "bg-[#05a4ff]/10 text-[#cbd5e1] border border-[#05a4ff]/30 hover:bg-[#05a4ff]/20"
                }`}
              >
                {t.views[view]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Process Diagram */}
      <div className="relative h-[480px] max-w-[1000px] mx-auto bg-[#05a4ff]/6 rounded-xl overflow-hidden border border-[#05a4ff]/20 mb-8">
        <svg className="absolute inset-0 w-full h-full">
          {/* Process Edges */}
          {processNodes.slice(0, -1).map((node, index) => {
            const nextNode = processNodes[index + 1];
            const length = Math.sqrt(
              Math.pow((nextNode.x - node.x) * 8, 2) +
                Math.pow((nextNode.y - node.y) * 4, 2),
            );
            const angle =
              Math.atan2((nextNode.y - node.y) * 4, (nextNode.x - node.x) * 8) *
              (180 / Math.PI);

            return (
              <motion.line
                key={`edge-${node.id}`}
                x1={node.x * 8}
                y1={node.y * 4 + 20}
                x2={nextNode.x * 8}
                y2={nextNode.y * 4 + 20}
                stroke={
                  activeView === "compliance" && node.type === "compliance"
                    ? "#facc15"
                    : "#05a4ff"
                }
                strokeWidth={activeNode === node.id ? 3 : 2}
                strokeDasharray={
                  activeView === "bottleneck" && node.id === "quality"
                    ? "5,5"
                    : "0"
                }
                opacity={
                  activeView === "bottleneck" && node.id === "quality"
                    ? 0.8
                    : 0.45
                }
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.1 }}
              >
                <motion.polygon
                  points={`${nextNode.x * 8 - 8},${nextNode.y * 4 + 16} ${nextNode.x * 8 - 8},${nextNode.y * 4 + 24} ${nextNode.x * 8},${nextNode.y * 4 + 20}`}
                  fill={
                    activeView === "compliance" && node.type === "compliance"
                      ? "#facc15"
                      : "#05a4ff"
                  }
                />
              </motion.line>
            );
          })}

          {/* Process Nodes */}
          {processNodes.map((node) => {
            const isActive = activeNode === node.id;
            const isBottleneck =
              activeView === "bottleneck" && node.id === "quality";
            const isCompliance =
              activeView === "compliance" && node.type === "compliance";
            const isTwin = activeView === "twin";

            return (
              <g key={node.id}>
                <motion.rect
                  x={node.x * 8 - 80}
                  y={node.y * 4}
                  width={160}
                  height={40}
                  rx={10}
                  fill={
                    isBottleneck
                      ? "rgba(239, 68, 68, 0.8)"
                      : isCompliance
                        ? "rgba(234, 179, 8, 0.75)"
                        : isTwin
                          ? "rgba(139, 92, 246, 0.8)"
                          : isActive
                            ? "rgba(0, 212, 168, 0.55)"
                            : "rgba(5, 164, 255, 0.4)"
                  }
                  stroke={
                    isBottleneck
                      ? "rgba(239, 68, 68, 0.6)"
                      : isCompliance
                        ? "rgba(234, 179, 8, 0.6)"
                        : isTwin
                          ? "rgba(139, 92, 246, 0.6)"
                          : isActive
                            ? "rgba(0, 212, 168, 0.6)"
                            : "rgba(5, 164, 255, 0.35)"
                  }
                  strokeWidth={isActive ? 2 : 1}
                  className="cursor-pointer"
                  onClick={() => setActiveNode(isActive ? null : node.id)}
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: isActive
                      ? "0 0 20px rgba(0, 212, 168, 0.35)"
                      : isBottleneck
                        ? "0 0 15px rgba(239, 68, 68, 0.4)"
                        : "0 0 0px rgba(5, 164, 255, 0)",
                  }}
                />
                <text
                  x={node.x * 8}
                  y={node.y * 4 + 25}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1000px] mx-auto">
        {Object.entries(t.metrics).map(([key, label]) => (
          <motion.div
            key={key}
            className="bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/6 border border-[#05a4ff]/20 rounded-lg p-5 text-center"
            whileHover={{ scale: 1.05, borderColor: "rgba(5, 164, 255, 0.4)" }}
          >
            <div className="text-xs text-[#a0aec0] mb-2">{label}</div>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {key === "throughput"
                ? Math.round(
                    metrics[key as keyof typeof metrics] as number,
                  ).toLocaleString()
                : key === "latency"
                  ? (metrics[key as keyof typeof metrics] as number).toFixed(
                      1,
                    ) + "s"
                  : Math.round(metrics[key as keyof typeof metrics] as number) +
                    "%"}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
