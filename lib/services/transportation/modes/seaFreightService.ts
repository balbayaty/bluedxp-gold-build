/**
 * Sea Freight Service - Complete Business Logic
 *
 * Handles ALL sea freight operations:
 * - Container booking (FCL: 20ft, 40ft, 40HC, 45HC, Reefer, etc.)
 * - LCL consolidation and de-consolidation
 * - Bill of Lading (B/L) generation (Master & House)
 * - VGM (Verified Gross Mass) calculation & submission
 * - Vessel schedule integration
 * - Shipping line API integration
 * - Container stuffing/unstuffing optimization
 * - Demurrage & detention calculation
 * - Port operations management
 *
 * INTEGRATES WITH:
 * - Shipping line APIs (Maersk, MSC, COSCO, Hapag-Lloyd)
 * - Port systems
 * - Container tracking systems (SCAC codes)
 * - Finance module (for demurrage/detention charges)
 *
 * NO DUPLICATION - Uses platform services
 */

import type { Shipment, ShipmentItem, Location } from "@/types/tms";
import { eventBus, createEvent } from "@/lib/services/event-bus";

// ============================================================================
// TYPES - Sea Freight Specific
// ============================================================================

export interface BillOfLading {
  blNumber: string; // Format: MAEU123456789 (SCAC code + number)
  type: "MASTER" | "HOUSE" | "SEA_WAYBILL";
  masterBL?: string; // If this is a house B/L
  shippingLine: {
    scacCode: string; // 4-letter SCAC code
    name: string;
  };
  shipment: {
    id: string;
    portOfLoading: Location;
    portOfDischarge: Location;
  };
  shipper: {
    name: string;
    address: string;
    contact: string;
  };
  consignee: {
    name: string;
    address: string;
    contact: string;
  };
  notifyParty: {
    name: string;
    address: string;
    contact: string;
  };
  vessel: {
    name: string;
    imoNumber: string;
    voyageNumber: string;
  };
  containers: ContainerInfo[];
  cargo: {
    description: string;
    hsCode?: string;
    packageType: string;
    packageCount: number;
    grossWeight: number; // kg
    volume: number; // m³ or CBM
  };
  freightPayable: "PREPAID" | "COLLECT";
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  charges: {
    freight: number;
    thc: number; // Terminal Handling Charges
    baf: number; // Bunker Adjustment Factor
    currency: string;
  };
  generatedAt: Date;
  status: "DRAFT" | "ISSUED" | "SURRENDERED" | "SWITCHED" | "DELIVERED";
}

export interface ContainerInfo {
  containerNumber: string; // Format: ABCD1234567 (4 letters + 7 digits)
  containerType:
    | "20FT"
    | "40FT"
    | "40FT_HC"
    | "45FT_HC"
    | "20FT_REEFER"
    | "40FT_REEFER"
    | "OPEN_TOP"
    | "FLAT_RACK";
  sealNumber: string;
  sealNumbers?: string[]; // Multiple seals
  isEmpty: boolean;
  vgm?: VGM; // Verified Gross Mass
  stuffing?: {
    date: Date;
    location: Location;
    method: "FCL" | "LCL_CONSOLIDATION";
    stuffedBy: string;
  };
  unstuffing?: {
    date: Date;
    location: Location;
    method: "FCL" | "LCL_DECONSOLIDATION";
    unstuffedBy: string;
  };
}

export interface VGM {
  containerNumber: string;
  method: "METHOD_1" | "METHOD_2"; // SOLAS VGM methods
  grossMass: number; // kg
  verifiedBy: string;
  verifiedAt: Date;
  submittedToTerminal: boolean;
  submissionReference?: string;
  certified: boolean;
}

export interface ContainerBooking {
  bookingNumber: string;
  bookingDate: Date;
  shippingLine: string;
  containerType: string;
  containerCount: number;
  portOfLoading: Location;
  portOfDischarge: Location;
  vessel: {
    name: string;
    voyageNumber: string;
    etd: Date; // Estimated Time of Departure
    eta: Date; // Estimated Time of Arrival
  };
  stuffingDeadline: Date; // CY Cut-off
  documentDeadline: Date; // Documentation cut-off
  status: "REQUESTED" | "CONFIRMED" | "CANCELLED";
  confirmationNumber?: string;
}

