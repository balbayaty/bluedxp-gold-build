"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  calculateVirtualScroll,
  VirtualScrollConfig,
} from "@/utils/performanceOptimization";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtual List Component
 * Renders only visible items for performance with large lists
 */
export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = "",
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const config: VirtualScrollConfig = {
    itemHeight,
    containerHeight,
    overscan,
  };

  const virtualScroll = useMemo(() => {
    return calculateVirtualScroll(scrollTop, items.length, config);
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: virtualScroll.totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${virtualScroll.offsetY}px)` }}>
          {virtualScroll.visibleItems.map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ height: itemHeight }}
            >
              {renderItem(items[index], index)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
