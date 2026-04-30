"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ComplianceMatrixProps {
  language: "en" | "ar";
}

export default function ComplianceMatrix({ language }: ComplianceMatrixProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const complianceData = [
    { subject: language === "en" ? "Quality" : "الجودة", A: 99, fullMark: 100 },
    { subject: language === "en" ? "Safety" : "السلامة", A: 98, fullMark: 100 },
    {
      subject: language === "en" ? "Environmental" : "البيئة",
      A: 96,
      fullMark: 100,
    },
    { subject: language === "en" ? "Health" : "الصحة", A: 97, fullMark: 100 },
    { subject: language === "en" ? "Security" : "الأمن", A: 99, fullMark: 100 },
    {
      subject: language === "en" ? "Data Privacy" : "خصوصية البيانات",
      A: 100,
      fullMark: 100,
    },
  ];

  const standards = [
    {
      name: "ISO 9001",
      status: "Compliant",
      color: "#00d4a8",
      icon: "ri-checkbox-circle-fill",
    },
    {
      name: "ISO 14001",
      status: "Compliant",
      color: "#00d4a8",
      icon: "ri-checkbox-circle-fill",
    },
    {
      name: "ISO 45001",
      status: "Compliant",
      color: "#00d4a8",
      icon: "ri-checkbox-circle-fill",
    },
    {
      name: "ISO 27001",
      status: "Compliant",
      color: "#00d4a8",
      icon: "ri-checkbox-circle-fill",
    },
    { name: "WCAG 2.1", status: "AAA", color: "#05a4ff", icon: "ri-star-fill" },
    {
      name: "GDPR",
      status: "Compliant",
      color: "#00d4a8",
      icon: "ri-checkbox-circle-fill",
    },
    {
      name: "SOC 2",
      status: "Type II",
      color: "#8b5cf6",
      icon: "ri-shield-star-fill",
    },
    {
      name: "Saudi Compliance",
      status: "Certified",
      color: "#10b981",
      icon: "ri-shield-check-fill",
    },
  ];

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-b from-transparent to-[#00d4a8]/5 relative"
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
              ? "Compliance & Standards"
              : "الامتثال والمعايير"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#00d4a8] to-[#10b981] bg-clip-text text-transparent">
              {language === "en"
                ? "Enterprise Compliance Matrix"
                : "مصفوفة امتثال المؤسسة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-8 text-center">
              {language === "en" ? "Compliance Radar" : "رادار الامتثال"}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={complianceData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="rgba(255,255,255,0.7)"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.5)"
                />
                <Radar
                  name="Compliance Score"
                  dataKey="A"
                  stroke="#00d4a8"
                  fill="#00d4a8"
                  fillOpacity={0.6}
                  strokeWidth={3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(0, 212, 168, 0.5)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-8">
              {language === "en"
                ? "Certifications & Standards"
                : "الشهادات والمعايير"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {standards.map((standard, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-[#00d4a8]/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <i
                      className={`${standard.icon} text-2xl`}
                      style={{ color: standard.color }}
                    ></i>
                    <span className="font-bold text-white">
                      {standard.name}
                    </span>
                  </div>
                  <div
                    className="text-xs px-3 py-1 rounded-full inline-block"
                    style={{
                      backgroundColor: `${standard.color}30`,
                      color: standard.color,
                    }}
                  >
                    {standard.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
