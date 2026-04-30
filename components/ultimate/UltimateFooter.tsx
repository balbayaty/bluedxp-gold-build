"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface UltimateFooterProps {
  language: "en" | "ar";
}

export default function UltimateFooter({ language }: UltimateFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/20 py-16 mt-24">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#05a4ff]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d4a8]/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link href="/ultimate" className="inline-block mb-6">
              <div className="bg-gradient-to-br from-[#05a4ff]/30 to-[#00d4a8]/30 backdrop-blur-xl border border-[#05a4ff]/40 rounded-2xl p-4 inline-block">
                <img
                  src="/bluedxp-logo.svg"
                  alt="BlueDXP"
                  className="h-12 w-auto"
                />
              </div>
            </Link>
            <p className="text-lg text-white/70 leading-relaxed mb-6 max-w-md">
              {language === "en"
                ? "Enterprise Intelligence Operating System for Tomorrow's Operations. Trusted by Fortune 500 companies worldwide."
                : "نظام تشغيل الذكاء المؤسسي لعمليات المستقبل. موثوق به من قبل شركات Fortune 500 في جميع أنحاء العالم."}
            </p>
            <div className="flex gap-4">
              {["twitter-x", "linkedin", "github", "youtube"].map(
                (social, index) => (
                  <motion.a
                    key={social}
                    href="#"
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center hover:from-[#05a4ff]/30 hover:to-[#00d4a8]/30 transition-all border border-white/10 hover:border-[#05a4ff]/50"
                  >
                    <i
                      className={`ri-${social}${social === "linkedin" || social === "github" ? "-fill" : "-line"} text-xl`}
                    ></i>
                  </motion.a>
                ),
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-bold mb-6 text-lg">
              {language === "en" ? "Product" : "المنتج"}
            </h4>
            <div className="space-y-3">
              {[
                "Intelligence",
                "Operations",
                "Integration",
                "Governance",
                "Pricing",
              ].map((item, index) => (
                <Link
                  key={index}
                  href="#"
                  className="block text-white/70 hover:text-[#05a4ff] transition-colors"
                >
                  {language === "ar" && item === "Intelligence"
                    ? "الذكاء"
                    : language === "ar" && item === "Operations"
                      ? "العمليات"
                      : language === "ar" && item === "Integration"
                        ? "التكامل"
                        : language === "ar" && item === "Governance"
                          ? "الحوكمة"
                          : language === "ar" && item === "Pricing"
                            ? "التسعير"
                            : item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-bold mb-6 text-lg">
              {language === "en" ? "Company" : "الشركة"}
            </h4>
            <div className="space-y-3">
              {["About", "Careers", "Contact", "Partners", "News"].map(
                (item, index) => (
                  <Link
                    key={index}
                    href="#"
                    className="block text-white/70 hover:text-[#05a4ff] transition-colors"
                  >
                    {language === "ar" && item === "About"
                      ? "عن الشركة"
                      : language === "ar" && item === "Careers"
                        ? "الوظائف"
                        : language === "ar" && item === "Contact"
                          ? "اتصل بنا"
                          : language === "ar" && item === "Partners"
                            ? "الشركاء"
                            : language === "ar" && item === "News"
                              ? "الأخبار"
                              : item}
                  </Link>
                ),
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-bold mb-6 text-lg">
              {language === "en" ? "Resources" : "الموارد"}
            </h4>
            <div className="space-y-3">
              {[
                "Documentation",
                "API Reference",
                "White Papers",
                "Blog",
                "Support",
              ].map((item, index) => (
                <Link
                  key={index}
                  href="#"
                  className="block text-white/70 hover:text-[#05a4ff] transition-colors"
                >
                  {language === "ar" && item === "Documentation"
                    ? "التوثيق"
                    : language === "ar" && item === "API Reference"
                      ? "مرجع API"
                      : language === "ar" && item === "White Papers"
                        ? "أوراق بيضاء"
                        : language === "ar" && item === "Blog"
                          ? "المدونة"
                          : language === "ar" && item === "Support"
                            ? "الدعم"
                            : item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-10 mt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-white/60">
              © {currentYear} Bluedxp —{" "}
              {language === "en"
                ? "Enterprise Intelligence Operating System"
                : "نظام تشغيل الذكاء المؤسسي"}
            </p>
            <div className="flex items-center gap-8 text-sm text-white/60">
              <Link href="#" className="hover:text-[#05a4ff] transition-colors">
                {language === "en" ? "Privacy Policy" : "سياسة الخصوصية"}
              </Link>
              <Link href="#" className="hover:text-[#05a4ff] transition-colors">
                {language === "en" ? "Terms of Service" : "شروط الخدمة"}
              </Link>
              <Link href="#" className="hover:text-[#05a4ff] transition-colors">
                {language === "en" ? "Security" : "الأمان"}
              </Link>
              <Link href="#" className="hover:text-[#05a4ff] transition-colors">
                {language === "en" ? "Compliance" : "الامتثال"}
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-xs text-white/50 leading-relaxed max-w-4xl mx-auto">
              {language === "en"
                ? "Bluedxp empowers organizations to transform operational complexity into strategic advantage through integrated intelligence systems. From pharmaceutical supply chains to petrochemical logistics to advanced manufacturing—enterprises operating in regulated environments at exponential speed."
                : "تمكّن Bluedxp المنظمات من تحويل تعقيد العمليات إلى ميزة استراتيجية عبر أنظمة ذكاء متكاملة. من سلاسل إمداد الأدوية إلى لوجستيات البتروكيماويات إلى التصنيع المتقدم—مؤسسات تعمل في بيئات منظمة بسرعة أسية."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
