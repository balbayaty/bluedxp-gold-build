"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface EnhancedHazalyzeShowcaseProps {
  language: "en" | "ar";
}

/**
 * Enhanced Hazalyze Showcase with graphs, charts, and advanced graphics
 */
export default function EnhancedHazalyzeShowcase({
  language,
}: EnhancedHazalyzeShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [chartData, setChartData] = useState({
    aiQueries: Array.from(
      { length: 12 },
      () => Math.floor(Math.random() * 1000) + 500,
    ),
    performance: Array.from(
      { length: 7 },
      () => Math.floor(Math.random() * 30) + 70,
    ),
    usage: [45, 62, 78, 85, 92, 88, 95],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData({
        aiQueries: Array.from(
          { length: 12 },
          () => Math.floor(Math.random() * 1000) + 500,
        ),
        performance: Array.from(
          { length: 7 },
          () => Math.floor(Math.random() * 30) + 70,
        ),
        usage: chartData.usage.map((val) =>
          Math.max(70, Math.min(100, val + (Math.random() - 0.5) * 5)),
        ),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [chartData.usage]);

  const content = {
    en: {
      badge: "AI & Intelligence Core",
      title: "Hazalyze: The Intelligent Brain of BlueDXP",
      subtitle:
        "Hazalyze is the AI-powered intelligence module that enables autonomous decision-making, real-time compliance monitoring, and predictive optimization across the entire BlueDXP platform.",
      features: [
        {
          id: "copilot",
          title: "AI Copilot",
          icon: "🤖",
          description:
            "Conversational AI assistant that understands context, provides intelligent recommendations, and enables natural language interaction with the platform.",
          capabilities: [
            "Natural language queries",
            "Context-aware responses",
            "Multi-modal understanding",
            "Real-time assistance",
          ],
          stats: { queries: "12.4K", accuracy: "94%", responseTime: "0.8s" },
        },
        {
          id: "vision",
          title: "AI Vision Intelligence",
          icon: "👁️",
          description:
            "Multi-modal vision analysis for images, video, and live streaming. Specialized models for chemical, manufacturing, logistics, and healthcare industries.",
          capabilities: [
            "Image & video analysis",
            "Live stream processing",
            "Industry specializations",
            "Anomaly detection",
          ],
          stats: { analyses: "8.7K", accuracy: "96%", avgTime: "2.1s" },
        },
        {
          id: "orchestration",
          title: "Intelligent Orchestration",
          icon: "🎯",
          description:
            "Process mining, root cause analysis, predictive analytics, and autonomous compliance monitoring powered by AI reasoning.",
          capabilities: [
            "Process discovery",
            "Root cause analysis",
            "Predictive analytics",
            "Autonomous compliance",
          ],
          stats: { processes: "342", efficiency: "+87%", compliance: "98%" },
        },
        {
          id: "agents",
          title: "Agent Orchestration",
          icon: "🤝",
          description:
            "Specialized AI agents for different tasks, with memory, learning capabilities, and human-AI collaboration workflows.",
          capabilities: [
            "Specialized agents",
            "Memory & learning",
            "Human-AI collaboration",
            "Workflow automation",
          ],
          stats: { agents: "24", tasks: "1.2K", success: "92%" },
        },
        {
          id: "knowledge",
          title: "Knowledge Base",
          icon: "📚",
          description:
            "Self-learning knowledge base with vector embeddings, enabling semantic search and continuous learning from operational data.",
          capabilities: [
            "Vector embeddings",
            "Semantic search",
            "Self-learning",
            "Tenant isolation",
          ],
          stats: { documents: "45K", queries: "3.4K", relevance: "91%" },
        },
        {
          id: "insights",
          title: "Automated Insights",
          icon: "💡",
          description:
            "AI-generated insights and recommendations that help optimize operations, reduce costs, and improve compliance.",
          capabilities: [
            "Automated insights",
            "Performance alerts",
            "Optimization recommendations",
            "Predictive alerts",
          ],
          stats: { insights: "156", impact: "+$2.4M", adoption: "89%" },
        },
      ],
    },
    ar: {
      badge: "نواة الذكاء الاصطناعي",
      title: "هازالايز: العقل الذكي لمنصة BlueDXP",
      subtitle:
        "هازالايز هو وحدة الذكاء المدعومة بالذكاء الاصطناعي التي تمكن من اتخاذ القرارات المستقلة ومراقبة الامتثال في الوقت الفعلي والتحسين التنبؤي عبر منصة BlueDXP بأكملها.",
      features: [
        {
          id: "copilot",
          title: "مساعد الذكاء الاصطناعي",
          icon: "🤖",
          description:
            "مساعد ذكاء اصطناعي محادث يفهم السياق ويقدم توصيات ذكية ويمكن التفاعل باللغة الطبيعية مع المنصة.",
          capabilities: [
            "استعلامات اللغة الطبيعية",
            "استجابات واعية بالسياق",
            "فهم متعدد الوسائط",
            "مساعدة في الوقت الفعلي",
          ],
          stats: { queries: "12.4K", accuracy: "94%", responseTime: "0.8s" },
        },
        {
          id: "vision",
          title: "ذكاء الرؤية بالذكاء الاصطناعي",
          icon: "👁️",
          description:
            "تحليل رؤية متعدد الوسائط للصور والفيديو والبث المباشر. نماذج متخصصة للصناعات الكيميائية والتصنيع والخدمات اللوجستية والرعاية الصحية.",
          capabilities: [
            "تحليل الصور والفيديو",
            "معالجة البث المباشر",
            "التخصصات الصناعية",
            "كشف الشذوذ",
          ],
          stats: { analyses: "8.7K", accuracy: "96%", avgTime: "2.1s" },
        },
        {
          id: "orchestration",
          title: "التنسيق الذكي",
          icon: "🎯",
          description:
            "استخراج العمليات وتحليل السبب الجذري والتحليلات التنبؤية ومراقبة الامتثال المستقلة المدعومة بالاستدلال الذكي.",
          capabilities: [
            "اكتشاف العملية",
            "تحليل السبب الجذري",
            "التحليلات التنبؤية",
            "الامتثال المستقل",
          ],
          stats: { processes: "342", efficiency: "+87%", compliance: "98%" },
        },
        {
          id: "agents",
          title: "تنسيق الوكلاء",
          icon: "🤝",
          description:
            "وكلاء ذكاء اصطناعي متخصصون لمهام مختلفة، مع الذاكرة وقدرات التعلم وسير عمل التعاون بين الإنسان والذكاء الاصطناعي.",
          capabilities: [
            "وكلاء متخصصون",
            "الذاكرة والتعلم",
            "التعاون بين الإنسان والذكاء الاصطناعي",
            "أتمتة سير العمل",
          ],
          stats: { agents: "24", tasks: "1.2K", success: "92%" },
        },
        {
          id: "knowledge",
          title: "قاعدة المعرفة",
          icon: "📚",
          description:
            "قاعدة معرفة ذاتية التعلم مع تضمينات متجهة، مما يتيح البحث الدلالي والتعلم المستمر من البيانات التشغيلية.",
          capabilities: [
            "تضمينات متجهة",
            "البحث الدلالي",
            "التعلم الذاتي",
            "عزل المستأجر",
          ],
          stats: { documents: "45K", queries: "3.4K", relevance: "91%" },
        },
        {
          id: "insights",
          title: "الرؤى الآلية",
          icon: "💡",
          description:
            "رؤى وتوصيات مولدة بالذكاء الاصطناعي تساعد في تحسين العمليات وتقليل التكاليف وتحسين الامتثال.",
          capabilities: [
            "رؤى آلية",
            "تنبيهات الأداء",
            "توصيات التحسين",
            "تنبيهات تنبؤية",
          ],
          stats: { insights: "156", impact: "+$2.4M", adoption: "89%" },
        },
      ],
    },
  };

  const t = content[language];

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4"
        >
          {t.badge}
        </motion.div>
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
          className="text-xl text-[#a0aec0] max-w-[900px] mx-auto leading-relaxed"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Performance Overview Graph */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-8 backdrop-blur-sm"
      >
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          {language === "en"
            ? "AI Performance Overview"
            : "نظرة عامة على أداء الذكاء الاصطناعي"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Queries Chart */}
          <div className="bg-[#0a0e14]/50 rounded-xl p-6 border border-[#05a4ff]/20">
            <div className="text-sm text-[#a0aec0] mb-4">
              {language === "en"
                ? "AI Queries (Last 12 Hours)"
                : "استعلامات الذكاء الاصطناعي (آخر 12 ساعة)"}
            </div>
            <div className="h-32 flex items-end justify-between gap-1">
              {chartData.aiQueries.map((value, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-[#05a4ff] to-[#00d4a8] rounded-t"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(value / 1500) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ opacity: 0.8 }}
                />
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-[#05a4ff]">
                {chartData.aiQueries
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString()}
              </div>
              <div className="text-xs text-[#a0aec0]">
                {language === "en" ? "Total Queries" : "إجمالي الاستعلامات"}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-[#0a0e14]/50 rounded-xl p-6 border border-[#05a4ff]/20">
            <div className="text-sm text-[#a0aec0] mb-4">
              {language === "en" ? "Performance Metrics" : "مقاييس الأداء"}
            </div>
            <div className="h-32 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-32 h-32">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="rgba(5, 164, 255, 0.1)"
                  strokeWidth="20"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="url(#performanceGradient)"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - 0.87) }}
                  transition={{ duration: 1 }}
                />
                <defs>
                  <linearGradient
                    id="performanceGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#05a4ff" />
                    <stop offset="100%" stopColor="#00d4a8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-bold text-white">87%</div>
                <div className="text-xs text-[#a0aec0]">
                  {language === "en" ? "Overall" : "الإجمالي"}
                </div>
              </div>
            </div>
          </div>

          {/* Usage Trend */}
          <div className="bg-[#0a0e14]/50 rounded-xl p-6 border border-[#05a4ff]/20">
            <div className="text-sm text-[#a0aec0] mb-4">
              {language === "en"
                ? "Usage Trend (7 Days)"
                : "اتجاه الاستخدام (7 أيام)"}
            </div>
            <div className="h-32 flex items-end justify-between gap-1">
              {chartData.usage.map((value, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-[#00d4a8] to-[#05a4ff] rounded-t relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ opacity: 0.8 }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#00d4a8] font-semibold">
                    {value}%
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-[#00d4a8]">
                {Math.round(
                  chartData.usage.reduce((a, b) => a + b, 0) /
                    chartData.usage.length,
                )}
                %
              </div>
              <div className="text-xs text-[#a0aec0]">
                {language === "en" ? "Average Usage" : "متوسط الاستخدام"}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {t.features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`bg-gradient-to-br from-[#05a4ff]/8 to-[#05a4ff]/3 border border-[#05a4ff]/15 rounded-xl p-6 cursor-pointer transition-all ${
              activeFeature === feature.id
                ? "border-[#05a4ff]/40 bg-gradient-to-br from-[#05a4ff]/12 to-[#05a4ff]/6 scale-105"
                : "hover:border-[#05a4ff]/30 hover:bg-gradient-to-br hover:from-[#05a4ff]/10 hover:to-[#05a4ff]/5"
            }`}
            onClick={() =>
              setActiveFeature(activeFeature === feature.id ? null : feature.id)
            }
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{feature.icon}</div>
              <div className="text-right">
                {Object.entries(feature.stats).map(([key, value]) => (
                  <div key={key} className="text-xs text-[#a0aec0]">
                    <span className="text-[#00d4a8] font-semibold">
                      {value}
                    </span>{" "}
                    {key}
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#05a4ff] mb-3">
              {feature.title}
            </h3>
            <p className="text-[#cbd5e1] text-sm mb-4 leading-relaxed">
              {feature.description}
            </p>

            {activeFeature === feature.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-[#05a4ff]/20"
              >
                <ul className="space-y-2">
                  {feature.capabilities.map((capability, capIndex) => (
                    <li
                      key={capIndex}
                      className="text-sm text-[#a0aec0] flex items-start gap-2"
                    >
                      <span className="text-[#00d4a8] mt-1">✓</span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Integration Note with Graph */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-[#00d4a8]/8 to-[#05a4ff]/5 border border-[#00d4a8]/20 rounded-xl p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {language === "en" ? "Seamlessly Integrated" : "متكامل بسلاسة"}
            </h3>
            <p className="text-[#cbd5e1] mb-6">
              {language === "en"
                ? "Hazalyze powers intelligence across all BlueDXP modules - WMS, TMS, Compliance, and more. Every module benefits from AI reasoning, vision intelligence, and automated insights."
                : "هازالايز يمد الذكاء عبر جميع وحدات BlueDXP - WMS و TMS والامتثال والمزيد. كل وحدة تستفيد من الاستدلال بالذكاء الاصطناعي وذكاء الرؤية والرؤى الآلية."}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {["WMS", "TMS", "Compliance"].map((module) => (
                <div key={module} className="text-center">
                  <div className="text-2xl font-bold text-[#00d4a8]">98%</div>
                  <div className="text-xs text-[#a0aec0]">{module}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0e14]/50 rounded-xl p-6 border border-[#05a4ff]/20">
            <div className="text-sm text-[#a0aec0] mb-4 text-center">
              {language === "en"
                ? "Module Integration Status"
                : "حالة تكامل الوحدة"}
            </div>
            <div className="space-y-3">
              {["WMS", "TMS", "Compliance", "ISO-IMS", "MSDS"].map(
                (module, index) => (
                  <div key={module}>
                    <div className="flex justify-between text-xs text-[#a0aec0] mb-1">
                      <span>{module}</span>
                      <span className="text-[#00d4a8]">98%</span>
                    </div>
                    <div className="h-2 bg-[#0a0e14] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#05a4ff] to-[#00d4a8]"
                        initial={{ width: 0 }}
                        whileInView={{ width: "98%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
