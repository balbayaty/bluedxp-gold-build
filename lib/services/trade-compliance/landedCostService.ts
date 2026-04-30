/**
 * Landed Cost Calculation Service
 * Calculates comprehensive landed costs including all fees, duties, taxes, and charges
 */

import {
  LandedCostBreakdown,
  CostItem,
  CostCategory,
  TradeComplianceRecord,
  ExchangeRate,
  ProductCostBreakdown,
  CountryCode,
} from "@/types/trade-compliance";

// ============================================================================
// LANDED COST CALCULATION
// ============================================================================

/**
 * Calculate comprehensive landed cost for trade compliance record
 */
export async function calculateLandedCost(
  record: TradeComplianceRecord,
  exchangeRates?: ExchangeRate[],
): Promise<LandedCostBreakdown> {
  const baseCurrency = record.currency || "SAR";
  const rates = exchangeRates || (await getDefaultExchangeRates(baseCurrency));

  const breakdown: LandedCostBreakdown = {
    id: `lc-${record.id}-${Date.now()}`,
    tradeComplianceRecordId: record.id,

    // Product Costs
    productCost: createCostItem(
      "Product Cost",
      "Total product value",
      record.totalValue,
      record.currency,
      baseCurrency,
      rates,
      "PRODUCT",
      false,
    ),

    // Freight Cost
    freightCost: calculateFreightCost(record, baseCurrency, rates),

    // Insurance Cost
    insuranceCost: calculateInsuranceCost(record, baseCurrency, rates),

    // Customs & Duties
    customsDuty: calculateCustomsDuty(record, baseCurrency, rates),
    vat: calculateVAT(record, baseCurrency, rates),
    exciseTax: calculateExciseTax(record, baseCurrency, rates),
    otherTaxes: calculateOtherTaxes(record, baseCurrency, rates),

    // License & Compliance Costs
    licenseFees: calculateLicenseFees(record, baseCurrency, rates),
    complianceFees: calculateComplianceFees(record, baseCurrency, rates),
    inspectionFees: calculateInspectionFees(record, baseCurrency, rates),

    // Handling & Logistics
    handlingFees: calculateHandlingFees(record, baseCurrency, rates),
    storageFees: calculateStorageFees(record, baseCurrency, rates),
    documentationFees: calculateDocumentationFees(record, baseCurrency, rates),

    // Other Costs
    bankCharges: calculateBankCharges(record, baseCurrency, rates),
    currencyConversion: calculateCurrencyConversion(
      record,
      baseCurrency,
      rates,
    ),
    otherFees: [],

    // Totals (will be calculated)
    subtotal: 0,
    totalTaxes: 0,
    totalFees: 0,
    totalCost: 0,
    currency: baseCurrency,

    // Exchange Rates
    exchangeRates: rates,

    // Product Breakdown (will be calculated)
    productBreakdown: [],

    calculatedAt: new Date().toISOString(),
  };

  // Calculate totals
  breakdown.subtotal =
    breakdown.productCost.amountInBaseCurrency +
    breakdown.freightCost.amountInBaseCurrency +
    breakdown.insuranceCost.amountInBaseCurrency;

  breakdown.totalTaxes =
    breakdown.customsDuty.amountInBaseCurrency +
    breakdown.vat.amountInBaseCurrency +
    (breakdown.exciseTax?.amountInBaseCurrency || 0) +
    breakdown.otherTaxes.reduce(
      (sum, tax) => sum + tax.amountInBaseCurrency,
      0,
    );

  breakdown.totalFees =
    breakdown.licenseFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    breakdown.complianceFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    breakdown.inspectionFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    breakdown.handlingFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    breakdown.storageFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    breakdown.documentationFees.reduce(
      (sum, fee) => sum + fee.amountInBaseCurrency,
      0,
    ) +
    (breakdown.bankCharges?.amountInBaseCurrency || 0) +
    (breakdown.currencyConversion?.amountInBaseCurrency || 0) +
    breakdown.otherFees.reduce((sum, fee) => sum + fee.amountInBaseCurrency, 0);

  breakdown.totalCost =
    breakdown.subtotal + breakdown.totalTaxes + breakdown.totalFees;

  // Calculate product breakdown
  breakdown.productBreakdown = calculateProductBreakdown(record, breakdown);

  return breakdown;
}

// ============================================================================
// COST CALCULATION HELPERS
// ============================================================================

