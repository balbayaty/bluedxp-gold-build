/**
 * Comprehensive Vehicle Specifications Database
 *
 * All vehicle, container, ULD, and rail car types with complete specifications
 * Industry standards: ISO, IATA, IMO, AAR
 */

import type { VehicleSpecification } from "@/types/load-design";

/**
 * Get all vehicle specifications
 */
export function getAllVehicleSpecifications(): Map<
  string,
  VehicleSpecification
> {
  const specs = new Map<string, VehicleSpecification>();

  // ============================================================================
  // STANDARD TRUCKS
  // ============================================================================

  specs.set("TRUCK", {
    id: "truck",
    type: "TRUCK",
    name: "Standard Truck",
    description: "Standard delivery truck",
    dimensions: { length: 600, width: 240, height: 260 },
    maxWeight: 5000,
    maxVolume: 30,
    tareWeight: 3000,
    baseCost: 300,
    costPerKm: 0.5,
    costPerHour: 25,
    currency: "USD",
  });

  specs.set("LARGE_TRUCK", {
    id: "large-truck",
    type: "LARGE_TRUCK",
    name: "Large Truck",
    description: "Large freight truck",
    dimensions: { length: 1200, width: 240, height: 260 },
    maxWeight: 20000,
    maxVolume: 80,
    tareWeight: 8000,
    maxAxleWeight: 10000,
    maxGrossWeight: 28000,
    baseCost: 500,
    costPerKm: 0.7,
    costPerHour: 30,
    currency: "USD",
  });

  specs.set("VAN", {
    id: "van",
    type: "VAN",
    name: "Delivery Van",
    description: "Small delivery van",
    dimensions: { length: 400, width: 180, height: 180 },
    maxWeight: 1500,
    maxVolume: 10,
    tareWeight: 1200,
    baseCost: 200,
    costPerKm: 0.3,
    costPerHour: 20,
    currency: "USD",
  });

  specs.set("FLATBED", {
    id: "flatbed",
    type: "FLATBED",
    name: "Flatbed Truck",
    description: "Flatbed truck for oversized loads",
    dimensions: { length: 1200, width: 240, height: 250 },
    maxWeight: 25000,
    maxVolume: 50,
    tareWeight: 7000,
    baseCost: 400,
    costPerKm: 0.6,
    costPerHour: 28,
    currency: "USD",
  });

  specs.set("REEFER", {
    id: "reefer",
    type: "REEFER",
    name: "Refrigerated Truck",
    description: "Temperature-controlled truck",
    dimensions: { length: 700, width: 240, height: 240 },
    maxWeight: 15000,
    maxVolume: 35,
    tareWeight: 5000,
    hasTemperatureControl: true,
    temperatureRange: { min: -20, max: 20 },
    hasRefrigeration: true,
    baseCost: 500,
    costPerKm: 0.8,
    costPerHour: 35,
    currency: "USD",
  });

  specs.set("TANKER", {
    id: "tanker",
    type: "TANKER",
    name: "Tanker Truck",
    description: "Liquid cargo tanker",
    dimensions: { length: 1000, width: 240, height: 300 },
    maxWeight: 20000,
    maxVolume: 40,
    tareWeight: 8000,
    metadata: { hazmatApproved: true, liquidOnly: true },
    baseCost: 600,
    costPerKm: 0.9,
    costPerHour: 40,
    currency: "USD",
  });

  // ============================================================================
  // ISO CONTAINERS (Sea Freight)
  // ============================================================================

  specs.set("20FT_STANDARD", {
    id: "20ft-standard",
    type: "20FT_STANDARD",
    name: "20ft Standard Container",
    description: "ISO 20ft standard dry container",
    dimensions: { length: 606, width: 244, height: 259 },
    maxWeight: 28000,
    maxVolume: 33.2,
    tareWeight: 2200,
    compliantCountries: ["GLOBAL"],
    baseCost: 500,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1 },
  });

  specs.set("40FT_STANDARD", {
    id: "40ft-standard",
    type: "40FT_STANDARD",
    name: "40ft Standard Container",
    description: "ISO 40ft standard dry container",
    dimensions: { length: 1219, width: 244, height: 259 },
    maxWeight: 28000,
    maxVolume: 67.7,
    tareWeight: 3800,
    compliantCountries: ["GLOBAL"],
    baseCost: 800,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2 },
  });

  specs.set("40FT_HIGH_CUBE", {
    id: "40ft-hc",
    type: "40FT_HIGH_CUBE",
    name: "40ft High Cube Container",
    description: "ISO 40ft high cube container (extra height)",
    dimensions: { length: 1219, width: 244, height: 289 },
    maxWeight: 28000,
    maxVolume: 76.4,
    tareWeight: 3900,
    compliantCountries: ["GLOBAL"],
    baseCost: 850,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2 },
  });

  specs.set("45FT_HIGH_CUBE", {
    id: "45ft-hc",
    type: "45FT_HIGH_CUBE",
    name: "45ft High Cube Container",
    description: "ISO 45ft high cube container",
    dimensions: { length: 1371, width: 244, height: 289 },
    maxWeight: 28000,
    maxVolume: 86.1,
    tareWeight: 4200,
    compliantCountries: ["GLOBAL"],
    baseCost: 950,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2.25 },
  });

  specs.set("20FT_REEFER", {
    id: "20ft-reefer",
    type: "20FT_REEFER",
    name: "20ft Reefer Container",
    description: "ISO 20ft refrigerated container",
    dimensions: { length: 606, width: 229, height: 230 },
    maxWeight: 28000,
    maxVolume: 28.3,
    tareWeight: 3000,
    hasTemperatureControl: true,
    temperatureRange: { min: -30, max: 30 },
    hasRefrigeration: true,
    compliantCountries: ["GLOBAL"],
    baseCost: 700,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1 },
  });

  specs.set("40FT_REEFER", {
    id: "40ft-reefer",
    type: "40FT_REEFER",
    name: "40ft Reefer Container",
    description: "ISO 40ft refrigerated container",
    dimensions: { length: 1219, width: 229, height: 230 },
    maxWeight: 28000,
    maxVolume: 59.3,
    tareWeight: 4800,
    hasTemperatureControl: true,
    temperatureRange: { min: -30, max: 30 },
    hasRefrigeration: true,
    compliantCountries: ["GLOBAL"],
    baseCost: 1100,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2 },
  });

  specs.set("20FT_OPEN_TOP", {
    id: "20ft-open-top",
    type: "20FT_OPEN_TOP",
    name: "20ft Open Top Container",
    description: "ISO 20ft open top container for oversized cargo",
    dimensions: { length: 606, width: 244, height: 259 },
    maxWeight: 28000,
    maxVolume: 33.2,
    tareWeight: 2400,
    compliantCountries: ["GLOBAL"],
    baseCost: 600,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1, openTop: true },
  });

  specs.set("40FT_OPEN_TOP", {
    id: "40ft-open-top",
    type: "40FT_OPEN_TOP",
    name: "40ft Open Top Container",
    description: "ISO 40ft open top container",
    dimensions: { length: 1219, width: 244, height: 259 },
    maxWeight: 28000,
    maxVolume: 67.7,
    tareWeight: 4000,
    compliantCountries: ["GLOBAL"],
    baseCost: 900,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2, openTop: true },
  });

  specs.set("20FT_FLAT_RACK", {
    id: "20ft-flat-rack",
    type: "20FT_FLAT_RACK",
    name: "20ft Flat Rack Container",
    description: "ISO 20ft flat rack for heavy/oversized cargo",
    dimensions: { length: 606, width: 244, height: 259 },
    maxWeight: 35000,
    maxVolume: 30,
    tareWeight: 2800,
    compliantCountries: ["GLOBAL"],
    baseCost: 650,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1, flatRack: true },
  });

  specs.set("40FT_FLAT_RACK", {
    id: "40ft-flat-rack",
    type: "40FT_FLAT_RACK",
    name: "40ft Flat Rack Container",
    description: "ISO 40ft flat rack container",
    dimensions: { length: 1219, width: 244, height: 259 },
    maxWeight: 35000,
    maxVolume: 60,
    tareWeight: 5000,
    compliantCountries: ["GLOBAL"],
    baseCost: 1000,
    currency: "USD",
    metadata: { isoStandard: true, teu: 2, flatRack: true },
  });

  specs.set("TANK_CONTAINER", {
    id: "tank-container",
    type: "TANK_CONTAINER",
    name: "ISO Tank Container",
    description: "ISO tank container for liquids",
    dimensions: { length: 606, width: 244, height: 259 },
    maxWeight: 26000,
    maxVolume: 25,
    tareWeight: 4000,
    compliantCountries: ["GLOBAL"],
    baseCost: 800,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1, tank: true, hazmatApproved: true },
  });

  specs.set("BULK_CONTAINER", {
    id: "bulk-container",
    type: "BULK_CONTAINER",
    name: "ISO Bulk Container",
    description: "ISO bulk container for dry bulk cargo",
    dimensions: { length: 606, width: 244, height: 259 },
    maxWeight: 28000,
    maxVolume: 33.2,
    tareWeight: 2500,
    compliantCountries: ["GLOBAL"],
    baseCost: 550,
    currency: "USD",
    metadata: { isoStandard: true, teu: 1, bulk: true },
  });

  // ============================================================================
  // AIR CARGO ULDs (IATA Standard)
  // ============================================================================

  specs.set("PALLET_88X108", {
    id: "pallet-88x108",
    type: "PALLET_88X108",
    name: 'IATA Pallet 88" x 108"',
    description: "Standard IATA pallet (lower deck)",
    dimensions: { length: 224, width: 274, height: 163 },
    maxWeight: 5000,
    maxVolume: 10,
    tareWeight: 100,
    compliantCountries: ["GLOBAL"],
    baseCost: 200,
    currency: "USD",
    metadata: { iataStandard: true, ula: "P1P", lowerDeck: true },
  });

  specs.set("PALLET_96X125", {
    id: "pallet-96x125",
    type: "PALLET_96X125",
    name: 'IATA Pallet 96" x 125"',
    description: "Wide IATA pallet (lower deck)",
    dimensions: { length: 318, width: 244, height: 163 },
    maxWeight: 6800,
    maxVolume: 12.6,
    tareWeight: 120,
    compliantCountries: ["GLOBAL"],
    baseCost: 250,
    currency: "USD",
    metadata: { iataStandard: true, ula: "P6P", lowerDeck: true },
  });

  specs.set("PALLET_96X238", {
    id: "pallet-96x238",
    type: "PALLET_96X238",
    name: 'IATA Pallet 96" x 238"',
    description: "Long IATA pallet (main deck)",
    dimensions: { length: 605, width: 244, height: 244 },
    maxWeight: 11340,
    maxVolume: 36,
    tareWeight: 200,
    compliantCountries: ["GLOBAL"],
    baseCost: 400,
    currency: "USD",
    metadata: { iataStandard: true, ula: "PAG", mainDeck: true },
  });

  specs.set("CONTAINER_LD1", {
    id: "container-ld1",
    type: "CONTAINER_LD1",
    name: "IATA LD-1 Container",
    description: "Lower deck container type 1",
    dimensions: { length: 153, width: 162, height: 163 },
    maxWeight: 1588,
    maxVolume: 4.1,
    tareWeight: 80,
    compliantCountries: ["GLOBAL"],
    baseCost: 150,
    currency: "USD",
    metadata: { iataStandard: true, lowerDeck: true },
  });

  specs.set("CONTAINER_LD3", {
    id: "container-ld3",
    type: "CONTAINER_LD3",
    name: "IATA LD-3 Container",
    description: "Lower deck container type 3",
    dimensions: { length: 153, width: 162, height: 163 },
    maxWeight: 1588,
    maxVolume: 4.1,
    tareWeight: 80,
    compliantCountries: ["GLOBAL"],
    baseCost: 150,
    currency: "USD",
    metadata: { iataStandard: true, lowerDeck: true },
  });

  specs.set("CONTAINER_LD7", {
    id: "container-ld7",
    type: "CONTAINER_LD7",
    name: "IATA LD-7 Container",
    description: "Lower deck container type 7",
    dimensions: { length: 318, width: 244, height: 163 },
    maxWeight: 5000,
    maxVolume: 12.6,
    tareWeight: 120,
    compliantCountries: ["GLOBAL"],
    baseCost: 250,
    currency: "USD",
    metadata: { iataStandard: true, lowerDeck: true },
  });

  specs.set("CONTAINER_LD9", {
    id: "container-ld9",
    type: "CONTAINER_LD9",
    name: "IATA LD-9 Container",
    description: "Lower deck container type 9",
    dimensions: { length: 318, width: 244, height: 163 },
    maxWeight: 5000,
    maxVolume: 12.6,
    tareWeight: 120,
    compliantCountries: ["GLOBAL"],
    baseCost: 250,
    currency: "USD",
    metadata: { iataStandard: true, lowerDeck: true },
  });

  specs.set("CONTAINER_M1", {
    id: "container-m1",
    type: "CONTAINER_M1",
    name: "IATA M-1 Container",
    description: "Main deck container type 1",
    dimensions: { length: 318, width: 244, height: 244 },
    maxWeight: 6800,
    maxVolume: 18.9,
    tareWeight: 150,
    compliantCountries: ["GLOBAL"],
    baseCost: 300,
    currency: "USD",
    metadata: { iataStandard: true, mainDeck: true },
  });

  specs.set("CONTAINER_M2", {
    id: "container-m2",
    type: "CONTAINER_M2",
    name: "IATA M-2 Container",
    description: "Main deck container type 2",
    dimensions: { length: 318, width: 244, height: 244 },
    maxWeight: 6800,
    maxVolume: 18.9,
    tareWeight: 150,
    compliantCountries: ["GLOBAL"],
    baseCost: 300,
    currency: "USD",
    metadata: { iataStandard: true, mainDeck: true },
  });

  // ============================================================================
  // RAIL CARS (AAR Standard)
  // ============================================================================

  specs.set("BOX_CAR", {
    id: "box-car",
    type: "BOX_CAR",
    name: "Box Car",
    description: "Standard enclosed rail car",
    dimensions: { length: 1500, width: 280, height: 300 },
    maxWeight: 100000,
    maxVolume: 126,
    tareWeight: 30000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 2000,
    currency: "USD",
    metadata: { aarStandard: true, enclosed: true },
  });

  specs.set("FLAT_CAR", {
    id: "flat-car",
    type: "FLAT_CAR",
    name: "Flat Car",
    description: "Flat rail car for oversized cargo",
    dimensions: { length: 1500, width: 280, height: 200 },
    maxWeight: 100000,
    maxVolume: 84,
    tareWeight: 25000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 1800,
    currency: "USD",
    metadata: { aarStandard: true, flat: true },
  });

  specs.set("HOPPER_CAR", {
    id: "hopper-car",
    type: "HOPPER_CAR",
    name: "Hopper Car",
    description: "Hopper car for bulk materials",
    dimensions: { length: 1200, width: 280, height: 350 },
    maxWeight: 100000,
    maxVolume: 118,
    tareWeight: 28000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 1900,
    currency: "USD",
    metadata: { aarStandard: true, bulk: true },
  });

  specs.set("TANK_CAR", {
    id: "tank-car",
    type: "TANK_CAR",
    name: "Tank Car",
    description: "Rail tank car for liquids",
    dimensions: { length: 1200, width: 280, height: 350 },
    maxWeight: 100000,
    maxVolume: 118,
    tareWeight: 35000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 2200,
    currency: "USD",
    metadata: { aarStandard: true, tank: true, hazmatApproved: true },
  });

  specs.set("REEFER_CAR", {
    id: "reefer-car",
    type: "REEFER_CAR",
    name: "Refrigerated Rail Car",
    description: "Temperature-controlled rail car",
    dimensions: { length: 1500, width: 280, height: 300 },
    maxWeight: 80000,
    maxVolume: 126,
    tareWeight: 40000,
    hasTemperatureControl: true,
    temperatureRange: { min: -30, max: 30 },
    hasRefrigeration: true,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 2500,
    currency: "USD",
    metadata: { aarStandard: true, refrigerated: true },
  });

  specs.set("AUTO_RACK", {
    id: "auto-rack",
    type: "AUTO_RACK",
    name: "Auto Rack Car",
    description: "Rail car for vehicles",
    dimensions: { length: 2000, width: 280, height: 400 },
    maxWeight: 100000,
    maxVolume: 224,
    tareWeight: 30000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 2200,
    currency: "USD",
    metadata: { aarStandard: true, vehicles: true },
  });

  specs.set("GONDOLA", {
    id: "gondola",
    type: "GONDOLA",
    name: "Gondola Car",
    description: "Open-top rail car",
    dimensions: { length: 1500, width: 280, height: 300 },
    maxWeight: 100000,
    maxVolume: 126,
    tareWeight: 28000,
    compliantCountries: ["US", "CA", "MX"],
    baseCost: 1900,
    currency: "USD",
    metadata: { aarStandard: true, openTop: true },
  });

  return specs;
}

