"use client";

interface ModulesFooterProps {
  language: "en" | "ar";
}

export default function ModulesFooter({ language }: ModulesFooterProps) {
  const isArabic = language === "ar";
  return (
    <footer className="bg-[#0a0e14] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-white font-bold text-xl mb-4">BlueDXP</div>
        <p className="text-white/60 text-sm mb-8">
          {isArabic
            ? "منصة شاملة للمؤسسات"
            : "Comprehensive Enterprise Platform"}
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
