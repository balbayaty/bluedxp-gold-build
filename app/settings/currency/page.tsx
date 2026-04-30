"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getAllCurrencies, Currency } from "@/utils/currency";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { SaudiRiyalSymbolSVG } from "@/components/SaudiRiyalSymbol";

export default function CurrencySettings() {
  const { currency, currencyInfo, setCurrency, formatCurrency } = useCurrency();
  const currencies = getAllCurrencies();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency as any);
    setCurrency(newCurrency as any);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Currency Settings
          </h1>
          <p className="text-gray-400">
            Configure your default currency and preferences
          </p>
        </motion.div>

        {/* Current Currency Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Current Currency
              </h2>
              <p className="text-gray-400 text-sm">
                This currency will be used throughout the platform
              </p>
            </div>
            <div className="text-right">
              {currencyInfo.code === "SAR" ? (
                <div className="flex items-center justify-end mb-1">
                  <SaudiRiyalSymbolSVG size={48} color="#22d3ee" />
                </div>
              ) : (
                <div className="text-3xl font-bold text-cyan-400 mb-1">
                  {currencyInfo.symbol}
                </div>
              )}
              <div className="text-sm text-gray-400">{currencyInfo.name}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs mb-1">Example Amount</div>
              <CurrencyDisplay amount={1234.56} size="lg" variant="highlight" />
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs mb-1">Large Amount</div>
              <CurrencyDisplay
                amount={1234567.89}
                compact
                size="lg"
                variant="highlight"
              />
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-gray-400 text-xs mb-1">Small Amount</div>
              <CurrencyDisplay amount={12.34} size="lg" variant="highlight" />
            </div>
          </div>
        </motion.div>

        {/* Currency Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Select Currency</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencies.map((curr) => (
              <motion.button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedCurrency === curr.code
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedCurrency === curr.code
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                          : "bg-white/10"
                      }`}
                    >
                      {curr.code === "SAR" ? (
                        <SaudiRiyalSymbolSVG
                          size={24}
                          color={
                            selectedCurrency === curr.code
                              ? "#ffffff"
                              : "#22d3ee"
                          }
                        />
                      ) : (
                        <span
                          className={`text-xl font-bold ${
                            selectedCurrency === curr.code
                              ? "text-white"
                              : "text-cyan-400"
                          }`}
                        >
                          {curr.symbol}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {curr.name}
                      </div>
                      <div className="text-gray-400 text-sm">{curr.code}</div>
                    </div>
                  </div>
                  {selectedCurrency === curr.code && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <i className="ri-check-line text-white text-sm"></i>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Decimal Places: {curr.decimalPlaces} • Locale: {curr.locale}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Currency Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                About Currency Settings
              </h3>
              <p className="text-gray-300 text-sm mb-3">
                The selected currency will be used as the default throughout the
                platform. All monetary values will be displayed using this
                currency's symbol and formatting.
              </p>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Currency preference is saved automatically</li>
                <li>
                  • The currency symbol (ر.س for SAR) is visible in the header
                </li>
                <li>
                  • All financial reports and transactions use this currency
                </li>
                <li>
                  • You can change the currency at any time from this page
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
