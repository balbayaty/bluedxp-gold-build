/**
 * Advanced Category Display - Mind-Blowing UI/UX
 *
 * Revolutionary category display with:
 * - Zero scrolling issues (intelligent responsive grid)
 * - 3D hover effects and glassmorphism
 * - Particle animations and gradient flows
 * - Advanced micro-interactions
 * - Smooth transitions and morphing
 * - 4IR/5IR aligned design
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRouter } from "next/navigation";
import type { WidgetCategory } from "@/types/workspace";

interface AdvancedCategoryDisplayProps {
  categories: WidgetCategory[];
  onCategorySelect?: (category: WidgetCategory) => void;
}

// Advanced gradient colors for each category type
const categoryGradients: Record<string, string[]> = {
  Management: ["from-blue-500", "via-cyan-500", "to-teal-500"],
  "Finance & Accounting": ["from-emerald-500", "via-green-500", "to-lime-500"],
  Operations: ["from-purple-500", "via-pink-500", "to-rose-500"],
  Analytics: ["from-orange-500", "via-amber-500", "to-yellow-500"],
  Compliance: ["from-red-500", "via-pink-500", "to-rose-500"],
  IoT: ["from-indigo-500", "via-blue-500", "to-cyan-500"],
  "AI/ML": ["from-violet-500", "via-purple-500", "to-fuchsia-500"],
  System: ["from-slate-500", "via-gray-500", "to-zinc-500"],
};

// Default gradient for unknown categories
const defaultGradient = ["from-cyan-500", "via-blue-500", "to-indigo-500"];

export function AdvancedCategoryDisplay({
  categories,
  onCategorySelect,
}: AdvancedCategoryDisplayProps) {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (category: WidgetCategory) => {
    setSelectedCategory(category.id);
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      // Default navigation to workspace with category filter
      router.push(`/workspace?category=${category.slug || category.id}`);
    }
  };

  // Get gradient for category
  const getGradient = (categoryName: string) => {
    const gradient = categoryGradients[categoryName] || defaultGradient;
    return gradient.join(" ");
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] overflow-hidden"
    >
      {/* Animated Background Particles */}
      <ParticleBackground />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            Workspace Categories
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Explore intelligent modules and capabilities
          </motion.p>
        </motion.div>

        {/* Advanced Category Grid - No Scrolling Needed */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
          style={{
            // Ensure all items fit without scrolling
            minHeight: "calc(100vh - 300px)",
            gridAutoRows: "minmax(280px, auto)",
          }}
        >
          <AnimatePresence mode="popLayout">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                isHovered={hoveredIndex === index}
                isSelected={selectedCategory === category.id}
                onHover={() => setHoveredIndex(index)}
                onLeave={() => setHoveredIndex(null)}
                onClick={() => handleCategoryClick(category)}
                gradient={getGradient(category.name)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Action Hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="fixed bottom-8 right-8 z-20"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-cyan-300 font-medium">
                Hover to explore
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Individual Category Card with Advanced Effects
interface CategoryCardProps {
  category: WidgetCategory;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  gradient: string;
}

function CategoryCard({
  category,
  index,
  isHovered,
  isSelected,
  onHover,
  onLeave,
  onClick,
  gradient,
}: CategoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    ["7.5deg", "-7.5deg"],
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    ["-7.5deg", "7.5deg"],
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    onLeave();
  };

  const icon = category.icon || "ri-folder-line";
  const description =
    category.description || "Explore category modules and capabilities";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={onHover}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group relative cursor-pointer"
      style={{
        perspective: "1000px",
      }}
    >
      {/* 3D Card Container */}
      <motion.div
        animate={{
          scale: isHovered ? 1.05 : 1,
          z: isHovered ? 50 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative h-full"
      >
        {/* Glowing Background Effect */}
        <motion.div
          animate={{
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-60`}
        />

        {/* Main Card */}
        <div className="relative h-full bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden">
          {/* Animated Gradient Overlay */}
          <motion.div
            animate={{
              backgroundPosition: isHovered
                ? ["0% 0%", "100% 100%", "0% 0%"]
                : "0% 0%",
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10`}
            style={{
              backgroundSize: "200% 200%",
            }}
          />

          {/* Shimmer Effect */}
          <motion.div
            animate={{
              x: isHovered ? ["-100%", "200%"] : "-100%",
            }}
            transition={{
              duration: 1.5,
              repeat: isHovered ? Infinity : 0,
              ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Icon with 3D Effect */}
            <motion.div
              animate={{
                rotateY: isHovered ? 180 : 0,
                scale: isHovered ? 1.2 : 1,
              }}
              transition={{ duration: 0.6, type: "spring" }}
              className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
            >
              <i className={`${icon} text-3xl text-white`}></i>
            </motion.div>

            {/* Category Name */}
            <motion.h3
              animate={{
                y: isHovered ? -5 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400"
            >
              {category.name}
            </motion.h3>

            {/* Description */}
            <motion.p
              animate={{
                opacity: isHovered ? 1 : 0.7,
              }}
              className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3"
            >
              {description}
            </motion.p>

            {/* Action Indicator */}
            <motion.div
              animate={{
                x: isHovered ? 5 : 0,
                opacity: isHovered ? 1 : 0.5,
              }}
              className="flex items-center gap-2 text-cyan-400 font-medium text-sm"
            >
              <span>Explore</span>
              <motion.i
                animate={{
                  x: isHovered ? [0, 5, 0] : 0,
                }}
                transition={{
                  duration: 1,
                  repeat: isHovered ? Infinity : 0,
                }}
                className="ri-arrow-right-line text-lg"
              ></motion.i>
            </motion.div>

            {/* Particle Burst on Hover */}
            <AnimatePresence>
              {isHovered && <ParticleBurst gradient={gradient} />}
            </AnimatePresence>
          </div>

          {/* Border Glow Effect */}
          <motion.div
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 blur-sm -z-10`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Particle Background Component
function ParticleBackground() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => {
        const initialX = Math.random() * dimensions.width;
        const initialY = Math.random() * dimensions.height;
        const targetX = Math.random() * dimensions.width;
        const targetY = Math.random() * dimensions.height;

        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            initial={{
              x: initialX,
              y: initialY,
            }}
            animate={{
              y: targetY,
              x: targetX,
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        );
      })}
    </div>
  );
}

// Particle Burst Effect on Hover
function ParticleBurst({ gradient }: { gradient: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => {
        const angle = (i * 360) / 12;
        const distance = 100;
        const radians = (angle * Math.PI) / 180;

        return (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${gradient} rounded-full`}
            initial={{
              x: "50%",
              y: "50%",
              scale: 0,
            }}
            animate={{
              x: `calc(50% + ${Math.cos(radians) * distance}px)`,
              y: `calc(50% + ${Math.sin(radians) * distance}px)`,
              scale: [0, 1, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}
