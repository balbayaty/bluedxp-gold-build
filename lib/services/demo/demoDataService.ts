/**
 * Demo Data Service
 *
 * Generates realistic demo/test data for all modules
 * Used when real data is not available - makes dashboards look impressive!
 */

export interface DemoDataConfig {
  tenantId?: string;
  dateRange?: { from: Date; to: Date };
  count?: number;
}

/**
 * Generate demo shipments data
 */
export function generateDemoShipments(config: DemoDataConfig = {}) {
  const count = config.count || 150;
  const carriers = [
    "Aramex",
    "DHL",
    "FedEx",
    "UPS",
    "SMSA",
    "Zajil",
    "Saudi Post",
    "Naqel",
  ];
  const statuses = [
    "CREATED",
    "IN_TRANSIT",
    "IN_CUSTOMS",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "EXCEPTION",
  ];
  const modes = ["ROAD", "AIR", "SEA", "RAIL"];
  const cities = [
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Mecca",
    "Medina",
    "Khobar",
    "Abha",
    "Tabuk",
  ];

  const shipments = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdDate = new Date(
      now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    );
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];

    const estimatedDelivery = new Date(
      createdDate.getTime() + (2 + Math.random() * 10) * 24 * 60 * 60 * 1000,
    );
    const actualDelivery =
      status === "DELIVERED"
        ? new Date(
            estimatedDelivery.getTime() +
              (Math.random() - 0.3) * 2 * 24 * 60 * 60 * 1000,
          )
        : null;

    shipments.push({
      id: `SH-${String(i + 1).padStart(6, "0")}`,
      trackingNumber: `TRK${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      carrierId: `CAR-${Math.floor(Math.random() * 8) + 1}`,
      carrierName: carrier,
      status,
      mode,
      origin: cities[Math.floor(Math.random() * cities.length)],
      destination: cities[Math.floor(Math.random() * cities.length)],
      estimatedDelivery: estimatedDelivery.toISOString(),
      actualDelivery: actualDelivery?.toISOString() || null,
      createdAt: createdDate.toISOString(),
      freightCost: Math.round((500 + Math.random() * 5000) * 100) / 100,
      weight: Math.round((10 + Math.random() * 500) * 100) / 100,
      volume: Math.round((0.1 + Math.random() * 5) * 100) / 100,
      packages: Math.floor(Math.random() * 10) + 1,
    });
  }

  return shipments;
}

/**
 * Generate demo carriers data
 */
export function generateDemoCarriers(config: DemoDataConfig = {}) {
  const carriers = [
    { name: "Aramex", code: "ARAMEX", type: "EXPRESS", rating: 4.8 },
    { name: "DHL Express", code: "DHL", type: "EXPRESS", rating: 4.9 },
    { name: "FedEx", code: "FEDEX", type: "EXPRESS", rating: 4.7 },
    { name: "UPS", code: "UPS", type: "STANDARD", rating: 4.6 },
    { name: "SMSA Express", code: "SMSA", type: "EXPRESS", rating: 4.5 },
    { name: "Zajil Express", code: "ZAJIL", type: "EXPRESS", rating: 4.4 },
    { name: "Saudi Post", code: "SPOST", type: "STANDARD", rating: 4.2 },
    { name: "Naqel Express", code: "NAQEL", type: "EXPRESS", rating: 4.6 },
  ];

  return carriers.map((carrier, index) => ({
    id: `CAR-${index + 1}`,
    name: carrier.name,
    code: carrier.code,
    type: carrier.type,
    rating: carrier.rating,
    active: true,
    onTimeRate: 85 + Math.random() * 10,
    totalShipments: Math.floor(Math.random() * 500) + 100,
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));
}

/**
 * Generate demo inventory data
 */
export function generateDemoInventory(config: DemoDataConfig = {}) {
  const count = config.count || 200;
  const categories = [
    "Electronics",
    "Chemicals",
    "Pharmaceuticals",
    "Food & Beverage",
    "Automotive",
    "Textiles",
    "Machinery",
    "Raw Materials",
  ];
  const warehouses = [
    "WH-RIYADH-01",
    "WH-JEDDAH-01",
    "WH-DAMMAM-01",
    "WH-MECCA-01",
  ];

  const items = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    const quantity = Math.floor(Math.random() * 10000) + 100;
    const reserved = Math.floor(quantity * 0.1);
    const available = quantity - reserved;

    items.push({
      id: `SKU-${String(i + 1).padStart(6, "0")}`,
      sku: `SKU-${String(i + 1).padStart(6, "0")}`,
      name: `${category} Item ${i + 1}`,
      description: `Demo ${category.toLowerCase()} item for testing`,
      category,
      warehouse,
      quantity,
      reserved,
      available,
      unit: "PCS",
      unitCost: Math.round((10 + Math.random() * 500) * 100) / 100,
      totalValue: Math.round(quantity * (10 + Math.random() * 500) * 100) / 100,
      lastUpdated: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  return items;
}

/**
 * Generate demo orders data
 */
export function generateDemoOrders(config: DemoDataConfig = {}) {
  const count = config.count || 100;
  const statuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  const customers = [
    "Customer A",
    "Customer B",
    "Customer C",
    "Customer D",
    "Customer E",
  ];

  const orders = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdDate = new Date(
      now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000,
    );
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const totalAmount = Math.round((100 + Math.random() * 10000) * 100) / 100;

    orders.push({
      id: `ORD-${String(i + 1).padStart(6, "0")}`,
      orderNumber: `ORD-${String(i + 1).padStart(6, "0")}`,
      customerName: customer,
      status,
      totalAmount,
      itemCount: Math.floor(Math.random() * 20) + 1,
      createdAt: createdDate.toISOString(),
      expectedDelivery: new Date(
        createdDate.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  return orders;
}

/**
 * Generate demo financial data
 */
export function generateDemoFinancialData(config: DemoDataConfig = {}) {
  const now = new Date();
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const revenue = Math.round((50000 + Math.random() * 200000) * 100) / 100;
    const expenses = Math.round((30000 + Math.random() * 150000) * 100) / 100;
    const profit = revenue - expenses;

    months.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue,
      expenses,
      profit,
      margin: Math.round((profit / revenue) * 100 * 100) / 100,
    });
  }

  return {
    summary: {
      totalRevenue: months.reduce((sum, m) => sum + m.revenue, 0),
      totalExpenses: months.reduce((sum, m) => sum + m.expenses, 0),
      totalProfit: months.reduce((sum, m) => sum + m.profit, 0),
      averageMargin:
        Math.round(
          (months.reduce((sum, m) => sum + m.margin, 0) / months.length) * 100,
        ) / 100,
    },
    monthly: months,
  };
}

/**
 * Generate demo analytics/metrics
 */
export function generateDemoMetrics(config: DemoDataConfig = {}) {
  return {
    totalShipments: 1247,
    activeShipments: 342,
    deliveredShipments: 856,
    onTimeDeliveryRate: 94.5,
    averageTransitTime: 3.2,
    totalFreightCost: 2456789.5,
    carrierCount: 8,
    exceptionRate: 2.3,
    customerSatisfaction: 4.7,
    inventoryValue: 12500000,
    inventoryItems: 1247,
    lowStockAlerts: 23,
    pendingOrders: 45,
    completedOrders: 892,
    revenue: 3456789.12,
    expenses: 1234567.89,
    profit: 2222221.23,
  };
}

/**
 * Generate demo process mining variants
 */
export function generateDemoProcessVariants(
  processType: string = "SALES_ORDER",
) {
  const eventSequences = [
    [
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "PAYMENT_RECEIVED",
      "INVOICE_GENERATED",
      "SHIPPED",
      "DELIVERED",
    ],
    [
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "PAYMENT_PENDING",
      "PAYMENT_RECEIVED",
      "INVOICE_GENERATED",
      "SHIPPED",
      "DELIVERED",
    ],
    [
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "CREDIT_CHECK",
      "PAYMENT_RECEIVED",
      "INVOICE_GENERATED",
      "SHIPPED",
      "DELIVERED",
    ],
    [
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "PAYMENT_RECEIVED",
      "INVOICE_GENERATED",
      "SHIPPED",
      "DELIVERY_FAILED",
      "RESCHEDULED",
      "DELIVERED",
    ],
    [
      "ORDER_CREATED",
      "ORDER_CONFIRMED",
      "PAYMENT_RECEIVED",
      "INVOICE_GENERATED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
    ],
  ];

  return eventSequences.map((sequence, index) => {
    const frequency = Math.floor(Math.random() * 200) + 50;
    const avgDuration = (2 + Math.random() * 10) * 24 * 60 * 60; // 2-12 days in seconds
    const efficiency = 70 + Math.random() * 25; // 70-95%

    return {
      variantId: `VARIANT-${processType}-${String(index + 1).padStart(3, "0")}`,
      frequency,
      averageDuration: avgDuration,
      efficiency: Math.round(efficiency * 100) / 100,
      events: sequence,
      isOptimal: index === 0, // First variant is optimal
      deviationRate: index > 2 ? Math.random() * 15 : Math.random() * 5, // Higher deviation for later variants
    };
  });
}

/**
 * Generate demo process mining metrics
 */
export function generateDemoProcessMetrics(
  processType: string = "SALES_ORDER",
) {
  const now = new Date();
  const last30Days = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    last30Days.push({
      date: date.toISOString().split("T")[0],
      cases: Math.floor(Math.random() * 50) + 20,
      avgDuration: Math.floor((2 + Math.random() * 8) * 24 * 60 * 60),
      efficiency: Math.round((75 + Math.random() * 20) * 100) / 100,
      deviations: Math.floor(Math.random() * 10),
      cost: Math.round((1000 + Math.random() * 5000) * 100) / 100,
    });
  }

  return {
    totalCases: last30Days.reduce((sum, d) => sum + d.cases, 0),
    averageDuration: Math.floor(
      last30Days.reduce((sum, d) => sum + d.avgDuration, 0) / last30Days.length,
    ),
    averageEfficiency:
      Math.round(
        (last30Days.reduce((sum, d) => sum + d.efficiency, 0) /
          last30Days.length) *
          100,
      ) / 100,
    totalDeviations: last30Days.reduce((sum, d) => sum + d.deviations, 0),
    totalCost: last30Days.reduce((sum, d) => sum + d.cost, 0),
    dailyMetrics: last30Days,
    bottlenecks: [
      { activity: "PAYMENT_PENDING", avgWaitTime: 18 * 60 * 60, frequency: 45 }, // 18 hours
      { activity: "CREDIT_CHECK", avgWaitTime: 4 * 60 * 60, frequency: 23 }, // 4 hours
      { activity: "DELIVERY_FAILED", avgWaitTime: 24 * 60 * 60, frequency: 12 }, // 24 hours
    ],
    topVariants: generateDemoProcessVariants(processType).slice(0, 5),
  };
}

/**
 * Generate demo process mining cases
 */
export function generateDemoProcessCases(
  processType: string = "SALES_ORDER",
  count: number = 100,
) {
  const cases = [];
  const variants = generateDemoProcessVariants(processType);
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const variant = variants[Math.floor(Math.random() * variants.length)];
    const startTime = new Date(
      now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    );
    const duration =
      variant.averageDuration +
      (Math.random() - 0.5) * variant.averageDuration * 0.3;

    const events = variant.events.map((activity, index) => ({
      id: `event-${i}-${index}`,
      activity,
      timestamp: new Date(
        startTime.getTime() +
          (index * duration) / variant.events.length +
          Math.random() * 3600000,
      ).toISOString(),
      resource: `RES-${Math.floor(Math.random() * 10) + 1}`,
      cost: Math.round((50 + Math.random() * 200) * 100) / 100,
    }));

    const deviations =
      Math.random() > 0.7
        ? [
            {
              id: `dev-${i}`,
              type: ["DELAY", "SKIP", "REPEAT", "EXCEPTION"][
                Math.floor(Math.random() * 4)
              ],
              activity:
                variant.events[
                  Math.floor(Math.random() * variant.events.length)
                ],
              severity: ["LOW", "MEDIUM", "HIGH"][
                Math.floor(Math.random() * 3)
              ],
              description: "Process deviation detected",
            },
          ]
        : [];

    cases.push({
      id: `case-${processType}-${String(i + 1).padStart(6, "0")}`,
      caseId: `CASE-${String(i + 1).padStart(6, "0")}`,
      caseType: processType,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
      status: Math.random() > 0.2 ? "COMPLETED" : "ACTIVE",
      events,
      variants: [variant.variantId],
      deviations,
      performance: {
        duration: Math.floor(duration),
        waitingTime: Math.floor(duration * 0.3),
        processingTime: Math.floor(duration * 0.7),
        cycleTime: Math.floor(duration),
        throughput: Math.round((1 / (duration / 86400)) * 100) / 100,
        efficiency: variant.efficiency + (Math.random() - 0.5) * 10,
      },
      attributes: {
        customer: `Customer ${Math.floor(Math.random() * 20) + 1}`,
        value: Math.round((100 + Math.random() * 1000) * 100) / 100,
        priority: ["LOW", "NORMAL", "HIGH"][Math.floor(Math.random() * 3)],
      },
    });
  }

  return cases;
}

/**
 * Generate demo journey analysis data
 * Special handling for Saudi-Kuwait route (beautiful detailed route)
 */
export function generateDemoJourneyAnalysis(shipmentId: string) {
  // Check if this is a Saudi-Kuwait route request (from proposals/journey page)
  const isSaudiKuwait =
    shipmentId.includes("saudi-kuwait") || shipmentId.includes("SA-KW");

  // Beautiful Saudi-Kuwait route with detailed touchpoints
  if (isSaudiKuwait) {
    return generateSaudiKuwaitJourney(shipmentId);
  }

  const cities = [
    { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lon: 46.6753 },
    { name: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lon: 39.1925 },
    { name: "Dammam", country: "Saudi Arabia", lat: 26.4207, lon: 50.0888 },
    { name: "Dubai", country: "UAE", lat: 25.2048, lon: 55.2708 },
    { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lon: 47.9774 },
    { name: "Rotterdam", country: "Netherlands", lat: 51.9225, lon: 4.4772 },
    { name: "Hamburg", country: "Germany", lat: 53.5511, lon: 9.9937 },
    { name: "Shanghai", country: "China", lat: 31.2304, lon: 121.4737 },
  ];

  const origin = cities[Math.floor(Math.random() * cities.length)];
  let destination = cities[Math.floor(Math.random() * cities.length)];
  while (destination.name === origin.name) {
    destination = cities[Math.floor(Math.random() * cities.length)];
  }

  const now = new Date();
  const pickupDate = new Date(
    now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000,
  );
  const estimatedDelivery = new Date(
    pickupDate.getTime() + (5 + Math.random() * 15) * 24 * 60 * 60 * 1000,
  );

  const touchpoints = [
    {
      id: "tp-1",
      sequence: 1,
      type: "ORIGIN",
      name: `${origin.name} Warehouse`,
      location: {
        address: {
          city: origin.name,
          country: origin.country,
          countryCode:
            origin.country === "Saudi Arabia"
              ? "SA"
              : origin.country === "UAE"
                ? "AE"
                : "XX",
        },
        coordinates: { lat: origin.lat, lon: origin.lon },
      },
      plannedArrival: pickupDate.toISOString(),
      plannedDeparture: new Date(
        pickupDate.getTime() + 2 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: pickupDate.toISOString(),
      actualDeparture: new Date(
        pickupDate.getTime() + 2.5 * 60 * 60 * 1000,
      ).toISOString(),
      estimatedArrival: pickupDate.toISOString(),
      status: "COMPLETED",
      delay: 30 * 60, // 30 minutes
      processingTime: 2.5,
      customsStatus: undefined,
    },
    {
      id: "tp-2",
      sequence: 2,
      type: "PORT",
      name: `${origin.name} Port`,
      location: {
        address: {
          city: origin.name,
          country: origin.country,
          countryCode:
            origin.country === "Saudi Arabia"
              ? "SA"
              : origin.country === "UAE"
                ? "AE"
                : "XX",
        },
        coordinates: { lat: origin.lat, lon: origin.lon },
      },
      plannedArrival: new Date(
        pickupDate.getTime() + 4 * 60 * 60 * 1000,
      ).toISOString(),
      plannedDeparture: new Date(
        pickupDate.getTime() + 6 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: new Date(
        pickupDate.getTime() + 4.5 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: new Date(
        pickupDate.getTime() + 7 * 60 * 60 * 1000,
      ).toISOString(),
      estimatedArrival: new Date(
        pickupDate.getTime() + 4 * 60 * 60 * 1000,
      ).toISOString(),
      status: "COMPLETED",
      delay: 60 * 60, // 1 hour
      processingTime: 2.5,
      customsStatus: undefined,
    },
    {
      id: "tp-3",
      sequence: 3,
      type: "CUSTOMS",
      name: `${destination.name} Customs`,
      location: {
        address: {
          city: destination.name,
          country: destination.country,
          countryCode:
            destination.country === "Saudi Arabia"
              ? "SA"
              : destination.country === "UAE"
                ? "AE"
                : "XX",
        },
        coordinates: { lat: destination.lat, lon: destination.lon },
      },
      plannedArrival: new Date(
        estimatedDelivery.getTime() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      plannedDeparture: new Date(
        estimatedDelivery.getTime() - 1.5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: new Date(
        estimatedDelivery.getTime() -
          2 * 24 * 60 * 60 * 1000 +
          2 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: new Date(
        estimatedDelivery.getTime() -
          1.5 * 24 * 60 * 60 * 1000 +
          3 * 60 * 60 * 1000,
      ).toISOString(),
      estimatedArrival: new Date(
        estimatedDelivery.getTime() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: "COMPLETED",
      delay: 3 * 60 * 60, // 3 hours
      processingTime: 3,
      customsStatus: Math.random() > 0.3 ? "CLEARED" : "PENDING",
    },
    {
      id: "tp-4",
      sequence: 4,
      type: "DESTINATION",
      name: `${destination.name} Warehouse`,
      location: {
        address: {
          city: destination.name,
          country: destination.country,
          countryCode:
            destination.country === "Saudi Arabia"
              ? "SA"
              : destination.country === "UAE"
                ? "AE"
                : "XX",
        },
        coordinates: { lat: destination.lat, lon: destination.lon },
      },
      plannedArrival: estimatedDelivery.toISOString(),
      plannedDeparture: null,
      actualArrival: new Date(
        estimatedDelivery.getTime() + Math.random() * 2 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: null,
      estimatedArrival: estimatedDelivery.toISOString(),
      status: Math.random() > 0.3 ? "COMPLETED" : "IN_TRANSIT",
      delay: Math.random() > 0.3 ? Math.floor(Math.random() * 2 * 60 * 60) : 0,
      processingTime: undefined,
      customsStatus: undefined,
    },
  ];

  const totalDistance = Math.round(
    Math.sqrt(
      Math.pow((destination.lat - origin.lat) * 111, 2) +
        Math.pow(
          (destination.lon - origin.lon) *
            111 *
            Math.cos((origin.lat * Math.PI) / 180),
          2,
        ),
    ),
  );

  // Generate transport legs from touchpoints
  const transportLegs = [];
  const carriers = [
    "Aramex",
    "DHL",
    "FedEx",
    "UPS",
    "SMSA",
    "Zajil",
    "Saudi Post",
  ];
  for (let i = 0; i < touchpoints.length - 1; i++) {
    const from = touchpoints[i];
    const to = touchpoints[i + 1];
    const legDistance = Math.round(totalDistance / (touchpoints.length - 1));
    const legDuration = Math.floor(
      (new Date(to.plannedArrival).getTime() -
        new Date(from.plannedDeparture).getTime()) /
        1000,
    );
    const legMode = ["ROAD", "SEA", "AIR", "RAIL"][
      Math.floor(Math.random() * 4)
    ];
    const carrierName = carriers[Math.floor(Math.random() * carriers.length)];

    transportLegs.push({
      id: `leg-${i + 1}`,
      sequence: i + 1,
      fromTouchpointId: from.id,
      toTouchpointId: to.id,
      from: {
        touchpointId: from.id,
        name: from.name,
        location: from.location,
      },
      to: {
        touchpointId: to.id,
        name: to.name,
        location: to.location,
      },
      mode: legMode,
      distance: legDistance,
      plannedDuration: legDuration,
      estimatedDuration: legDuration / 3600, // Convert to hours
      actualDuration: legDuration + Math.floor(Math.random() * 3600),
      status:
        from.status === "COMPLETED" && to.status !== "IN_TRANSIT"
          ? "COMPLETED"
          : "IN_TRANSIT",
      carrier: {
        id: `carrier-${carrierName.toLowerCase()}`,
        name: carrierName,
        code: carrierName.substring(0, 3).toUpperCase(),
      },
      cost: Math.round((legDistance * 0.3 + Math.random() * 200) * 100) / 100,
      vessel:
        legMode === "SEA"
          ? {
              name: `MV ${carrierName} Express`,
              imo: `IMO${Math.floor(Math.random() * 1000000)}`,
            }
          : undefined,
      flight:
        legMode === "AIR"
          ? {
              number: `${carrierName.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
              aircraft: "Boeing 777F",
            }
          : undefined,
    });
  }

  return {
    id: `journey-${shipmentId}`,
    shipmentId,
    journeyName: `Journey from ${origin.name} to ${destination.name}`,
    origin: {
      name: origin.name,
      country: origin.country,
      coordinates: { lat: origin.lat, lon: origin.lon },
    },
    destination: {
      name: destination.name,
      country: destination.country,
      coordinates: { lat: destination.lat, lon: destination.lon },
    },
    mode: ["ROAD", "SEA", "AIR", "MULTIMODAL"][Math.floor(Math.random() * 4)],
    totalDistance,
    totalDuration: Math.floor(
      (estimatedDelivery.getTime() - pickupDate.getTime()) / 1000,
    ),
    estimatedTotalDuration:
      Math.floor((estimatedDelivery.getTime() - pickupDate.getTime()) / 1000) /
      3600, // Convert to hours
    plannedDuration: Math.floor(
      (estimatedDelivery.getTime() - pickupDate.getTime()) / 1000,
    ),
    actualDuration: Math.floor(
      (estimatedDelivery.getTime() -
        pickupDate.getTime() +
        Math.random() * 2 * 24 * 60 * 60 * 1000) /
        1000,
    ),
    actualTotalDuration:
      Math.floor(
        (estimatedDelivery.getTime() -
          pickupDate.getTime() +
          Math.random() * 2 * 24 * 60 * 60 * 1000) /
          1000,
      ) / 3600, // Convert to hours
    touchpoints,
    transportLegs,
    status: touchpoints[touchpoints.length - 1].status,
    createdAt: pickupDate.toISOString(),
    updatedAt: new Date().toISOString(),
    cost: {
      freight:
        Math.round((totalDistance * 0.5 + Math.random() * 1000) * 100) / 100,
      customs: Math.round((200 + Math.random() * 500) * 100) / 100,
      handling: Math.round((100 + Math.random() * 300) * 100) / 100,
      total: 0, // Will be calculated
    },
    rootCauseAnalysis: {
      bottlenecks: touchpoints
        .filter((tp) => tp.delay > 60 * 60)
        .map((tp) => ({
          touchpoint: tp.name,
          delay: tp.delay,
          cause: ["CUSTOMS_DELAY", "WEATHER", "TRAFFIC", "DOCUMENTATION"][
            Math.floor(Math.random() * 4)
          ],
          impact: "MEDIUM",
        })),
      recommendations: [
        "Pre-clear customs documentation",
        "Use express customs lane",
        "Optimize route to avoid traffic",
      ],
    },
    optimization: {
      potentialSavings: Math.round(totalDistance * 0.1 * 100) / 100,
      timeSavings: Math.floor(Math.random() * 24 * 60 * 60),
      alternativeRoutes: [
        {
          name: "Alternative Route 1",
          distance: totalDistance + Math.floor(Math.random() * 100),
          duration:
            Math.floor(
              (estimatedDelivery.getTime() - pickupDate.getTime()) / 1000,
            ) - Math.floor(Math.random() * 12 * 60 * 60),
          cost: Math.round(totalDistance * 0.45 * 100) / 100,
        },
      ],
    },
    predictions: {
      onTimeProbability: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
      riskFactors: [
        { factor: "Customs clearance", probability: 0.3 },
        { factor: "Weather conditions", probability: 0.15 },
        { factor: "Traffic congestion", probability: 0.2 },
      ],
    },
    createdAt: pickupDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate demo root cause analysis data
 */
export function generateDemoRootCauses(count: number = 20) {
  const issueTypes = [
    "SLA_BREACH",
    "QUALITY_ISSUE",
    "DELAY",
    "COST_OVERRUN",
    "COMPLIANCE_VIOLATION",
    "SYSTEM_ERROR",
    "HUMAN_ERROR",
  ];
  const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const methods = ["5_WHYS", "FISHBONE", "FMEA", "ML_ANALYSIS"];

  const rootCauses = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const confidence = 70 + Math.random() * 25; // 70-95%
    const effectiveness = 60 + Math.random() * 35; // 60-95%

    const causes = [
      "Insufficient process documentation",
      "Lack of training for staff",
      "System integration failure",
      "Inadequate quality control",
      "Resource constraints",
      "Communication breakdown",
      "Process deviation",
      "Equipment malfunction",
    ];

    const contributingFactors = causes.slice(
      0,
      Math.floor(Math.random() * 4) + 2,
    );
    const rootCause = contributingFactors[0];

    rootCauses.push({
      id: `rca-${String(i + 1).padStart(6, "0")}`,
      issueId: `ISSUE-${String(i + 1).padStart(6, "0")}`,
      issueType,
      severity,
      description: `${issueType.replace("_", " ")} detected in process execution`,
      rootCause,
      contributingFactors: contributingFactors.slice(1),
      analysisMethod: method,
      confidence: Math.round(confidence * 100) / 100,
      validated: Math.random() > 0.3,
      recommendations: [
        "Implement automated monitoring",
        "Enhance staff training program",
        "Update process documentation",
        "Add quality checkpoints",
      ].slice(0, Math.floor(Math.random() * 3) + 2),
      actions: [
        {
          id: `action-${i}-1`,
          description: "Implement recommended solution",
          status: Math.random() > 0.5 ? "COMPLETED" : "IN_PROGRESS",
          effectiveness: Math.round(effectiveness * 100) / 100,
          completedAt:
            Math.random() > 0.5
              ? new Date(
                  now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                ).toISOString()
              : null,
        },
      ],
      recurrenceCount: Math.floor(Math.random() * 5),
      similarIssues: Math.floor(Math.random() * 10),
      createdAt: new Date(
        now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: new Date(
        now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  }

  return rootCauses;
}

/**
 * Generate beautiful Saudi-Kuwait journey with detailed touchpoints
 * This is the "sexy" route the user mentioned!
 */
function generateSaudiKuwaitJourney(shipmentId: string) {
  const now = new Date();
  const pickupDate = new Date(
    now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000,
  );
  const estimatedDelivery = new Date(
    pickupDate.getTime() + 5.2 * 24 * 60 * 60 * 1000,
  ); // ~5.2 days total

  // Beautiful detailed touchpoints for Saudi-Kuwait route
  const touchpoints = [
    {
      id: "tp-sa-kw-1",
      sequence: 1,
      type: "ORIGIN",
      name: "Riyadh Industrial Plant",
      location: {
        address: {
          city: "Riyadh",
          country: "Saudi Arabia",
          countryCode: "SA",
        },
        coordinates: { lat: 24.7136, lon: 46.6753 },
      },
      plannedArrival: pickupDate.toISOString(),
      plannedDeparture: new Date(
        pickupDate.getTime() + 2 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: pickupDate.toISOString(),
      actualDeparture: new Date(
        pickupDate.getTime() + 2.5 * 60 * 60 * 1000,
      ).toISOString(),
      estimatedArrival: pickupDate.toISOString(),
      status: "COMPLETED",
      delay: 30 * 60, // 30 minutes
      processingTime: 2.5,
      customsStatus: undefined,
      dwellTime: 2.5,
      handlingType: "LOADING",
    },
    {
      id: "tp-sa-kw-2",
      sequence: 2,
      type: "CUSTOMS",
      name: "Saudi Customs (Khafji Border)",
      location: {
        address: {
          city: "Khafji",
          country: "Saudi Arabia",
          countryCode: "SA",
        },
        coordinates: { lat: 28.4167, lon: 48.5 },
      },
      plannedArrival: new Date(
        pickupDate.getTime() + 11 * 60 * 60 * 1000,
      ).toISOString(),
      plannedDeparture: new Date(
        pickupDate.getTime() + 18 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: new Date(
        pickupDate.getTime() + 11.5 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: new Date(
        pickupDate.getTime() + 19 * 60 * 60 * 1000,
      ).toISOString(),
      estimatedArrival: new Date(
        pickupDate.getTime() + 11 * 60 * 60 * 1000,
      ).toISOString(),
      status: "COMPLETED",
      delay: 60 * 60, // 1 hour delay
      processingTime: 7.5,
      customsStatus: "CLEARED",
      dwellTime: 7.5,
      handlingType: "CUSTOMS_CLEARANCE",
    },
    {
      id: "tp-sa-kw-3",
      sequence: 3,
      type: "CUSTOMS",
      name: "Kuwait Customs (Nuwaiseeb Border)",
      location: {
        address: {
          city: "Nuwaiseeb",
          country: "Kuwait",
          countryCode: "KW",
        },
        coordinates: { lat: 28.45, lon: 48.4 },
      },
      plannedArrival: new Date(
        pickupDate.getTime() + 12 * 60 * 60 * 1000,
      ).toISOString(),
      plannedDeparture: new Date(
        pickupDate.getTime() + 18 * 60 * 60 * 1000,
      ).toISOString(),
      actualArrival: new Date(
        pickupDate.getTime() + 12 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: new Date(
        pickupDate.getTime() + 67.5 * 60 * 60 * 1000,
      ).toISOString(), // 55.5 hours delay!
      estimatedArrival: new Date(
        pickupDate.getTime() + 12 * 60 * 60 * 1000,
      ).toISOString(),
      status: "COMPLETED",
      delay: 55.5 * 60 * 60, // 55.5 hours - major bottleneck!
      processingTime: 55.5,
      customsStatus: "CLEARED",
      dwellTime: 55.5,
      handlingType: "CUSTOMS_CLEARANCE",
    },
    {
      id: "tp-sa-kw-4",
      sequence: 4,
      type: "DESTINATION",
      name: "Kuwait City Warehouse",
      location: {
        address: {
          city: "Kuwait City",
          country: "Kuwait",
          countryCode: "KW",
        },
        coordinates: { lat: 29.3759, lon: 47.9774 },
      },
      plannedArrival: new Date(
        pickupDate.getTime() + 20 * 60 * 60 * 1000,
      ).toISOString(),
      plannedDeparture: null,
      actualArrival: new Date(
        pickupDate.getTime() + 70 * 60 * 60 * 1000,
      ).toISOString(),
      actualDeparture: null,
      estimatedArrival: new Date(
        pickupDate.getTime() + 20 * 60 * 60 * 1000,
      ).toISOString(),
      status: "COMPLETED",
      delay: 50 * 60 * 60, // 50 hours total delay
      processingTime: 8.83,
      customsStatus: undefined,
      dwellTime: 8.83,
      handlingType: "UNLOADING",
    },
  ];

  // Calculate total distance (Riyadh to Kuwait City via border)
  const totalDistance = Math.round(
    Math.sqrt(
      Math.pow((29.3759 - 24.7136) * 111, 2) +
        Math.pow(
          (47.9774 - 46.6753) * 111 * Math.cos((24.7136 * Math.PI) / 180),
          2,
        ),
    ),
  ); // ~650 km

  // Generate transport legs
  const transportLegs = [
    {
      id: "leg-sa-kw-1",
      sequence: 1,
      fromTouchpointId: "tp-sa-kw-1",
      toTouchpointId: "tp-sa-kw-2",
      from: {
        touchpointId: "tp-sa-kw-1",
        name: "Riyadh Industrial Plant",
        location: touchpoints[0].location,
      },
      to: {
        touchpointId: "tp-sa-kw-2",
        name: "Saudi Customs (Khafji Border)",
        location: touchpoints[1].location,
      },
      mode: "ROAD",
      distance: 450, // km
      plannedDuration: 11 * 3600, // 11 hours
      estimatedDuration: 11.5, // hours
      actualDuration: 11.5 * 3600,
      status: "COMPLETED",
      carrier: {
        id: "carrier-aramex",
        name: "Aramex",
        code: "ARX",
      },
      cost: 1250.0,
    },
    {
      id: "leg-sa-kw-2",
      sequence: 2,
      fromTouchpointId: "tp-sa-kw-2",
      toTouchpointId: "tp-sa-kw-3",
      from: {
        touchpointId: "tp-sa-kw-2",
        name: "Saudi Customs (Khafji Border)",
        location: touchpoints[1].location,
      },
      to: {
        touchpointId: "tp-sa-kw-3",
        name: "Kuwait Customs (Nuwaiseeb Border)",
        location: touchpoints[2].location,
      },
      mode: "ROAD",
      distance: 15, // km (border crossing)
      plannedDuration: 0.5 * 3600, // 30 minutes
      estimatedDuration: 0.5, // hours
      actualDuration: 0.5 * 3600,
      status: "COMPLETED",
      carrier: {
        id: "carrier-aramex",
        name: "Aramex",
        code: "ARX",
      },
      cost: 50.0,
    },
    {
      id: "leg-sa-kw-3",
      sequence: 3,
      fromTouchpointId: "tp-sa-kw-3",
      toTouchpointId: "tp-sa-kw-4",
      from: {
        touchpointId: "tp-sa-kw-3",
        name: "Kuwait Customs (Nuwaiseeb Border)",
        location: touchpoints[2].location,
      },
      to: {
        touchpointId: "tp-sa-kw-4",
        name: "Kuwait City Warehouse",
        location: touchpoints[3].location,
      },
      mode: "ROAD",
      distance: 185, // km
      plannedDuration: 2.5 * 3600, // 2.5 hours
      estimatedDuration: 2.5, // hours
      actualDuration: 2.5 * 3600,
      status: "COMPLETED",
      carrier: {
        id: "carrier-aramex",
        name: "Aramex",
        code: "ARX",
      },
      cost: 350.0,
    },
  ];

  const totalDuration = Math.floor(
    (estimatedDelivery.getTime() - pickupDate.getTime()) / 1000,
  );
  const actualDuration =
    Math.floor(
      (touchpoints[3].actualArrival
        ? new Date(touchpoints[3].actualArrival).getTime()
        : estimatedDelivery.getTime()) - pickupDate.getTime(),
    ) / 1000;

  return {
    id: `journey-${shipmentId}`,
    shipmentId,
    journeyName: "Saudi Arabia → Kuwait (Riyadh to Kuwait City)",
    origin: {
      name: "Riyadh",
      country: "Saudi Arabia",
      coordinates: { lat: 24.7136, lon: 46.6753 },
    },
    destination: {
      name: "Kuwait City",
      country: "Kuwait",
      coordinates: { lat: 29.3759, lon: 47.9774 },
    },
    mode: "ROAD",
    totalDistance,
    totalDuration,
    estimatedTotalDuration: totalDuration / 3600, // Convert to hours
    plannedDuration: totalDuration,
    actualDuration,
    actualTotalDuration: actualDuration / 3600, // Convert to hours
    touchpoints,
    transportLegs,
    status: touchpoints[touchpoints.length - 1].status,
    cost: {
      freight: 1650.0,
      customs: 450.0,
      handling: 200.0,
      total: 2300.0,
    },
    bottlenecks: [
      {
        touchpointId: "tp-sa-kw-3",
        touchpointName: "Kuwait Customs (Nuwaiseeb Border)",
        type: "DELAY",
        severity: "CRITICAL",
        avgDelayHours: 55.5,
        frequency: 85, // 85% of shipments
        costImpact: 1250.0,
        recommendations: [
          "Engage with Kuwait authorities for extended processing hours",
          "Implement AEO (Authorized Economic Operator) program",
          "Pre-file documentation before arrival",
          "Use trusted shipper program for expedited clearance",
        ],
      },
      {
        touchpointId: "tp-sa-kw-4",
        touchpointName: "Kuwait City Warehouse",
        type: "DELAY",
        severity: "HIGH",
        avgDelayHours: 7.94,
        frequency: 45, // 45% of shipments
        costImpact: 350.0,
        recommendations: [
          "Schedule arrivals between 5-8am for same-day processing",
          "Implement appointment system",
          "Optimize warehouse receiving hours",
        ],
      },
    ],
    insights: [
      {
        id: "insight-1",
        type: "OPTIMIZATION",
        title: "Kuwait Customs Bottleneck",
        description:
          "Kuwait customs clearance averages 55.5 hours due to limited operational hours (8am-1pm, Sat-Thu only)",
        impact: "CRITICAL",
        confidence: 95,
        recommendations: [
          "Apply for AEO program to reduce clearance time by 60-70%",
          "Pre-file all documentation 24 hours before arrival",
          "Coordinate with customs broker for expedited processing",
        ],
        estimatedSavings: {
          time: 35, // hours
          cost: 850.0,
          co2: 45, // kg
        },
      },
      {
        id: "insight-2",
        type: "COST",
        title: "Warehouse Arrival Optimization",
        description:
          "45% of shipments arrive outside warehouse operational hours, causing 7.94 hour average delay",
        impact: "HIGH",
        confidence: 88,
        recommendations: [
          "Implement dynamic scheduling based on customs clearance time",
          "Coordinate with warehouse for extended receiving hours",
          "Use real-time tracking to optimize arrival windows",
        ],
        estimatedSavings: {
          time: 7.94,
          cost: 350.0,
        },
      },
    ],
    rootCauseAnalysis: {
      bottlenecks: touchpoints
        .filter((tp) => tp.delay > 60 * 60)
        .map((tp) => ({
          touchpoint: tp.name,
          delay: tp.delay,
          cause:
            tp.id === "tp-sa-kw-3"
              ? "CUSTOMS_OPERATIONAL_HOURS"
              : "WAREHOUSE_OPERATIONAL_HOURS",
          impact: tp.id === "tp-sa-kw-3" ? "CRITICAL" : "HIGH",
        })),
      recommendations: [
        "Implement AEO program for expedited customs clearance",
        "Pre-file documentation 24 hours before border arrival",
        "Coordinate warehouse receiving schedules",
        "Use real-time tracking for dynamic scheduling",
      ],
    },
    optimization: {
      potentialSavings: 42.94, // hours
      timeSavings: 42.94 * 3600, // seconds
      alternativeRoutes: [
        {
          name: "Alternative Route via Dammam Port",
          distance: totalDistance + 150,
          duration: Math.floor((totalDuration - 20 * 3600) / 1000), // 20 hours faster
          cost: 2100.0,
        },
      ],
    },
    predictions: {
      onTimeProbability: 0.15, // Only 15% on-time due to customs delays
      riskFactors: [
        { factor: "Kuwait customs operational hours", probability: 0.85 },
        { factor: "Warehouse arrival timing", probability: 0.45 },
        { factor: "Documentation completeness", probability: 0.25 },
      ],
    },
    createdAt: pickupDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if demo mode is enabled
 */
export function isDemoModeEnabled(): boolean {
  if (typeof window === "undefined") {
    return (
      process.env.ENABLE_DEMO_DATA === "true" ||
      process.env.NODE_ENV === "development"
    );
  }
  return (
    localStorage.getItem("demo-mode") === "true" ||
    process.env.NODE_ENV === "development"
  );
}
