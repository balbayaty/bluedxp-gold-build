"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface FeaturesSectionProps {
  language: "en" | "ar";
}

export default function FeaturesSection({ language }: FeaturesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: "ri-brain-line",
      title: language === "en" ? "Conversational AI" : "ذكاء اصطناعي محادثة",
      description:
        language === "en"
          ? "Natural language interface for real-time decision queries and transparent AI reasoning"
          : "واجهة لغة طبيعية لاستعلامات القرارات اللحظية واستدلال ذكاء اصطناعي شفاف",
      gradient: "from-[#05a4ff] to-[#0088d1]",
    },
    {
      icon: "ri-cpu-line",
      title: language === "en" ? "Process Automation" : "أتمتة العمليات",
      description:
        language === "en"
          ? "End-to-end workflow automation with human-in-the-loop control and exception handling"
          : "أتمتة سير العمل الشاملة مع تحكم بشري ومعالجة الاستثناءات",
      gradient: "from-[#00d4a8] to-[#00b894]",
    },
    {
      icon: "ri-database-2-line",
      title: language === "en" ? "Enterprise Memory" : "ذاكرة المؤسسة",
      description:
        language === "en"
          ? "Unified knowledge system that learns continuously from every decision and exception"
          : "نظام معرفة موحد يتعلم باستمرار من كل قرار واستثناء",
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
    },
    {
      icon: "ri-team-line",
      title:
        language === "en"
          ? "Human-Machine Collaboration"
          : "تعاون الإنسان والآلة",
      description:
        language === "en"
          ? "Augmented decision support combining human judgment with machine scale and speed"
          : "دعم قرار معزز يجمع بين حكم الإنسان وحجم الآلة وسرعتها",
      gradient: "from-[#f59e0b] to-[#d97706]",
    },
  ];

  return (
    <section ref={ref} id="intelligence" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "Autonomous Intelligence" : "ذكاء ذاتي"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "One Brain. Infinite Reasoning Pathways."
                : "عقل واحد. مسارات استدلال لا نهائية."}
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            {language === "en"
              ? "Bluedxp operates as a unified intelligence system where conversational AI reasoning combines with enterprise data systems and human expertise."
              : "تعمل Bluedxp كنظام ذكاء موحد يجمع بين استدلال اللغة الطبيعية وبيانات المؤسسة وخبرة البشر."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-[#05a4ff]/50 transition-all overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative z-10">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <i className={`${feature.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
