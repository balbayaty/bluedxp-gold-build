"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface QuantumRouteVisualizationProps {
  language: "en" | "ar";
}

export default function QuantumRouteVisualization({
  language,
}: QuantumRouteVisualizationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeAlgo, setActiveAlgo] = useState<
    "quantum" | "ml" | "genetic" | "traditional"
  >("quantum");
  const [nodes, setNodes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    // Generate random network nodes
    const newNodes = [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      isMajor: i % 6 === 0,
    }));
    setNodes(newNodes);

    // Animate vehicles
    const interval = setInterval(() => {
      setVehicles((prev) => {
        const newVehicles = [...prev];
        if (newVehicles.length < 8) {
          const startNode =
            newNodes[Math.floor(Math.random() * newNodes.length)];
          const endNode = newNodes[Math.floor(Math.random() * newNodes.length)];
          newVehicles.push({
            id: Date.now(),
            x: startNode.x,
            y: startNode.y,
            targetX: endNode.x,
            targetY: endNode.y,
          });
        }
        return newVehicles
          .map((v) => ({
            ...v,
            x: v.x + (v.targetX - v.x) * 0.02,
            y: v.y + (v.targetY - v.y) * 0.02,
          }))
          .filter(
            (v) =>
              Math.abs(v.x - v.targetX) > 1 || Math.abs(v.y - v.targetY) > 1,
          );
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const algoInfo = {
    quantum: {
      icon: "🔮",
      title:
        language === "en"
          ? "Quantum-Inspired Algorithm"
          : "الخوارزمية المستلهمة من الكم",
      time: "0.32s",
      routes: "37,621",
      optimization: "99.7%",
      color: "#05a4ff",
    },
    ml: {
      icon: "🧠",
      title:
        language === "en"
          ? "ML-Enhanced Routing"
          : "توجيه مدعّم بالتعلّم الآلي",
      time: "0.89s",
      routes: "28,350",
      optimization: "97.2%",
      color: "#00d4a8",
    },
    genetic: {
      icon: "🧬",
      title: language === "en" ? "Genetic Algorithm" : "الخوارزمية الجينية",
      time: "2.41s",
      routes: "15,783",
      optimization: "94.5%",
      color: "#8b5cf6",
    },
    traditional: {
      icon: "📊",
      title: language === "en" ? "Traditional Algorithm" : "خوارزمية تقليدية",
      time: "8.76s",
      routes: "5,942",
      optimization: "86.3%",
      color: "#f59e0b",
    },
  };

  const currentAlgo = algoInfo[activeAlgo];

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-b from-transparent to-[#8b5cf6]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "Route Optimization" : "تحسين المسار"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#8b5cf6] to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Quantum-Inspired Route Optimization"
                : "تحسين المسارات المستلهم من الكم"}
            </span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {Object.entries(algoInfo).map(([key, info]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveAlgo(key as typeof activeAlgo)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeAlgo === key
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl shadow-[#8b5cf6]/40"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              <span>{info.icon}</span>
              {info.title}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <motion.div
              key={activeAlgo}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
              style={{ height: "600px" }}
            >
              <svg className="w-full h-full">
                {/* Network nodes */}
                {nodes.map((node) => (
                  <motion.circle
                    key={node.id}
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.isMajor ? 8 : 5}
                    fill={node.isMajor ? currentAlgo.color : "#05a4ff"}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: node.id * 0.02 }}
                    style={{
                      filter: `drop-shadow(0 0 ${node.isMajor ? 15 : 8}px ${currentAlgo.color})`,
                    }}
                  />
                ))}

                {/* Animated connections */}
                {nodes.slice(0, -1).map((node, i) => {
                  const nextNode = nodes[i + 1];
                  return (
                    <motion.line
                      key={`line-${i}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${nextNode.x}%`}
                      y2={`${nextNode.y}%`}
                      stroke={currentAlgo.color}
                      strokeWidth="2"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: i * 0.05 }}
                    />
                  );
                })}

                {/* Moving vehicles */}
                {vehicles.map((vehicle) => (
                  <motion.circle
                    key={vehicle.id}
                    cx={`${vehicle.x}%`}
                    cy={`${vehicle.y}%`}
                    r="6"
                    fill="#fff"
                    style={{
                      filter: `drop-shadow(0 0 10px ${currentAlgo.color})`,
                    }}
                  />
                ))}
              </svg>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6"
              style={{ borderColor: currentAlgo.color + "60" }}
            >
              <div className="text-4xl mb-2">{currentAlgo.icon}</div>
              <div className="text-xs text-white/60 mb-1">
                {language === "en" ? "Processing Time" : "وقت المعالجة"}
              </div>
              <div
                className="text-3xl font-bold mb-4"
                style={{ color: currentAlgo.color }}
              >
                {currentAlgo.time}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6"
              style={{ borderColor: currentAlgo.color + "60" }}
            >
              <div className="text-xs text-white/60 mb-1">
                {language === "en" ? "Routes Calculated" : "المسارات المحتسبة"}
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: currentAlgo.color }}
              >
                {currentAlgo.routes}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl p-6"
              style={{ borderColor: currentAlgo.color + "60" }}
            >
              <div className="text-xs text-white/60 mb-1">
                {language === "en" ? "Optimization Level" : "مستوى التحسين"}
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: currentAlgo.color }}
              >
                {currentAlgo.optimization}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
