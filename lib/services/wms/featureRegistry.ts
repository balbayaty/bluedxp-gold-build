/**
 * WMS Feature Registry
 * Complete registry of all WMS features with their requirements,
 * status, and benchmark comparisons
 */

import { WMSFeature, FeatureCategory } from "@/types/featureRegistry";

/**
 * WMS Feature Categories
 */
export const WMS_FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "inbound",
    name: "Inbound Operations",
    description: "Receiving, ASN processing, and dock management",
    icon: "ri-inbox-line",
    color: "cyan",
    features: [
      "asn-processing",
      "receiving",
      "dock-scheduling",
      "cross-docking",
      "quality-inspection",
    ],
  },
  {
    id: "inventory",
    name: "Inventory Management",
    description: "Stock control, cycle counting, and location management",
    icon: "ri-archive-line",
    color: "purple",
    features: [
      "inventory-tracking",
      "cycle-counting",
      "lot-tracking",
      "serial-tracking",
      "expiry-management",
    ],
  },
  {
    id: "picking",
    name: "Picking & Fulfillment",
    description: "Order picking, wave planning, and route optimization",
    icon: "ri-hand-coin-line",
    color: "green",
    features: [
      "route-optimization",
      "wave-planning",
      "batch-picking",
      "zone-picking",
      "pick-to-light",
    ],
  },
  {
    id: "outbound",
    name: "Outbound Operations",
    description: "Shipping, packing, and carrier management",
    icon: "ri-truck-line",
    color: "orange",
    features: [
      "shipping",
      "packing",
      "load-planning",
      "carrier-integration",
      "label-printing",
    ],
  },
  {
    id: "optimization",
    name: "AI & Optimization",
    description: "AI-powered optimization and predictive analytics",
    icon: "ri-brain-line",
    color: "pink",
    features: [
      "slotting-optimization",
      "demand-forecasting",
      "labor-planning",
      "space-optimization",
    ],
  },
];

/**
 * Complete WMS Feature Registry
 */
