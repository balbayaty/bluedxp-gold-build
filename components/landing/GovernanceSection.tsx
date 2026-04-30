"use client";

import { motion } from "framer-motion";

interface GovernanceSectionProps {
  language: "en" | "ar";
}

export default function GovernanceSection({
  language,
}: GovernanceSectionProps) {
  const translations = {
    en: {
      badge: "Enterprise Governance",
      title: "Integrated Management System Intelligence",
      intro:
        "Bluedxp embeds integrated management system (IMS) logic directly into operations, making quality, safety, environmental, and health compliance automatic outcomes of intelligent operations rather than manual afterthoughts.",
      cards: [
        {
          title: "Municipal & Regulatory Integration",
          p: "Direct integration with civil defense requirements, municipal operational standards, and governmental compliance frameworks. Real-time alignment with all local requirements.",
          items: [
            "Automated compliance mapping",
            "Real-time regulatory monitoring",
            "Municipal requirement alignment",
            "Governance audit trails",
          ],
        },
        {
          title: "IMS Orchestration",
          p: "Unified management of Quality, Safety, Environmental, and Health standards. Compliance becomes embedded in every operational decision.",
          items: [
            "Multi-standard integration (ISO suite)",
            "Continuous compliance verification",
            "Predictive risk assessment",
            "Audit-ready documentation",
          ],
        },
        {
          title: "Cryptographic Security & Data Sovereignty",
          p: "Enterprise-grade security with quantum-resistant encryption, immutable audit logs, and complete data residency control. Your data, your rules.",
          items: [
            "Post-quantum encryption standards",
            "Zero-knowledge architecture",
            "Regional data residency",
            "Forensic-grade audit capability",
          ],
        },
        {
          title: "Predictive Compliance Risk",
          p: "Machine learning identifies compliance risks and regulatory drift 90+ days before they become violations. Proactive mitigation replaces reactive firefighting.",
          items: [
            "Risk prediction models",
            "Emerging violation detection",
            "Mitigation recommendation engines",
            "Continuous improvement tracking",
          ],
        },
      ],
    },
    ar: {
      badge: "حوكمة المؤسسة",
      title: "ذكاء نظام الإدارة المتكامل",
      intro:
        "تُضمّن Bluedxp منطق نظام الإدارة المتكامل مباشرة في العمليات، لتصبح الجودة والسلامة والبيئة والصحة نواتج تلقائية لعمليات ذكية وليست أعمالاً يدوية لاحقة.",
      cards: [
        {
          title: "تكامل بلدي وتنظيمي",
          p: "تكامل مباشر مع متطلبات الدفاع المدني والمعايير التشغيلية البلدية وأطر الامتثال الحكومية. مواءمة لحظية مع جميع المتطلبات المحلية.",
          items: [
            "خرائط امتثال مؤتمتة",
            "مراقبة تنظيمية لحظية",
            "مواءمة متطلبات البلديات",
            "سجلات تدقيق حوكمية",
          ],
        },
        {
          title: "تنسيق نظام الإدارة المتكامل",
          p: "إدارة موحدة لمعايير الجودة والسلامة والبيئة والصحة. يصبح الامتثال جزءًا مدمجًا في كل قرار تشغيلي.",
          items: [
            "تكامل متعدد المعايير (حزمة ISO)",
            "تحقق امتثال مستمر",
            "تقييم مخاطر تنبؤي",
            "توثيق جاهز للتدقيق",
          ],
        },
        {
          title: "أمن تشفيري وسيادة البيانات",
          p: "أمن على مستوى المؤسسة بتشفير مقاوم للكم وسجلات تدقيق غير قابلة للتغيير وتحكم كامل في إقامة البيانات. بياناتك، قواعدك.",
          items: [
            "معايير تشفير ما بعد الكم",
            "معمارية معرفة صفرية",
            "إقامة بيانات إقليمية",
            "قدرات تدقيق جنائي",
          ],
        },
        {
          title: "مخاطر امتثال تنبؤية",
          p: "يتعرف التعلم الآلي على مخاطر الامتثال والانجراف التنظيمي قبل 90+ يومًا من تحوّلها إلى مخالفات. الاستباق يحل محل ردود الفعل.",
          items: [
            "نماذج تنبؤ بالمخاطر",
            "كشف المخالفات الناشئة",
            "محركات توصية للتخفيف",
            "تتبع التحسين المستمر",
          ],
        },
      ],
    },
  };

  const t = translations[language];

  return (
    <section id="governance" className="py-20 border-t border-[#05a4ff]/10">
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
                <ul className="space-y-2 relative z-10">
                  {card.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-sm text-[#a0aec0] flex items-start gap-2"
                    >
                      <span className="text-[#00d4a8] mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
