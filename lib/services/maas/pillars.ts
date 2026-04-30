/**
 * MaaS 12 Shared Services Pillars
 *
 * All 12 pillars with services and revenue models
 *
 * @module maas
 */

import type { MAASPillarDefinition } from "./types";

/**
 * All 12 MaaS pillars
 */
export const MAAS_PILLARS: MAASPillarDefinition[] = [
  {
    id: 1,
    name: "Smart Factory Infrastructure",
    type: "SMART_FACTORY_INFRASTRUCTURE",
    description:
      "Turnkey manufacturing facilities with flexible configurations",
    services: ["Building shells", "Utilities", "Clean rooms", "Assembly lines"],
    revenue: "Lease + usage fees",
    pricing: {
      model: "per_sqm_monthly",
      basePrice: 200, // SAR/sqm/month
      margin: "35-45%",
    },
  },
  {
    id: 2,
    name: "Robotics & Automation",
    type: "ROBOTICS_AUTOMATION",
    description: "Shared AMR fleets, cobots, and automation systems",
    services: ["AMR rental", "Cobot deployment", "Integration services"],
    revenue: "Hourly/task-based billing",
    pricing: {
      model: "hourly",
      unitPrice: 150, // SAR/hour
      margin: "40-50%",
    },
  },
  {
    id: 3,
    name: "Quality Assurance Labs",
    type: "QUALITY_ASSURANCE_LABS",
    description: "Shared testing and certification facilities",
    services: ["Material testing", "Product certification", "Metrology"],
    revenue: "Per-test fees",
    pricing: {
      model: "per_test",
      unitPrice: 500, // SAR/test
      margin: "50-60%",
    },
  },
  {
    id: 4,
    name: "Logistics Hub",
    type: "LOGISTICS_HUB",
    description: "Integrated 3PL/4PL services",
    services: ["Warehousing", "Distribution", "Last-mile", "Cross-border"],
    revenue: "Storage + handling fees",
    pricing: {
      model: "storage_handling",
      basePrice: 50, // SAR/unit/month
      margin: "30-40%",
    },
  },
  {
    id: 5,
    name: "Talent & Training Academy",
    type: "TALENT_TRAINING_ACADEMY",
    description: "Workforce development and shared talent pool",
    services: ["Training programs", "Temp staffing", "Upskilling"],
    revenue: "Training fees + placement",
    pricing: {
      model: "per_participant",
      unitPrice: 1000, // SAR/participant
      margin: "25-35%",
    },
  },
  {
    id: 6,
    name: "Procurement Consortium",
    type: "PROCUREMENT_CONSORTIUM",
    description: "Bulk purchasing and supplier management",
    services: ["Group buying", "Supplier vetting", "Payment terms"],
    revenue: "Procurement fees + savings share",
    pricing: {
      model: "percentage",
      unitPrice: 0.02, // 2% of purchase value
      margin: "60-70%",
    },
  },
  {
    id: 7,
    name: "Sustainability Services",
    type: "SUSTAINABILITY_SERVICES",
    description: "Carbon tracking, waste management, circular economy",
    services: ["Carbon reporting", "Waste-to-value", "Green certifications"],
    revenue: "Service fees + carbon credits",
    pricing: {
      model: "monthly_subscription",
      basePrice: 5000, // SAR/month
      margin: "40-50%",
    },
  },
  {
    id: 8,
    name: "Digital Twin Platform",
    type: "DIGITAL_TWIN_PLATFORM",
    description: "Shared simulation and modeling infrastructure",
    services: ["Process simulation", "Predictive maintenance", "What-if"],
    revenue: "Platform subscription",
    pricing: {
      model: "subscription",
      basePrice: 10000, // SAR/month
      margin: "70-80%",
    },
  },
  {
    id: 9,
    name: "Compliance & Certification",
    type: "COMPLIANCE_CERTIFICATION",
    description: "Regulatory support and certification services",
    services: ["ISO support", "SASO compliance", "Export certifications"],
    revenue: "Consulting fees",
    pricing: {
      model: "hourly",
      unitPrice: 500, // SAR/hour
      margin: "50-60%",
    },
  },
  {
    id: 10,
    name: "R&D Collaboration Hub",
    type: "RD_COLLABORATION_HUB",
    description: "Shared innovation facilities and IP services",
    services: ["Prototyping", "Patent support", "University partnerships"],
    revenue: "Project fees + IP licensing",
    pricing: {
      model: "project_based",
      basePrice: 50000, // SAR/project
      margin: "40-50%",
    },
  },
  {
    id: 11,
    name: "Financial Services",
    type: "FINANCIAL_SERVICES",
    description: "Trade finance, insurance, payment solutions",
    services: ["LC services", "Credit insurance", "FX management"],
    revenue: "Transaction fees",
    pricing: {
      model: "percentage",
      unitPrice: 0.01, // 1% of transaction
      margin: "60-70%",
    },
  },
  {
    id: 12,
    name: "Customer Success Platform",
    type: "CUSTOMER_SUCCESS_PLATFORM",
    description: "Sales, marketing, and customer management",
    services: ["Lead generation", "CRM", "After-sales support"],
    revenue: "Commission + subscription",
    pricing: {
      model: "commission_subscription",
      basePrice: 3000, // SAR/month
      unitPrice: 0.05, // 5% commission
      margin: "50-60%",
    },
  },
];