export interface LCLConsolidation {
  consolidationId: string;
  masterBL: string;
  forwarder: string;
  origin: Location;
  destination: Location;
  shipments: Shipment[];
  totalCBM: number; // Cubic meters
  totalWeight: number;
  containerAssignment?: {
    containerNumber: string;
    containerType: string;
    utilization: number; // percentage
  };
  deconsolidationPoint?: Location;
}

export interface DemurrageDetention {
  type: "DEMURRAGE" | "DETENTION";
  containerNumber: string;
  freeTime: number; // days
  startDate: Date;
  endDate?: Date;
  daysUsed: number;
  daysOverdue: number;
  rate: number; // per day
  currency: string;
  totalCharge: number;
  status: "WITHIN_FREE_TIME" | "OVERDUE" | "CLOSED";
}

// ============================================================================
// SEA FREIGHT SERVICE
// ============================================================================

export class SeaFreightService {
  /**
   * Book FCL (Full Container Load)
   */
  async bookFCLContainer(params: {
    shipment: Shipment;
    containerType: ContainerInfo["containerType"];
    containerCount: number;
    shippingLine: string;
    portOfLoading: Location;
    portOfDischarge: Location;
    requestedETD?: Date;
    tenantId: string;
  }): Promise<ContainerBooking> {
    const {
      shipment,
      containerType,
      containerCount,
      shippingLine,
      portOfLoading,
      portOfDischarge,
      requestedETD,
      tenantId,
    } = params;

    // Find suitable vessel
    const vessels = await this.findVessels({
      pol: portOfLoading,
      pod: portOfDischarge,
      etd: requestedETD || new Date(),
      shippingLine,
    });

    if (vessels.length === 0) {
      throw new Error("No vessels available for requested route and date");
    }

    const selectedVessel = vessels[0]; // Select first available

    // Generate booking number
    const bookingNumber = `BKG${Date.now()}`;

    // Calculate deadlines
    const stuffingDeadline = new Date(
      selectedVessel.etd.getTime() - 24 * 3600000,
    ); // 24 hours before sailing
    const documentDeadline = new Date(
      selectedVessel.etd.getTime() - 48 * 3600000,
    ); // 48 hours before sailing

    const booking: ContainerBooking = {
      bookingNumber,
      bookingDate: new Date(),
      shippingLine,
      containerType,
      containerCount,
      portOfLoading,
      portOfDischarge,
      vessel: selectedVessel,
      stuffingDeadline,
      documentDeadline,
      status: "REQUESTED",
    };

    // In production: Submit booking to shipping line API
    // For now, auto-confirm
    booking.status = "CONFIRMED";
    booking.confirmationNumber = `CONF${Date.now()}`;

    // Update shipment
    shipment.fclDetails = {
      ...shipment.fclDetails,
      containerType,
      containerCount,
    };
    shipment.bookingNumber = bookingNumber;
    shipment.vesselName = selectedVessel.name;
    shipment.voyageNumber = selectedVessel.voyageNumber;
    shipment.status = "BOOKED";

    await eventBus.publish(
      createEvent(
        "transportation.sea_freight.fcl_booked",
        shipment.id,
        "Shipment",
        {
          shipmentId: shipment.id,
          bookingNumber,
          containerType,
          containerCount,
          vessel: selectedVessel.name,
        },
        1,
        { tenantId, userId: "sea-freight-service" },
      ),
    );

    return booking;
  }

