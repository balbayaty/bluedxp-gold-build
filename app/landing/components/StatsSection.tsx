"use client";

import { motion } from "framer-motion";

interface StatsSectionProps {
  language: "en" | "ar";
}

/**
 * Stats Section - The Challenge / Reality Today
 *
 * Displays key statistics about operational challenges
 */
export default function StatsSection({ language }: StatsSectionProps) {
  const content = {
    en: {
      badge: "The Reality Today",
      title: "Modern Enterprises Face an Intelligence Crisis",
      intro:
        "Organizations operate with fragmented intelligence: scattered operational data, siloed compliance tracking, delayed decision-making, and reactive problem-solving. In markets moving at exponential speed, this approach creates exponential risk.",
      stats: [
        {
          number: "67%",
          label:
            "of decisions rely on manual data gathering and human interpretation",
        },
        {
          number: "43%",
          label:
            "of compliance issues emerge from process gaps rather than incidents",
        },
        {
          number: "5-7 days",
          label:
            "average latency between problem occurrence and decision response",
        },
        {
          number: "31%",
          label:
            "of supply chain value lost to inefficient routing and underutilized capacity",
        },
      ],
    },
    ar: {
      badge: "الواقع اليوم",
      title: "الشركات الحديثة تواجه أزمة ذكاء",
      intro:
        "تعمل المنظمات بذكاء مجزأ: بيانات تشغيلية مبعثرة، وتتبع امتثال معزول، واتخاذ قرارات متأخر، وحل مشاكل تفاعلي. في الأسواق التي تتحرك بسرعة أسية، يخلق هذا النهج مخاطر أسية.",
      stats: [
        {
          number: "67%",
          label: "من القرارات تعتمد على جمع البيانات اليدوي والتفسير البشري",
        },
        {
          number: "43%",
          label: "من مشاكل الامتثال تنشأ من فجوات العملية بدلاً من الحوادث",
        },
        {
          number: "5-7 أيام",
          label: "متوسط زمن الاستجابة بين حدوث المشكلة واستجابة القرار",
        },
        {
          number: "31%",
          label:
            "من قيمة سلسلة التوريد تُفقد بسبب التوجيه غير الفعال والقدرة غير المستغلة",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#05a4ff]/4 border border-[#05a4ff]/15 rounded-xl p-6 text-center hover:border-[#05a4ff]/30 transition-all hover:-translate-y-1"
          >
            <div className="text-5xl font-extrabold text-[#05a4ff] mb-3">
              {stat.number}
            </div>
            <div className="text-sm text-[#a0aec0] leading-relaxed">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
