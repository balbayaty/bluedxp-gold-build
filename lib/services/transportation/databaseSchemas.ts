/**
 * Transportation Database Schemas
 *
 * Database schema definitions for transportation module
 * Supports multiple database systems (PostgreSQL, MongoDB, etc.)
 */

export interface ShipmentSchema {
  id: string;
  shipmentNumber: string;
  trackingNumber?: string;
  referenceNumber?: string;
  customerReference?: string;
  internalReference?: string;

  type: string;
  mode: string;
  status: string;
  priority?: string;
  serviceLevel?: string;

  origin: any; // JSON
  destination: any; // JSON
  route?: any; // JSON
  alternativeRoutes?: any[]; // JSON array
  intermediateStops?: any[]; // JSON array

  pickupDate?: Date;
  pickupTimeWindow?: any; // JSON
  estimatedPickup?: Date;
  actualPickup?: Date;
  estimatedDelivery?: Date;
  deliveryTimeWindow?: any; // JSON
  actualDelivery?: Date;
  bookingDate?: Date;
  cutOffDate?: Date;
  sailingDate?: Date;
  departureDate?: Date;
  arrivalDate?: Date;

  items: any[]; // JSON array
  totalWeight: number;
  totalVolume: number;
  totalValue: number;
  currency: string;
  totalPieces?: number;
  totalPallets?: number;
  totalContainers?: number;
  dimensions?: any; // JSON

  consolidationLevel?: string;
  masterShipmentId?: string;
  childShipmentIds?: string[];
  consolidatedShipmentIds?: string[];
  consolidationDetails?: any; // JSON

  fclDetails?: any; // JSON
  lclDetails?: any; // JSON
  airFreightDetails?: any; // JSON
  railFreightDetails?: any; // JSON
  roadFreightDetails?: any; // JSON
  bulkDetails?: any; // JSON
  projectCargoDetails?: any; // JSON

  carrierId?: string;
  carrierName?: string;
  carrierCode?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  containerNumber?: string;
  containerNumbers?: string[];
  vesselName?: string;
  vesselIMO?: string;
  voyageNumber?: string;
  flightNumber?: string;
  awbNumber?: string;
  blNumber?: string;
  houseBL?: string;
  masterBL?: string;
  bookingAgent?: string;
  freightForwarder?: string;
  nvocc?: string;

  incoterms?: string;
  incotermsLocation?: string;

  customs?: any; // JSON
  brokerId?: string;
  brokerName?: string;

  documents: any[]; // JSON array

  freightCharges?: any; // JSON
  insurance?: any; // JSON
  paymentTerms?: string;
  paymentMethod?: string;

  pricingIntelligence?: any; // JSON
  emissions?: any; // JSON
  transitTime?: any; // JSON

  temperatureControl?: any; // JSON
  hazmat?: any; // JSON
  specialHandling?: any; // JSON

  trackingEvents: any[]; // JSON array
  currentLocation?: any; // JSON
  realTimeTracking?: any; // JSON

  exceptions: any[]; // JSON array
  alerts: any[]; // JSON array

  journeyId?: string;
  lifecycleId?: string;
  rootCauseAnalysisId?: string;

  aiInsights?: any; // JSON

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  tenantId?: string;

  integrationSource?: string;
  externalId?: string;
  externalReferences?: any; // JSON
}

