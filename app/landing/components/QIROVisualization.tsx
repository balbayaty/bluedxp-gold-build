"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface QIROVisualizationProps {
  language: "en" | "ar";
}

/**
 * Quantum-Inspired Route Optimization (QIRO) Visualization
 *
 * Interactive visualization showing:
 * - Network nodes and connections
 * - Route optimization algorithms
 * - Real-time vehicle tracking
 * - Performance metrics comparison
 *
 * Aligned with BlueDXP Transportation & Logistics capabilities
 */
export default function QIROVisualization({
  language,
}: QIROVisualizationProps) {
  const [activeAlgorithm, setActiveAlgorithm] = useState<
    "quantum" | "ml" | "genetic" | "traditional"
  >("quantum");
  const [vehiclePosition, setVehiclePosition] = useState({ x: 100, y: 200 });

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

  // Network nodes (cities/warehouses)
  const nodes = [
    { id: "A", x: 100, y: 100, major: true },
    { id: "B", x: 300, y: 150, major: false },
    { id: "C", x: 500, y: 120, major: true },
    { id: "D", x: 200, y: 250, major: false },
    { id: "E", x: 400, y: 280, major: false },
    { id: "F", x: 600, y: 250, major: true },
    { id: "G", x: 150, y: 350, major: false },
    { id: "H", x: 450, y: 380, major: false },
  ];

  // Optimal route based on algorithm
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
    // Calculate metrics based on algorithm
    const algorithmMetrics = {
      quantum: { distance: 1240, time: 8.5, cost: 23, efficiency: 94 },
      ml: { distance: 1380, time: 9.2, cost: 19, efficiency: 87 },
      genetic: { distance: 1450, time: 9.8, cost: 16, efficiency: 82 },
      traditional: { distance: 1680, time: 11.5, cost: 0, efficiency: 65 },
    };

    setMetrics(algorithmMetrics[activeAlgorithm]);

    // Animate vehicle along route
    const route = routes[activeAlgorithm];
    let currentIndex = 0;
    const interval = setInterval(() => {
      const currentNode = nodes.find((n) => n.id === route[currentIndex]);
      if (currentNode) {
        setVehiclePosition({ x: currentNode.x, y: currentNode.y });
      }
      currentIndex = (currentIndex + 1) % route.length;
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAlgorithm]);

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] max-w-[900px] mx-auto mb-4">
          {t.subtitle}
        </p>
        <div className="flex items-start justify-center gap-4 max-w-[900px] mx-auto bg-[#05a4ff]/6 border border-[#05a4ff]/20 rounded-lg p-4 mb-8">
          <span className="text-2xl">⚡</span>
          <div className="text-left">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent mb-1">
              {language === "en" ? "How It Works" : "كيف يعمل"}
            </h3>
            <p className="text-sm text-[#cbd5e1]">{t.description}</p>
          </div>
        </div>
      </div>

      {/* Algorithm Controls */}
      <div className="flex justify-center gap-2 flex-wrap mb-8">
        {(["quantum", "ml", "genetic", "traditional"] as const).map((algo) => (
          <button
            key={algo}
            onClick={() => setActiveAlgorithm(algo)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeAlgorithm === algo
                ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg shadow-[#05a4ff]/25"
                : "bg-[#05a4ff]/10 text-[#cbd5e1] border border-[#05a4ff]/30 hover:bg-[#05a4ff]/20"
            }`}
          >
            {t.algorithms[algo]}
          </button>
        ))}
      </div>

      {/* Network Map */}
      <div className="relative h-[420px] max-w-[1000px] mx-auto bg-[#05a4ff]/6 rounded-xl overflow-hidden border border-[#05a4ff]/20 mb-8">
        <svg className="absolute inset-0 w-full h-full">
          {/* Network Edges */}
          {nodes.map((node, i) =>
            nodes.slice(i + 1).map((otherNode) => {
              const distance = Math.sqrt(
                Math.pow(otherNode.x - node.x, 2) +
                  Math.pow(otherNode.y - node.y, 2),
              );
              const isInRoute =
                routes[activeAlgorithm].includes(node.id) &&
                routes[activeAlgorithm].includes(otherNode.id) &&
                Math.abs(
                  routes[activeAlgorithm].indexOf(node.id) -
                    routes[activeAlgorithm].indexOf(otherNode.id),
                ) === 1;

              return (
                <line
                  key={`edge-${node.id}-${otherNode.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={otherNode.x}
                  y2={otherNode.y}
                  stroke={isInRoute ? "#00d4a8" : "rgba(5, 164, 255, 0.25)"}
                  strokeWidth={isInRoute ? 3 : 2}
                  strokeDasharray={isInRoute ? "0" : "3,3"}
                  opacity={isInRoute ? 1 : 0.3}
                />
              );
            }),
          )}

          {/* Network Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.major ? 10 : 7}
                fill={node.major ? "#8b5cf6" : "#05a4ff"}
                className="drop-shadow-lg"
                style={{
                  filter: node.major
                    ? "drop-shadow(0 0 16px rgba(139, 92, 246, 0.8))"
                    : "drop-shadow(0 0 12px rgba(5, 164, 255, 0.7))",
                }}
              />
              <text
                x={node.x}
                y={node.y - 15}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="700"
              >
                {node.id}
              </text>
            </g>
          ))}

          {/* Vehicle */}
          <motion.circle
            cx={vehiclePosition.x}
            cy={vehiclePosition.y}
            r={8}
            fill={
              activeAlgorithm === "quantum"
                ? "#8b5cf6"
                : activeAlgorithm === "ml"
                  ? "#05a4ff"
                  : activeAlgorithm === "genetic"
                    ? "#10b981"
                    : "#f59e0b"
            }
            className="drop-shadow-lg z-10"
            style={{
              filter:
                activeAlgorithm === "quantum"
                  ? "drop-shadow(0 0 12px rgba(139, 92, 246, 0.9))"
                  : "drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))",
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        </svg>

        {/* Metrics Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 w-[190px] z-10">
          {Object.entries(t.metrics).map(([key, label]) => (
            <motion.div
              key={key}
              className="bg-[#0a0e14]/80 border border-[#05a4ff]/30 rounded-lg p-2"
              animate={{
                borderColor:
                  activeAlgorithm === "quantum"
                    ? "rgba(139, 92, 246, 0.5)"
                    : "rgba(5, 164, 255, 0.3)",
              }}
            >
              <div className="text-xs text-[#94a3b8] mb-1">{label}</div>
              <div className="text-base font-extrabold text-white">
                {key === "distance"
                  ? `${metrics[key]} km`
                  : key === "time"
                    ? `${metrics[key]} hrs`
                    : key === "cost"
                      ? `${metrics[key]}%`
                      : `${metrics[key]}%`}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="max-w-[1000px] mx-auto">
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
                  className={`p-4 rounded-lg border-2 ${
                    activeAlgorithm === algo
                      ? "border-[#05a4ff] bg-[#05a4ff]/10"
                      : "border-[#05a4ff]/20 bg-[#05a4ff]/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-sm font-semibold text-[#05a4ff] mb-2">
                    {t.algorithms[algo]}
                  </div>
                  <div className="text-2xl font-extrabold text-white mb-1">
                    {algoMetrics.efficiency}%
                  </div>
                  <div className="text-xs text-[#a0aec0]">
                    {language === "en" ? "Efficiency" : "الكفاءة"}
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
