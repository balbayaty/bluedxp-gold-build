"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface HomeFooterProps {
  language: "en" | "ar";
}

export default function HomeFooter({ language }: HomeFooterProps) {
  return (
    <footer className="bg-[#0a0e14]/80 backdrop-blur-xl border-t border-white/10 py-12 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link href="/home" className="inline-block mb-4">
              <img
                src="/bluedxp-logo.svg"
                alt="BlueDXP"
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              {language === "en"
                ? "Enterprise Intelligence Operating System for Tomorrow's Operations"
                : "نظام تشغيل الذكاء المؤسسي لعمليات المستقبل"}
            </p>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {language === "en" ? "Product" : "المنتج"}
            </h4>
            <div className="space-y-2">
              <Link
                href="#intelligence"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Intelligence" : "الذكاء"}
              </Link>
              <Link
                href="#operations"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Operations" : "العمليات"}
              </Link>
              <Link
                href="#integration"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Integration" : "التكامل"}
              </Link>
              <Link
                href="#governance"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Governance" : "الحوكمة"}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {language === "en" ? "Company" : "الشركة"}
            </h4>
            <div className="space-y-2">
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "About" : "عن الشركة"}
              </Link>
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Careers" : "الوظائف"}
              </Link>
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Contact" : "تواصل معنا"}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#05a4ff] font-semibold mb-4 text-sm">
              {language === "en" ? "Resources" : "الموارد"}
            </h4>
            <div className="space-y-2">
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Documentation" : "التوثيق"}
              </Link>
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "API Reference" : "مرجع API"}
              </Link>
              <Link
                href="#"
                className="block text-sm text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                {language === "en" ? "Blog" : "المدونة"}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60">
              © 2025 Bluedxp —{" "}
              {language === "en"
                ? "Enterprise Intelligence Operating System"
                : "نظام تشغيل الذكاء المؤسسي"}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                <i className="ri-twitter-x-line text-xl"></i>
              </Link>
              <Link
                href="#"
                className="text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                <i className="ri-linkedin-fill text-xl"></i>
              </Link>
              <Link
                href="#"
                className="text-white/60 hover:text-[#05a4ff] transition-colors"
              >
                <i className="ri-github-fill text-xl"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
