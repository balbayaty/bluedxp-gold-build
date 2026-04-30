"use client";

import { motion } from "framer-motion";

interface SaudiPartnershipsProps {
  language: "en" | "ar";
}

export default function SaudiPartnerships({
  language,
}: SaudiPartnershipsProps) {
  const isArabic = language === "ar";
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "الشراكات الاستراتيجية" : "Strategic Partnerships"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "شراكات مع المؤسسات السعودية الرائدة"
              : "Partnerships with leading Saudi institutions"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
