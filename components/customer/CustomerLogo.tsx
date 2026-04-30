"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface CustomerLogoProps {
  logo?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
    variant?: "light" | "dark" | "full";
  };
  customerName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
  variant?: "default" | "compact" | "full";
}

const sizeClasses = {
  sm: { logo: "h-6", text: "text-xs" },
  md: { logo: "h-8", text: "text-sm" },
  lg: { logo: "h-10", text: "text-base" },
  xl: { logo: "h-12", text: "text-lg" },
};

export default function CustomerLogo({
  logo,
  customerName,
  size = "md",
  className = "",
  showName = false,
  variant = "default",
}: CustomerLogoProps) {
  const sizeConfig = sizeClasses[size];
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fallback: Show customer name initials
  const initials = customerName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fallbackDisplay = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeConfig.logo} aspect-square rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold ${sizeConfig.text}`}
      >
        {initials}
      </div>
      {showName && (
        <span className={`${sizeConfig.text} font-medium text-white/90`}>
          {customerName}
        </span>
      )}
    </div>
  );

  // If no logo, show fallback immediately
  if (!logo || !logo.url) {
    return fallbackDisplay;
  }

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (variant === "compact") {
    // If error, show fallback
    if (imageError) {
      return fallbackDisplay;
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`${sizeConfig.logo} w-auto ${className} relative`}
      >
        {imageLoading && (
          <div
            className={`${sizeConfig.logo} w-16 bg-white/5 rounded animate-pulse`}
          />
        )}
        <img
          src={logo.url}
          alt={logo.alt || customerName}
          className={`${sizeConfig.logo} w-auto object-contain filter drop-shadow-sm ${imageLoading ? "opacity-0 absolute" : "opacity-100"}`}
          style={{
            maxWidth: logo.width ? `${logo.width}px` : undefined,
            maxHeight: logo.height ? `${logo.height}px` : undefined,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
        />
      </motion.div>
    );
  }

  if (variant === "full") {
    // If error, show fallback
    if (imageError) {
      return fallbackDisplay;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 ${className}`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 blur-lg rounded-lg" />
          {imageLoading && (
            <div
              className={`${sizeConfig.logo} w-24 bg-white/5 rounded animate-pulse absolute`}
            />
          )}
          <img
            src={logo.url}
            alt={logo.alt || customerName}
            className={`${sizeConfig.logo} w-auto object-contain relative z-10 filter drop-shadow-lg ${imageLoading ? "opacity-0" : "opacity-100"}`}
            style={{
              maxWidth: logo.width ? `${logo.width}px` : undefined,
              maxHeight: logo.height ? `${logo.height}px` : undefined,
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
          />
        </div>
        {showName && (
          <span className={`${sizeConfig.text} font-semibold text-white/90`}>
            {customerName}
          </span>
        )}
      </motion.div>
    );
  }

  // Default variant
  // If error, show fallback
  if (imageError) {
    return fallbackDisplay;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${sizeConfig.logo} w-auto ${className} relative`}
    >
      {imageLoading && (
        <div
          className={`${sizeConfig.logo} w-20 bg-white/5 rounded animate-pulse`}
        />
      )}
      <img
        src={logo.url}
        alt={logo.alt || customerName}
        className={`${sizeConfig.logo} w-auto object-contain ${imageLoading ? "opacity-0 absolute" : "opacity-100"}`}
        style={{
          maxWidth: logo.width ? `${logo.width}px` : undefined,
          maxHeight: logo.height ? `${logo.height}px` : undefined,
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager"
      />
    </motion.div>
  );
}
