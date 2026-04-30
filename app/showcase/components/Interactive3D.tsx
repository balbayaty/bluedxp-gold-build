"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Interactive3D() {
  const [hoveredRack, setHoveredRack] = useState<number | null>(null);

  const racks = [
    { id: 1, color: "#06b6d4", label: "Zone A", material: "Material A" },
    { id: 2, color: "#8b5cf6", label: "Zone B", material: "Material B" },
    { id: 3, color: "#10b981", label: "Zone C", material: "Material C" },
    { id: 4, color: "#f59e0b", label: "Zone D", material: "Material D" },
    { id: 5, color: "#ef4444", label: "Zone E", material: "Material E" },
    { id: 6, color: "#06b6d4", label: "Zone F", material: "Material F" },
  ];

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
              Interactive 3D Warehouse
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Explore your warehouse in immersive 3D
          </p>
        </motion.div>

        <div className="h-[600px] md:h-[800px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 relative">
          {/* Warehouse Floor Grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            ></div>
          </div>

          {/* Warehouse Layout */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-3 gap-8 md:gap-12">
              {racks.map((rack, index) => {
                const isHovered = hoveredRack === rack.id;
                const row = Math.floor(index / 3);
                const col = index % 3;

                return (
                  <motion.div
                    key={rack.id}
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{
                      opacity: 1,
                      scale: isHovered ? 1.1 : 1,
                      y: isHovered ? -10 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    onHoverStart={() => setHoveredRack(rack.id)}
                    onHoverEnd={() => setHoveredRack(null)}
                    className="relative"
                  >
                    {/* Storage Rack */}
                    <div
                      className="relative w-24 h-32 md:w-32 md:h-40"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(15deg) rotateY(${col * 5 - 5}deg)`,
                      }}
                    >
                      {/* Rack Front */}
                      <div
                        className="absolute inset-0 rounded-lg border-2 flex flex-col items-center justify-center backdrop-blur-xl transition-all"
                        style={{
                          backgroundColor: `${rack.color}30`,
                          borderColor: rack.color,
                          transform: "translateZ(20px)",
                          boxShadow: isHovered
                            ? `0 0 30px ${rack.color}80`
                            : `0 0 15px ${rack.color}40`,
                        }}
                      >
                        <div className="text-xs md:text-sm font-bold text-white mb-1">
                          {rack.label}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          {rack.material}
                        </div>
                      </div>

                      {/* Rack Top */}
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundColor: `${rack.color}20`,
                          transform: "rotateX(90deg) translateZ(20px)",
                        }}
                      ></div>

                      {/* Rack Sides */}
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundColor: `${rack.color}15`,
                          transform: "rotateY(90deg) translateZ(10px)",
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundColor: `${rack.color}15`,
                          transform: "rotateY(-90deg) translateZ(10px)",
                        }}
                      ></div>

                      {/* Material Boxes on Shelves */}
                      {[0, 1, 2].map((shelf) => (
                        <motion.div
                          key={shelf}
                          animate={{
                            y: isHovered ? -2 : 0,
                          }}
                          className="absolute left-1/2 -translate-x-1/2"
                          style={{
                            bottom: `${shelf * 30 + 10}px`,
                            width: "60%",
                            height: "20px",
                            backgroundColor: rack.color,
                            borderRadius: "4px",
                            opacity: 0.8,
                            transform: "translateZ(15px)",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Floating Labels */}
          {hoveredRack && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2"
            >
              <div className="text-white font-semibold">
                {racks.find((r) => r.id === hoveredRack)?.label}
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
              <i className="ri-mouse-line"></i>
              <span>Hover to explore</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
              <i className="ri-eye-line"></i>
              <span>3D visualization</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
              <i className="ri-information-line"></i>
              <span>Interactive racks</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
