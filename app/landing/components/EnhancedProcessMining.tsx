"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface EnhancedProcessMiningProps {
  language: "en" | "ar";
}

/**
 * Enhanced Process Mining with proper alignment, 3D effects, real-time updates, and interactive animations
 */
export default function EnhancedProcessMining({
  language,
}: EnhancedProcessMiningProps) {
  const [activeView, setActiveView] = useState<
    "process" | "compliance" | "bottleneck" | "twin"
  >("process");
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.8, 1, 1, 0.8],
  );

  const content = {
    en: {
      title: "Process Mining & Compliance Intelligence",
      subtitle:
        "Discover, analyze, and optimize your operational processes in real-time with AI-powered insights",
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
      subtitle:
        "اكتشف وحلل وحدد عملياتك التشغيلية في الوقت الفعلي مع رؤى مدعومة بالذكاء الاصطناعي",
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

  // Process nodes with percentage-based positioning for proper alignment
  const processNodes = [
    {
      id: "start",
      label: "Start",
      x: 5,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
    {
      id: "receive",
      label: "Receive",
      x: 20,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
    {
      id: "quality",
      label: "Quality Check",
      x: 35,
      y: 50,
      type: "compliance",
      color: "#facc15",
    },
    {
      id: "putaway",
      label: "Putaway",
      x: 50,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
    {
      id: "storage",
      label: "Storage",
      x: 65,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
    {
      id: "pick",
      label: "Picking",
      x: 80,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
    {
      id: "ship",
      label: "Shipping",
      x: 95,
      y: 50,
      type: "process",
      color: "#05a4ff",
    },
  ];

  const [metrics, setMetrics] = useState({
    efficiency: 87,
    compliance: 94,
    throughput: 1240,
    latency: 2.3,
  });

  const [flowAnimation, setFlowAnimation] = useState(0);

  useEffect(() => {
    // Real-time metric updates
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
      setFlowAnimation((prev) => (prev + 1) % 100);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Animate flow on view change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [activeView]);

  // Calculate SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 200;
  const nodeWidth = 140;
  const nodeHeight = 60;

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, scale }}
      className="max-w-[1400px] mx-auto px-6 py-20"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4"
        >
          {language === "en" ? "Intelligent Orchestration" : "التنسيق الذكي"}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4 text-white"
        >
          {t.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-[#a0aec0] max-w-[900px] mx-auto"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Enhanced Visualization Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8 bg-gradient-to-r from-[#05a4ff]/10 to-[#00d4a8]/6 p-6 rounded-xl border border-[#05a4ff]/20 backdrop-blur-sm"
      >
        <div className="mb-4 text-sm font-semibold text-[#a0aec0] text-center">
          {language === "en" ? "View Mode" : "وضع العرض"}
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          {(["process", "compliance", "bottleneck", "twin"] as const).map(
            (view) => (
              <motion.button
                key={view}
                onClick={() => setActiveView(view)}
                className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all overflow-hidden ${
                  activeView === view
                    ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                    : "bg-[#05a4ff]/10 text-[#cbd5e1] border border-[#05a4ff]/30 hover:bg-[#05a4ff]/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">{t.views[view]}</span>
                {activeView === view && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] to-[#05a4ff]"
                    layoutId="activeView"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ),
          )}
        </div>
      </motion.div>

      {/* Properly Aligned Process Diagram */}
      <div className="relative w-full max-w-[1200px] mx-auto bg-gradient-to-br from-[#05a4ff]/6 to-[#00d4a8]/4 rounded-2xl overflow-hidden border border-[#05a4ff]/20 mb-8 backdrop-blur-sm p-8">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#05a4ff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#00d4a8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#05a4ff" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#05a4ff" />
            </marker>
          </defs>

          {/* Animated Flow Lines - Properly aligned */}
          {processNodes.slice(0, -1).map((node, index) => {
            const nextNode = processNodes[index + 1];
            const startX = (node.x / 100) * svgWidth;
            const startY = (node.y / 100) * svgHeight;
            const endX = (nextNode.x / 100) * svgWidth;
            const endY = (nextNode.y / 100) * svgHeight;
            const isActive =
              activeNode === node.id || activeNode === nextNode.id;
            const isBottleneck =
              activeView === "bottleneck" && node.id === "quality";
            const isCompliance =
              activeView === "compliance" && node.type === "compliance";

            return (
              <g key={`edge-${node.id}`}>
                <motion.line
                  x1={startX + nodeWidth / 2}
                  y1={startY}
                  x2={endX - nodeWidth / 2}
                  y2={endY}
                  stroke={
                    isBottleneck
                      ? "#ef4444"
                      : isCompliance
                        ? "#facc15"
                        : "#05a4ff"
                  }
                  strokeWidth={isActive ? 4 : 2}
                  strokeDasharray={isBottleneck ? "8,4" : "0"}
                  opacity={isActive ? 1 : isBottleneck ? 0.8 : 0.5}
                  filter={isActive ? "url(#glow)" : undefined}
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: isAnimating ? [0, 1] : 1,
                    opacity: isActive ? 1 : isBottleneck ? 0.8 : 0.5,
                  }}
                  transition={{ duration: 1, delay: index * 0.15 }}
                />
                {/* Animated flow particles */}
                <motion.circle
                  r="4"
                  fill={isCompliance ? "#facc15" : "#00d4a8"}
                  opacity={isActive ? 1 : 0}
                  animate={{
                    cx: [startX + nodeWidth / 2, endX - nodeWidth / 2],
                    cy: [startY, endY],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "linear",
                  }}
                />
              </g>
            );
          })}

          {/* Properly Aligned Process Nodes */}
          {processNodes.map((node, index) => {
            const x = (node.x / 100) * svgWidth - nodeWidth / 2;
            const y = (node.y / 100) * svgHeight - nodeHeight / 2;
            const isActive = activeNode === node.id;
            const isBottleneck =
              activeView === "bottleneck" && node.id === "quality";
            const isCompliance =
              activeView === "compliance" && node.type === "compliance";
            const isTwin = activeView === "twin";

            return (
              <g key={node.id}>
                {/* 3D Shadow Effect */}
                <motion.ellipse
                  cx={(node.x / 100) * svgWidth}
                  cy={(node.y / 100) * svgHeight + nodeHeight / 2 + 10}
                  rx={nodeWidth / 2}
                  ry={15}
                  fill="rgba(0, 0, 0, 0.3)"
                  opacity={isActive ? 0.5 : 0.2}
                  animate={{
                    opacity: isActive ? 0.5 : 0.2,
                    rx: isActive ? nodeWidth / 2 + 10 : nodeWidth / 2,
                  }}
                />
                {/* Main Node */}
                <motion.rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={12}
                  fill={
                    isBottleneck
                      ? "rgba(239, 68, 68, 0.9)"
                      : isCompliance
                        ? "rgba(234, 179, 8, 0.85)"
                        : isTwin
                          ? "rgba(139, 92, 246, 0.9)"
                          : isActive
                            ? "rgba(0, 212, 168, 0.7)"
                            : "rgba(5, 164, 255, 0.5)"
                  }
                  stroke={
                    isBottleneck
                      ? "#ef4444"
                      : isCompliance
                        ? "#facc15"
                        : isTwin
                          ? "#8b5cf6"
                          : isActive
                            ? "#00d4a8"
                            : "#05a4ff"
                  }
                  strokeWidth={isActive ? 3 : 2}
                  className="cursor-pointer"
                  onClick={() => setActiveNode(isActive ? null : node.id)}
                  whileHover={{ scale: 1.1, y: -5 }}
                  animate={{
                    boxShadow: isActive
                      ? "0 0 30px rgba(0, 212, 168, 0.6)"
                      : isBottleneck
                        ? "0 0 20px rgba(239, 68, 68, 0.5)"
                        : "0 0 0px rgba(5, 164, 255, 0)",
                  }}
                  filter={isActive ? "url(#glow)" : undefined}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <text
                  x={(node.x / 100) * svgWidth}
                  y={(node.y / 100) * svgHeight + 5}
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

      {/* Enhanced Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
        {Object.entries(t.metrics).map(([key, label], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/6 border border-[#05a4ff]/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-[#05a4ff]/40 transition-all"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="text-xs text-[#a0aec0] mb-3 font-medium">
              {label}
            </div>
            <motion.div
              className="text-4xl font-extrabold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent"
              key={metrics[key as keyof typeof metrics]}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
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
            </motion.div>
            {/* Trend indicator */}
            <motion.div
              className="mt-2 text-xs text-[#00d4a8]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ↗ {language === "en" ? "Live" : "مباشر"}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
