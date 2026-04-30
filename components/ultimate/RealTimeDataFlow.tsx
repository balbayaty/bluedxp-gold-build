"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface RealTimeDataFlowProps {
  language: "en" | "ar";
}

interface DataPacket {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  label: string;
}

export default function RealTimeDataFlow({ language }: RealTimeDataFlowProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);

  const nodes = [
    {
      x: 10,
      y: 50,
      label: language === "en" ? "Source" : "المصدر",
      color: "#05a4ff",
    },
    {
      x: 35,
      y: 25,
      label: language === "en" ? "Processing" : "المعالجة",
      color: "#00d4a8",
    },
    {
      x: 35,
      y: 75,
      label: language === "en" ? "Validation" : "التحقق",
      color: "#8b5cf6",
    },
    {
      x: 65,
      y: 50,
      label: language === "en" ? "AI Engine" : "محرك الذكاء",
      color: "#f59e0b",
    },
    {
      x: 90,
      y: 50,
      label: language === "en" ? "Output" : "المخرج",
      color: "#10b981",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPackets((prev) => {
        const updated = prev
          .map((packet) => ({
            ...packet,
            x: packet.x + (packet.targetX - packet.x) * 0.1,
            y: packet.y + (packet.targetY - packet.y) * 0.1,
          }))
          .filter((p) => Math.abs(p.x - p.targetX) > 0.5);

        if (prev.length < 12) {
          const colors = ["#05a4ff", "#00d4a8", "#8b5cf6", "#f59e0b"];
          updated.push({
            id: Date.now(),
            x: nodes[0].x,
            y: nodes[0].y,
            targetX: nodes[Math.floor(Math.random() * nodes.length)].x,
            targetY: nodes[Math.floor(Math.random() * nodes.length)].y,
            color: colors[Math.floor(Math.random() * colors.length)],
            label: "Data",
          });
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#00d4a8] to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Real-Time Data Flow"
                : "تدفق البيانات اللحظي"}
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
          style={{ height: "600px" }}
        >
          <svg className="w-full h-full">
            {/* Nodes */}
            {nodes.map((node, index) => (
              <g key={index}>
                <motion.circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="40"
                  fill={`${node.color}40`}
                  stroke={node.color}
                  strokeWidth="3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{
                    filter: `drop-shadow(0 0 20px ${node.color})`,
                  }}
                />
                <text
                  x={`${node.x}%`}
                  y={`${node.y}%`}
                  textAnchor="middle"
                  dy=".3em"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* Data packets */}
            {dataPackets.map((packet) => (
              <motion.circle
                key={packet.id}
                cx={`${packet.x}%`}
                cy={`${packet.y}%`}
                r="8"
                fill={packet.color}
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  filter: `drop-shadow(0 0 15px ${packet.color})`,
                }}
              />
            ))}

            {/* Connection lines */}
            {[
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 3],
              [3, 4],
            ].map(([from, to], index) => (
              <motion.line
                key={index}
                x1={`${nodes[from].x}%`}
                y1={`${nodes[from].y}%`}
                x2={`${nodes[to].x}%`}
                y2={`${nodes[to].y}%`}
                stroke="rgba(5, 164, 255, 0.3)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            ))}
          </svg>

          <div className="absolute top-6 right-6 space-y-3">
            <div className="bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/60 mb-1">
                {language === "en" ? "Data Packets/sec" : "حزم البيانات/ثانية"}
              </div>
              <div className="text-2xl font-bold text-[#00d4a8]">
                {dataPackets.length * 2}
              </div>
            </div>
            <div className="bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/60 mb-1">
                {language === "en" ? "Latency" : "التأخير"}
              </div>
              <div className="text-2xl font-bold text-[#05a4ff]">12ms</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