function createCostItem(
  name: string,
  description: string,
  amount: number,
  currency: string,
  baseCurrency: string,
  exchangeRates: ExchangeRate[],
  category: CostCategory,
  estimated: boolean,
  required: boolean = true,
): CostItem {
  const rate = getExchangeRate(currency, baseCurrency, exchangeRates);
  const amountInBaseCurrency = amount * rate;

  return {
    id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    description,
    amount,
    currency,
    exchangeRate: rate,
    amountInBaseCurrency,
    baseCurrency,
    category,
    required,
    estimated,
  };
}

function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[],
): number {
  if (fromCurrency === toCurrency) return 1;

  const rate = rates.find(
    (r) =>
      (r.fromCurrency === fromCurrency && r.toCurrency === toCurrency) ||
      (r.fromCurrency === toCurrency && r.toCurrency === fromCurrency),
  );

  if (rate) {
    return rate.fromCurrency === fromCurrency ? rate.rate : 1 / rate.rate;
  }

  // Default rates (should be fetched from API in production)
  const defaultRates: Record<string, number> = {
    SAR: 1,
    USD: 3.75,
    EUR: 4.1,
    GBP: 4.75,
    AED: 1.02,
    KWD: 12.25,
    QAR: 1.03,
    BHD: 9.95,
    OMR: 9.75,
  };

  const fromRate = defaultRates[fromCurrency] || 1;
  const toRate = defaultRates[toCurrency] || 1;

  return fromRate / toRate;
}

async function getDefaultExchangeRates(
  baseCurrency: string,
): Promise<ExchangeRate[]> {
  // In production, fetch from exchange rate API
  const currencies = [
    "SAR",
    "USD",
    "EUR",
    "GBP",
    "AED",
    "KWD",
    "QAR",
    "BHD",
    "OMR",
  ];
  const rates: ExchangeRate[] = [];

  for (const currency of currencies) {
    if (currency !== baseCurrency) {
      rates.push({
        fromCurrency: baseCurrency,
        toCurrency: currency,
        rate: getExchangeRate(baseCurrency, currency, []),
        date: new Date().toISOString(),
        source: "Default",
      });
    }
  }

  return rates;
}

// ============================================================================
// FREIGHT & INSURANCE
// ============================================================================

