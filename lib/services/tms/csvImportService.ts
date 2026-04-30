/**
 * CSV Import Service for TMS
 * Handles import of Zoho CSV data into TMS system
 * Supports Flex Logistics tenant data import
 */

import {
  TransportJob,
  JobType,
  JobStatus,
  ShipmentType,
  TruckType,
  BayanStatus,
  DOStatus,
  ManifestStatus,
  SIStatus,
} from "@/types/tms/transportJob";

export interface CSVRow {
  [key: string]: string | undefined;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  jobIds: string[];
}

export interface ImportOptions {
  tenantId: string;
  createdBy: string;
  skipValidation?: boolean;
  dryRun?: boolean;
}

/**
 * Maps CSV column names to TransportJob fields
 */
const CSV_FIELD_MAPPING: Record<string, keyof TransportJob> = {
  "Record Id": "recordId",
  "Job Name": "jobName",
  "Job Number": "jobNumber",
  "Job Type": "jobType",
  "Job Status": "jobStatus",
  "Job Owner": "jobOwner",
  "Job Owner.id": "jobOwnerId",
  "Created By": "createdBy",
  "Created By.id": "createdById",
  "Modified By": "modifiedBy",
  "Modified By.id": "modifiedById",
  "Created Time": "createdTime",
  "Modified Time": "modifiedTime",
  "Last Activity Time": "lastActivityTime",
  Currency: "currency",
  "Exchange Rate": "exchangeRate",
  Customer: "customer",
  "Customer.id": "customerId",
  "Transporter / OU": "transporter",
  "Transporter / OU.id": "transporterId",
  "Container Number": "containerNumber",
  "Shipment Number": "shipmentNumber",
  "Shipment Type": "shipmentType",
  "Shipment Type Other": "shipmentTypeOther",
  "Shipment Origin": "shipmentOrigin",
  "Shipment Destination": "shipmentDestination",
  "Shipment Final Destination": "shipmentFinalDestination",
  "Shipment Weight": "shipmentWeight",
  "Booking Number": "bookingNumber",
  "Master Bill of Landing (MBL) Number": "masterBillOfLading",
  "House Bill of Landing (HBL) Number": "houseBillOfLading",
  "Order Number": "orderNumber",
  "PO Number": "poNumber",
  "Flex Invoice Number": "flexInvoiceNumber",
  "Ref No": "refNo",
  "Transporter Bill": "transporterBill",
  "Bayan Status": "bayanStatus",
  "Bayan Number": "bayanNumber",
  "Bayan Number Entry": "bayanNumberEntry",
  "Bayan Number Exit": "bayanNumberExit",
  "DO Status": "doStatus",
  "Manifest Status": "manifestStatus",
  "Shipping Instructions (SI) Status": "siStatus",
  "Truck Type": "truckType",
  "Vehicle Plate Number": "vehiclePlateNumber",
  "Type of Equipment": "typeOfEquipment",
  "Old Container": "oldContainer",
  "Driver Name": "driverName",
  "Driver Name.id": "driverId",
  "Driver Mobile Number": "driverMobileNumber",
  "Driver Foreign Mobile Number": "driverForeignMobileNumber",
  "Driver Iqama Number": "driverIqamaNumber",
  "Driver License Number": "driverLicenseNumber",
  "Driver Passport Number": "driverPassportNumber",
  "Driver Nationality": "driverNationality",
  "POL Country": "polCountry",
  POL: "polLocation",
  "POD Country": "podCountry",
  POD: "podLocation",
  "POL Details": "polDetails",
  "POD Details": "podDetails",
  "Drop Off (Sailing) Port": "dropOffPort",
  "Empty Container Collection Depot": "emptyContainerCollectionDepot",
  "Collection (Arrival) Port": "collectionPort",
  "Full Container Drop Off Depot": "fullContainerDropOffDepot",
  "Storage Terminal Name": "storageTerminalName",
  "Foreign Consignee / Consigner": "foreignConsignee",
  "Local Consignee / Consigner": "localConsignee",
  "Consignee Name": "consigneeName",
  "Consignee Phone": "consigneePhone",
  "Request Date": "requestDate",
  "Loading Date": "loadingDate",
  "Loading Date for Way Bill": "loadingDateForWayBill",
  "Departure Time for Way Bill": "departureTimeForWayBill",
  "Date Offload": "dateOffload",
  "Saudi Border Arrival": "saudiBorderArrival",
  "Saudi Border Departure": "saudiBorderDeparture",
  "Destination Border Arrival": "destinationBorderArrival",
  "Destination Border Departure": "destinationBorderDeparture",
  "Transit Border  Arrival": "transitBorderArrival",
  "Transit Border Departure": "transitBorderDeparture",
  "Border Entry no.": "borderEntryNo",
  "Shipper (POL) Arrival": "shipperArrival",
  "Shipper (POL) Departure": "shipperDeparture",
  "Consignee (POD) Arrival": "consigneeArrival",
  "Consignee (POD) Departure": "consigneeDeparture",
  "Storage Terminal Date In": "storageTerminalDateIn",
  "Storage Terminal Date Out": "storageTerminalDateOut",
  "Agreed Rate -Cost TRP": "costTRP",
  "Other Expenses": "otherExpenses",
  "Others Amount": "othersAmount",
  "Bridge Clearance Fees": "bridgeClearanceFees",
  "CC BO Entry": "ccBOEntry",
  "CC BO Exit": "ccBOExit",
  "Over Weight": "overWeight",
  "Detention Loading Days": "detentionLoadingDays",
  "Total Loading Time": "totalLoadingTime",
  "Total Offloading Time": "totalOffloadingTime",
  "Transit Time": "transitTime",
  "Transit Time 2": "transitTime2",
  "Lane Name": "laneName",
  "Lane Name.id": "laneId",
  Deal: "deal",
  "Deal.id": "dealId",
  "Round Trip": "roundTrip",
  "Bank Name": "bankName",
  "IBAN Number": "ibanNumber",
  "Container Release Order (CRO) Number": "containerReleaseOrderNumber",
  "Dispatcher Name": "dispatcherName",
  "Notes and Instructions": "notesAndInstructions",
  "Number of Total Containers on MBL": "numberOfContainersOnMBL",
  Weight: "shipmentWeight",
  ETA: "eta",
  "ETA Not Provided": "etaNotProvided",
};

