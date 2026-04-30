"use client";

import { motion } from "framer-motion";
import { RiDoubleQuotesL } from "react-icons/ri";

interface ExecutiveTestimonialsProps {
  language: "en" | "ar";
}

export default function ExecutiveTestimonials({
  language,
}: ExecutiveTestimonialsProps) {
  const isArabic = language === "ar";
  const testimonials = [
    {
      quote: isArabic
        ? "BlueDXP غيرت طريقة عملنا بالكامل. الكفاءة والامتثال في مستوى لا يصدق."
        : "BlueDXP has completely transformed how we operate. The efficiency and compliance levels are incredible.",
      author: isArabic
        ? "مدير تنفيذي، شركة فورتشن 500"
        : "CEO, Fortune 500 Company",
    },
    {
      quote: isArabic
        ? "أفضل استثمار قمنا به. النظام يعمل بشكل مستقل ويوفر لنا الوقت والموارد."
        : "Best investment we've made. The system works autonomously and saves us time and resources.",
      author: isArabic
        ? "مدير العمليات، مؤسسة حكومية"
        : "Operations Director, Government Institution",
    },
  ];
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
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
              transition={{ delay: i * 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
            >
              <RiDoubleQuotesL className="w-12 h-12 text-blue-400 mb-4" />
              <p className="text-white/90 text-lg mb-6">{testimonial.quote}</p>
              <p className="text-white/60">{testimonial.author}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