export const WMS_FEATURES: Record<string, WMSFeature> = {
  // ============================================
  // PICKING & ROUTE OPTIMIZATION FEATURES
  // ============================================
  "route-optimization": {
    id: "route-optimization",
    name: "Picking Route Optimization",
    description:
      "AI-powered route optimization for picking operations using advanced pathfinding algorithms",
    category: "PICKING",
    status: "READY",

    requirements: {
      data: [
        {
          id: "warehouse-layout",
          item: "Warehouse Layout",
          description:
            "CAD floor plan or manual layout definition with dimensions",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
          documentation: "/docs/warehouse-layout",
        },
        {
          id: "aisle-config",
          item: "Aisle Configuration",
          description:
            "Aisle IDs, widths, directions, and cross-aisle connections",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
        {
          id: "location-coords",
          item: "Location Coordinates",
          description: "X/Y/Z coordinates for each storage location",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
        {
          id: "travel-times",
          item: "Historical Travel Times",
          description: "Actual measured travel times for algorithm calibration",
          source: "IOT_SENSOR",
          required: false,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "erp-location",
          item: "ERP Location Master",
          description: "Import warehouse location data from ERP system",
          type: "API",
          required: true,
          currentStatus: "PENDING",
          endpoint: "/api/erp/locations",
        },
        {
          id: "position-tracking",
          item: "Real-time Position Tracking",
          description: "Indoor positioning system for actual path tracking",
          type: "IOT",
          required: false,
          currentStatus: "NOT_AVAILABLE",
        },
      ],
      hardware: [
        {
          id: "ips",
          item: "Indoor Positioning System",
          description:
            "BLE beacons, UWB, or WiFi triangulation for real-time tracking",
          alternatives: [
            "Manual time studies",
            "Video analysis",
            "RF scanner timestamps",
          ],
          required: false,
          estimatedCost: "$5,000 - $50,000",
          vendors: ["Zebra", "Cisco", "Pozyx", "Quuppa"],
        },
      ],
      configuration: [
        {
          step: 1,
          action: "Define warehouse layout dimensions and zones",
          where: "/settings/warehouse",
          estimatedTime: "2-4 hours",
          complexity: "MEDIUM",
        },
        {
          step: 2,
          action: "Configure aisle paths and travel directions",
          where: "/settings/warehouse/aisles",
          estimatedTime: "1-2 hours",
          complexity: "MEDIUM",
        },
        {
          step: 3,
          action: "Map storage locations with X/Y/Z coordinates",
          where: "/storage-locations",
          estimatedTime: "4-8 hours",
          complexity: "COMPLEX",
        },
        {
          step: 4,
          action: "Calibrate travel speeds per zone and equipment type",
          where: "/settings/warehouse/travel-times",
          estimatedTime: "1-2 hours",
          complexity: "EASY",
        },
      ],
    },

    metrics: {
      weight: 9,
      probability: 60,
      ease: 4,
      estimatedEffort: "2-3 weeks",
      roi: 9,
      dependencies: ["inventory-tracking", "location-coords"],
      riskLevel: "MEDIUM",
      maintenanceEffort: "LOW",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "EWM has sophisticated route optimization with wave integration",
        limitations: ["Requires premium license", "Complex configuration"],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "WMS Cloud includes machine learning-based path planning",
        limitations: ["Limited customization"],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Industry-leading algorithms with real-time adaptation",
        limitations: ["High cost", "Complex implementation"],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "AI-powered optimization with continuous learning",
        limitations: ["Requires significant data history"],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Real-time recalculation with congestion avoidance",
        limitations: ["Integration complexity"],
      },
    },

    examples: [
      "Reduce picker travel distance by 15-30%",
      "Optimize batch picks across multiple orders",
      "Avoid congestion zones during peak hours",
      "Account for one-way aisles and equipment restrictions",
      "Dynamic re-routing based on real-time conditions",
    ],
    benefits: [
      "Reduced labor costs",
      "Faster order fulfillment",
      "Lower picker fatigue",
      "Improved throughput",
      "Better equipment utilization",
    ],
    limitations: [
      "Requires accurate warehouse layout data",
      "Initial setup can be time-consuming",
      "Optimal results need calibration",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  "wave-planning": {
    id: "wave-planning",
    name: "Wave Planning",
    description:
      "Intelligent grouping and sequencing of orders into picking waves",
    category: "PICKING",
    status: "READY",

    requirements: {
      data: [
        {
          id: "order-data",
          item: "Order Data",
          description: "Sales orders with items, quantities, and priorities",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
        {
          id: "cutoff-times",
          item: "Carrier Cutoff Times",
          description: "Shipping cutoff times for different carriers",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
        {
          id: "picker-capacity",
          item: "Picker Capacity",
          description:
            "Number of available pickers and their productivity rates",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "order-import",
          item: "Order Import",
          description: "Real-time order sync from ERP/OMS",
          type: "API",
          required: true,
          currentStatus: "PENDING",
        },
      ],
      hardware: [],
      configuration: [
        {
          step: 1,
          action: "Configure wave release rules",
          where: "/wave-planning/settings",
          estimatedTime: "1-2 hours",
          complexity: "MEDIUM",
        },
        {
          step: 2,
          action: "Set carrier cutoff times",
          where: "/carriers",
          estimatedTime: "30 minutes",
          complexity: "EASY",
        },
        {
          step: 3,
          action: "Define picker capacity and zones",
          where: "/settings/labor",
          estimatedTime: "1 hour",
          complexity: "EASY",
        },
      ],
    },

    metrics: {
      weight: 8,
      probability: 70,
      ease: 6,
      estimatedEffort: "1-2 weeks",
      roi: 8,
      dependencies: ["order-data"],
      riskLevel: "LOW",
      maintenanceEffort: "LOW",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Full wave management with optimization",
        limitations: [],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Automated wave planning",
        limitations: [],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Real-time wave optimization",
        limitations: [],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "AI-driven wave planning",
        limitations: [],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Flexible wave configuration",
        limitations: [],
      },
    },

    examples: [
      "Group orders by shipping zone",
      "Prioritize orders by cutoff time",
      "Balance workload across zones",
      "Optimize cartonization",
    ],
    benefits: [
      "Improved on-time shipping",
      "Better labor utilization",
      "Reduced dock congestion",
    ],
    limitations: [
      "Requires accurate order data",
      "Needs carrier integration for optimal results",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  // ============================================
  // INVENTORY FEATURES
  // ============================================
  "cycle-counting": {
    id: "cycle-counting",
    name: "Cycle Counting",
    description:
      "Continuous inventory verification with multiple counting methodologies",
    category: "INVENTORY",
    status: "READY",

    requirements: {
      data: [
        {
          id: "inventory-data",
          item: "Current Inventory",
          description: "On-hand inventory quantities by location",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "AVAILABLE",
          mockAvailable: true,
        },
        {
          id: "abc-analysis",
          item: "ABC Classification",
          description: "Item velocity classification for counting frequency",
          source: "MANUAL_ENTRY",
          required: false,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "erp-inventory",
          item: "ERP Inventory Sync",
          description: "Two-way inventory synchronization with ERP",
          type: "API",
          required: true,
          currentStatus: "PENDING",
        },
      ],
      hardware: [
        {
          id: "scanner",
          item: "Barcode Scanner",
          description: "Handheld or wearable barcode scanner",
          alternatives: ["Mobile phone camera", "RFID reader"],
          required: true,
          estimatedCost: "$200 - $2,000",
          vendors: ["Zebra", "Honeywell", "Datalogic"],
        },
      ],
      configuration: [
        {
          step: 1,
          action: "Configure counting methods and schedules",
          where: "/cycle-counting/settings",
          estimatedTime: "1 hour",
          complexity: "EASY",
        },
        {
          step: 2,
          action: "Set variance thresholds",
          where: "/cycle-counting/settings",
          estimatedTime: "30 minutes",
          complexity: "EASY",
        },
      ],
    },

    metrics: {
      weight: 9,
      probability: 85,
      ease: 8,
      estimatedEffort: "1 week",
      roi: 8,
      dependencies: [],
      riskLevel: "LOW",
      maintenanceEffort: "LOW",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Full cycle counting with ERP integration",
        limitations: [],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Automated count scheduling",
        limitations: [],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Continuous counting optimization",
        limitations: [],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Exception-based counting",
        limitations: [],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Multi-method support",
        limitations: [],
      },
    },

    examples: [
      "ABC analysis-based counting frequency",
      "Random location selection",
      "Exception-triggered counts",
      "Full physical inventory support",
    ],
    benefits: [
      "Improved inventory accuracy",
      "Reduced shrinkage",
      "Better financial reporting",
      "Compliance with audit requirements",
    ],
    limitations: [
      "Requires accurate initial inventory",
      "Regular effort required",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  "inventory-tracking": {
    id: "inventory-tracking",
    name: "Real-Time Inventory Tracking",
    description:
      "Live visibility of inventory levels, locations, and movements",
    category: "INVENTORY",
    status: "READY",

    requirements: {
      data: [
        {
          id: "sku-master",
          item: "SKU Master Data",
          description:
            "Complete item master with dimensions, weight, and attributes",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
        {
          id: "location-master",
          item: "Location Master",
          description: "All storage locations with attributes",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "erp-sync",
          item: "ERP Real-Time Sync",
          description: "Continuous sync of inventory transactions",
          type: "WEBSOCKET",
          required: true,
          currentStatus: "PENDING",
        },
      ],
      hardware: [
        {
          id: "scanner",
          item: "Mobile Scanning Device",
          description: "For confirming movements",
          required: true,
          estimatedCost: "$200 - $2,000",
        },
      ],
      configuration: [
        {
          step: 1,
          action: "Import or create location master",
          where: "/storage-locations",
          estimatedTime: "2-4 hours",
          complexity: "MEDIUM",
        },
        {
          step: 2,
          action: "Configure inventory attributes",
          where: "/settings/inventory",
          estimatedTime: "1 hour",
          complexity: "EASY",
        },
      ],
    },

    metrics: {
      weight: 10,
      probability: 75,
      ease: 6,
      estimatedEffort: "2 weeks",
      roi: 10,
      dependencies: [],
      riskLevel: "LOW",
      maintenanceEffort: "MEDIUM",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Full HANA-powered real-time visibility",
        limitations: [],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Cloud-based tracking",
        limitations: [],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Sub-second updates",
        limitations: [],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "AI-enhanced visibility",
        limitations: [],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Multi-site visibility",
        limitations: [],
      },
    },

    examples: [
      "Real-time stock levels",
      "Location-level tracking",
      "Movement history",
      "Allocation visibility",
    ],
    benefits: [
      "Accurate stock visibility",
      "Reduced stockouts",
      "Better order promising",
      "Improved planning",
    ],
    limitations: [
      "Requires consistent scanning discipline",
      "Initial data cleanup may be needed",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  // ============================================
  // INBOUND FEATURES
  // ============================================
  "asn-processing": {
    id: "asn-processing",
    name: "ASN Processing",
    description:
      "Advanced Shipping Notice processing with validation and dock scheduling",
    category: "INBOUND",
    status: "READY",

    requirements: {
      data: [
        {
          id: "asn-data",
          item: "ASN Documents",
          description: "Advance shipping notices from suppliers",
          source: "API_INTEGRATION",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
        {
          id: "po-data",
          item: "Purchase Orders",
          description: "PO data for ASN validation",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "edi",
          item: "EDI Integration",
          description: "EDI 856 ASN document exchange",
          type: "EDI",
          required: false,
          currentStatus: "NOT_AVAILABLE",
        },
      ],
      hardware: [],
      configuration: [
        {
          step: 1,
          action: "Configure ASN validation rules",
          where: "/settings/inbound",
          estimatedTime: "1 hour",
          complexity: "EASY",
        },
      ],
    },

    metrics: {
      weight: 9,
      probability: 80,
      ease: 7,
      estimatedEffort: "1 week",
      roi: 8,
      dependencies: [],
      riskLevel: "LOW",
      maintenanceEffort: "LOW",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Full EDI integration",
        limitations: [],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Cloud ASN processing",
        limitations: [],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Advanced validation",
        limitations: [],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Automated processing",
        limitations: [],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Multi-channel support",
        limitations: [],
      },
    },

    examples: [
      "Automated PO matching",
      "Quantity variance detection",
      "Dock door scheduling",
      "Receipt planning",
    ],
    benefits: [
      "Faster receiving",
      "Reduced errors",
      "Better dock scheduling",
      "Improved vendor compliance",
    ],
    limitations: [
      "Requires supplier participation",
      "EDI setup for full automation",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  // ============================================
  // OUTBOUND FEATURES
  // ============================================
  "load-planning": {
    id: "load-planning",
    name: "Load Planning & Optimization",
    description:
      "AI-powered truck loading optimization and weight distribution",
    category: "OUTBOUND",
    status: "DEMO",

    requirements: {
      data: [
        {
          id: "shipment-data",
          item: "Shipment Data",
          description: "Orders ready to ship with dimensions and weight",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "PARTIAL",
          mockAvailable: true,
        },
        {
          id: "truck-specs",
          item: "Truck Specifications",
          description: "Vehicle dimensions and weight capacity",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "tms",
          item: "TMS Integration",
          description: "Transport management system connection",
          type: "API",
          required: false,
          currentStatus: "NOT_AVAILABLE",
        },
      ],
      hardware: [
        {
          id: "scale",
          item: "Floor Scale",
          description: "For verifying load weights",
          required: false,
          estimatedCost: "$1,000 - $5,000",
        },
      ],
      configuration: [
        {
          step: 1,
          action: "Configure vehicle types and capacities",
          where: "/settings/vehicles",
          estimatedTime: "1-2 hours",
          complexity: "EASY",
        },
        {
          step: 2,
          action: "Set loading rules and constraints",
          where: "/load-planning/settings",
          estimatedTime: "1 hour",
          complexity: "MEDIUM",
        },
      ],
    },

    metrics: {
      weight: 7,
      probability: 50,
      ease: 5,
      estimatedEffort: "2-3 weeks",
      roi: 7,
      dependencies: ["shipping"],
      riskLevel: "MEDIUM",
      maintenanceEffort: "LOW",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "TM integration for load building",
        limitations: [],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "OTM integration",
        limitations: [],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "3D load visualization",
        limitations: [],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "AI optimization",
        limitations: [],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Multi-stop planning",
        limitations: [],
      },
    },

    examples: [
      "Maximize truck utilization",
      "Balance weight distribution",
      "Optimize stop sequence",
      "Stack pattern optimization",
    ],
    benefits: [
      "Reduced shipping costs",
      "Better truck utilization",
      "Fewer shipments needed",
      "Improved delivery times",
    ],
    limitations: [
      "Requires accurate product dimensions",
      "Complex for mixed loads",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },

  // ============================================
  // AI & OPTIMIZATION FEATURES
  // ============================================
  "slotting-optimization": {
    id: "slotting-optimization",
    name: "AI Slotting Optimization",
    description:
      "Machine learning-based optimal product placement recommendations",
    category: "OPTIMIZATION",
    status: "PARTIAL",

    requirements: {
      data: [
        {
          id: "historical-picks",
          item: "Historical Pick Data",
          description: "At least 90 days of pick history",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
        {
          id: "product-velocity",
          item: "Product Velocity",
          description: "Sales velocity data by SKU",
          source: "ERP_IMPORT",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
        {
          id: "location-attributes",
          item: "Location Attributes",
          description: "Ergonomic attributes, pick frequency capacity",
          source: "MANUAL_ENTRY",
          required: true,
          currentStatus: "MISSING",
          mockAvailable: true,
        },
      ],
      integrations: [
        {
          id: "ml-engine",
          item: "ML Model Service",
          description: "Machine learning model execution environment",
          type: "API",
          required: true,
          currentStatus: "NOT_AVAILABLE",
        },
      ],
      hardware: [],
      configuration: [
        {
          step: 1,
          action: "Configure slotting zones and rules",
          where: "/settings/slotting",
          estimatedTime: "2-4 hours",
          complexity: "COMPLEX",
        },
        {
          step: 2,
          action: "Train ML model with historical data",
          where: "/settings/ai",
          estimatedTime: "1-2 days",
          complexity: "COMPLEX",
        },
      ],
    },

    metrics: {
      weight: 7,
      probability: 30,
      ease: 3,
      estimatedEffort: "1-2 months",
      roi: 8,
      dependencies: ["inventory-tracking", "historical-picks"],
      riskLevel: "HIGH",
      maintenanceEffort: "HIGH",
    },

    benchmark: {
      sap: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "EWM slotting optimization",
        limitations: ["Manual rules"],
      },
      oracle: {
        hasFeature: true,
        maturityLevel: "STANDARD",
        notes: "Basic slotting",
        limitations: ["Limited AI"],
      },
      manhattan: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "ML-powered slotting",
        limitations: ["High cost"],
      },
      blueYonder: {
        hasFeature: true,
        maturityLevel: "WORLD_CLASS",
        notes: "Luminate slotting",
        limitations: ["Data requirements"],
      },
      korber: {
        hasFeature: true,
        maturityLevel: "ADVANCED",
        notes: "Continuous slotting",
        limitations: [],
      },
    },

    examples: [
      "Place fast movers in golden zone",
      "Co-locate frequently picked together items",
      "Balance pick face utilization",
      "Seasonal slot adjustments",
    ],
    benefits: [
      "Reduced pick time",
      "Lower labor costs",
      "Improved ergonomics",
      "Better space utilization",
    ],
    limitations: [
      "Requires significant historical data",
      "Complex implementation",
      "Ongoing model maintenance",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-15",
  },
};

/**
 * Get all features for a category
 */
export function getFeaturesByCategory(category: string): WMSFeature[] {
  return Object.values(WMS_FEATURES).filter(
    (f) => f.category === category.toUpperCase(),
  );
}

/**
 * Get feature by ID
 */
export function getFeatureById(id: string): WMSFeature | undefined {
  return WMS_FEATURES[id];
}

/**
 * Get all features with a specific status
 */
export function getFeaturesByStatus(
  status: WMSFeature["status"],
): WMSFeature[] {
  return Object.values(WMS_FEATURES).filter((f) => f.status === status);
}

/**
 * Get features sorted by readiness probability
 */
export function getFeaturesByReadiness(): WMSFeature[] {
  return Object.values(WMS_FEATURES).sort(
    (a, b) => b.metrics.probability - a.metrics.probability,
  );
}

/**
 * Get features sorted by business weight
 */
export function getFeaturesByImportance(): WMSFeature[] {
  return Object.values(WMS_FEATURES).sort(
    (a, b) => b.metrics.weight - a.metrics.weight,
  );
}