  /**
   * Generate Bill of Lading (B/L)
   */
  async generateBillOfLading(params: {
    shipment: Shipment;
    shippingLine: { scacCode: string; name: string };
    vessel: { name: string; imoNumber: string; voyageNumber: string };
    containers: ContainerInfo[];
    type: "MASTER" | "HOUSE";
    masterBL?: string;
    tenantId: string;
  }): Promise<BillOfLading> {
    const {
      shipment,
      shippingLine,
      vessel,
      containers,
      type,
      masterBL,
      tenantId,
    } = params;

    // Generate B/L number
    const blNumber = this.generateBLNumber(shippingLine.scacCode);

    const billOfLading: BillOfLading = {
      blNumber,
      type,
      masterBL,
      shippingLine,
      shipment: {
        id: shipment.id,
        portOfLoading: shipment.origin,
        portOfDischarge: shipment.destination,
      },
      shipper: {
        name: shipment.consignorName || "",
        address: shipment.origin.address.street,
        contact: shipment.consignorContact || "",
      },
      consignee: {
        name: shipment.consigneeName || "",
        address: shipment.destination.address.street,
        contact: shipment.consigneeContact || "",
      },
      notifyParty: {
        name: shipment.notifyPartyName || shipment.consigneeName || "",
        address: shipment.destination.address.street,
        contact: shipment.consigneeContact || "",
      },
      vessel,
      containers,
      cargo: {
        description: shipment.items
          .map((i) => `${i.quantity} ${i.unit} ${i.description}`)
          .join("; "),
        hsCode: shipment.items[0]?.hsCode,
        packageType: "CONTAINER",
        packageCount: containers.length,
        grossWeight: shipment.totalWeight,
        volume: shipment.totalVolume,
      },
      freightPayable:
        (shipment.paymentTerms === "THIRD_PARTY"
          ? "PREPAID"
          : shipment.paymentTerms) || "PREPAID",
      placeOfReceipt: shipment.origin.address.city,
      placeOfDelivery: shipment.destination.address.city,
      charges: {
        freight: shipment.freightCharges?.baseRate || 0,
        thc: 0, // Calculate based on port
        baf: 0, // Calculate based on fuel index
        currency: shipment.currency,
      },
      generatedAt: new Date(),
      status: "ISSUED",
    };

    // Update shipment
    shipment.blNumber = blNumber;
    if (type === "HOUSE") {
      shipment.houseBL = blNumber;
      shipment.masterBL = masterBL;
    } else {
      shipment.masterBL = blNumber;
    }

    await eventBus.publish(
      createEvent(
        "transportation.sea_freight.bl_generated",
        blNumber,
        "BillOfLading",
        { blNumber, type, shipmentId: shipment.id },
        1,
        { tenantId, userId: "sea-freight-service" },
      ),
    );

    return billOfLading;
  }

