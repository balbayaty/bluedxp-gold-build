"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "react-icons/ri";

interface ExecutiveCTAProps {
  language: "en" | "ar";
}

export default function ExecutiveCTA({ language }: ExecutiveCTAProps) {
  const router = useRouter();
  const isArabic = language === "ar";
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
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
          <p className="text-xl text-white/70 mb-8">
            {isArabic
              ? "انضم إلى المؤسسات الرائدة التي تثق ب BlueDXP"
              : "Join leading enterprises that trust BlueDXP"}
          </p>
          <motion.button
            onClick={() => router.push("/login")}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg flex items-center space-x-2 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isArabic ? "ابدأ الآن" : "Get Started"}</span>
            <RiArrowRightLine className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
