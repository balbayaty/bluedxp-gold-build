"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface EnterpriseTestimonialsProps {
  language: "en" | "ar";
}

export default function EnterpriseTestimonials({
  language,
}: EnterpriseTestimonialsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      quote:
        language === "en"
          ? "Bluedxp transformed our operations. Decision-making is now 95% faster, and compliance is automatic. The ROI was evident within the first quarter."
          : "حوّلت Bluedxp عملياتنا. اتخاذ القرارات الآن أسرع بنسبة 95%، والامتثال تلقائي. كان عائد الاستثمار واضحًا في الربع الأول.",
      author: language === "en" ? "Ahmed Al-Mansouri" : "أحمد المنصوري",
      role:
        language === "en"
          ? "CEO, Logistics Corp"
          : "الرئيس التنفيذي، شركة اللوجستيات",
      company: "Fortune 500",
      logo: "🏢",
    },
    {
      quote:
        language === "en"
          ? "The AI-powered insights have eliminated 80% of our manual compliance work. Game-changing technology that pays for itself."
          : "الرؤى المدعومة بالذكاء الاصطناعي ألغت 80% من عمل الامتثال اليدوي. تقنية تغير قواعد اللعبة تدفع تكلفتها بنفسها.",
      author: language === "en" ? "Sarah Johnson" : "سارة جونسون",
      role: language === "en" ? "Operations Director" : "مديرة العمليات",
      company: "Enterprise",
      logo: "🏭",
    },
    {
      quote:
        language === "en"
          ? "Real-time intelligence across our entire supply chain. We can't imagine operating without it. McKinsey-level insights at our fingertips."
          : "ذكاء لحظي عبر سلسلة إمدادنا بالكامل. لا يمكننا تخيل العمل بدونه. رؤى على مستوى McKinsey في متناول أيدينا.",
      author: language === "en" ? "Mohammed Hassan" : "محمد حسن",
      role: language === "en" ? "Supply Chain Manager" : "مدير سلسلة الإمداد",
      company: "Global",
      logo: "🌍",
    },
  ];

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#f59e0b] bg-clip-text text-transparent">
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
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -10 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 hover:border-[#f59e0b]/50 transition-all"
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
                <div className="w-16 h-16 bg-gradient-to-br from-[#f59e0b]/20 to-[#05a4ff]/20 rounded-2xl flex items-center justify-center text-3xl">
                  {testimonial.logo}
                </div>
                <div>
                  <div className="font-bold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-white/60">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-[#f59e0b] mt-1">
                    {testimonial.company}
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