function calculateFreightCost(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem {
  // Freight cost based on shipment mode, weight, volume, and distance
  let freightAmount = 0;
  const totalWeight = record.products.reduce((sum, p) => sum + p.weight, 0);
  const totalVolume = record.products.reduce((sum, p) => sum + p.volume, 0);

  const freightRates: Record<
    string,
    { perKg: number; perM3: number; base: number }
  > = {
    AIR: { perKg: 5, perM3: 200, base: 500 },
    SEA: { perKg: 0.5, perM3: 50, base: 1000 },
    LAND: { perKg: 0.3, perM3: 30, base: 300 },
    RAIL: { perKg: 0.4, perM3: 40, base: 400 },
    COURIER: { perKg: 8, perM3: 300, base: 200 },
  };

  const rate = freightRates[record.shipmentMode] || freightRates["LAND"];
  freightAmount =
    rate.base + totalWeight * rate.perKg + totalVolume * rate.perM3;

  // Add distance factor (simplified)
  if (record.originPort && record.destinationPort) {
    // Estimate distance (in production, use actual distance calculation)
    const estimatedDistance = 1000; // km
    freightAmount += estimatedDistance * 0.5;
  }

  return createCostItem(
    "Freight Cost",
    `Freight cost for ${record.shipmentMode} shipment`,
    freightAmount,
    baseCurrency,
    baseCurrency,
    rates,
    "FREIGHT",
    true,
  );
}

function calculateInsuranceCost(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem {
  // Insurance typically 0.1% to 0.5% of product value
  const insuranceRate = 0.002; // 0.2%
  const insuranceAmount = record.totalValue * insuranceRate;

  return createCostItem(
    "Insurance Cost",
    "Marine/Transport insurance",
    insuranceAmount,
    record.currency,
    baseCurrency,
    rates,
    "INSURANCE",
    true,
  );
}

// ============================================================================
// CUSTOMS & DUTIES
// ============================================================================

function calculateCustomsDuty(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem {
  // Customs duty varies by country and product
  // Saudi Arabia: typically 5% for most products, 0% for GCC countries
  let dutyRate = 0.05; // 5% default

  // GCC countries: 0% duty
  const gccCountries: CountryCode[] = ["SA", "AE", "KW", "QA", "BH", "OM"];
  if (
    gccCountries.includes(record.originCountry) &&
    gccCountries.includes(record.destinationCountry)
  ) {
    dutyRate = 0;
  }

  // Special rates for certain products
  if (
    record.products.some(
      (p) => p.category === "MEDICINE" || p.category === "FOOD",
    )
  ) {
    dutyRate = 0.05; // 5% for food and medicine
  }

  const dutyAmount = record.totalValue * dutyRate;

  return createCostItem(
    "Customs Duty",
    `Customs duty at ${(dutyRate * 100).toFixed(1)}%`,
    dutyAmount,
    baseCurrency,
    baseCurrency,
    rates,
    "CUSTOMS_DUTY",
    true,
  );
}

function calculateVAT(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem {
  // VAT calculation: (Product + Freight + Insurance + Duty) * VAT Rate
  // Saudi Arabia: 15% VAT
  const vatRate = 0.15; // 15%

  // Calculate base for VAT (simplified - would include freight, insurance, duty)
  const vatBase = record.totalValue * 1.1; // Approximate with 10% for freight/insurance
  const vatAmount = vatBase * vatRate;

  return createCostItem(
    "VAT",
    `Value Added Tax at ${(vatRate * 100).toFixed(1)}%`,
    vatAmount,
    baseCurrency,
    baseCurrency,
    rates,
    "VAT",
    true,
  );
}

function calculateExciseTax(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem | undefined {
  // Excise tax applies to specific products (tobacco, energy drinks, etc.)
  const exciseProducts = ["TOBACCO", "ENERGY_DRINKS", "SOFT_DRINKS"];
  const hasExciseProducts = record.products.some((p) =>
    exciseProducts.some((ep) => p.name.toUpperCase().includes(ep)),
  );

  if (!hasExciseProducts) return undefined;

  const exciseRate = 0.5; // 50% excise tax
  const exciseAmount = record.totalValue * exciseRate;

  return createCostItem(
    "Excise Tax",
    `Excise tax at ${(exciseRate * 100).toFixed(1)}%`,
    exciseAmount,
    baseCurrency,
    baseCurrency,
    rates,
    "EXCISE_TAX",
    true,
  );
}

function calculateOtherTaxes(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const taxes: CostItem[] = [];

  // Additional taxes based on country and product type
  // This would be expanded based on actual tax regulations

  return taxes;
}

// ============================================================================
// LICENSE & COMPLIANCE FEES
// ============================================================================

function calculateLicenseFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  for (const license of record.requiredLicenses) {
    if (license.cost && license.cost > 0) {
      fees.push(
        createCostItem(
          `${license.licenseType} License Fee`,
          `License fee for ${license.licenseType}`,
          license.cost,
          license.currency || baseCurrency,
          baseCurrency,
          rates,
          "LICENSE_FEE",
          false,
        ),
      );
    }
  }

  return fees;
}

function calculateComplianceFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  // Compliance fees for various regulatory requirements
  // Civil Defense inspection fee
  if (record.products.some((p) => p.category === "CHEMICALS")) {
    fees.push(
      createCostItem(
        "Civil Defense Compliance Fee",
        "Compliance fee for chemical products",
        200,
        baseCurrency,
        baseCurrency,
        rates,
        "COMPLIANCE_FEE",
        true,
      ),
    );
  }

  // SFDA compliance fee
  if (
    record.products.some(
      (p) => p.category === "FOOD" || p.category === "MEDICINE",
    )
  ) {
    fees.push(
      createCostItem(
        "SFDA Compliance Fee",
        "Compliance fee for food/medicine products",
        300,
        baseCurrency,
        baseCurrency,
        rates,
        "COMPLIANCE_FEE",
        true,
      ),
    );
  }

  return fees;
}

function calculateInspectionFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  // Inspection fees vary by product type
  if (record.products.some((p) => p.category === "FOOD")) {
    fees.push(
      createCostItem(
        "Food Inspection Fee",
        "Inspection fee for food products",
        500,
        baseCurrency,
        baseCurrency,
        rates,
        "INSPECTION_FEE",
        true,
      ),
    );
  }

  if (record.products.some((p) => p.category === "CHEMICALS")) {
    fees.push(
      createCostItem(
        "Chemical Inspection Fee",
        "Inspection fee for chemical products",
        800,
        baseCurrency,
        baseCurrency,
        rates,
        "INSPECTION_FEE",
        true,
      ),
    );
  }

  return fees;
}

// ============================================================================
// HANDLING & LOGISTICS FEES
// ============================================================================

function calculateHandlingFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  // Handling fees based on weight and volume
  const totalWeight = record.products.reduce((sum, p) => sum + p.weight, 0);
  const handlingFee = totalWeight * 0.5; // SAR 0.5 per kg

  fees.push(
    createCostItem(
      "Handling Fee",
      "Warehouse handling and processing fee",
      handlingFee,
      baseCurrency,
      baseCurrency,
      rates,
      "HANDLING_FEE",
      true,
    ),
  );

  return fees;
}

function calculateStorageFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  // Storage fees if goods are stored before clearance
  // Estimated 7 days storage
  const totalVolume = record.products.reduce((sum, p) => sum + p.volume, 0);
  const dailyStorageRate = 10; // SAR per m³ per day
  const storageDays = 7;
  const storageFee = totalVolume * dailyStorageRate * storageDays;

  fees.push(
    createCostItem(
      "Storage Fee",
      `Storage fee for ${storageDays} days`,
      storageFee,
      baseCurrency,
      baseCurrency,
      rates,
      "STORAGE_FEE",
      true,
    ),
  );

  return fees;
}

