"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  rounded?: boolean;
}

export function SkeletonBox({
  className = "",
  height = "h-4",
  rounded = true,
}: {
  className?: string;
  height?: string;
  rounded?: boolean;
}) {
  return (
    <motion.div
      className={`${height} ${rounded ? "rounded-lg" : ""} bg-gradient-to-r from-white/5 via-white/10 to-white/5 ${className}`}
      animate={{
        backgroundPosition: ["0%", "100%"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={i === lines - 1 ? "h-3" : "h-4"}
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}
    >
      <div className="space-y-4">
        <SkeletonBox height="h-6" className="w-1/2" />
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <SkeletonBox height="h-8" className="w-20" />
          <SkeletonBox height="h-8" className="w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} height="h-4" className="w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox key={colIndex} height="h-4" className="w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({
  className = "",
  count = 1,
  height = "h-4",
  rounded = true,
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={className}
          height={height}
          rounded={rounded}
        />
      ))}
    </>
  );
}
