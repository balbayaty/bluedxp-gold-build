"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TestimonialsSectionProps {
  language: "en" | "ar";
}

export default function TestimonialsSection({
  language,
}: TestimonialsSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote:
        language === "en"
          ? "Bluedxp transformed our operations. Decision-making is now 95% faster, and compliance is automatic."
          : "حوّلت Bluedxp عملياتنا. اتخاذ القرارات الآن أسرع بنسبة 95%، والامتثال تلقائي.",
      author: language === "en" ? "Ahmed Al-Mansouri" : "أحمد المنصوري",
      role:
        language === "en"
          ? "CEO, Logistics Corp"
          : "الرئيس التنفيذي، شركة اللوجستيات",
      company: "Logistics Corp",
    },
    {
      quote:
        language === "en"
          ? "The AI-powered insights have eliminated 80% of our manual compliance work. Game-changing."
          : "الرؤى المدعومة بالذكاء الاصطناعي ألغت 80% من عمل الامتثال اليدوي. تغيير جذري.",
      author: language === "en" ? "Sarah Johnson" : "سارة جونسون",
      role: language === "en" ? "Operations Director" : "مديرة العمليات",
      company: "Pharma Supply",
    },
    {
      quote:
        language === "en"
          ? "Real-time intelligence across our entire supply chain. We can't imagine operating without it."
          : "ذكاء لحظي عبر سلسلة إمدادنا بالكامل. لا يمكننا تخيل العمل بدونه.",
      author: language === "en" ? "Mohammed Hassan" : "محمد حسن",
      role: language === "en" ? "Supply Chain Manager" : "مدير سلسلة الإمداد",
      company: "Manufacturing Plus",
    },
  ];

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-b from-transparent to-[#8b5cf6]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#8b5cf6] bg-clip-text text-transparent">
              {language === "en"
                ? "Trusted by Industry Leaders"
                : "موثوق به من قبل قادة الصناعة"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-[#8b5cf6]/50 transition-all"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className="ri-star-fill text-[#f59e0b] text-xl"
                  ></i>
                ))}
              </div>
              <p className="text-white/80 mb-6 leading-relaxed text-lg">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6]/20 to-[#05a4ff]/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-[#8b5cf6]">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-white/60">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
