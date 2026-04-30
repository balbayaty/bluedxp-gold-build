"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface LandingFooterProps {
  language: "en" | "ar";
}

export default function LandingFooter({ language }: LandingFooterProps) {
  const translations = {
    en: {
      product: "Product",
      enterprise: "Enterprise",
      resources: "Resources",
      company: "Company",
      links: {
        intelligence: "Intelligence",
        operations: "Operations",
        integration: "Integration",
        governance: "Governance",
        roadmap: "Roadmap",
        security: "Security & Governance",
        compliance: "Compliance Standards",
        integrationFramework: "Integration Framework",
        sla: "SLA & Support",
        documentation: "Documentation",
        api: "API Reference",
        whitePapers: "White Papers",
        blog: "Blog & Research",
        about: "About Bluedxp",
        careers: "Careers",
        contact: "Contact",
        privacy: "Privacy & Terms",
      },
      copyright: "© 2025 Bluedxp — Enterprise Intelligence Operating System",
      description:
        "Designed for enterprises operating at scale across MENA. Building the future of autonomous operations, real-time compliance, and continuous optimization. One Brain. Infinite Output.",
      longDescription:
        "Bluedxp empowers organizations to transform operational complexity into strategic advantage through integrated intelligence systems that combine autonomous decision-making with human expertise. From pharmaceutical supply chains to petrochemical logistics to advanced manufacturing—enterprises that operate in regulated environments at exponential speed.",
    },
    ar: {
      product: "المنتج",
      enterprise: "المؤسسات",
      resources: "الموارد",
      company: "الشركة",
      links: {
        intelligence: "الذكاء",
        operations: "العمليات",
        integration: "التكامل",
        governance: "الحوكمة",
        roadmap: "خارطة الطريق",
        security: "الأمن والحوكمة",
        compliance: "معايير الامتثال",
        integrationFramework: "إطار التكامل",
        sla: "اتفاقية مستوى الخدمة والدعم",
        documentation: "التوثيق",
        api: "مرجع واجهات البرمجة API",
        whitePapers: "أوراق بيضاء",
        blog: "المدونة والأبحاث",
        about: "عن Bluedxp",
        careers: "الوظائف",
        contact: "تواصل معنا",
        privacy: "الخصوصية والشروط",
      },
      copyright: "© 2025 Bluedxp — نظام تشغيل الذكاء المؤسسي",
      description:
        "مصمم للمؤسسات العاملة على نطاق واسع في منطقة الشرق الأوسط وشمال أفريقيا. نبني مستقبل التشغيل الذاتي والامتثال اللحظي والتحسين المستمر. عقل واحد، إنتاج بلا حدود.",
      longDescription:
        "تمكّن Bluedxp المنظمات من تحويل تعقيد العمليات إلى ميزة استراتيجية عبر أنظمة ذكاء متكاملة تجمع اتخاذ القرار الذاتي بخبرة البشر. من سلاسل إمداد الأدوية إلى لوجستيات البتروكيماويات إلى التصنيع المتقدم—مؤسسات تعمل في بيئات منظمة بسرعة أسية.",
    },
  };

  const t = translations[language];

  return (
    <footer className="bg-[#0a0e14]/50 border-t border-[#05a4ff]/10 py-12 mt-16">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {t.product}
            </h4>
            <div className="space-y-2">
              <Link
                href="#intelligence"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.intelligence}
              </Link>
              <Link
                href="#operations"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.operations}
              </Link>
              <Link
                href="#integration"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.integration}
              </Link>
              <Link
                href="#governance"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.governance}
              </Link>
              <Link
                href="#roadmap"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.roadmap}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {t.enterprise}
            </h4>
            <div className="space-y-2">
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.security}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.compliance}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.integrationFramework}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.sla}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {t.resources}
            </h4>
            <div className="space-y-2">
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.documentation}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.api}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.whitePapers}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.blog}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {t.company}
            </h4>
            <div className="space-y-2">
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.about}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.careers}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.contact}
              </Link>
              <Link
                href="#"
                className="block text-sm text-[#a0aec0] hover:text-[#05a4ff] transition-colors"
              >
                {t.links.privacy}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#05a4ff]/10 pt-8 mt-8">
          <p className="text-white mb-4 font-semibold">{t.copyright}</p>
          <p className="text-sm text-[#a0aec0] mb-4 leading-relaxed">
            {t.description}
          </p>
          <p className="text-xs text-[#7a8ba0] leading-relaxed">
            {t.longDescription}
          </p>
        </div>
      </div>
    </footer>
  );
}
