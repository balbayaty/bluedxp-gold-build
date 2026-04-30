"use client";

import { motion } from "framer-motion";

interface VisionSectionProps {
  language: "en" | "ar";
}

export default function VisionSection({ language }: VisionSectionProps) {
  const translations = {
    en: {
      badge: "Our Mission",
      title: "The Future of Enterprise Operations",
      intro:
        "We believe enterprises should operate at human speed for strategic decisions and machine speed for execution. Intelligence should be autonomous yet accountable. Compliance should be automatic, not burdensome. Operations should scale without proportional complexity.",
      long: "Bluedxp is built for enterprises that operate at the speed of modern commerce, manage regulatory complexity across multiple jurisdictions, and compete in markets where intelligence becomes the primary competitive advantage. From pharmaceutical supply chains to petrochemical logistics to advanced manufacturing—enterprises that can't afford to choose between speed and safety.",
      tagline:
        "One Brain. Infinite Output. This is how business will work globally. We're building it now for MENA.",
    },
    ar: {
      badge: "مهمتنا",
      title: "مستقبل عمليات المؤسسة",
      intro:
        "نؤمن بأن القرارات الاستراتيجية يجب أن تسير بسرعة البشر، بينما التنفيذ بسرعة الآلة. يجب أن يكون الذكاء ذاتيًا وقابلًا للمساءلة. يجب أن يكون الامتثال تلقائيًا لا عبئًا. ويجب أن تتوسع العمليات دون تعقيد متناسب.",
      long: "صُممت Bluedxp للمؤسسات التي تعمل بسرعة التجارة الحديثة، وتدير تعقيدات تنظيمية متعددة الاختصاصات، وتنافس في أسواق يصبح فيها الذكاء الميزة التنافسية الأساسية. من سلاسل إمداد الأدوية إلى لوجستيات البتروكيماويات إلى التصنيع المتقدم — مؤسسات لا تستطيع التفريط بين السرعة والسلامة.",
      tagline:
        "عقل واحد، إنتاج بلا حدود. هكذا ستعمل الأعمال عالميًا. نبنيه الآن لمنطقة الشرق الأوسط وشمال إفريقيا.",
    },
  };

  const t = translations[language];

  return (
    <section className="py-20 bg-gradient-to-b from-[#05a4ff]/5 to-[#00d4a8]/5 border-t border-[#05a4ff]/10">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-6 uppercase tracking-wider">
            {t.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t.title}
          </h2>
          <p className="text-lg text-[#cbd5e1] mb-8 leading-relaxed">
            {t.intro}
          </p>
          <p className="text-lg text-[#cbd5e1] mb-8 leading-relaxed">
            {t.long}
          </p>
          <p className="text-xl text-[#00d4a8] font-semibold">{t.tagline}</p>
        </motion.div>
      </div>
    </section>
  );
}
