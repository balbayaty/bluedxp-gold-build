"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface ProcessMining3DProps {
  language: "en" | "ar";
}

export default function ProcessMining3D({ language }: ProcessMining3DProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeView, setActiveView] = useState<
    "standard" | "compliance" | "bottlenecks" | "digital-twin"
  >("standard");
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const views = {
    standard: language === "en" ? "Standard Flow" : "التدفق القياسي",
    compliance: language === "en" ? "Compliance Focus" : "تركيز الامتثال",
    bottlenecks: language === "en" ? "Bottleneck Analysis" : "تحليل الاختناقات",
    "digital-twin": language === "en" ? "Digital Twin" : "التوأم الرقمي",
  };

  const processNodes = [
    {
      id: 1,
      label: language === "en" ? "Order Received" : "تم استلام الطلب",
      x: 10,
      y: 15,
      color: "#05a4ff",
    },
    {
      id: 2,
      label: language === "en" ? "Resource Allocation" : "تخصيص الموارد",
      x: 30,
      y: 35,
      color: "#00d4a8",
    },
    {
      id: 3,
      label: language === "en" ? "Route Planning" : "تخطيط المسار",
      x: 50,
      y: 15,
      color: "#8b5cf6",
    },
    {
      id: 4,
      label: language === "en" ? "Pickup" : "الاستلام",
      x: 70,
      y: 35,
      color: "#f59e0b",
    },
    {
      id: 5,
      label: language === "en" ? "Delivery" : "التسليم",
      x: 90,
      y: 15,
      color: "#10b981",
    },
    {
      id: 6,
      label: language === "en" ? "Quality Check" : "فحص الجودة",
      x: 70,
      y: 65,
      color: "#ef4444",
    },
  ];

  const connections = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 4, to: 6 },
    { from: 6, to: 5 },
  ];

  return (
    <section
      ref={ref}
      id="intelligence"
      className="py-24 bg-gradient-to-b from-transparent to-[#05a4ff]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en"
              ? "Process Mining & Compliance Intelligence"
              : "التنقيب في العمليات وذكاء الامتثال"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#8b5cf6] to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Advanced Process Visualization"
                : "تصور العمليات المتقدم"}
            </span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {Object.entries(views).map(([key, label]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView(key as typeof activeView)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeView === key
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl shadow-[#8b5cf6]/40"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <motion.div
          key={activeView}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
          style={{ height: "600px" }}
        >
          <div className="relative w-full h-full">
            {processNodes.map((node, index) => (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: animationStep === index ? 1.3 : 1,
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className="relative px-6 py-4 rounded-2xl border-2 font-bold text-white text-center shadow-2xl backdrop-blur-xl"
                  style={{
                    backgroundColor: `${node.color}40`,
                    borderColor: node.color,
                    boxShadow:
                      animationStep === index
                        ? `0 0 40px ${node.color}80`
                        : `0 10px 30px ${node.color}40`,
                  }}
                >
                  {node.label}
                </div>
              </motion.div>
            ))}

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((conn, index) => {
                const fromNode = processNodes.find((n) => n.id === conn.from);
                const toNode = processNodes.find((n) => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const isActive =
                  animationStep === conn.from - 1 ||
                  animationStep === conn.to - 1;

                return (
                  <motion.line
                    key={index}
                    x1={`${fromNode.x}%`}
                    y1={`${fromNode.y}%`}
                    x2={`${toNode.x}%`}
                    y2={`${toNode.y}%`}
                    stroke={isActive ? "#00d4a8" : "rgba(5, 164, 255, 0.3)"}
                    strokeWidth={isActive ? 4 : 2}
                    strokeDasharray={isActive ? "0" : "5,5"}
                    animate={{
                      strokeDashoffset: isActive ? 0 : [0, -10],
                    }}
                    transition={{
                      duration: isActive ? 0 : 2,
                      repeat: isActive ? 0 : Infinity,
                      ease: "linear",
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
