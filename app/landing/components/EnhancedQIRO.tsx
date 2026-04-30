"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface EnhancedQIROProps {
  language: "en" | "ar";
}

/**
 * Enhanced QIRO with 3D network visualization, real-time vehicle tracking, and advanced animations
 */
export default function EnhancedQIRO({ language }: EnhancedQIROProps) {
  const [activeAlgorithm, setActiveAlgorithm] = useState<
    "quantum" | "ml" | "genetic" | "traditional"
  >("quantum");
  const [vehiclePosition, setVehiclePosition] = useState({
    x: 100,
    y: 200,
    progress: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
      title: "Quantum-Inspired Route Optimization (QIRO)",
      subtitle:
        "Next-generation route optimization using quantum-inspired algorithms, machine learning, and genetic algorithms",
      description:
        "QIRO leverages quantum computing principles to explore exponentially more route combinations, delivering optimal solutions faster than traditional methods.",
      algorithms: {
        quantum: "Quantum-Inspired",
        ml: "Machine Learning",
        genetic: "Genetic Algorithm",
        traditional: "Traditional",
      },
      metrics: {
        distance: "Distance Saved",
        time: "Time Saved",
        cost: "Cost Reduction",
        efficiency: "Efficiency Gain",
      },
    },
    ar: {
      title: "تحسين المسار المستوحى من الكم (QIRO)",
      subtitle:
        "تحسين المسار من الجيل القادم باستخدام الخوارزميات المستوحاة من الكم والتعلم الآلي والخوارزميات الجينية",
      description:
        "يستفيد QIRO من مبادئ الحوسبة الكمية لاستكشاف تركيبات المسارات بشكل أسي، مما يوفر حلولاً مثلى أسرع من الطرق التقليدية.",
      algorithms: {
        quantum: "مستوحى من الكم",
        ml: "التعلم الآلي",
        genetic: "الخوارزمية الجينية",
        traditional: "تقليدي",
      },
      metrics: {
        distance: "المسافة المحفوظة",
        time: "الوقت المحفوظ",
        cost: "تقليل التكلفة",
        efficiency: "زيادة الكفاءة",
      },
    },
  };

  const t = content[language];

  // Enhanced network nodes with 3D positioning
  const nodes = [
    {
      id: "A",
      x: 100,
      y: 100,
      major: true,
      label: language === "en" ? "Warehouse" : "مستودع",
    },
    { id: "B", x: 300, y: 150, major: false, label: "B" },
    {
      id: "C",
      x: 500,
      y: 120,
      major: true,
      label: language === "en" ? "Hub" : "محور",
    },
    { id: "D", x: 200, y: 250, major: false, label: "D" },
    { id: "E", x: 400, y: 280, major: false, label: "E" },
    {
      id: "F",
      x: 600,
      y: 250,
      major: true,
      label: language === "en" ? "Destination" : "الوجهة",
    },
    { id: "G", x: 150, y: 350, major: false, label: "G" },
    { id: "H", x: 450, y: 380, major: false, label: "H" },
  ];

  const routes = {
    quantum: ["A", "B", "C", "F", "E", "D", "A"],
    ml: ["A", "D", "E", "F", "C", "B", "A"],
    genetic: ["A", "B", "D", "E", "F", "C", "A"],
    traditional: ["A", "B", "C", "F", "E", "D", "G", "H", "A"],
  };

  const [metrics, setMetrics] = useState({
    distance: 0,
    time: 0,
    cost: 0,
    efficiency: 0,
  });

  useEffect(() => {
    const algorithmMetrics = {
      quantum: { distance: 1240, time: 8.5, cost: 23, efficiency: 94 },
      ml: { distance: 1380, time: 9.2, cost: 19, efficiency: 87 },
      genetic: { distance: 1450, time: 9.8, cost: 16, efficiency: 82 },
      traditional: { distance: 1680, time: 11.5, cost: 0, efficiency: 65 },
    };

    setMetrics(algorithmMetrics[activeAlgorithm]);
    setIsAnimating(true);
    setVehiclePosition({ x: nodes[0].x, y: nodes[0].y, progress: 0 });

    // Animate vehicle along route
    const route = routes[activeAlgorithm];
    let currentIndex = 0;
    let progress = 0;

    const interval = setInterval(() => {
      if (currentIndex < route.length - 1) {
        const currentNode = nodes.find((n) => n.id === route[currentIndex]);
        const nextNode = nodes.find((n) => n.id === route[currentIndex + 1]);

        if (currentNode && nextNode) {
          progress += 0.02;
          if (progress >= 1) {
            progress = 0;
            currentIndex++;
          } else {
            const x = currentNode.x + (nextNode.x - currentNode.x) * progress;
            const y = currentNode.y + (nextNode.y - currentNode.y) * progress;
            setVehiclePosition({ x, y, progress });
          }
        } else {
          currentIndex++;
        }
      } else {
        // Reset to start
        currentIndex = 0;
        progress = 0;
        setVehiclePosition({ x: nodes[0].x, y: nodes[0].y, progress: 0 });
      }
    }, 50);

    setTimeout(() => setIsAnimating(false), 1000);

    return () => clearInterval(interval);
  }, [activeAlgorithm]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, scale }}
      className="max-w-[1400px] mx-auto px-6 py-20"
    >
      <div className="text-center mb-12">
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
          className="text-xl text-[#a0aec0] max-w-[900px] mx-auto mb-4"
        >
          {t.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-start justify-center gap-4 max-w-[900px] mx-auto bg-[#05a4ff]/6 border border-[#05a4ff]/20 rounded-xl p-6 mb-8 backdrop-blur-sm"
        >
          <span className="text-3xl">⚡</span>
          <div className="text-left">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-2">
              {language === "en" ? "How It Works" : "كيف يعمل"}
            </h3>
            <p className="text-sm text-[#cbd5e1] leading-relaxed">
              {t.description}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Algorithm Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex justify-center gap-3 flex-wrap mb-8"
      >
        {(["quantum", "ml", "genetic", "traditional"] as const).map((algo) => (
          <motion.button
            key={algo}
            onClick={() => setActiveAlgorithm(algo)}
            className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all overflow-hidden ${
              activeAlgorithm === algo
                ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                : "bg-[#05a4ff]/10 text-[#cbd5e1] border border-[#05a4ff]/30 hover:bg-[#05a4ff]/20"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">{t.algorithms[algo]}</span>
            {activeAlgorithm === algo && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#00d4a8] to-[#05a4ff]"
                layoutId="activeAlgorithm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Enhanced 3D Network Map */}
      <div className="relative h-[500px] max-w-[1200px] mx-auto bg-gradient-to-br from-[#05a4ff]/6 to-[#00d4a8]/4 rounded-2xl overflow-hidden border border-[#05a4ff]/20 mb-8 backdrop-blur-sm">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient
              id="routeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#05a4ff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#00d4a8" stopOpacity="1" />
              <stop offset="100%" stopColor="#05a4ff" stopOpacity="0.3" />
            </linearGradient>
            <filter id="nodeGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Network Edges with Animation */}
          {nodes.map((node, i) =>
            nodes.slice(i + 1).map((otherNode) => {
              const isInRoute =
                routes[activeAlgorithm].includes(node.id) &&
                routes[activeAlgorithm].includes(otherNode.id) &&
                Math.abs(
                  routes[activeAlgorithm].indexOf(node.id) -
                    routes[activeAlgorithm].indexOf(otherNode.id),
                ) === 1;

              return (
                <motion.line
                  key={`edge-${node.id}-${otherNode.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={otherNode.x}
                  y2={otherNode.y}
                  stroke={
                    isInRoute
                      ? "url(#routeGradient)"
                      : "rgba(5, 164, 255, 0.15)"
                  }
                  strokeWidth={isInRoute ? 3 : 1}
                  strokeDasharray={isInRoute ? "0" : "4,4"}
                  opacity={isInRoute ? 1 : 0.2}
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: isAnimating ? [0, 1] : 1,
                    opacity: isInRoute ? 1 : 0.2,
                  }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              );
            }),
          )}

          {/* Enhanced Network Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              {/* Glow Effect */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.major ? 15 : 10}
                fill={node.major ? "#8b5cf6" : "#05a4ff"}
                opacity="0.3"
                filter="url(#nodeGlow)"
              />
              {/* Main Node */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.major ? 12 : 8}
                fill={node.major ? "#8b5cf6" : "#05a4ff"}
                className="drop-shadow-lg cursor-pointer"
                filter="url(#nodeGlow)"
                whileHover={{ scale: 1.3, r: node.major ? 15 : 10 }}
                animate={{
                  boxShadow: node.major
                    ? "0 0 20px rgba(139, 92, 246, 0.8)"
                    : "0 0 15px rgba(5, 164, 255, 0.7)",
                }}
              />
              <text
                x={node.x}
                y={node.y - 20}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="700"
                className="pointer-events-none"
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* Enhanced Animated Vehicle */}
          <motion.g>
            <motion.circle
              cx={vehiclePosition.x}
              cy={vehiclePosition.y}
              r={10}
              fill={
                activeAlgorithm === "quantum"
                  ? "#8b5cf6"
                  : activeAlgorithm === "ml"
                    ? "#05a4ff"
                    : activeAlgorithm === "genetic"
                      ? "#10b981"
                      : "#f59e0b"
              }
              filter="url(#nodeGlow)"
              animate={{
                scale: [1, 1.3, 1],
                boxShadow: [
                  "0 0 15px rgba(139, 92, 246, 0.9)",
                  "0 0 25px rgba(139, 92, 246, 1)",
                  "0 0 15px rgba(139, 92, 246, 0.9)",
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            {/* Vehicle trail */}
            <motion.circle
              cx={vehiclePosition.x}
              cy={vehiclePosition.y}
              r={15}
              fill={
                activeAlgorithm === "quantum"
                  ? "rgba(139, 92, 246, 0.3)"
                  : activeAlgorithm === "ml"
                    ? "rgba(5, 164, 255, 0.3)"
                    : activeAlgorithm === "genetic"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)"
              }
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </motion.g>
        </svg>

        {/* Enhanced Metrics Overlay */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 right-6 flex flex-col gap-3 w-[220px] z-10"
        >
          {Object.entries(t.metrics).map(([key, label], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0a0e14]/90 backdrop-blur-md border border-[#05a4ff]/30 rounded-xl p-4 hover:border-[#05a4ff]/50 transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-xs text-[#94a3b8] mb-2">{label}</div>
              <motion.div
                className="text-xl font-extrabold text-white"
                key={metrics[key as keyof typeof metrics]}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {key === "distance"
                  ? `${metrics[key]} km`
                  : key === "time"
                    ? `${metrics[key]} hrs`
                    : key === "cost"
                      ? `${metrics[key]}%`
                      : `${metrics[key]}%`}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Enhanced Performance Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-[1200px] mx-auto"
      >
        <h3 className="text-2xl font-bold mb-6 text-center text-white">
          {language === "en"
            ? "Algorithm Performance Comparison"
            : "مقارنة أداء الخوارزميات"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["quantum", "ml", "genetic", "traditional"] as const).map(
            (algo) => {
              const algoMetrics = {
                quantum: {
                  distance: 1240,
                  time: 8.5,
                  cost: 23,
                  efficiency: 94,
                },
                ml: { distance: 1380, time: 9.2, cost: 19, efficiency: 87 },
                genetic: {
                  distance: 1450,
                  time: 9.8,
                  cost: 16,
                  efficiency: 82,
                },
                traditional: {
                  distance: 1680,
                  time: 11.5,
                  cost: 0,
                  efficiency: 65,
                },
              }[algo];

              return (
                <motion.div
                  key={algo}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className={`p-6 rounded-xl border-2 backdrop-blur-sm transition-all ${
                    activeAlgorithm === algo
                      ? "border-[#05a4ff] bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/10"
                      : "border-[#05a4ff]/20 bg-[#05a4ff]/5 hover:border-[#05a4ff]/40"
                  }`}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="text-sm font-semibold text-[#05a4ff] mb-3">
                    {t.algorithms[algo]}
                  </div>
                  <div className="text-3xl font-extrabold text-white mb-2">
                    {algoMetrics.efficiency}%
                  </div>
                  <div className="text-xs text-[#a0aec0] mb-4">
                    {language === "en" ? "Efficiency" : "الكفاءة"}
                  </div>
                  <div className="h-2 bg-[#0a0e14]/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#05a4ff] to-[#00d4a8]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${algoMetrics.efficiency}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
