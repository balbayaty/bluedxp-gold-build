'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { CurrencyCode, DEFAULT_CURRENCY, getCurrency, Currency } from '@/utils/currency'

interface CurrencyContextType {
  currency: CurrencyCode
  currencyInfo: Currency
  setCurrency: (currency: CurrencyCode) => void
  formatCurrency: (amount: number, options?: { showSymbol?: boolean; showCode?: boolean; compact?: boolean }) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // HYDRATION-SAFE: Start with DEFAULT_CURRENCY on both server and client
  // Then read from localStorage AFTER mount to avoid hydration mismatch
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY)

  // Read from localStorage AFTER mount (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedCurrency = localStorage.getItem('app-currency') as CurrencyCode
    if (savedCurrency && Object.keys(getCurrency()).includes(savedCurrency)) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  // Save currency to localStorage when it changes
  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-currency', newCurrency)
    }
  }

  const currencyInfo = getCurrency(currency)

  const formatCurrency = useCallback((
    amount: number,
    options?: { showSymbol?: boolean; showCode?: boolean; compact?: boolean }
  ): string => {
    // Use currencyInfo from outer scope
    const info = getCurrency(currency)
    const symbol = options?.showSymbol !== false ? info.symbol : ''
    const code = options?.showCode ? ` ${currency}` : ''
    
    if (typeof window === 'undefined') {
      // Server-side: return simple format
      return `${symbol}${amount.toFixed(2)}${code}`
    }
    
    // Client-side: use Intl.NumberFormat
    try {
      const formatted = new Intl.NumberFormat(info.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
      
      if (options?.compact) {
        return formatted.replace(info.symbol, '').trim() + code
      }
      return formatted
    } catch (error) {
      // Fallback formatting
      return `${symbol}${amount.toFixed(2)}${code}`
    }
  }, [currency])

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        formatCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}


