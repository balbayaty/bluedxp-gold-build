"use client";

import { motion } from "framer-motion";
import { RiDoubleQuotesL } from "react-icons/ri";

interface SaudiTestimonialsProps {
  language: "en" | "ar";
}

export default function SaudiTestimonials({
  language,
}: SaudiTestimonialsProps) {
  const isArabic = language === "ar";
  const testimonials = [
    {
      quote: isArabic
        ? "BlueDXP ساعدتنا على تحقيق أهداف رؤية 2030 بشكل فعال"
        : "BlueDXP helped us achieve Vision 2030 goals effectively",
      author: isArabic ? "مدير تنفيذي، مؤسسة سعودية" : "CEO, Saudi Institution",
    },
  ];
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "شهادات العملاء" : "Client Testimonials"}
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
            >
              <RiDoubleQuotesL className="w-12 h-12 text-[#00ff88] mb-4" />
              <p className="text-white/90 text-lg mb-6">{testimonial.quote}</p>
              <p className="text-white/60">{testimonial.author}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
