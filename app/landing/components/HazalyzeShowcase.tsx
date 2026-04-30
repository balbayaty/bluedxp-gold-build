"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface HazalyzeShowcaseProps {
  language: "en" | "ar";
}

/**
 * Hazalyze AI Module Showcase
 *
 * Showcases Hazalyze as the AI & Intelligence core of BlueDXP:
 * - AI Copilot capabilities
 * - AI Vision Intelligence
 * - Intelligent Orchestration
 * - Agent Orchestration
 * - Knowledge Base
 * - Automated Insights
 */
export default function HazalyzeShowcase({ language }: HazalyzeShowcaseProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

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
        },
      ],
    },
  };

  const t = content[language];

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4">
          {t.badge}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] max-w-[900px] mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Features Grid */}
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
            <div className="text-4xl mb-4">{feature.icon}</div>
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

      {/* Integration Note */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-[#00d4a8]/8 to-[#05a4ff]/5 border border-[#00d4a8]/20 rounded-xl p-8 text-center"
      >
        <h3 className="text-2xl font-bold text-white mb-4">
          {language === "en" ? "Seamlessly Integrated" : "متكامل بسلاسة"}
        </h3>
        <p className="text-[#cbd5e1] max-w-2xl mx-auto">
          {language === "en"
            ? "Hazalyze powers intelligence across all BlueDXP modules - WMS, TMS, Compliance, and more. Every module benefits from AI reasoning, vision intelligence, and automated insights."
            : "هازالايز يمد الذكاء عبر جميع وحدات BlueDXP - WMS و TMS والامتثال والمزيد. كل وحدة تستفيد من الاستدلال بالذكاء الاصطناعي وذكاء الرؤية والرؤى الآلية."}
        </p>
      </motion.div>
    </div>
  );
}