/**
 * CSV Import Service
 */
export class CSVImportService {
  /**
   * Parse CSV content into rows
   */
  private parseCSV(csvContent: string): CSVRow[] {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const header = this.parseCSVLine(lines[0]);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: CSVRow = {};
      header.forEach((col, index) => {
        row[col] = values[index]?.trim() || undefined;
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current); // Add last field

    return result;
  }

  /**
   * Convert CSV row to TransportJob
   */
  private convertRowToJob(
    row: CSVRow,
    options: ImportOptions,
  ): Partial<TransportJob> {
    const job: Partial<TransportJob> = {
      tenantId: options.tenantId,
      createdBy: options.createdBy,
    };

    // Map all fields
    Object.entries(CSV_FIELD_MAPPING).forEach(([csvField, jobField]) => {
      const value = row[csvField];
      if (value !== undefined && value !== "") {
        (job as any)[jobField] = this.convertValue(jobField, value);
      }
    });

    // Generate ID if not present
    if (!job.id && job.jobNumber) {
      job.id = `job_${job.jobNumber}_${Date.now()}`;
    }

    // Set defaults
    if (!job.jobStatus) {
      job.jobStatus = JobStatus.PENDING;
    }

    return job;
  }

  /**
   * Convert CSV value to appropriate type
   */
  private convertValue(field: keyof TransportJob, value: string): any {
    // Date fields
    const dateFields: (keyof TransportJob)[] = [
      "createdTime",
      "modifiedTime",
      "lastActivityTime",
      "requestDate",
      "loadingDate",
      "loadingDateForWayBill",
      "dateOffload",
      "saudiBorderArrival",
      "saudiBorderDeparture",
      "destinationBorderArrival",
      "destinationBorderDeparture",
      "transitBorderArrival",
      "transitBorderDeparture",
      "shipperArrival",
      "shipperDeparture",
      "consigneeArrival",
      "consigneeDeparture",
      "storageTerminalDateIn",
      "storageTerminalDateOut",
      "eta",
    ];

    if (dateFields.includes(field)) {
      return this.parseDate(value);
    }

    // Number fields
    const numberFields: (keyof TransportJob)[] = [
      "exchangeRate",
      "shipmentWeight",
      "numberOfContainersOnMBL",
      "agreedRate",
      "costTRP",
      "otherExpenses",
      "othersAmount",
      "bridgeClearanceFees",
      "ccBOEntry",
      "ccBOExit",
      "overWeight",
      "detentionLoadingDays",
      "totalLoadingTime",
      "totalOffloadingTime",
      "transitTime",
      "transitTime2",
    ];

    if (numberFields.includes(field)) {
      const num = parseFloat(value.replace(/,/g, ""));
      return isNaN(num) ? undefined : num;
    }

    // Boolean fields
    if (
      field === "roundTrip" ||
      field === "locked" ||
      field === "etaNotProvided"
    ) {
      return (
        value.toLowerCase() === "true" || value === "1" || value === "TRUE"
      );
    }

    // Enum fields
    if (field === "jobType") {
      return this.mapJobType(value);
    }
    if (field === "jobStatus") {
      return this.mapJobStatus(value);
    }
    if (field === "shipmentType") {
      return this.mapShipmentType(value);
    }
    if (field === "truckType") {
      return this.mapTruckType(value);
    }
    if (field === "bayanStatus") {
      return this.mapBayanStatus(value);
    }
    if (field === "doStatus") {
      return this.mapDOStatus(value);
    }
    if (field === "manifestStatus") {
      return this.mapManifestStatus(value);
    }
    if (field === "siStatus") {
      return this.mapSIStatus(value);
    }

    return value;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr || dateStr.trim() === "") return undefined;

    // Try various date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
      /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          // MM/DD/YYYY or MM/DD/YYYY HH:MM
          const month = parseInt(match[1]) - 1;
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          const hour = match[4] ? parseInt(match[4]) : 0;
          const minute = match[5] ? parseInt(match[5]) : 0;
          const second = match[6] ? parseInt(match[6]) : 0;
          return new Date(year, month, day, hour, minute, second);
        } else {
          // ISO format
          return new Date(dateStr);
        }
      }
    }

    // Fallback to Date constructor
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }

  /**
   * Map job type string to enum
   */
  private mapJobType(value: string): JobType {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("cross border")) return JobType.CROSS_BORDER;
    if (normalized.includes("inland export")) return JobType.INLAND_EXPORT;
    if (normalized.includes("inter city")) return JobType.INTER_CITY;
    if (normalized.includes("inland import")) return JobType.INLAND_IMPORT;
    return JobType.CROSS_BORDER; // Default
  }

  /**
   * Map job status string to enum
   */
  private mapJobStatus(value: string): JobStatus {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("completed")) return JobStatus.COMPLETED;
    if (normalized.includes("rejected")) return JobStatus.REJECTED;
    if (normalized.includes("cancelled")) return JobStatus.CANCELLED;
    if (normalized.includes("transit")) return JobStatus.IN_TRANSIT;
    if (normalized.includes("delivered")) return JobStatus.DELIVERED;
    return JobStatus.PENDING;
  }

  /**
   * Map shipment type string to enum
   */
  private mapShipmentType(value: string): ShipmentType {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("box") || normalized.includes("case"))
      return ShipmentType.BOXES_CASES;
    if (normalized.includes("equipment")) return ShipmentType.EQUIPMENT;
    if (normalized.includes("jumbo") || normalized.includes("bag"))
      return ShipmentType.JUMBO_BAGS;
    if (normalized.includes("drum")) return ShipmentType.DRUMS;
    return ShipmentType.OTHER;
  }

  /**
   * Map truck type string to enum
   */
  private mapTruckType(value: string): TruckType {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("box") && normalized.includes("dry"))
      return TruckType.BOX_TRAILER_DRY;
    if (normalized.includes("reefer")) return TruckType.REEFER_TRAILER;
    if (normalized.includes("flatbed")) return TruckType.FLATBED;
    if (normalized.includes("lowbed")) return TruckType.LOWBED;
    if (normalized.includes("curtain")) return TruckType.CURTAIN_SIDE;
    return TruckType.OTHER;
  }

  /**
   * Map Bayan status string to enum
   */
  private mapBayanStatus(value: string): BayanStatus {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("approved")) return BayanStatus.APPROVED;
    if (normalized.includes("rejected")) return BayanStatus.REJECTED;
    if (normalized.includes("submitted")) return BayanStatus.SUBMITTED;
    return BayanStatus.PENDING;
  }

  /**
   * Map DO status string to enum
   */
  private mapDOStatus(value: string): DOStatus {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("completed")) return DOStatus.COMPLETED;
    if (normalized.includes("received")) return DOStatus.RECEIVED;
    if (normalized.includes("issued")) return DOStatus.ISSUED;
    return DOStatus.PENDING;
  }

  /**
   * Map Manifest status string to enum
   */
  private mapManifestStatus(value: string): ManifestStatus {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("approved")) return ManifestStatus.APPROVED;
    if (normalized.includes("submitted")) return ManifestStatus.SUBMITTED;
    return ManifestStatus.PENDING;
  }

  /**
   * Map SI status string to enum
   */
  private mapSIStatus(value: string): SIStatus {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("approved")) return SIStatus.APPROVED;
    if (normalized.includes("submitted")) return SIStatus.SUBMITTED;
    return SIStatus.PENDING;
  }

  /**
   * Validate transport job data
   */
  private validateJob(job: Partial<TransportJob>): string[] {
    const errors: string[] = [];

    if (!job.jobName && !job.jobNumber) {
      errors.push("Job name or job number is required");
    }

    if (!job.jobType) {
      errors.push("Job type is required");
    }

    if (!job.tenantId) {
      errors.push("Tenant ID is required");
    }

    return errors;
  }

  /**
   * Import CSV data
   */
  async importCSV(
    csvContent: string,
    options: ImportOptions,
    saveCallback: (job: Partial<TransportJob>) => Promise<string>,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      jobIds: [],
    };

    try {
      // Parse CSV
      const rows = this.parseCSV(csvContent);

      if (rows.length === 0) {
        result.errors.push({ row: 0, error: "No data rows found in CSV" });
        result.success = false;
        return result;
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const job = this.convertRowToJob(row, options);

          // Validate
          if (!options.skipValidation) {
            const errors = this.validateJob(job);
            if (errors.length > 0) {
              result.failed++;
              result.errors.push({
                row: i + 2, // +2 for header and 1-based index
                error: errors.join("; "),
              });
              continue;
            }
          }

          // Save if not dry run
          if (!options.dryRun) {
            const jobId = await saveCallback(job);
            result.jobIds.push(jobId);
          }

          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      result.success = result.failed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : "Failed to parse CSV",
      });
    }

    return result;
  }
}

export const csvImportService = new CSVImportService();
