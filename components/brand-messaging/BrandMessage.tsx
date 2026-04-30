"use client";

import React, { useState, useEffect } from "react";
import { useBrandMessaging } from "@/lib/services/brand-messaging/useBrandMessaging";
import type { MessagingType, MessagingContext } from "@/types/brand-messaging";

interface BrandMessageProps {
  type: MessagingType;
  context: MessagingContext;
  className?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  fallback?: string;
  showLoading?: boolean;
  onGenerated?: (text: string) => void;
}

export const BrandMessage: React.FC<BrandMessageProps> = ({
  type,
  context,
  className,
  as: Component = "span",
  fallback,
  showLoading = false,
  onGenerated,
}) => {
  const { getMessage, currentLanguage, isLoading } = useBrandMessaging();
  const [text, setText] = useState(fallback || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMessage = async () => {
      try {
        const messageText = await getMessage(type, context);
        if (!cancelled) {
          setText(messageText);
          setError(null);
          onGenerated?.(messageText);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load message",
          );
          if (fallback) {
            setText(fallback);
          }
        }
      }
    };

    loadMessage();

    return () => {
      cancelled = true;
    };
  }, [type, context, currentLanguage, getMessage, fallback, onGenerated]);

  if (isLoading && showLoading) {
    return (
      <Component className={className}>
        <span className="animate-pulse text-gray-400">Loading...</span>
      </Component>
    );
  }

  if (error && !text) {
    return (
      <Component className={className}>
        <span className="text-red-500 text-sm">{error}</span>
      </Component>
    );
  }

  return (
    <Component
      className={className}
      dir={currentLanguage === "ar" ? "rtl" : "ltr"}
    >
      {text || fallback || "..."}
    </Component>
  );
};
