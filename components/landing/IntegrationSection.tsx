"use client";

import { motion } from "framer-motion";

interface IntegrationSectionProps {
  language: "en" | "ar";
}

export default function IntegrationSection({
  language,
}: IntegrationSectionProps) {
  const translations = {
    en: {
      badge: "Ecosystem Architecture",
      title: "Connected Enterprise Intelligence Network",
      intro:
        "Bluedxp integrates seamlessly with enterprise systems through open APIs and intelligent connectors. One unified brain. All your data. All your systems.",
      cards: [
        {
          title: "Enterprise Systems",
          p: "Connect all operational systems into one intelligent network. Your existing investments, enhanced.",
          items: [
            "Enterprise resource planning systems",
            "Warehouse management platforms",
            "Transportation networks",
            "Workforce communication systems",
            "Financial & accounting systems",
          ],
        },
        {
          title: "Regulatory & Compliance Frameworks",
          p: "Direct connections to government, municipal, and industry regulatory bodies ensure real-time compliance alignment.",
          items: [
            "Tax & trade compliance systems",
            "Safety & health standards",
            "Environmental regulations",
            "Industry certifications",
            "Municipal requirements",
          ],
        },
        {
          title: "Intelligence & Analytics Sources",
          p: "Ingest market intelligence, operational benchmarks, and external data streams for enhanced decision-making.",
          items: [
            "Market data & pricing feeds",
            "Border & customs status",
            "Logistics network intelligence",
            "Industry benchmarks",
            "Predictive market signals",
          ],
        },
        {
          title: "API-First Architecture",
          p: "Everything is accessible through modern APIs. Build custom integrations, extend functionality, maintain control.",
          items: [
            "RESTful & GraphQL interfaces",
            "Real-time event streaming",
            "Webhook support",
            "Custom integration framework",
            "Developer-friendly SDKs",
          ],
        },
      ],
    },
    ar: {
      badge: "معمارية النظام البيئي",
      title: "شبكة ذكاء مؤسسية متصلة",
      intro:
        "تتكامل Bluedxp بسلاسة مع أنظمة المؤسسة عبر واجهات API مفتوحة وموصلات ذكية. عقل موحد واحد. كل بياناتك. كل أنظمتك.",
      cards: [
        {
          title: "أنظمة المؤسسة",
          p: "اربط جميع الأنظمة التشغيلية في شبكة ذكاء واحدة. استثماراتك الحالية… محسّنة.",
          items: [
            "أنظمة تخطيط موارد المؤسسة",
            "منصات إدارة المستودعات",
            "شبكات النقل",
            "أنظمة تواصل القوى العاملة",
            "أنظمة مالية ومحاسبية",
          ],
        },
        {
          title: "أطر الامتثال والتنظيم",
          p: "اتصالات مباشرة مع الجهات الحكومية والبلدية والتنظيمية لضمان مواءمة امتثال لحظية.",
          items: [
            "أنظمة الضرائب والتجارة",
            "معايير السلامة والصحة",
            "لوائح بيئية",
            "شهادات صناعية",
            "متطلبات بلدية",
          ],
        },
        {
          title: "مصادر الذكاء والتحليلات",
          p: "استيعاب ذكاء الأسواق ومعايير التشغيل وتدفّقات البيانات الخارجية لاتخاذ قرارات أفضل.",
          items: [
            "لقيم البيانات والأسعار",
            "حالة الحدود والجمارك",
            "ذكاء شبكات اللوجستيات",
            "معايير صناعية",
            "إشارات سوق تنبؤية",
          ],
        },
        {
          title: "معمارية API أولاً",
          p: "كل شيء متاح عبر واجهات حديثة. ابنِ تكاملات مخصصة، ووسّع الوظائف، واحتفظ بالتحكم.",
          items: [
            "واجهات REST وGraphQL",
            "بثّ أحداث لحظي",
            "دعم Webhook",
            "إطار تكامل مخصص",
            "حِزم SDK صديقة للمطورين",
          ],
        },
      ],
    },
  };

  const t = translations[language];

  return (
    <section
      id="integration"
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
                      <span className="text-[#00d4a8] mt-1">→</span>
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