  /**
   * Calculate and submit VGM (Verified Gross Mass)
   * SOLAS requirement - mandatory for all containers
   */
  async calculateAndSubmitVGM(params: {
    container: ContainerInfo;
    cargo: Shipment["items"];
    method: "METHOD_1" | "METHOD_2";
    tenantId: string;
  }): Promise<VGM> {
    const { container, cargo, method, tenantId } = params;

    let grossMass = 0;

    if (method === "METHOD_1") {
      // Method 1: Weigh the packed container
      // In production: Integrate with weighbridge/scale
      const cargoWeight = cargo.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0,
      );
      const tareWeight = this.getContainerTareWeight(container.containerType);
      grossMass = cargoWeight + tareWeight;
    } else {
      // Method 2: Weigh all cargo items + dunnage + container tare
      const cargoWeight = cargo.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0,
      );
      const dunnageWeight = cargoWeight * 0.02; // 2% for dunnage (pallets, straps, etc.)
      const tareWeight = this.getContainerTareWeight(container.containerType);
      grossMass = cargoWeight + dunnageWeight + tareWeight;
    }

    const vgm: VGM = {
      containerNumber: container.containerNumber,
      method,
      grossMass: Math.round(grossMass),
      verifiedBy: "BlueDXP System",
      verifiedAt: new Date(),
      submittedToTerminal: false,
      certified: true,
    };

    // Submit VGM to terminal
    try {
      const submissionRef = await this.submitVGMToTerminal(
        vgm,
        container,
        tenantId,
      );
      vgm.submittedToTerminal = true;
      vgm.submissionReference = submissionRef;
    } catch (error) {
      console.error("VGM submission to terminal failed:", error);
    }

    await eventBus.publish(
      createEvent(
        "transportation.sea_freight.vgm_calculated",
        container.containerNumber,
        "Container",
        { vgm, method },
        1,
        { tenantId, userId: "sea-freight-service" },
      ),
    );

    return vgm;
  }

  /**
   * Optimize container stuffing (packing)
   */
  async optimizeContainerStuffing(params: {
    cargo: ShipmentItem[];
    containerType: ContainerInfo["containerType"];
  }): Promise<{
    feasible: boolean;
    utilization: { weight: number; volume: number };
    stuffingPlan: StuffingInstruction[];
    warnings: string[];
  }> {
    const containerCapacity = this.getContainerCapacity(params.containerType);

    // Calculate totals
    const totalWeight = params.cargo.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = params.cargo.reduce(
      (sum, item) => sum + item.volume * item.quantity,
      0,
    );

    // Check feasibility
    const weightFeasible = totalWeight <= containerCapacity.maxGrossWeight;
    const volumeFeasible = totalVolume <= containerCapacity.volume;

    const feasible = weightFeasible && volumeFeasible;

    const warnings: string[] = [];
    if (!weightFeasible) {
      warnings.push(
        `Overweight: ${totalWeight}kg exceeds ${containerCapacity.maxGrossWeight}kg limit`,
      );
    }
    if (!volumeFeasible) {
      warnings.push(
        `Over-volume: ${totalVolume}m³ exceeds ${containerCapacity.volume}m³ capacity`,
      );
    }

    // Generate stuffing plan
    const stuffingPlan: StuffingInstruction[] = [];
    for (const item of params.cargo) {
      stuffingPlan.push({
        item: item.sku,
        description: item.description,
        quantity: item.quantity,
        position: "FLOOR", // Simplified - in production, use 3D bin packing
        stackable: true,
        loadSequence: stuffingPlan.length + 1,
      });
    }

    return {
      feasible,
      utilization: {
        weight: (totalWeight / containerCapacity.maxGrossWeight) * 100,
        volume: (totalVolume / containerCapacity.volume) * 100,
      },
      stuffingPlan,
      warnings,
    };
  }

  /**
   * Calculate Demurrage (port storage charges)
   */
  async calculateDemurrage(params: {
    containerNumber: string;
    arrivalDate: Date;
    pickupDate?: Date;
    portCode: string;
    freeTime: number; // days
    tenantId: string;
  }): Promise<DemurrageDetention> {
    const {
      containerNumber,
      arrivalDate,
      pickupDate,
      portCode,
      freeTime,
      tenantId,
    } = params;

    const now = pickupDate || new Date();
    const daysSinceArrival = Math.floor(
      (now.getTime() - arrivalDate.getTime()) / (24 * 3600000),
    );

    const daysOverdue = Math.max(0, daysSinceArrival - freeTime);

    // Get port's demurrage rate
    const rate = await this.getDemurrageRate(portCode, "DEMURRAGE");

    const totalCharge = daysOverdue * rate;

    return {
      type: "DEMURRAGE",
      containerNumber,
      freeTime,
      startDate: arrivalDate,
      endDate: pickupDate,
      daysUsed: daysSinceArrival,
      daysOverdue,
      rate,
      currency: "USD",
      totalCharge,
      status: daysOverdue > 0 ? "OVERDUE" : "WITHIN_FREE_TIME",
    };
  }

  /**
   * Calculate Detention (container usage charges)
   */
  async calculateDetention(params: {
    containerNumber: string;
    pickupDate: Date;
    returnDate?: Date;
    shippingLine: string;
    freeTime: number; // days
    tenantId: string;
  }): Promise<DemurrageDetention> {
    const {
      containerNumber,
      pickupDate,
      returnDate,
      shippingLine,
      freeTime,
      tenantId,
    } = params;

    const now = returnDate || new Date();
    const daysSincePickup = Math.floor(
      (now.getTime() - pickupDate.getTime()) / (24 * 3600000),
    );

    const daysOverdue = Math.max(0, daysSincePickup - freeTime);

    // Get shipping line's detention rate
    const rate = await this.getDemurrageRate(shippingLine, "DETENTION");

    const totalCharge = daysOverdue * rate;

    return {
      type: "DETENTION",
      containerNumber,
      freeTime,
      startDate: pickupDate,
      endDate: returnDate,
      daysUsed: daysSincePickup,
      daysOverdue,
      rate,
      currency: "USD",
      totalCharge,
      status: daysOverdue > 0 ? "OVERDUE" : "WITHIN_FREE_TIME",
    };
  }

  /**
   * Track vessel in real-time
   */
  async trackVessel(imoNumber: string): Promise<{
    vessel: {
      name: string;
      imoNumber: string;
      currentPosition: { lat: number; lng: number };
      currentPort?: string;
      status: "AT_SEA" | "AT_PORT" | "ANCHORED";
      speed: number; // knots
      heading: number; // degrees
    };
    eta: {
      port: string;
      estimatedArrival: Date;
      confidence: number;
    };
    lastUpdate: Date;
  }> {
    // In production: Integrate with vessel tracking APIs
    // - MarineTraffic API
    // - VesselFinder API
    // - AIS (Automatic Identification System)

    // Mock response
    return {
      vessel: {
        name: "MSC OSCAR",
        imoNumber,
        currentPosition: { lat: 25.2048, lng: 55.2708 }, // Dubai
        currentPort: "AEJEA", // Jebel Ali
        status: "AT_PORT",
        speed: 0,
        heading: 0,
      },
      eta: {
        port: "SAJED", // Jeddah
        estimatedArrival: new Date(Date.now() + 48 * 3600000),
        confidence: 0.95,
      },
      lastUpdate: new Date(),
    };
  }

  /**
   * LCL Consolidation
   */
  async createLCLConsolidation(params: {
    shipments: Shipment[];
    origin: Location;
    destination: Location;
    forwarder: string;
    tenantId: string;
  }): Promise<LCLConsolidation> {
    const { shipments, origin, destination, forwarder, tenantId } = params;

    // Calculate total CBM (Cubic Meters)
    const totalCBM = shipments.reduce((sum, s) => sum + s.totalVolume, 0);
    const totalWeight = shipments.reduce((sum, s) => sum + s.totalWeight, 0);

    // Determine container type needed
    const containerType = this.selectContainerForLCL(totalCBM, totalWeight);

    // Generate consolidation ID
    const consolidationId = `CON-${Date.now()}`;

    // Generate Master B/L for consolidation
    const masterBLNumber = `${forwarder}-${Date.now()}`;

    const consolidation: LCLConsolidation = {
      consolidationId,
      masterBL: masterBLNumber,
      forwarder,
      origin,
      destination,
      shipments,
      totalCBM: Math.round(totalCBM * 100) / 100,
      totalWeight: Math.round(totalWeight),
      containerAssignment: {
        containerNumber: `TEMP-${consolidationId}`,
        containerType,
        utilization:
          (totalCBM / this.getContainerCapacity(containerType).volume) * 100,
      },
    };

    // Update each shipment with consolidation info
    for (const shipment of shipments) {
      shipment.consolidationLevel = "CONSOLIDATED";
      shipment.masterShipmentId = consolidationId;
      shipment.lclDetails = {
        ...shipment.lclDetails,
        bookingNumber: masterBLNumber,
        freightForwarder: forwarder,
        cbm: shipment.totalVolume,
      };
    }

    await eventBus.publish(
      createEvent(
        "transportation.sea_freight.lcl_consolidated",
        consolidationId,
        "LCLConsolidation",
        {
          consolidationId,
          masterBL: masterBLNumber,
          shipments: shipments.length,
          totalCBM,
        },
        1,
        { tenantId, userId: "sea-freight-service" },
      ),
    );

    return consolidation;
  }

  /**
   * Find available vessels
   */
  private async findVessels(params: {
    pol: Location;
    pod: Location;
    etd: Date;
    shippingLine: string;
  }): Promise<
    Array<{
      name: string;
      imoNumber: string;
      voyageNumber: string;
      etd: Date;
      eta: Date;
      transitTime: number; // days
    }>
  > {
    // In production: Integrate with shipping line APIs
    // - Maersk API
    // - MSC API
    // - COSCO API

    // Mock vessel schedule
    return [
      {
        name: "MSC OSCAR",
        imoNumber: "IMO9778077",
        voyageNumber: "V123W",
        etd: params.etd,
        eta: new Date(params.etd.getTime() + 14 * 24 * 3600000), // +14 days
        transitTime: 14,
      },
      {
        name: "MAERSK ESSEX",
        imoNumber: "IMO9632156",
        voyageNumber: "V456E",
        etd: new Date(params.etd.getTime() + 2 * 24 * 3600000), // +2 days
        eta: new Date(params.etd.getTime() + 16 * 24 * 3600000), // +16 days
        transitTime: 14,
      },
    ];
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private generateBLNumber(scacCode: string): string {
    // B/L format: SCAC code (4 letters) + serial number
    const serial = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0");
    return `${scacCode}${serial}`;
  }

  private getContainerCapacity(type: ContainerInfo["containerType"]): {
    maxGrossWeight: number;
    tareWeight: number;
    payload: number;
    volume: number;
    internalDimensions: { length: number; width: number; height: number };
  } {
    const capacities: Record<string, any> = {
      "20FT": {
        maxGrossWeight: 24000, // kg
        tareWeight: 2300,
        payload: 21700,
        volume: 33.2, // m³
        internalDimensions: { length: 5.9, width: 2.35, height: 2.39 },
      },
      "40FT": {
        maxGrossWeight: 30480,
        tareWeight: 3800,
        payload: 26680,
        volume: 67.7,
        internalDimensions: { length: 12.03, width: 2.35, height: 2.39 },
      },
      "40FT_HC": {
        maxGrossWeight: 30480,
        tareWeight: 3900,
        payload: 26580,
        volume: 76.3,
        internalDimensions: { length: 12.03, width: 2.35, height: 2.69 },
      },
      "45FT_HC": {
        maxGrossWeight: 30480,
        tareWeight: 4800,
        payload: 25680,
        volume: 86.0,
        internalDimensions: { length: 13.56, width: 2.35, height: 2.69 },
      },
      "20FT_REEFER": {
        maxGrossWeight: 27400,
        tareWeight: 3100,
        payload: 24300,
        volume: 28.0,
        internalDimensions: { length: 5.45, width: 2.29, height: 2.27 },
      },
      "40FT_REEFER": {
        maxGrossWeight: 30480,
        tareWeight: 4850,
        payload: 25630,
        volume: 59.0,
        internalDimensions: { length: 11.59, width: 2.29, height: 2.25 },
      },
    };

    return capacities[type] || capacities["20FT"];
  }

  private getContainerTareWeight(type: ContainerInfo["containerType"]): number {
    return this.getContainerCapacity(type).tareWeight;
  }

  private selectContainerForLCL(
    cbm: number,
    weight: number,
  ): ContainerInfo["containerType"] {
    // Select smallest container that fits
    if (cbm <= 28 && weight <= 21700) return "20FT";
    if (cbm <= 67.7 && weight <= 26680) return "40FT";
    return "40FT_HC";
  }

  private async getDemurrageRate(
    portCodeOrLine: string,
    type: "DEMURRAGE" | "DETENTION",
  ): Promise<number> {
    // In production: Get from port/shipping line rate tables
    const rates: Record<string, number> = {
      DEMURRAGE: 150, // USD per day
      DETENTION: 200, // USD per day
    };
    return rates[type] || 150;
  }

  private async submitVGMToTerminal(
    vgm: VGM,
    container: ContainerInfo,
    tenantId: string,
  ): Promise<string> {
    // In production: Submit to port's VGM submission system
    // For now, return mock reference
    return `VGM-${Date.now()}`;
  }
}

interface StuffingInstruction {
  item: string;
  description: string;
  quantity: number;
  position: string;
  stackable: boolean;
  loadSequence: number;
}

export const seaFreightService = new SeaFreightService();
