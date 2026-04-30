"use client";

import { motion } from "framer-motion";

interface ChallengeSectionProps {
  language: "en" | "ar";
}

export default function ChallengeSection({ language }: ChallengeSectionProps) {
  const translations = {
    en: {
      badge: "The Reality Today",
      title: "Modern Enterprises Face an Intelligence Crisis",
      intro:
        "Organizations operate with fragmented intelligence: scattered operational data, siloed compliance tracking, delayed decision-making, and reactive problem-solving. In markets moving at exponential speed, this approach creates exponential risk.",
      stat1:
        "of decisions rely on manual data gathering and human interpretation",
      stat2:
        "of compliance issues emerge from process gaps rather than incidents",
      stat3: "average latency between problem occurrence and decision response",
      stat4:
        "of supply chain value lost to inefficient routing and underutilized capacity",
    },
    ar: {
      badge: "الواقع اليوم",
      title: "المؤسسات الحديثة تواجه أزمة ذكاء",
      intro:
        "تعمل المؤسسات بذكاء مجزأ: بيانات تشغيلية متناثرة، تتبع امتثال معزول، قرارات متأخرة، وحل مشكلات تفاعلي. في أسواق تتحرك بسرعة أسية، ينتج عن ذلك مخاطر أسية.",
      stat1: "من القرارات تعتمد على جمع البيانات يدويًا وتفسيرها البشري",
      stat2: "من قضايا الامتثال تنشأ من فجوات العمليات وليس الحوادث",
      stat3: "متوسط التأخير بين وقوع المشكلة والاستجابة بالقرار",
      stat4: "من قيمة سلسلة الإمداد تضيع بسبب توجيه غير فعّال وسعة غير مستغلة",
    },
  };

  const t = translations[language];

  const stats = [
    { number: "67%", label: t.stat1 },
    { number: "43%", label: t.stat2 },
    { number: "5-7 days", label: t.stat3 },
    { number: "31%", label: t.stat4 },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-[#05a4ff]/5 to-[#00d4a8]/5 border-t border-[#05a4ff]/10">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-6 uppercase tracking-wider">
            {t.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t.title}
          </h2>
          <p className="text-lg text-[#a0aec0] max-w-4xl mb-12 leading-relaxed">
            {t.intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#05a4ff]/10 to-[#05a4ff]/5 border border-[#05a4ff]/20 rounded-xl p-6 text-center hover:border-[#05a4ff]/40 transition-all hover:transform hover:scale-105"
              >
                <div className="text-4xl font-bold text-[#05a4ff] mb-3">
                  {stat.number}
                </div>
                <div className="text-sm text-[#a0aec0] leading-relaxed">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
