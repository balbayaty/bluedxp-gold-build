"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface System {
  name: string;
  color: string;
  status: "ONLINE" | "OFFLINE";
  description: string;
}

export default function SystemOrchestration3D() {
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);

  const systems: System[] = [
    {
      name: "WMS",
      color: "#06b6d4",
      status: "ONLINE",
      description:
        "Complete warehouse management with real-time tracking, optimization, and analytics.",
    },
    {
      name: "Hazalyze",
      color: "#8b5cf6",
      status: "ONLINE",
      description:
        "Intelligent chemical safety platform with compliance monitoring and risk management.",
    },
    {
      name: "AI Vision",
      color: "#10b981",
      status: "ONLINE",
      description:
        "Advanced computer vision for safety compliance, quality checks, and automation.",
    },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Unified System Architecture
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af] max-w-3xl mx-auto">
            Three powerful systems working in perfect harmony. Real-time
            integration, intelligent orchestration, and seamless data flow.
          </p>
        </motion.div>

        {/* 3D CSS Visualization */}
        <div className="h-[600px] md:h-[800px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 relative perspective-1000">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                  radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
                `,
                }}
              ></div>
            </div>

            {/* System Nodes with CSS 3D */}
            <div className="relative w-full h-full flex items-center justify-center gap-12 md:gap-20">
              {systems.map((system, index) => {
                const isHovered = hoveredSystem === system.name;
                const position = index === 0 ? -1 : index === 1 ? 0 : 1;

                return (
                  <motion.div
                    key={system.name}
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{
                      opacity: 1,
                      scale: isHovered ? 1.15 : 1,
                      y: isHovered ? -20 : 0,
                      rotateY: position * 15,
                    }}
                    transition={{ duration: 0.5 }}
                    onHoverStart={() => setHoveredSystem(system.name)}
                    onHoverEnd={() => setHoveredSystem(null)}
                    className="relative"
                    style={{ perspective: "1000px" }}
                  >
                    {/* System Cube */}
                    <div
                      className="relative w-32 h-32 md:w-40 md:h-40"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateY(${position * 20}deg) rotateX(10deg)`,
                      }}
                    >
                      {/* Front Face */}
                      <div
                        className="absolute inset-0 rounded-xl border-2 flex items-center justify-center backdrop-blur-xl transition-all"
                        style={{
                          backgroundColor: `${system.color}20`,
                          borderColor: system.color,
                          transform: "translateZ(40px)",
                          boxShadow: isHovered
                            ? `0 0 40px ${system.color}80`
                            : `0 0 20px ${system.color}40`,
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {system.name}
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-xs text-[#9ca3af]">
                              {system.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Face */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: `${system.color}30`,
                          transform: "rotateX(90deg) translateZ(40px)",
                        }}
                      ></div>

                      {/* Right Face */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: `${system.color}20`,
                          transform: "rotateY(90deg) translateZ(40px)",
                        }}
                      ></div>

                      {/* Left Face */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: `${system.color}20`,
                          transform: "rotateY(-90deg) translateZ(40px)",
                        }}
                      ></div>

                      {/* Bottom Face */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: `${system.color}30`,
                          transform: "rotateX(-90deg) translateZ(40px)",
                        }}
                      ></div>

                      {/* Back Face */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: `${system.color}10`,
                          transform: "translateZ(-40px)",
                        }}
                      ></div>
                    </div>

                    {/* Connection Lines */}
                    {index < systems.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                        className="absolute top-1/2 left-full w-12 md:w-20 h-0.5"
                        style={{
                          background: `linear-gradient(to right, ${system.color}, ${systems[index + 1].color})`,
                          transform: "translateY(-50%)",
                        }}
                      >
                        {/* Animated particles along the line */}
                        <motion.div
                          animate={{ x: ["0%", "100%"] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute top-1/2 w-2 h-2 rounded-full -translate-y-1/2"
                          style={{ backgroundColor: system.color }}
                        ></motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Floating Data Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-cyan-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* System Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {systems.map((system, index) => (
            <motion.div
              key={system.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${system.color}20` }}
                >
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: system.color }}
                  ></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {system.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm text-[#9ca3af]">Online</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#9ca3af]">{system.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
