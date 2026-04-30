"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Innovation3DProps {
  language: "en" | "ar";
}

export default function Innovation3D({ language }: Innovation3DProps) {
  const isArabic = language === "ar";
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <section
      id="interactive"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic
              ? "تجربة تفاعلية ثلاثية الأبعاد"
              : "Interactive 3D Experience"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "استكشف المنصة بطريقة تفاعلية ثلاثية الأبعاد"
              : "Explore the platform in an interactive 3D environment"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 h-64 flex items-center justify-center relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 transition-opacity ${hovered === i ? "opacity-100" : "opacity-0"}`}
              />
              <div className="relative z-10 text-center">
                <div className="text-4xl mb-4">{isArabic ? "🎯" : "🎯"}</div>
                <div className="text-white font-semibold">
                  {isArabic ? "ميزة تفاعلية" : "Interactive Feature"}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
