"use client";

import { RiGlobalLine, RiLinkedinFill, RiTwitterFill } from "react-icons/ri";

interface ExecutiveFooterProps {
  language: "en" | "ar";
}

export default function ExecutiveFooter({ language }: ExecutiveFooterProps) {
  const isArabic = language === "ar";
  return (
    <footer className="bg-[#0a0e14] border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-white font-bold text-xl mb-4">BlueDXP</div>
            <p className="text-white/60 text-sm">
              {isArabic
                ? "نظام التشغيل الذكي للمؤسسات"
                : "Enterprise Intelligence Operating System"}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">
              {isArabic ? "المنصة" : "Platform"}
            </h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#capabilities" className="hover:text-white">
                  {isArabic ? "القدرات" : "Capabilities"}
                </a>
              </li>
              <li>
                <a href="#compliance" className="hover:text-white">
                  {isArabic ? "الامتثال" : "Compliance"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">
              {isArabic ? "الشركة" : "Company"}
            </h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  {isArabic ? "من نحن" : "About"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  {isArabic ? "اتصل بنا" : "Contact"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">
              {isArabic ? "تابعنا" : "Follow Us"}
            </h4>
            <div className="flex space-x-4">
              <a href="#" className="text-white/60 hover:text-white">
                <RiLinkedinFill className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white">
                <RiTwitterFill className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
          <p>
            © 2025 BlueDXP.{" "}
            {isArabic ? "جميع الحقوق محفوظة" : "All rights reserved"}.
          </p>
        </div>
      </div>
    </footer>
  );
}