/**
 * Get vehicle specification by type
 */
export function getVehicleSpec(type: string): VehicleSpecification | undefined {
  const specs = getAllVehicleSpecifications();
  return specs.get(type);
}

/**
 * Get vehicle specifications by category
 */
export function getVehicleSpecsByCategory(
  category: "TRUCK" | "CONTAINER" | "ULD" | "RAIL",
): VehicleSpecification[] {
  const specs = getAllVehicleSpecifications();
  const filtered: VehicleSpecification[] = [];

  for (const spec of specs.values()) {
    if (
      category === "TRUCK" &&
      ["TRUCK", "VAN", "LARGE_TRUCK", "FLATBED", "REEFER", "TANKER"].includes(
        spec.type,
      )
    ) {
      filtered.push(spec);
    } else if (
      (category === "CONTAINER" && spec.type.includes("FT")) ||
      spec.type.includes("CONTAINER")
    ) {
      filtered.push(spec);
    } else if (
      category === "ULD" &&
      (spec.type.includes("PALLET") ||
        spec.type.includes("CONTAINER_LD") ||
        spec.type.includes("CONTAINER_M"))
    ) {
      filtered.push(spec);
    } else if (category === "RAIL" && spec.type.includes("CAR")) {
      filtered.push(spec);
    }
  }

  return filtered;
}
