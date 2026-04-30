"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface Interactive3DNetworkProps {
  language: "en" | "ar";
}

export default function Interactive3DNetwork({
  language,
}: Interactive3DNetworkProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes = [
    {
      id: 0,
      x: 50,
      y: 50,
      z: 100,
      color: "#05a4ff",
      label: "Core",
      name: language === "en" ? "Core Intelligence" : "الذكاء الأساسي",
      size: 80,
    },
    {
      id: 1,
      x: 70,
      y: 30,
      z: 120,
      color: "#00d4a8",
      label: "WMS",
      name: language === "en" ? "Warehouse Management" : "إدارة المستودعات",
      size: 60,
    },
    {
      id: 2,
      x: 30,
      y: 30,
      z: 80,
      color: "#8b5cf6",
      label: "TMS",
      name: language === "en" ? "Transportation" : "النقل",
      size: 60,
    },
    {
      id: 3,
      x: 65,
      y: 70,
      z: 110,
      color: "#f59e0b",
      label: "QMS",
      name: language === "en" ? "Quality Management" : "إدارة الجودة",
      size: 60,
    },
    {
      id: 4,
      x: 35,
      y: 70,
      z: 90,
      color: "#ef4444",
      label: "ERP",
      name:
        language === "en"
          ? "Enterprise Resource Planning"
          : "تخطيط موارد المؤسسة",
      size: 60,
    },
    {
      id: 5,
      x: 50,
      y: 20,
      z: 130,
      color: "#10b981",
      label: "AI",
      name: language === "en" ? "AI Engine" : "محرك الذكاء الاصطناعي",
      size: 70,
    },
  ];

  const connections = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 0, to: 4 },
    { from: 0, to: 5 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setRotation((prev) => ({
          x: prev.x,
          y: prev.y + 0.5,
        }));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotation((prev) => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getNodePosition = (node: (typeof nodes)[0]) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    const x = node.x - 50;
    const y = node.y - 50;
    const z = node.z - 100;

    const rotatedY = y * Math.cos(radX) - z * Math.sin(radX);
    const rotatedZ1 = y * Math.sin(radX) + z * Math.cos(radX);

    const rotatedX = x * Math.cos(radY) + rotatedZ1 * Math.sin(radY);
    const rotatedZ = -x * Math.sin(radY) + rotatedZ1 * Math.cos(radY);

    const scale = 300 / (300 + rotatedZ);

    return {
      x: rotatedX * scale + 50,
      y: rotatedY * scale + 50,
      scale,
      z: rotatedZ,
    };
  };

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en"
              ? "3D System Architecture"
              : "معمارية النظام ثلاثية الأبعاد"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Interactive System Orchestration"
                : "تنسيق النظام التفاعلي"}
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            {language === "en"
              ? "Explore our integrated system architecture in interactive 3D. Click and drag to rotate, scroll to zoom."
              : "استكشف معمارية نظامنا المتكاملة في ثلاثي الأبعاد التفاعلي. انقر واسحب للدوران، مرر للتكبير."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CSS 3D Visualization */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
              style={{ height: "600px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Instructions */}
                <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-lg text-xs text-white/70">
                  {language === "en"
                    ? "Click and drag to rotate • Auto-rotating"
                    : "انقر واسحب للدوران • دوران تلقائي"}
                </div>

                <svg className="absolute inset-0 w-full h-full">
                  {/* Draw connections */}
                  {connections.map((conn, index) => {
                    const fromNode = nodes[conn.from];
                    const toNode = nodes[conn.to];
                    const fromPos = getNodePosition(fromNode);
                    const toPos = getNodePosition(toNode);

                    return (
                      <motion.line
                        key={index}
                        x1={`${fromPos.x}%`}
                        y1={`${fromPos.y}%`}
                        x2={`${toPos.x}%`}
                        y2={`${toPos.y}%`}
                        stroke="rgba(5, 164, 255, 0.4)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    );
                  })}
                </svg>

                {/* Draw nodes */}
                {nodes
                  .map((node) => ({ ...node, pos: getNodePosition(node) }))
                  .sort((a, b) => a.pos.z - b.pos.z)
                  .map((node, index) => (
                    <motion.div
                      key={node.id}
                      className="absolute"
                      style={{
                        left: `${node.pos.x}%`,
                        top: `${node.pos.y}%`,
                        transform: `translate(-50%, -50%) scale(${node.pos.scale})`,
                        zIndex: Math.round(node.pos.z + 100),
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: node.pos.scale, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        onClick={() => setActiveNode(node.id)}
                        className={`relative cursor-pointer ${activeNode === node.id ? "z-50" : ""}`}
                        style={{
                          width: `${node.size}px`,
                          height: `${node.size}px`,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-full animate-pulse"
                          style={{
                            backgroundColor: node.color,
                            opacity: activeNode === node.id ? 0.6 : 0.3,
                            filter: `blur(${activeNode === node.id ? 20 : 10}px)`,
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-full border-4 backdrop-blur-xl flex items-center justify-center font-bold text-white shadow-2xl"
                          style={{
                            backgroundColor: `${node.color}40`,
                            borderColor: node.color,
                            boxShadow: `0 0 30px ${node.color}80`,
                          }}
                        >
                          {node.label}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </div>

          {/* Node Information Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-6 text-white">
              {language === "en" ? "System Nodes" : "عقد النظام"}
            </h3>
            {nodes.map((node, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, x: 5 }}
                onClick={() => setActiveNode(index)}
                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                  activeNode === index
                    ? "bg-gradient-to-r from-white/20 to-white/10 border-2 shadow-xl"
                    : "bg-white/5 border border-white/10"
                }`}
                style={{
                  borderColor: activeNode === index ? node.color : undefined,
                  boxShadow:
                    activeNode === index
                      ? `0 10px 30px ${node.color}40`
                      : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${node.color}30` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-white">{node.name}</div>
                    <div className="text-xs text-white/60">{node.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
