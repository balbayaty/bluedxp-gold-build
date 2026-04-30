"use client";

import { motion } from "framer-motion";

interface OperationsSectionProps {
  language: "en" | "ar";
}

export default function OperationsSection({
  language,
}: OperationsSectionProps) {
  const translations = {
    en: {
      badge: "Operational Impact",
      title: "Transforming Complexity into Executable Clarity",
      supplyChain: "Supply Chain Optimization",
      impactMetrics: "Impact Metrics",
      valueProps: [
        {
          title: "Quantum-Inspired Route Optimization",
          p: "Navigate supply chain uncertainty with probabilistic optimization that considers multiple state possibilities—committed routes, contingent routes, and phantom pathways—collapsing toward optimal delivery probability in real-time.",
        },
        {
          title: "Demand-Capacity Intelligence",
          p: "Real-time matching of demand signals with capacity availability, eliminating the gap between what's possible and what actually executes.",
        },
        {
          title: "Border & Regulatory Navigation",
          p: "Automatic alignment with customs procedures, municipal requirements, and regulatory frameworks across GCC corridors. Anticipate rather than react.",
        },
      ],
      features: [
        "<strong>Detention Reduction:</strong> 40-50% decrease in unplanned delays through predictive optimization",
        "<strong>Compliance Automation:</strong> 80%+ reduction in manual compliance verification and audit labor",
        "<strong>Decision Velocity:</strong> 95%+ improvement in operational decision cycle time",
        "<strong>Error Elimination:</strong> 99%+ accuracy in standardized decision workflows",
        "<strong>Capacity Utilization:</strong> 15-25% improvement through intelligent load balancing",
        "<strong>Cost Reduction:</strong> 25-35% operational savings through autonomous optimization",
        "<strong>First-Pass Success:</strong> 94%+ shipment delivery on first attempt",
      ],
    },
    ar: {
      badge: "الأثر التشغيلي",
      title: "تحويل التعقيد إلى وضوح قابل للتنفيذ",
      supplyChain: "تحسين سلاسل الإمداد",
      impactMetrics: "مقاييس الأثر",
      valueProps: [
        {
          title: "تحسين المسارات المستلهم من الكم",
          p: "تنقّل عدم اليقين في سلسلة الإمداد بتحسين احتمالي يأخذ في الحسبان حالات متعددة—مسارات مؤكدة ومسارات طارئة ومسارات افتراضية—مع انهيار نحو أعلى احتمالية تسليم في الزمن الحقيقي.",
        },
        {
          title: "ذكاء الطلب والسعة",
          p: "مواءمة لحظية لإشارات الطلب مع توافر السعة، لإلغاء الفجوة بين الممكن وما يُنفّذ فعليًا.",
        },
        {
          title: "المنافذ واللوائح الحدودية",
          p: "مواءمة تلقائية مع إجراءات الجمارك والمتطلبات البلدية والأطر التنظيمية عبر ممرات الخليج. توقّع بدلًا من أن تتفاعل.",
        },
      ],
      features: [
        "<strong>خفض الاحتجاز:</strong> انخفاض 40–50% في التأخيرات غير المخططة عبر التحسين التنبئي",
        "<strong>أتمتة الامتثال:</strong> تقليل بأكثر من 80% في التحقق اليدوي والجهد التدقيقي",
        "<strong>سرعة القرار:</strong> تحسن بأكثر من 95% في دورة قرار التشغيل",
        "<strong>القضاء على الأخطاء:</strong> دقة تفوق 99% في مسارات القرارات المعيارية",
        "<strong>استغلال السعة:</strong> تحسن 15–25% عبر موازنة أحمال ذكية",
        "<strong>خفض التكلفة:</strong> وفر 25–35% تشغيليًا عبر التحسين الذاتي",
        "<strong>نجاح من المحاولة الأولى:</strong> تسليم يفوق 94% من المحاولة الأولى",
      ],
    },
  };

  const t = translations[language];

  return (
    <section
      id="operations"
      className="py-20 bg-gradient-to-b from-[#05a4ff]/5 to-[#00d4a8]/5 border-t border-[#05a4ff]/10"
    >
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
            <div>
              <h3 className="text-xl font-semibold text-[#05a4ff] mb-6">
                {t.supplyChain}
              </h3>
              <div className="space-y-4">
                {t.valueProps.map((vp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-gradient-to-br from-[#00d4a8]/10 to-[#05a4ff]/5 border border-[#00d4a8]/20 rounded-xl p-5 hover:border-[#00d4a8]/40 transition-all"
                  >
                    <h4 className="text-lg font-semibold text-[#00d4a8] mb-2">
                      {vp.title}
                    </h4>
                    <p className="text-[#cbd5e1] text-sm leading-relaxed">
                      {vp.p}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#05a4ff] mb-6">
                {t.impactMetrics}
              </h3>
              <ul className="space-y-3">
                {t.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-[#cbd5e1] text-sm flex items-start gap-2"
                  >
                    <span className="text-[#00d4a8] mt-1">✓</span>
                    <span dangerouslySetInnerHTML={{ __html: feature }} />
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