function calculateDocumentationFees(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem[] {
  const fees: CostItem[] = [];

  // Documentation fees
  fees.push(
    createCostItem(
      "Documentation Fee",
      "Customs documentation and processing fee",
      200,
      baseCurrency,
      baseCurrency,
      rates,
      "DOCUMENTATION_FEE",
      true,
    ),
  );

  return fees;
}

// ============================================================================
// OTHER FEES
// ============================================================================

function calculateBankCharges(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem | undefined {
  // Bank charges for L/C or payment processing
  const bankChargeRate = 0.001; // 0.1%
  const bankCharge = record.totalValue * bankChargeRate;

  return createCostItem(
    "Bank Charges",
    "Bank processing charges",
    bankCharge,
    baseCurrency,
    baseCurrency,
    rates,
    "BANK_CHARGE",
    true,
  );
}

function calculateCurrencyConversion(
  record: TradeComplianceRecord,
  baseCurrency: string,
  rates: ExchangeRate[],
): CostItem | undefined {
  if (record.currency === baseCurrency) return undefined;

  // Currency conversion fee: 0.5% of amount
  const conversionRate = 0.005;
  const conversionFee = record.totalValue * conversionRate;

  return createCostItem(
    "Currency Conversion Fee",
    `Currency conversion from ${record.currency} to ${baseCurrency}`,
    conversionFee,
    baseCurrency,
    baseCurrency,
    rates,
    "CURRENCY_CONVERSION",
    true,
  );
}

// ============================================================================
// PRODUCT BREAKDOWN
// ============================================================================

function calculateProductBreakdown(
  record: TradeComplianceRecord,
  breakdown: LandedCostBreakdown,
): ProductCostBreakdown[] {
  const productBreakdowns: ProductCostBreakdown[] = [];

  const totalProductValue = record.products.reduce(
    (sum, p) => sum + p.totalValue,
    0,
  );

  for (const product of record.products) {
    const allocationRatio = product.totalValue / totalProductValue;

    productBreakdowns.push({
      productId: product.id,
      productName: product.name,
      productCost: product.totalValue,
      freightAllocation:
        breakdown.freightCost.amountInBaseCurrency * allocationRatio,
      dutyAllocation:
        breakdown.customsDuty.amountInBaseCurrency * allocationRatio,
      vatAllocation: breakdown.vat.amountInBaseCurrency * allocationRatio,
      licenseFeesAllocation:
        breakdown.licenseFees.reduce(
          (sum, fee) => sum + fee.amountInBaseCurrency,
          0,
        ) * allocationRatio,
      otherFeesAllocation: breakdown.totalFees * allocationRatio,
      totalCost: 0, // Will be calculated
      costPerUnit: 0, // Will be calculated
    });
  }

  // Calculate totals
  for (const pb of productBreakdowns) {
    pb.totalCost =
      pb.productCost +
      pb.freightAllocation +
      pb.dutyAllocation +
      pb.vatAllocation +
      pb.licenseFeesAllocation +
      pb.otherFeesAllocation;
    pb.costPerUnit =
      pb.totalCost /
      (record.products.find((p) => p.id === pb.productId)?.quantity || 1);
  }

  return productBreakdowns;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const landedCostService = {
  calculateLandedCost,
  getDefaultExchangeRates,
};

export default landedCostService;
