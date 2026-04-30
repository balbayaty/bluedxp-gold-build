/**
 * Initialize TMS Database Tables
 * Creates all required tables for TMS module
 */

const { getDatabaseClient } = require('../lib/database/client');

async function initTables() {
  try {
    console.log('🔧 Initializing TMS Database Tables...');
    console.log('='.repeat(60));
    console.log('');

    const dbClient = getDatabaseClient();
    await dbClient.connect();

    console.log('✅ Database connected');
    console.log('📋 Creating tables...\n');

    // Create tables SQL
    const createTablesSQL = `
      -- Transport Jobs Table
      CREATE TABLE IF NOT EXISTS tms_transport_jobs (
        id VARCHAR(255) PRIMARY KEY,
        "recordId" VARCHAR(255),
        "jobName" VARCHAR(500),
        "jobNumber" VARCHAR(255),
        "jobType" VARCHAR(100),
        "jobStatus" VARCHAR(100),
        "jobOwnerId" VARCHAR(255),
        "jobOwner" VARCHAR(255),
        "createdById" VARCHAR(255),
        "createdBy" VARCHAR(255),
        "modifiedById" VARCHAR(255),
        "modifiedBy" VARCHAR(255),
        "createdTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "modifiedTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActivityTime" TIMESTAMP,
        currency VARCHAR(10) DEFAULT 'SAR',
        "exchangeRate" DECIMAL(10, 4),
        "customerId" VARCHAR(255),
        customer VARCHAR(500),
        "transporterId" VARCHAR(255),
        transporter VARCHAR(500),
        "containerNumber" VARCHAR(255),
        "shipmentNumber" VARCHAR(255),
        "shipmentType" VARCHAR(100),
        "shipmentTypeOther" VARCHAR(255),
        "shipmentOrigin" VARCHAR(500),
        "shipmentDestination" VARCHAR(500),
        "shipmentFinalDestination" VARCHAR(500),
        "shipmentWeight" DECIMAL(10, 2),
        "numberOfContainersOnMBL" INTEGER,
        "bookingNumber" VARCHAR(255),
        "masterBillOfLading" VARCHAR(255),
        "houseBillOfLading" VARCHAR(255),
        "orderNumber" VARCHAR(255),
        "poNumber" VARCHAR(255),
        "flexInvoiceNumber" VARCHAR(255),
        "refNo" VARCHAR(255),
        "transporterBill" VARCHAR(255),
        "bayanStatus" VARCHAR(100),
        "bayanNumber" VARCHAR(255),
        "bayanNumberEntry" VARCHAR(255),
        "bayanNumberExit" VARCHAR(255),
        "doStatus" VARCHAR(100),
        "manifestStatus" VARCHAR(100),
        "siStatus" VARCHAR(100),
        "truckType" VARCHAR(100),
        "vehiclePlateNumber" VARCHAR(255),
        "typeOfEquipment" VARCHAR(255),
        "oldContainer" VARCHAR(255),
        "driverId" VARCHAR(255),
        "driverName" VARCHAR(255),
        "driverMobileNumber" VARCHAR(255),
        "driverForeignMobileNumber" VARCHAR(255),
        "driverIqamaNumber" VARCHAR(255),
        "driverLicenseNumber" VARCHAR(255),
        "driverPassportNumber" VARCHAR(255),
        "driverNationality" VARCHAR(100),
        "polCountry" VARCHAR(100),
        "polLocation" VARCHAR(500),
        "podCountry" VARCHAR(100),
        "podLocation" VARCHAR(500),
        "polDetails" TEXT,
        "podDetails" TEXT,
        "dropOffPort" VARCHAR(255),
        "emptyContainerCollectionDepot" VARCHAR(255),
        "collectionPort" VARCHAR(255),
        "fullContainerDropOffDepot" VARCHAR(255),
        "storageTerminalName" VARCHAR(255),
        "foreignConsignee" VARCHAR(500),
        "localConsignee" VARCHAR(500),
        "consigneeName" VARCHAR(500),
        "consigneePhone" VARCHAR(255),
        "requestDate" TIMESTAMP,
        "loadingDate" TIMESTAMP,
        "loadingDateForWayBill" TIMESTAMP,
        "departureTimeForWayBill" VARCHAR(255),
        "dateOffload" TIMESTAMP,
        "saudiBorderArrival" TIMESTAMP,
        "saudiBorderDeparture" TIMESTAMP,
        "destinationBorderArrival" TIMESTAMP,
        "destinationBorderDeparture" TIMESTAMP,
        "transitBorderArrival" TIMESTAMP,
        "transitBorderDeparture" TIMESTAMP,
        "borderEntryNo" VARCHAR(255),
        "shipperArrival" TIMESTAMP,
        "shipperDeparture" TIMESTAMP,
        "consigneeArrival" TIMESTAMP,
        "consigneeDeparture" TIMESTAMP,
        "storageTerminalDateIn" TIMESTAMP,
        "storageTerminalDateOut" TIMESTAMP,
        "agreedRate" DECIMAL(10, 2),
        "costTRP" DECIMAL(10, 2),
        "otherExpenses" DECIMAL(10, 2),
        "othersAmount" DECIMAL(10, 2),
        "bridgeClearanceFees" DECIMAL(10, 2),
        "ccBOEntry" DECIMAL(10, 2),
        "ccBOExit" DECIMAL(10, 2),
        "overWeight" DECIMAL(10, 2),
        "totalCost" DECIMAL(10, 2),
        "detentionLoadingDays" DECIMAL(5, 2),
        "totalLoadingTime" DECIMAL(10, 2),
        "totalOffloadingTime" DECIMAL(10, 2),
        "transitTime" DECIMAL(10, 2),
        "transitTime2" DECIMAL(10, 2),
        "laneId" VARCHAR(255),
        "laneName" VARCHAR(500),
        "dealId" VARCHAR(255),
        deal VARCHAR(500),
        "roundTrip" BOOLEAN,
        "bankName" VARCHAR(255),
        "ibanNumber" VARCHAR(255),
        "containerReleaseOrderNumber" VARCHAR(255),
        "dispatcherName" VARCHAR(255),
        "notesAndInstructions" TEXT,
        eta TIMESTAMP,
        "etaNotProvided" BOOLEAN,
        tag VARCHAR(255),
        locked BOOLEAN,
        "connectedToModule" VARCHAR(255),
        "connectedToId" VARCHAR(255),
        "tgaVerified" BOOLEAN,
        "daleeliVerified" BOOLEAN,
        "bayanSynced" BOOLEAN,
        "tenantId" VARCHAR(255) NOT NULL,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS tms_transport_jobs_tenantId_idx ON tms_transport_jobs("tenantId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobNumber_idx ON tms_transport_jobs("jobNumber");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobType_idx ON tms_transport_jobs("jobType");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_jobStatus_idx ON tms_transport_jobs("jobStatus");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_customer_idx ON tms_transport_jobs(customer);
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_transporter_idx ON tms_transport_jobs(transporter);
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_laneId_idx ON tms_transport_jobs("laneId");
      CREATE INDEX IF NOT EXISTS tms_transport_jobs_createdTime_idx ON tms_transport_jobs("createdTime");

      -- POD Records Table
      CREATE TABLE IF NOT EXISTS tms_pod_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        "deliveryDate" DATE NOT NULL,
        "deliveryTime" VARCHAR(20),
        "deliveryTimestamp" TIMESTAMP NOT NULL,
        "consigneeName" VARCHAR(500),
        "consigneePhone" VARCHAR(255),
        "deliveryLocation" TEXT,
        "gpsCoordinates" JSONB,
        "deliveryStatus" VARCHAR(50) NOT NULL,
        "deliveryNotes" TEXT,
        signature TEXT,
        photos JSONB,
        verified BOOLEAN DEFAULT FALSE,
        "verifiedAt" TIMESTAMP,
        "verifiedBy" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdBy" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_pod_records_jobId_idx ON tms_pod_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_pod_records_tenantId_idx ON tms_pod_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_pod_records_deliveryDate_idx ON tms_pod_records("deliveryDate");

      -- Detention Records Table
      CREATE TABLE IF NOT EXISTS tms_detention_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        "detentionType" VARCHAR(50) NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "freeTimeDays" DECIMAL(5, 2) DEFAULT 1,
        "detentionDays" DECIMAL(5, 2) NOT NULL,
        "detentionCost" DECIMAL(10, 2),
        "detentionRate" DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'active',
        "alertLevel" VARCHAR(50),
        "resolvedAt" TIMESTAMP,
        "resolvedBy" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_detention_records_jobId_idx ON tms_detention_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_detention_records_tenantId_idx ON tms_detention_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_detention_records_detentionType_idx ON tms_detention_records("detentionType");

      -- Transit Time Records Table
      CREATE TABLE IF NOT EXISTS tms_transit_time_records (
        id VARCHAR(255) PRIMARY KEY,
        "jobId" VARCHAR(255) NOT NULL,
        segment VARCHAR(50) NOT NULL,
        "segmentName" VARCHAR(255),
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "plannedTransitTime" DECIMAL(10, 2),
        "actualTransitTime" DECIMAL(10, 2) NOT NULL,
        delay DECIMAL(10, 2),
        origin VARCHAR(500) NOT NULL,
        destination VARCHAR(500) NOT NULL,
        "onTime" BOOLEAN DEFAULT TRUE,
        "delayReason" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_transit_time_records_jobId_idx ON tms_transit_time_records("jobId");
      CREATE INDEX IF NOT EXISTS tms_transit_time_records_tenantId_idx ON tms_transit_time_records("tenantId");
      CREATE INDEX IF NOT EXISTS tms_transit_time_records_segment_idx ON tms_transit_time_records(segment);

      -- Lanes Table
      CREATE TABLE IF NOT EXISTS tms_lanes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        origin VARCHAR(500) NOT NULL,
        destination VARCHAR(500) NOT NULL,
        "truckType" VARCHAR(100),
        "averageTransitTime" DECIMAL(10, 2),
        "onTimeDeliveryRate" DECIMAL(5, 2),
        "totalJobs" INTEGER DEFAULT 0,
        "totalRevenue" DECIMAL(10, 2),
        "totalCost" DECIMAL(10, 2),
        "profitability" DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "tenantId" VARCHAR(255) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tms_lanes_tenantId_idx ON tms_lanes("tenantId");
      CREATE INDEX IF NOT EXISTS tms_lanes_origin_destination_idx ON tms_lanes(origin, destination);
    `;

    // Execute table creation
    await dbClient.query(createTablesSQL);

    console.log('✅ All tables created successfully!');
    console.log('\n📊 Tables created:');
    console.log('   • tms_transport_jobs');
    console.log('   • tms_pod_records');
    console.log('   • tms_detention_records');
    console.log('   • tms_transit_time_records');
    console.log('   • tms_lanes');
    console.log('\n✅ Database initialization complete!');
    console.log('');

    await dbClient.disconnect();
  } catch (error) {
    console.error('\n❌ Error initializing tables:');
    console.error(error);
    if (error.message) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run initialization
initTables()
  .then(() => {
    console.log('✅ Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });


