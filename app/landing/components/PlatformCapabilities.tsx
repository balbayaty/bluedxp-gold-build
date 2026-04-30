"use client";

import { motion } from "framer-motion";

interface PlatformCapabilitiesProps {
  language: "en" | "ar";
}

/**
 * Platform Capabilities Section
 *
 * Showcases core BlueDXP capabilities:
 * - Conversational Decision Intelligence
 * - Autonomous Compliance
 * - Predictive Optimization
 * - Real-time Orchestration
 */
export default function PlatformCapabilities({
  language,
}: PlatformCapabilitiesProps) {
  const content = {
    en: {
      badge: "Autonomous Intelligence",
      title: "One Brain. Infinite Reasoning Pathways.",
      intro:
        "BlueDXP operates as a unified intelligence system where conversational AI reasoning combines with enterprise data systems and human expertise to create autonomous yet explainable decision-making.",
      capabilities: [
        {
          title: "Conversational Decision Intelligence",
          description:
            "Natural language interface enabling stakeholders at all levels to query, explore, and challenge decisions in real-time. AI reasoning is transparent, auditable, and collaborative.",
          icon: "💬",
        },
        {
          title: "Autonomous Compliance Monitoring",
          description:
            "Self-monitoring systems that detect compliance gaps before they become violations, automatically enforce policies, and provide real-time compliance intelligence.",
          icon: "🛡️",
        },
        {
          title: "Predictive Optimization",
          description:
            "AI-powered forecasting and optimization that predicts bottlenecks, optimizes routes, reduces waste, and continuously improves operational efficiency.",
          icon: "📈",
        },
        {
          title: "Real-time Orchestration",
          description:
            "Event-driven architecture that orchestrates processes across modules, enabling real-time decision-making and seamless integration between systems.",
          icon: "⚡",
        },
      ],
    },
    ar: {
      badge: "الذكاء المستقل",
      title: "عقل واحد. مسارات استدلال لا محدودة.",
      intro:
        "تعمل BlueDXP كنظام ذكاء موحد حيث يجمع الاستدلال بالذكاء الاصطناعي المحادث مع أنظمة البيانات المؤسسية والخبرة البشرية لإنشاء اتخاذ قرارات مستقل ولكنه قابل للتفسير.",
      capabilities: [
        {
          title: "ذكاء القرارات المحادث",
          description:
            "واجهة لغة طبيعية تمكن أصحاب المصلحة على جميع المستويات من الاستعلام والاستكشاف وتحدي القرارات في الوقت الفعلي. الاستدلال بالذكاء الاصطناعي شفاف وقابل للتدقيق وتعاوني.",
          icon: "💬",
        },
        {
          title: "مراقبة الامتثال المستقلة",
          description:
            "أنظمة المراقبة الذاتية التي تكتشف فجوات الامتثال قبل أن تصبح انتهاكات، وتطبق السياسات تلقائياً، وتوفر ذكاء الامتثال في الوقت الفعلي.",
          icon: "🛡️",
        },
        {
          title: "التحسين التنبؤي",
          description:
            "التنبؤ والتحسين المدعوم بالذكاء الاصطناعي الذي يتنبأ بالاختناقات ويحسن المسارات ويقلل الهدر ويحسن كفاءة العمليات باستمرار.",
          icon: "📈",
        },
        {
          title: "التنسيق في الوقت الفعلي",
          description:
            "هندسة معمارية مدفوعة بالأحداث تنسق العمليات عبر الوحدات، مما يتيح اتخاذ القرارات في الوقت الفعلي والتكامل السلس بين الأنظمة.",
          icon: "⚡",
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
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] max-w-[1000px] mx-auto leading-relaxed">
          {t.intro}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {t.capabilities.map((capability, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#05a4ff]/8 to-[#05a4ff]/3 border border-[#05a4ff]/15 rounded-xl p-6 hover:border-[#05a4ff]/30 transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">{capability.icon}</div>
            <h3 className="text-xl font-bold text-[#05a4ff] mb-3">
              {capability.title}
            </h3>
            <p className="text-[#cbd5e1] leading-relaxed">
              {capability.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
