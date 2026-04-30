"use client";

import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { motion } from "framer-motion";
import { SaudiRiyalSymbolSVG } from "./SaudiRiyalSymbol";

interface CurrencyDisplayProps {
  amount: number;
  showSymbol?: boolean;
  showCode?: boolean;
  compact?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "highlight" | "muted";
}

export default function CurrencyDisplay({
  amount,
  showSymbol = true,
  showCode = false,
  compact = false,
  className = "",
  size = "md",
  variant = "default",
}: CurrencyDisplayProps) {
  const { formatCurrency, currencyInfo } = useCurrency();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const variantClasses = {
    default: "text-white",
    highlight: "text-cyan-400 font-semibold",
    muted: "text-gray-400",
  };

  const formattedAmount = formatCurrency(amount, {
    showSymbol: false,
    showCode,
    compact,
  });
  const symbolSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {showSymbol && currencyInfo.code === "SAR" ? (
        <>
          <SaudiRiyalSymbolSVG
            size={symbolSize}
            color={
              variant === "highlight"
                ? "#22d3ee"
                : variant === "muted"
                  ? "#9ca3af"
                  : "#ffffff"
            }
            className="flex-shrink-0"
          />
          <span>{formattedAmount}</span>
        </>
      ) : (
        formatCurrency(amount, { showSymbol, showCode, compact })
      )}
    </span>
  );
}

/**
 * Currency Badge - Shows the current currency symbol prominently
 */
export function CurrencyBadge({ className = "" }: { className?: string }) {
  const { currencyInfo } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 ${className}`}
    >
      {currencyInfo.code === "SAR" ? (
        <SaudiRiyalSymbolSVG size={16} color="#22d3ee" />
      ) : (
        <span className="text-cyan-400 font-semibold text-sm">
          {currencyInfo.symbol}
        </span>
      )}
      <span className="text-gray-300 text-xs">{currencyInfo.code}</span>
    </motion.div>
  );
}

/**
 * Currency Selector - Dropdown to change currency
 */
export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, currencyInfo, setCurrency } = useCurrency();
  const { getAllCurrencies } = require("@/utils/currency");
  const currencies = getAllCurrencies();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {currencyInfo.code === "SAR" ? (
          <SaudiRiyalSymbolSVG size={18} color="#22d3ee" />
        ) : (
          <span className="text-cyan-400 font-semibold">
            {currencyInfo.symbol}
          </span>
        )}
        <span className="text-white text-sm">{currencyInfo.code}</span>
        <i
          className={`ri-arrow-down-s-line text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        ></i>
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 right-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[200px] z-50 shadow-xl"
        >
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                currency === curr.code
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                {curr.code === "SAR" ? (
                  <SaudiRiyalSymbolSVG size={18} color="#22d3ee" />
                ) : (
                  <span className="text-cyan-400 font-semibold">
                    {curr.symbol}
                  </span>
                )}
                <span className="text-white text-sm">{curr.name}</span>
              </div>
              <span className="text-gray-400 text-xs">{curr.code}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
