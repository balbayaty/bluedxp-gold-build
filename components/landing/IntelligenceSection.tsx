"use client";

import { motion } from "framer-motion";

interface IntelligenceSectionProps {
  language: "en" | "ar";
}

export default function IntelligenceSection({
  language,
}: IntelligenceSectionProps) {
  const translations = {
    en: {
      badge: "Autonomous Intelligence",
      title: "One Brain. Infinite Reasoning Pathways.",
      intro:
        "Bluedxp operates as a unified intelligence system where conversational AI reasoning combines with enterprise data systems and human expertise to create autonomous yet explainable decision-making.",
      cards: [
        {
          title: "Conversational Decision Intelligence",
          p: "Natural language interface enabling stakeholders at all levels to query, explore, and challenge decisions in real-time. AI reasoning is transparent, auditable, and collaborative.",
          items: [
            "Multi-language support (Arabic, English, Hindi)",
            "Context-aware reasoning across conversations",
            "Human-in-the-loop override capabilities",
            "Decision explanation & justification trails",
          ],
        },
        {
          title: "Intelligent Process Automation",
          p: "Automate end-to-end workflows from approval routing to compliance verification. Humans remain in control while routine decisions execute autonomously.",
          items: [
            "Self-configuring workflow engines",
            "Exception handling with human escalation",
            "Real-time monitoring & optimization",
            "Predictive process recommendations",
          ],
        },
        {
          title: "Unified Enterprise Memory",
          p: "Every decision, exception, and learning creates institutional knowledge. The system learns continuously without manual intervention.",
          items: [
            "Persistent context across operations",
            "Pattern recognition at enterprise scale",
            "Predictive anomaly detection",
            "Organizational learning acceleration",
          ],
        },
        {
          title: "Human-Machine Collaboration",
          p: "Humans bring judgment, creativity, and accountability. Machines bring scale, consistency, and speed. Together: unstoppable competitive advantage.",
          items: [
            "Augmented decision support",
            "Intelligent recommendation engines",
            "Collaborative problem-solving frameworks",
            "Trust & accountability mechanisms",
          ],
        },
      ],
    },
    ar: {
      badge: "ذكاء ذاتي",
      title: "عقل واحد. مسارات استدلال لا نهائية.",
      intro:
        "تعمل Bluedxp كنظام ذكاء موحد يجمع بين استدلال اللغة الطبيعية وبيانات المؤسسة وخبرة البشر لتمكين قرارات ذاتية قابلة للتفسير.",
      cards: [
        {
          title: "ذكاء اتخاذ القرار بالمحادثة",
          p: "واجهة لغة طبيعية تمكّن أصحاب المصلحة من الاستعلام والاستكشاف وتحدي القرارات لحظيًا. استدلال الذكاء الاصطناعي شفاف وقابل للتدقيق وتعاوني.",
          items: [
            "دعم لغات متعددة (العربية، الإنجليزية، الهندية)",
            "استدلال واعٍ للسياق عبر المحادثات",
            "قدرات تجاوز بشرية ضمن الحلقة",
            "مسارات شرح وتبرير القرارات",
          ],
        },
        {
          title: "أتمتة العمليات الذكية",
          p: "أتمتة شاملة لسير العمل من مسارات الموافقات إلى التحقق من الامتثال. يبقى البشر مسيطرين بينما تُنفّذ القرارات الروتينية ذاتيًا.",
          items: [
            "محركات سير عمل ذاتية التهيئة",
            "معالجة الاستثناءات مع تصعيد بشري",
            "مراقبة وتحسين لحظي",
            "توصيات تنبؤية لسير العمليات",
          ],
        },
        {
          title: "ذاكرة مؤسسية موحّدة",
          p: "كل قرار أو استثناء أو تعلّم يخلق معرفة مؤسسية. يتعلم النظام باستمرار دون تدخل يدوي.",
          items: [
            "سياق مستمر عبر العمليات",
            "تعرف أنماط على مستوى المؤسسة",
            "كشف تنبؤي للشذوذ",
            "تسريع التعلّم التنظيمي",
          ],
        },
        {
          title: "تعاون الإنسان والآلة",
          p: "يقدم البشر الحكم والإبداع والمسؤولية. وتقدم الآلات الحجم والاتساق والسرعة. معًا: ميزة تنافسية لا تُهزم.",
          items: [
            "دعم قرار معزَّز",
            "محركات توصية ذكية",
            "أطر حل مشكلات تعاونية",
            "آليات ثقة ومساءلة",
          ],
        },
      ],
    },
  };

  const t = translations[language];

  return (
    <section id="intelligence" className="py-20 border-t border-[#05a4ff]/10">
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
