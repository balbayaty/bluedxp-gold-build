"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiArrowRightLine, RiFlagLine } from "react-icons/ri";

interface SaudiHeroProps {
  language: "en" | "ar";
}

export default function SaudiHero({ language }: SaudiHeroProps) {
  const router = useRouter();
  const isArabic = language === "ar";
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#006c35]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffffff]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#006c35]/20 border border-[#006c35]/30 rounded-full mb-8"
        >
          <RiFlagLine className="w-4 h-4 text-[#006c35]" />
          <span className="text-[#00ff88] text-sm font-medium">
            {isArabic
              ? "محلي بالكامل للمملكة العربية السعودية"
              : "Fully Localized for Saudi Arabia"}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-[#00ff88] via-[#006c35] to-[#ffffff] bg-clip-text text-transparent">
            {isArabic ? "منصة ذكاء المؤسسات" : "Enterprise Intelligence"}
          </span>
          <br />
          <span className="text-white">
            {isArabic ? "للمملكة العربية السعودية" : "for Saudi Arabia"}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12"
        >
          {isArabic
            ? "منصة متكاملة مصممة خصيصاً للمملكة العربية السعودية، متوافقة مع رؤية 2030 ومتطلبات الامتثال المحلية"
            : "Integrated platform specifically designed for Saudi Arabia, aligned with Vision 2030 and local compliance requirements"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => router.push("/login")}
            className="group px-8 py-4 bg-gradient-to-r from-[#006c35] to-[#008c44] text-white rounded-lg font-semibold text-lg flex items-center space-x-2 shadow-xl shadow-[#006c35]/30"
            whileHover={{ scale: 1.05 }}
          >
            <span>{isArabic ? "ابدأ الآن" : "Get Started"}</span>
            <RiArrowRightLine className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
