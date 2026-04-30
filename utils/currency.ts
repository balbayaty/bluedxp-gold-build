/**
 * Currency Utility Functions
 * Main currency: SAR (Saudi Riyal)
 * Symbol: ر.س
 */

export type CurrencyCode = 'SAR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'KWD' | 'BHD' | 'OMR' | 'QAR' | 'JOD'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
  locale: string
}

export const currencies: Record<CurrencyCode, Currency> = {
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'ar-SA',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-EU',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'en-GB',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'ar-AE',
  },
  KWD: {
    code: 'KWD',
    symbol: 'د.ك',
    name: 'Kuwaiti Dinar',
    symbolPosition: 'before',
    decimalPlaces: 3,
    locale: 'ar-KW',
  },
  BHD: {
    code: 'BHD',
    symbol: 'د.ب',
    name: 'Bahraini Dinar',
    symbolPosition: 'before',
    decimalPlaces: 3,
    locale: 'ar-BH',
  },
  OMR: {
    code: 'OMR',
    symbol: 'ر.ع.',
    name: 'Omani Rial',
    symbolPosition: 'before',
    decimalPlaces: 3,
    locale: 'ar-OM',
  },
  QAR: {
    code: 'QAR',
    symbol: 'ر.ق',
    name: 'Qatari Riyal',
    symbolPosition: 'before',
    decimalPlaces: 2,
    locale: 'ar-QA',
  },
  JOD: {
    code: 'JOD',
    symbol: 'د.أ',
    name: 'Jordanian Dinar',
    symbolPosition: 'before',
    decimalPlaces: 3,
    locale: 'ar-JO',
  },
}

export const DEFAULT_CURRENCY: CurrencyCode = 'SAR'

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options?: {
    showSymbol?: boolean
    showCode?: boolean
    compact?: boolean
  }
): string {
  const currency = currencies[currencyCode]
  const { showSymbol = true, showCode = false, compact = false } = options || {}

  // Format number with proper decimal places
  const formattedAmount = amount.toFixed(currency.decimalPlaces)

  // Add thousand separators
  const parts = formattedAmount.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const formattedNumber = parts.join('.')

  // Build the currency string
  let result = formattedNumber

  if (compact && amount >= 1000) {
    if (amount >= 1000000) {
      result = `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      result = `${(amount / 1000).toFixed(1)}K`
    }
  }

  if (showSymbol) {
    if (currency.symbolPosition === 'before') {
      result = `${currency.symbol} ${result}`
    } else {
      result = `${result} ${currency.symbol}`
    }
  }

  if (showCode) {
    result = `${result} (${currency.code})`
  }

  return result
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string, currencyCode: CurrencyCode = DEFAULT_CURRENCY): number {
  const currency = currencies[currencyCode]
  // Remove currency symbol and formatting
  let cleaned = value
    .replace(currency.symbol, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim()

  return parseFloat(cleaned) || 0
}

/**
 * Convert currency from one to another (basic conversion, in production use real exchange rates)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount

  // In production, use real-time exchange rates
  // For now, using approximate rates
  const rates: Record<string, number> = exchangeRates || {
    'SAR-USD': 0.27,
    'SAR-EUR': 0.25,
    'SAR-GBP': 0.21,
    'SAR-AED': 0.98,
    'SAR-KWD': 0.082,
    'SAR-BHD': 0.10,
    'SAR-OMR': 0.10,
    'SAR-QAR': 0.98,
    'SAR-JOD': 0.19,
  }

  const rateKey = `${fromCurrency}-${toCurrency}`
  const reverseRateKey = `${toCurrency}-${fromCurrency}`

  if (rates[rateKey]) {
    return amount * rates[rateKey]
  } else if (rates[reverseRateKey]) {
    return amount / rates[reverseRateKey]
  }

  // Default: return same amount if no rate found
  return amount
}

/**
 * Get currency info
 */
export function getCurrency(currencyCode: CurrencyCode = DEFAULT_CURRENCY): Currency {
  return currencies[currencyCode]
}

/**
 * Get all available currencies
 */
export function getAllCurrencies(): Currency[] {
  return Object.values(currencies)
}