export interface CarrierSchema {
  id: string;
  code: string;
  name: string;
  type: string;
  contactPerson: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  coverage: any; // JSON
  rating?: number;
  performance?: any; // JSON
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

export interface LoadMatchSchema {
  id: string;
  requestId: string;
  carrierId: string;
  matchScore: number;
  confidence: number;
  estimatedPrice: number;
  estimatedTransitTime: number;
  reliability: number;
  reasons: string[];
  strengths: string[];
  considerations: string[];
  availability: boolean;
  bookingDeadline?: Date;
  createdAt: Date;
}

export interface FreightInvoiceSchema {
  id: string;
  invoiceNumber: string;
  carrierId: string;
  carrierName: string;
  shipmentId: string;
  invoiceDate: Date;
  dueDate: Date;
  lineItems: any[]; // JSON array
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  documentUrl?: string;
  ocrData?: any; // JSON
  status: string;
  auditResult?: any; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSchema {
  id: string;
  invoiceId: string;
  shipmentId: string;
  amount: number;
  currency: string;
  carrierId: string;
  paymentMethod: string;
  status: string;
  scheduledDate?: Date;
  processedDate?: Date;
  confirmationNumber?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IoTDeviceSchema {
  id: string;
  shipmentId: string;
  deviceId: string;
  deviceType: string;
  integrationType: string; // 'DIRECT' | 'GOVERNMENT'
  provider?: string;
  lastUpdate?: Date;
  status: string;
  metadata?: any; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorDataSchema {
  id: string;
  shipmentId: string;
  deviceId: string;
  timestamp: Date;
  location: any; // JSON
  sensors: any; // JSON
  vehicle?: any; // JSON
  compliance?: any; // JSON
  source: string;
  createdAt: Date;
}

export interface ComplianceRecordSchema {
  id: string;
  shipmentId: string;
  driverId?: string;
  vehicleId?: string;
  country: string;
  regulations: any[]; // JSON array
  overallStatus: string;
  violations: string[];
  checkedAt: Date;
  createdAt: Date;
}

export interface HoursOfServiceSchema {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  status: string;
  hours: any; // JSON
  violations: any[]; // JSON array
  compliant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockchainTransactionSchema {
  id: string;
  shipmentId: string;
  transactionType: string;
  data: any; // JSON
  hash: string;
  previousHash?: string;
  timestamp: Date;
  blockNumber?: number;
  createdAt: Date;
}

export interface FleetVehicleSchema {
  id: string;
  plateNumber: string;
  type: string;
  capacity: any; // JSON
  status: string;
  currentLocation?: any; // JSON
  driverId?: string;
  driverName?: string;
  maintenance: any; // JSON
  fuel?: any; // JSON
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

/**
 * Database migration utilities
 */
export class TransportationDatabaseSchemas {
  /**
   * Get PostgreSQL table creation SQL
   */
  static getPostgreSQLSchema(): string {
    return `
      -- Shipments Table
      CREATE TABLE IF NOT EXISTS shipments (
        id VARCHAR(255) PRIMARY KEY,
        shipment_number VARCHAR(255) UNIQUE NOT NULL,
        tracking_number VARCHAR(255),
        reference_number VARCHAR(255),
        customer_reference VARCHAR(255),
        internal_reference VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        mode VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(20),
        service_level VARCHAR(20),
        origin JSONB NOT NULL,
        destination JSONB NOT NULL,
        route JSONB,
        alternative_routes JSONB,
        intermediate_stops JSONB,
        pickup_date TIMESTAMP,
        pickup_time_window JSONB,
        estimated_pickup TIMESTAMP,
        actual_pickup TIMESTAMP,
        estimated_delivery TIMESTAMP,
        delivery_time_window JSONB,
        actual_delivery TIMESTAMP,
        booking_date TIMESTAMP,
        cut_off_date TIMESTAMP,
        sailing_date TIMESTAMP,
        departure_date TIMESTAMP,
        arrival_date TIMESTAMP,
        items JSONB NOT NULL,
        total_weight DECIMAL(10, 2) NOT NULL,
        total_volume DECIMAL(10, 2) NOT NULL,
        total_value DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        total_pieces INTEGER,
        total_pallets INTEGER,
        total_containers INTEGER,
        dimensions JSONB,
        consolidation_level VARCHAR(50),
        master_shipment_id VARCHAR(255),
        child_shipment_ids JSONB,
        consolidated_shipment_ids JSONB,
        consolidation_details JSONB,
        fcl_details JSONB,
        lcl_details JSONB,
        air_freight_details JSONB,
        rail_freight_details JSONB,
        road_freight_details JSONB,
        bulk_details JSONB,
        project_cargo_details JSONB,
        carrier_id VARCHAR(255),
        carrier_name VARCHAR(255),
        carrier_code VARCHAR(255),
        booking_number VARCHAR(255),
        confirmation_number VARCHAR(255),
        container_number VARCHAR(255),
        container_numbers JSONB,
        vessel_name VARCHAR(255),
        vessel_imo VARCHAR(255),
        voyage_number VARCHAR(255),
        flight_number VARCHAR(255),
        awb_number VARCHAR(255),
        bl_number VARCHAR(255),
        house_bl VARCHAR(255),
        master_bl VARCHAR(255),
        booking_agent VARCHAR(255),
        freight_forwarder VARCHAR(255),
        nvocc VARCHAR(255),
        incoterms VARCHAR(10),
        incoterms_location VARCHAR(255),
        customs JSONB,
        broker_id VARCHAR(255),
        broker_name VARCHAR(255),
        documents JSONB NOT NULL,
        freight_charges JSONB,
        insurance JSONB,
        payment_terms VARCHAR(50),
        payment_method VARCHAR(50),
        pricing_intelligence JSONB,
        emissions JSONB,
        transit_time JSONB,
        temperature_control JSONB,
        hazmat JSONB,
        special_handling JSONB,
        tracking_events JSONB NOT NULL,
        current_location JSONB,
        real_time_tracking JSONB,
        exceptions JSONB NOT NULL,
        alerts JSONB NOT NULL,
        journey_id VARCHAR(255),
        lifecycle_id VARCHAR(255),
        root_cause_analysis_id VARCHAR(255),
        ai_insights JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        tenant_id VARCHAR(255),
        integration_source VARCHAR(100),
        external_id VARCHAR(255),
        external_references JSONB
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
      CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON shipments(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
      CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at);
      CREATE INDEX IF NOT EXISTS idx_shipments_journey ON shipments(journey_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_lifecycle ON shipments(lifecycle_id);

      -- Carriers Table
      CREATE TABLE IF NOT EXISTS carriers (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        service_types JSONB NOT NULL,
        coverage JSONB NOT NULL,
        rating DECIMAL(3, 2),
        performance JSONB,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        tenant_id VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(status);
      CREATE INDEX IF NOT EXISTS idx_carriers_tenant ON carriers(tenant_id);

      -- Load Matches Table
      CREATE TABLE IF NOT EXISTS load_matches (
        id VARCHAR(255) PRIMARY KEY,
        request_id VARCHAR(255) NOT NULL,
        carrier_id VARCHAR(255) NOT NULL,
        match_score INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        estimated_price DECIMAL(10, 2) NOT NULL,
        estimated_transit_time INTEGER NOT NULL,
        reliability INTEGER NOT NULL,
        reasons JSONB NOT NULL,
        strengths JSONB NOT NULL,
        considerations JSONB NOT NULL,
        availability BOOLEAN NOT NULL,
        booking_deadline TIMESTAMP,
        created_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_load_matches_request ON load_matches(request_id);
      CREATE INDEX IF NOT EXISTS idx_load_matches_carrier ON load_matches(carrier_id);

      -- Freight Invoices Table
      CREATE TABLE IF NOT EXISTS freight_invoices (
        id VARCHAR(255) PRIMARY KEY,
        invoice_number VARCHAR(255) UNIQUE NOT NULL,
        carrier_id VARCHAR(255) NOT NULL,
        carrier_name VARCHAR(255) NOT NULL,
        shipment_id VARCHAR(255) NOT NULL,
        invoice_date TIMESTAMP NOT NULL,
        due_date TIMESTAMP NOT NULL,
        line_items JSONB NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        taxes DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        document_url TEXT,
        ocr_data JSONB,
        status VARCHAR(50) NOT NULL,
        audit_result JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_carrier ON freight_invoices(carrier_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_shipment ON freight_invoices(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON freight_invoices(status);

      -- Payments Table
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        invoice_id VARCHAR(255) NOT NULL,
        shipment_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        carrier_id VARCHAR(255) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        scheduled_date TIMESTAMP,
        processed_date TIMESTAMP,
        confirmation_number VARCHAR(255),
        failure_reason TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_payments_shipment ON payments(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

      -- IoT Devices Table
      CREATE TABLE IF NOT EXISTS iot_devices (
        id VARCHAR(255) PRIMARY KEY,
        shipment_id VARCHAR(255) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        provider VARCHAR(255),
        last_update TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_iot_shipment ON iot_devices(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_iot_device ON iot_devices(device_id);

      -- Sensor Data Table
      CREATE TABLE IF NOT EXISTS sensor_data (
        id VARCHAR(255) PRIMARY KEY,
        shipment_id VARCHAR(255) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        location JSONB,
        sensors JSONB,
        vehicle JSONB,
        compliance JSONB,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sensor_shipment ON sensor_data(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sensor_device ON sensor_data(device_id);

      -- Compliance Records Table
      CREATE TABLE IF NOT EXISTS compliance_records (
        id VARCHAR(255) PRIMARY KEY,
        shipment_id VARCHAR(255) NOT NULL,
        driver_id VARCHAR(255),
        vehicle_id VARCHAR(255),
        country VARCHAR(100) NOT NULL,
        regulations JSONB NOT NULL,
        overall_status VARCHAR(50) NOT NULL,
        violations JSONB NOT NULL,
        checked_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_compliance_shipment ON compliance_records(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(overall_status);

      -- Hours of Service Table
      CREATE TABLE IF NOT EXISTS hours_of_service (
        id VARCHAR(255) PRIMARY KEY,
        driver_id VARCHAR(255) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        hours JSONB NOT NULL,
        violations JSONB NOT NULL,
        compliant BOOLEAN NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_hos_driver ON hours_of_service(driver_id);
      CREATE INDEX IF NOT EXISTS idx_hos_date ON hours_of_service(date);

      -- Blockchain Transactions Table
      CREATE TABLE IF NOT EXISTS blockchain_transactions (
        id VARCHAR(255) PRIMARY KEY,
        shipment_id VARCHAR(255) NOT NULL,
        transaction_type VARCHAR(100) NOT NULL,
        data JSONB NOT NULL,
        hash VARCHAR(255) UNIQUE NOT NULL,
        previous_hash VARCHAR(255),
        timestamp TIMESTAMP NOT NULL,
        block_number INTEGER,
        created_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_blockchain_shipment ON blockchain_transactions(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON blockchain_transactions(hash);

      -- Fleet Vehicles Table
      CREATE TABLE IF NOT EXISTS fleet_vehicles (
        id VARCHAR(255) PRIMARY KEY,
        plate_number VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        capacity JSONB NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_location JSONB,
        driver_id VARCHAR(255),
        driver_name VARCHAR(255),
        maintenance JSONB NOT NULL,
        fuel JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        tenant_id VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_fleet_status ON fleet_vehicles(status);
      CREATE INDEX IF NOT EXISTS idx_fleet_tenant ON fleet_vehicles(tenant_id);
    `;
  }

  /**
   * Get MongoDB collection schemas
   */
  static getMongoDBSchemas(): Record<string, any> {
    return {
      shipments: {
        shipmentNumber: {
          type: String,
          required: true,
          unique: true,
          index: true,
        },
        trackingNumber: { type: String, index: true },
        type: { type: String, required: true, index: true },
        mode: { type: String, required: true, index: true },
        status: { type: String, required: true, index: true },
        origin: { type: Object, required: true },
        destination: { type: Object, required: true },
        items: { type: Array, required: true },
        totalWeight: { type: Number, required: true },
        totalVolume: { type: Number, required: true },
        totalValue: { type: Number, required: true },
        currency: { type: String, required: true },
        carrierId: { type: String, index: true },
        tenantId: { type: String, index: true },
        createdAt: { type: Date, required: true, index: true },
        updatedAt: { type: Date, required: true },
      },
      carriers: {
        code: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        status: { type: String, required: true, index: true },
        tenantId: { type: String, index: true },
        createdAt: { type: Date, required: true },
        updatedAt: { type: Date, required: true },
      },
      // Add more collections as needed
    };
  }
}
