"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "react-icons/ri";

interface SaudiCTAProps {
  language: "en" | "ar";
}

export default function SaudiCTA({ language }: SaudiCTAProps) {
  const router = useRouter();
  const isArabic = language === "ar";
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic
              ? "ابدأ رحلتك مع BlueDXP"
              : "Start Your Journey with BlueDXP"}
          </h2>
          <motion.button
            onClick={() => router.push("/login")}
            className="px-8 py-4 bg-gradient-to-r from-[#006c35] to-[#008c44] text-white rounded-lg font-semibold text-lg flex items-center space-x-2 mx-auto"
            whileHover={{ scale: 1.05 }}
          >
            <span>{isArabic ? "ابدأ الآن" : "Get Started"}</span>
            <RiArrowRightLine className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
