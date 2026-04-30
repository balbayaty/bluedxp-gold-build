"use client";

import { RiGlobalLine } from "react-icons/ri";

interface InnovationFooterProps {
  language: "en" | "ar";
}

export default function InnovationFooter({ language }: InnovationFooterProps) {
  const isArabic = language === "ar";
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-white font-bold text-xl mb-4">BlueDXP</div>
        <p className="text-white/60 text-sm mb-8">
          {isArabic
            ? "المستقبل الذكي للمؤسسات"
            : "The Intelligent Future of Enterprise"}
        </p>
        <div className="border-t border-white/10 pt-8 text-white/60 text-sm">
          <p>
            © 2025 BlueDXP.{" "}
            {isArabic ? "جميع الحقوق محفوظة" : "All rights reserved"}.
          </p>
        </div>
      </div>
    </footer>
  );
}
