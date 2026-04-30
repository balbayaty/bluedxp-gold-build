/**
 * Train Schedules API Routes
 * Provides global rail freight scheduling data
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GCC Rail Network Data
const stations = [
  {
    code: "GTT",
    name: "GTT Terminal",
    fullName: "Dammam Gulf Terminal",
    country: "Saudi Arabia",
    city: "Dammam",
    region: "Eastern Province",
    type: "TERMINAL",
    coordinates: { lat: 26.4167, lng: 50.0833 },
    capabilities: ["CONTAINER", "BULK", "INTERMODAL"],
    facilities: ["Container Yard", "Warehouse", "Customs Office"],
  },
  {
    code: "DRY",
    name: "Dry Port Riyadh",
    fullName: "Riyadh Dry Port Terminal",
    country: "Saudi Arabia",
    city: "Riyadh",
    region: "Central Province",
    type: "TERMINAL",
    coordinates: { lat: 24.7136, lng: 46.6753 },
    capabilities: ["CONTAINER", "BULK"],
    facilities: [
      "Container Yard",
      "Bonded Warehouse",
      "Customs Office",
      "Rail Yard",
    ],
  },
  {
    code: "ICAD",
    name: "ICAD Terminal",
    fullName: "Industrial City of Abu Dhabi Terminal",
    country: "UAE",
    city: "Abu Dhabi",
    region: "Abu Dhabi",
    type: "INTERMODAL",
    coordinates: { lat: 24.3574, lng: 54.5009 },
    capabilities: ["CONTAINER", "INTERMODAL"],
    facilities: ["Container Yard", "Warehouse", "Customs Clearance"],
  },
  {
    code: "NDP",
    name: "NDP Station",
    fullName: "National Distribution Point",
    country: "UAE",
    city: "Dubai",
    region: "Dubai",
    type: "STATION",
    coordinates: { lat: 25.1925, lng: 55.2758 },
    capabilities: ["CONTAINER", "DISTRIBUTION"],
    facilities: ["Transit Hub", "Cross-Dock"],
  },
  {
    code: "JART",
    name: "Jebel Ali Rail Terminal",
    fullName: "Jebel Ali Port Rail Terminal",
    country: "UAE",
    city: "Dubai",
    region: "Dubai",
    type: "PORT",
    coordinates: { lat: 24.989, lng: 55.0275 },
    capabilities: ["CONTAINER", "PORT_CONNECTION", "INTERMODAL"],
    facilities: [
      "Port Connection",
      "Container Yard",
      "Reefer Points",
      "Customs",
    ],
  },
  {
    code: "JED",
    name: "Jeddah Rail Terminal",
    fullName: "Jeddah Islamic Port Rail Terminal",
    country: "Saudi Arabia",
    city: "Jeddah",
    region: "Western Province",
    type: "PORT",
    coordinates: { lat: 21.5433, lng: 39.1728 },
    capabilities: ["CONTAINER", "PORT_CONNECTION"],
    facilities: ["Port Connection", "Container Yard", "Customs"],
  },
];

const trainServices = [
  {
    id: "ts-001",
    trainNumber: "NS-101",
    type: "National Shuttle",
    operator: "Saudi Railway Company (SAR)",
    origin: "GTT",
    destination: "DRY",
    departureTime: "06:00",
    arrivalTime: "12:30",
    transitTime: 6.5,
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU"],
    status: "OPERATIONAL",
    capacity: { containers: 80, maxWeight: 2000, unit: "TEU" },
    available: 24,
    distance: 450,
    services: ["CONTAINER", "GENERAL_CARGO"],
  },
  {
    id: "ts-002",
    trainNumber: "RDC-201",
    type: "Rail Direct Consist",
    operator: "Saudi Railway Company (SAR)",
    origin: "GTT",
    destination: "JART",
    departureTime: "22:00",
    arrivalTime: "08:30",
    transitTime: 10.5,
    nextDay: true,
    frequency: ["SUN", "TUE", "THU"],
    status: "OPERATIONAL",
    capacity: { containers: 120, maxWeight: 3000, unit: "TEU" },
    available: 45,
    distance: 650,
    services: ["CONTAINER", "INTERMODAL", "CROSS_BORDER"],
  },
  {
    id: "ts-003",
    trainNumber: "GTT-JART-01",
    type: "GTT-JART Express",
    operator: "Etihad Rail",
    origin: "GTT",
    destination: "JART",
    departureTime: "14:00",
    arrivalTime: "02:00",
    transitTime: 12,
    nextDay: true,
    frequency: ["MON", "WED", "SAT"],
    status: "OPERATIONAL",
    capacity: { containers: 100, maxWeight: 2500, unit: "TEU" },
    available: 12,
    distance: 650,
    services: ["CONTAINER", "EXPRESS", "CROSS_BORDER"],
  },
  {
    id: "ts-004",
    trainNumber: "RT-301",
    type: "Rail Transfer",
    operator: "Etihad Rail",
    origin: "ICAD",
    destination: "NDP",
    departureTime: "08:00",
    arrivalTime: "10:30",
    transitTime: 2.5,
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
    status: "OPERATIONAL",
    capacity: { containers: 60, maxWeight: 1500, unit: "TEU" },
    available: 35,
    distance: 150,
    services: ["CONTAINER", "DOMESTIC"],
  },
  {
    id: "ts-005",
    trainNumber: "NS-102",
    type: "National Shuttle",
    operator: "Saudi Railway Company (SAR)",
    origin: "DRY",
    destination: "GTT",
    departureTime: "15:00",
    arrivalTime: "21:30",
    transitTime: 6.5,
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU"],
    status: "OPERATIONAL",
    capacity: { containers: 80, maxWeight: 2000, unit: "TEU" },
    available: 56,
    distance: 450,
    services: ["CONTAINER", "GENERAL_CARGO"],
  },
  {
    id: "ts-006",
    trainNumber: "JED-EXP-01",
    type: "Express Freight",
    operator: "Saudi Railway Company (SAR)",
    origin: "DRY",
    destination: "JED",
    departureTime: "04:00",
    arrivalTime: "18:00",
    transitTime: 14,
    nextDay: false,
    frequency: ["SUN", "WED"],
    status: "OPERATIONAL",
    capacity: { containers: 100, maxWeight: 2500, unit: "TEU" },
    available: 78,
    distance: 950,
    services: ["CONTAINER", "EXPRESS", "PORT_FEEDER"],
  },
];

const routes = [
  {
    id: "route-001",
    name: "Saudi Eastern Corridor",
    code: "SEC",
    origin: "GTT",
    destination: "DRY",
    viaStations: [],
    distance: 450,
    standardTransitTime: 6.5,
    frequency: "Daily (Sun-Thu)",
    crossBorder: false,
    countries: ["Saudi Arabia"],
    serviceTypes: ["National Shuttle"],
  },
  {
    id: "route-002",
    name: "GCC Cross-Border Express",
    code: "GCE",
    origin: "GTT",
    destination: "JART",
    viaStations: ["ICAD"],
    distance: 650,
    standardTransitTime: 10.5,
    frequency: "3x Weekly",
    crossBorder: true,
    countries: ["Saudi Arabia", "UAE"],
    serviceTypes: ["Rail Direct Consist", "GTT-JART Express"],
  },
  {
    id: "route-003",
    name: "Saudi Western Corridor",
    code: "SWC",
    origin: "DRY",
    destination: "JED",
    viaStations: [],
    distance: 950,
    standardTransitTime: 14,
    frequency: "2x Weekly",
    crossBorder: false,
    countries: ["Saudi Arabia"],
    serviceTypes: ["Express Freight"],
  },
  {
    id: "route-004",
    name: "UAE Domestic Link",
    code: "UDL",
    origin: "ICAD",
    destination: "JART",
    viaStations: ["NDP"],
    distance: 200,
    standardTransitTime: 3.5,
    frequency: "Daily",
    crossBorder: false,
    countries: ["UAE"],
    serviceTypes: ["Rail Transfer"],
  },
];

const futureExpansions = [
  {
    name: "Kuwait Connection",
    description: "Rail link connecting GCC network to Kuwait",
    status: "PLANNING",
    expectedCompletion: "2027",
    benefits: [
      "New market access",
      "Reduced road freight",
      "Faster customs clearance",
    ],
  },
  {
    name: "Bahrain Causeway Link",
    description: "Rail extension via King Fahd Causeway",
    status: "UNDER_STUDY",
    expectedCompletion: "2028",
    benefits: ["Bahrain connectivity", "Island logistics hub"],
  },
  {
    name: "Oman Southern Extension",
    description: "Extension to Omani southern ports",
    status: "APPROVED",
    expectedCompletion: "2026",
    benefits: ["Sohar Port access", "Regional connectivity"],
  },
  {
    name: "Qatar Corridor",
    description: "Rail link to Qatar via Saudi Arabia",
    status: "PLANNING",
    expectedCompletion: "2029",
    benefits: ["Qatar market access", "World Cup legacy"],
  },
];

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const stationCode = searchParams.get("station");
    const routeId = searchParams.get("route");
    const serviceType = searchParams.get("type");

    let filteredServices = [...trainServices];

    if (stationCode && stationCode !== "ALL") {
      filteredServices = filteredServices.filter(
        (s) => s.origin === stationCode || s.destination === stationCode,
      );
    }
    if (serviceType && serviceType !== "ALL") {
      filteredServices = filteredServices.filter((s) => s.type === serviceType);
    }

    return NextResponse.json({
      success: true,
      data: {
        stations,
        services: filteredServices,
        routes,
        futureExpansions,
        stats: {
          totalStations: stations.length,
          totalServices: trainServices.length,
          totalRoutes: routes.length,
          crossBorderRoutes: routes.filter((r) => r.crossBorder).length,
          operationalStatus: "NORMAL",
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch train schedules" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "read",
  requireAuth: true,
});
