"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

interface ExecutiveTestimonialsProps {
  language: "en" | "ar";
}

export default function ExecutiveTestimonials({
  language,
}: ExecutiveTestimonialsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      quote:
        language === "en"
          ? "Bluedxp transformed our operations completely. Decision-making is now 95% faster, and compliance is fully automatic. The ROI was evident within the first quarter. This is McKinsey-level intelligence at our fingertips."
          : "حوّلت Bluedxp عملياتنا بشكل كامل. اتخاذ القرارات الآن أسرع بنسبة 95%، والامتثال تلقائي بالكامل. كان عائد الاستثمار واضحًا في الربع الأول. هذا ذكاء على مستوى McKinsey في متناول أيدينا.",
      author: language === "en" ? "Ahmed Al-Mansouri" : "أحمد المنصوري",
      role: language === "en" ? "CEO & Chairman" : "الرئيس التنفيذي والرئيس",
      company: "Al-Mansouri Logistics Group",
      revenue: "$2.5B",
      employees: "5,000+",
      image: "👨‍💼",
      color: "#05a4ff",
    },
    {
      quote:
        language === "en"
          ? "The AI-powered insights have eliminated 80% of our manual compliance work while improving accuracy to 99.7%. This is the future of enterprise operations. Game-changing technology that pays for itself in months."
          : "الرؤى المدعومة بالذكاء الاصطناعي ألغت 80% من عمل الامتثال اليدوي بينما حسّنت الدقة إلى 99.7%. هذا مستقبل عمليات المؤسسات. تقنية تغير قواعد اللعبة تدفع تكلفتها في أشهر.",
      author: language === "en" ? "Dr. Sarah Johnson" : "د. سارة جونسون",
      role:
        language === "en"
          ? "Chief Operations Officer"
          : "مديرة العمليات الرئيسية",
      company: "PharmaSupply International",
      revenue: "$1.8B",
      employees: "3,500+",
      image: "👩‍💼",
      color: "#00d4a8",
    },
    {
      quote:
        language === "en"
          ? "Real-time intelligence across our entire supply chain network spanning 12 countries. We can't imagine operating without it. The platform has become our central nervous system. Deloitte-grade insights, EY-level compliance."
          : "ذكاء لحظي عبر شبكة سلسلة الإمداد بأكملها في 12 دولة. لا يمكننا تخيل العمل بدونه. أصبحت المنصة جهازنا العصبي المركزي. رؤى على مستوى Deloitte، امتثال على مستوى EY.",
      author: language === "en" ? "Mohammed Hassan" : "محمد حسن",
      role:
        language === "en"
          ? "Executive VP, Supply Chain"
          : "نائب الرئيس التنفيذي، سلسلة الإمداد",
      company: "Gulf Manufacturing Corp",
      revenue: "$3.2B",
      employees: "8,000+",
      image: "🧑‍💼",
      color: "#8b5cf6",
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#f59e0b] to-[#ef4444] bg-clip-text text-transparent">
              {language === "en"
                ? "Trusted by Fortune 500 Leaders"
                : "موثوق به من قبل قادة Fortune 500"}
            </span>
          </h2>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border-2 rounded-3xl p-12 shadow-2xl"
                style={{
                  borderColor: testimonials[activeTestimonial].color + "60",
                  boxShadow: `0 30px 80px ${testimonials[activeTestimonial].color}40`,
                }}
              >
                <div className="flex items-center gap-2 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className="ri-star-fill text-[#f59e0b] text-3xl"
                    ></i>
                  ))}
                </div>

                <p className="text-2xl md:text-3xl text-white/90 mb-10 leading-relaxed font-medium">
                  "{testimonials[activeTestimonial].quote}"
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-2xl"
                      style={{
                        backgroundColor: `${testimonials[activeTestimonial].color}30`,
                      }}
                    >
                      {testimonials[activeTestimonial].image}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {testimonials[activeTestimonial].author}
                      </div>
                      <div className="text-white/70">
                        {testimonials[activeTestimonial].role}
                      </div>
                      <div
                        className="text-sm font-semibold mt-1"
                        style={{ color: testimonials[activeTestimonial].color }}
                      >
                        {testimonials[activeTestimonial].company}
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-sm text-white/60 mb-1">
                      {language === "en" ? "Revenue" : "الإيرادات"}
                    </div>
                    <div className="text-xl font-bold text-[#00d4a8]">
                      {testimonials[activeTestimonial].revenue}
                    </div>
                    <div className="text-sm text-white/60 mt-2">
                      {language === "en" ? "Employees" : "الموظفون"}
                    </div>
                    <div className="text-xl font-bold text-[#8b5cf6]">
                      {testimonials[activeTestimonial].employees}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-4 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeTestimonial === index ? "w-12" : ""
                  }`}
                  style={{
                    backgroundColor:
                      activeTestimonial === index
                        ? testimonials[index].color
                        : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
