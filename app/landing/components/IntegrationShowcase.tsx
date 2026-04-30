"use client";

import { motion } from "framer-motion";

interface IntegrationShowcaseProps {
  language: "en" | "ar";
}

/**
 * Integration Showcase Section
 *
 * Showcases BlueDXP's integration capabilities:
 * - ERP Integration
 * - IoT Connectivity
 * - API-First Design
 * - Webhook Support
 * - EDI Compatibility
 */
export default function IntegrationShowcase({
  language,
}: IntegrationShowcaseProps) {
  const content = {
    en: {
      title: "Integration-First Architecture",
      subtitle:
        "Designed for connectivity and interoperability from the ground up",
      description:
        "BlueDXP is built with integration in mind. Connect with ERP systems, IoT devices, third-party services, and more through our comprehensive integration layer.",
      integrations: [
        {
          name: "ERP Systems",
          icon: "🏢",
          description: "SAP, Oracle, ERPNext, and more",
        },
        {
          name: "IoT Devices",
          icon: "📡",
          description: "Sensors, RFID, barcode scanners, GPS",
        },
        {
          name: "APIs",
          icon: "🔌",
          description: "REST, GraphQL, WebSocket support",
        },
        {
          name: "Webhooks",
          icon: "🔔",
          description: "Real-time notifications and events",
        },
        {
          name: "EDI",
          icon: "📄",
          description: "Electronic Data Interchange compatibility",
        },
        {
          name: "Cloud",
          icon: "☁️",
          description: "Multi-cloud and hybrid deployments",
        },
      ],
    },
    ar: {
      title: "هندسة معمارية متكاملة",
      subtitle: "مصممة للاتصال والتشغيل البيني من البداية",
      description:
        "تم بناء BlueDXP مع مراعاة التكامل. اتصل بأنظمة ERP وأجهزة IoT وخدمات الطرف الثالث والمزيد من خلال طبقة التكامل الشاملة لدينا.",
      integrations: [
        {
          name: "أنظمة ERP",
          icon: "🏢",
          description: "SAP و Oracle و ERPNext والمزيد",
        },
        {
          name: "أجهزة IoT",
          icon: "📡",
          description: "أجهزة استشعار و RFID وماسحات الباركود و GPS",
        },
        {
          name: "واجهات برمجة التطبيقات",
          icon: "🔌",
          description: "دعم REST و GraphQL و WebSocket",
        },
        {
          name: "Webhooks",
          icon: "🔔",
          description: "الإشعارات والأحداث في الوقت الفعلي",
        },
        {
          name: "EDI",
          icon: "📄",
          description: "توافق تبادل البيانات الإلكتروني",
        },
        {
          name: "السحابة",
          icon: "☁️",
          description: "النشرات متعددة السحابة والهجينة",
        },
      ],
    },
  };

  const t = content[language];

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          {t.title}
        </h2>
        <p className="text-xl text-[#a0aec0] max-w-[900px] mx-auto mb-4">
          {t.subtitle}
        </p>
        <p className="text-lg text-[#cbd5e1] max-w-[800px] mx-auto">
          {t.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.integrations.map((integration, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#05a4ff]/8 to-[#05a4ff]/3 border border-[#05a4ff]/15 rounded-xl p-6 hover:border-[#05a4ff]/30 transition-all hover:-translate-y-1 text-center"
          >
            <div className="text-5xl mb-4">{integration.icon}</div>
            <h3 className="text-xl font-bold text-[#05a4ff] mb-2">
              {integration.name}
            </h3>
            <p className="text-sm text-[#a0aec0]">{integration.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
