"use client";

import { motion } from "framer-motion";

interface RoadmapSectionProps {
  language: "en" | "ar";
}

export default function RoadmapSection({ language }: RoadmapSectionProps) {
  const translations = {
    en: {
      badge: "Strategic Evolution",
      title: "Building Tomorrow's Enterprise Operating System",
      intro:
        "Bluedxp continuously evolves as the foundational intelligence layer for modern organizations. From autonomous operations to predictive manufacturing to sustainability intelligence—creating the future of enterprise technology.",
      cards: [
        {
          title: "Operational Digital Twins (Q3 2025)",
          p: "Immersive simulation environment enabling organizations to test strategic decisions before implementation in live operations. Eliminate risk through prediction.",
          note: "Pilot customers: Global enterprise networks",
        },
        {
          title: "Manufacturing Intelligence (Q2 2025)",
          p: "Predictive quality systems and process optimization for manufacturing operations. Zero-defect production through continuous AI-powered process intelligence.",
          note: "Strategic partnerships: Major GCC manufacturers",
        },
        {
          title: "Sustainability Intelligence (Live)",
          p: "Quantify environmental impact at operational level and identify decarbonization opportunities aligned with ESG commitments and Vision 2030 strategic priorities.",
          note: "Active customers: 3+ pharmaceutical & logistics enterprises",
        },
        {
          title: "Predictive Enterprise Finance (Q4 2025)",
          p: "AI-driven financial forecasting, cash flow optimization, and automated accounting. Finance becomes real-time, predictive, and autonomous.",
          note: "Development phase: Beta architecture framework",
        },
      ],
    },
    ar: {
      badge: "التطور الاستراتيجي",
      title: "بناء نظام تشغيل المؤسسة للمستقبل",
      intro:
        "تتطور Bluedxp باستمرار لتكون طبقة الذكاء الأساسية للمنظمات الحديثة: من التشغيل الذاتي إلى التصنيع التنبؤي إلى ذكاء الاستدامة.",
      cards: [
        {
          title: "التوائم الرقمية التشغيلية (الربع الثالث 2025)",
          p: "بيئة محاكاة غامرة تمكّن المؤسسات من اختبار القرارات الاستراتيجية قبل تنفيذها في العمليات الحية. أزل المخاطر عبر التنبؤ.",
          note: "عملاء تجريبيون: شبكات مؤسسات عالمية",
        },
        {
          title: "ذكاء التصنيع (الربع الثاني 2025)",
          p: "أنظمة جودة تنبؤية وتحسين العمليات للتصنيع. إنتاج بلا عيوب عبر ذكاء عمليات مدعوم بالذكاء الاصطناعي بشكل مستمر.",
          note: "شراكات استراتيجية: كبرى شركات الخليج",
        },
        {
          title: "ذكاء الاستدامة (فعّال)",
          p: "قياس الأثر البيئي على مستوى العمليات وتحديد فرص خفض الانبعاثات بما يتوافق مع التزامات ESG وأولويات رؤية 2030.",
          note: "عملاء نشطون: أكثر من 3 شركات أدوية ولوجستيات",
        },
        {
          title: "المالية التنبؤية للمؤسسات (الربع الرابع 2025)",
          p: "تنبؤ مالي مدفوع بالذكاء الاصطناعي، وتحسين التدفق النقدي، ومحاسبة مؤتمتة. تصبح المالية لحظية وتنبؤية وذاتية.",
          note: "مرحلة التطوير: إطار هندسي تجريبي",
        },
      ],
    },
  };

  const t = translations[language];

  return (
    <section id="roadmap" className="py-20 border-t border-[#05a4ff]/10">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {t.cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#05a4ff]/10 to-[#05a4ff]/5 border border-[#05a4ff]/20 rounded-xl p-6 hover:border-[#05a4ff]/40 hover:transform hover:scale-[1.02] transition-all relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0, 212, 168, 0.1), transparent)",
                  }}
                />
                <h4 className="text-xl font-semibold text-[#05a4ff] mb-3 relative z-10">
                  {card.title}
                </h4>
                <p className="text-[#cbd5e1] mb-4 leading-relaxed relative z-10">
                  {card.p}
                </p>
                <p className="text-xs text-[#7a8ba0] mt-4 font-medium relative z-10">
                  {card.note}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
