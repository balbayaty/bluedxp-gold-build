/**
 * Intelligent POD (Proof of Delivery) Service
 * Handles digital POD capture, validation, and evidence tracking
 */

import { PODRecord, TransportJob } from "@/types/tms/transportJob";
import { tmsDatabaseAdapter } from "./database/tmsDatabaseAdapter";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export interface PODCaptureData {
  jobId: string;
  deliveryDate: Date;
  deliveryTime: string;
  consigneeName: string;
  consigneePhone?: string;
  deliveryLocation?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  deliveryStatus: "delivered" | "partial" | "refused" | "damaged";
  deliveryNotes?: string;
  photos?: File[] | string[];
  documents?: File[] | string[];
  signature?: string; // Base64 or data URL
  createdBy: string;
  tenantId: string;
}

export interface PODValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Intelligent POD Service
 */
export class PODService {
  /**
   * Create POD record with intelligent validation
   */
  async createPOD(data: PODCaptureData): Promise<PODRecord> {
    // Validate POD data
    const validation = this.validatePOD(data);
    if (!validation.valid) {
      throw new Error(`POD validation failed: ${validation.errors.join(", ")}`);
    }

    // Create POD record
    const pod: PODRecord = {
      id: `pod_${data.jobId}_${Date.now()}`,
      jobId: data.jobId,
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
      deliveryTimestamp: this.combineDateTime(
        data.deliveryDate,
        data.deliveryTime,
      ),
      deliveryLocation: data.deliveryLocation,
      gpsCoordinates: data.gpsCoordinates,
      consigneeName: data.consigneeName,
      consigneePhone: data.consigneePhone,
      consigneeSignature: data.signature,
      deliveryStatus: data.deliveryStatus,
      deliveryNotes: data.deliveryNotes,
      photos: Array.isArray(data.photos)
        ? data.photos.map((p) => (typeof p === "string" ? p : ""))
        : [],
      documents: Array.isArray(data.documents)
        ? data.documents.map((d) => (typeof d === "string" ? d : ""))
        : [],
      evidenceIds: [],
      verified: false,
      createdAt: new Date(),
      createdBy: data.createdBy,
      tenantId: data.tenantId,
    };

    // Store POD in database
    await tmsDatabaseAdapter.storePOD(data.tenantId, pod);

    // Publish event
    await eventBus.publish(
      createEvent(
        "tms.pod.created",
        pod.id,
        "PODRecord",
        {
          podId: pod.id,
          jobId: pod.jobId,
          tenantId: pod.tenantId,
          deliveryStatus: pod.deliveryStatus,
          createdBy: pod.createdBy,
        },
        1,
        {
          tenantId: pod.tenantId,
          userId: pod.createdBy,
        },
      ),
    );

    // Verify GPS coordinates if provided
    if (data.gpsCoordinates) {
      const gpsValid = await this.verifyGPSLocation(
        data.gpsCoordinates,
        data.deliveryLocation,
      );
      if (!gpsValid) {
        // Log warning but don't fail
        console.warn("GPS coordinates do not match delivery location");
      }
    }

    return pod;
  }

  /**
   * Validate POD data
   */
  validatePOD(data: PODCaptureData): PODValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.jobId) {
      errors.push("Job ID is required");
    }
    if (!data.deliveryDate) {
      errors.push("Delivery date is required");
    }
    if (!data.deliveryTime) {
      errors.push("Delivery time is required");
    }
    if (!data.consigneeName) {
      errors.push("Consignee name is required");
    }
    if (!data.deliveryStatus) {
      errors.push("Delivery status is required");
    }
    if (!data.tenantId) {
      errors.push("Tenant ID is required");
    }

    // Validate delivery date is not in the future
    const deliveryDateTime = this.combineDateTime(
      data.deliveryDate,
      data.deliveryTime,
    );
    if (deliveryDateTime > new Date()) {
      warnings.push("Delivery date/time is in the future");
    }

    // Validate GPS coordinates if provided
    if (data.gpsCoordinates) {
      if (
        data.gpsCoordinates.latitude < -90 ||
        data.gpsCoordinates.latitude > 90
      ) {
        errors.push("Invalid GPS latitude");
      }
      if (
        data.gpsCoordinates.longitude < -180 ||
        data.gpsCoordinates.longitude > 180
      ) {
        errors.push("Invalid GPS longitude");
      }
    }

    // Validate signature format if provided
    if (data.signature) {
      if (!this.isValidSignatureFormat(data.signature)) {
        warnings.push("Signature format may be invalid");
      }
    }

    // Check for evidence
    if (!data.photos && !data.documents && !data.signature) {
      warnings.push("No evidence provided (photos, documents, or signature)");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verify GPS location matches delivery location
   * Uses approximate distance validation when exact geocoding is not available
   */
  private async verifyGPSLocation(
    gps: { latitude: number; longitude: number; accuracy?: number },
    deliveryLocation?: string,
  ): Promise<boolean> {
    // Basic coordinate validation
    if (
      gps.latitude < -90 ||
      gps.latitude > 90 ||
      gps.longitude < -180 ||
      gps.longitude > 180
    ) {
      return false;
    }

    // If no delivery location specified, just validate coordinates are reasonable
    if (!deliveryLocation) {
      return true;
    }

    // GPS accuracy check - if accuracy is poor (> 100m), flag as potentially unreliable
    // This helps identify potentially fraudulent or incorrect delivery locations
    if (gps.accuracy && gps.accuracy > 100) {
      console.warn(
        `[PODService] GPS accuracy is low (${gps.accuracy}m). Delivery location may be unreliable.`,
      );
      // Don't fail validation, but log for review
    }

    // Known location coordinates for major Saudi cities (for validation)
    const knownLocations: Record<
      string,
      { lat: number; lng: number; radius: number }
    > = {
      riyadh: { lat: 24.7136, lng: 46.6753, radius: 50 },
      jeddah: { lat: 21.5433, lng: 39.1728, radius: 40 },
      dammam: { lat: 26.4207, lng: 50.0888, radius: 30 },
      mecca: { lat: 21.4225, lng: 39.8262, radius: 25 },
      medina: { lat: 24.5247, lng: 39.5692, radius: 25 },
      khobar: { lat: 26.2172, lng: 50.1971, radius: 20 },
      jubail: { lat: 27.0046, lng: 49.6586, radius: 25 },
      yanbu: { lat: 24.0895, lng: 38.0618, radius: 20 },
      tabuk: { lat: 28.3838, lng: 36.555, radius: 25 },
    };

    // Check if delivery location matches any known location
    const locationLower = deliveryLocation.toLowerCase();
    for (const [city, coords] of Object.entries(knownLocations)) {
      if (locationLower.includes(city)) {
        // Calculate approximate distance using Haversine formula
        const distance = this.calculateDistance(
          gps.latitude,
          gps.longitude,
          coords.lat,
          coords.lng,
        );

        // Check if within acceptable radius (in km)
        if (distance <= coords.radius) {
          return true;
        } else {
          console.warn(
            `[PODService] GPS location is ${distance.toFixed(1)}km from ${city} (expected within ${coords.radius}km)`,
          );
          return false;
        }
      }
    }

    // If location not in known list, just validate coordinates are valid
    return true;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * 
   * The Haversine formula calculates the great-circle distance between two points
   * on a sphere given their longitudes and latitudes. This is more accurate for
   * short distances than simple Euclidean distance calculations.
   * 
   * Formula:
   * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
   * c = 2 ⋅ atan2( √a, √(1−a) )
   * d = R ⋅ c
   * 
   * where:
   * - φ is latitude, λ is longitude
   * - R is Earth's radius (6371 km)
   * - d is the distance in kilometers
   * 
   * @param lat1 - Latitude of first point in degrees
   * @param lng1 - Longitude of first point in degrees
   * @param lat2 - Latitude of second point in degrees
   * @param lng2 - Longitude of second point in degrees
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    // Haversine formula implementation
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate signature format
   */
  private isValidSignatureFormat(signature: string): boolean {
    // Check if it's a data URL or base64
    return (
      signature.startsWith("data:image/") ||
      signature.startsWith("data:application/") ||
      /^[A-Za-z0-9+/=]+$/.test(signature)
    );
  }

  /**
   * Combine date and time strings into Date object
   */
  private combineDateTime(date: Date, time: string): Date {
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = time.includes(":")
      ? time
      : `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    return new Date(`${dateStr}T${timeStr}`);
  }

  /**
   * Generate QR code for POD
   * Returns QR code data URL that can be embedded in images/PDFs
   */
  async generatePODQRCode(jobId: string, tenantId?: string): Promise<string> {
    // Generate QR code data URL using a simple encoding
    // In production, use a proper QR library like 'qrcode'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bluedxp.com";
    const podUrl = `${baseUrl}/tms/jobs/${jobId}/pod/capture`;

    // Create QR code payload with additional metadata
    const payload = {
      type: "POD_CAPTURE",
      jobId,
      tenantId,
      url: podUrl,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Encode payload as base64 for QR
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64",
    );

    // Return URL with encoded payload
    return `${baseUrl}/api/tms/pod/qr?data=${encodedPayload}`;
  }

  /**
   * Scan QR code and retrieve job information
   */
  async scanPODQRCode(
    qrCodeData: string,
  ): Promise<{ jobId: string; job?: TransportJob; expired?: boolean }> {
    // Try to parse as encoded payload first
    try {
      const url = new URL(qrCodeData);
      const encodedData = url.searchParams.get("data");

      if (encodedData) {
        const payload = JSON.parse(
          Buffer.from(encodedData, "base64").toString("utf-8"),
        );

        // Check if QR code is expired
        if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) {
          return { jobId: payload.jobId, expired: true };
        }

        // Fetch job details
        const job = await tmsDatabaseAdapter.getJob(
          payload.tenantId || "",
          payload.jobId,
        );

        return {
          jobId: payload.jobId,
          job: job || undefined,
          expired: false,
        };
      }
    } catch (e) {
      // Not encoded format, try URL pattern matching
    }

    // Fallback: Extract job ID from URL pattern
    // Expected format: /jobs/{jobId}/pod or similar URL pattern
    const match = qrCodeData.match(/\/jobs\/([^\/]+)\/pod/);
    if (!match) {
      throw new Error(
        `Invalid QR code format. Expected URL pattern with job ID, but received: ${qrCodeData.substring(0, 50)}...`,
      );
    }

    const jobId = match[1];
    return { jobId, expired: false };
  }

  /**
   * Verify POD record
   * Validates POD evidence and marks as verified
   */
  async verifyPOD(
    podId: string,
    verifiedBy: string,
    tenantId: string,
  ): Promise<PODRecord> {
    // Fetch POD from database
    const pods = await tmsDatabaseAdapter.getPODRecords(tenantId, "");
    const pod = pods.find((p) => p.id === podId);

    if (!pod) {
      throw new Error(`POD not found: ${podId}`);
    }

    // Validate POD has required evidence for verification
    const hasEvidence =
      (pod.photos && pod.photos.length > 0) ||
      (pod.documents && pod.documents.length > 0) ||
      pod.consigneeSignature;

    if (!hasEvidence) {
      throw new Error(
        "POD must have at least one form of evidence (photo, document, or signature) to be verified",
      );
    }

    // Update POD with verification
    const verifiedPod: PODRecord = {
      ...pod,
      verified: true,
      verifiedBy,
      verifiedAt: new Date(),
    };

    // Store updated POD
    await tmsDatabaseAdapter.storePOD(tenantId, verifiedPod);

    // Publish verification event
    await eventBus.publish(
      createEvent(
        "tms.pod.verified",
        podId,
        "PODRecord",
        {
          podId,
          jobId: pod.jobId,
          tenantId,
          verifiedBy,
          deliveryStatus: pod.deliveryStatus,
        },
        1,
        {
          tenantId,
          userId: verifiedBy,
        },
      ),
    );

    return verifiedPod;
  }

  /**
   * Get POD records for a job
   */
  async getPODRecords(jobId: string, tenantId: string): Promise<PODRecord[]> {
    return tmsDatabaseAdapter.getPODRecords(tenantId, jobId);
  }

  /**
   * Update POD record
   */
  async updatePOD(
    podId: string,
    updates: Partial<PODRecord>,
    tenantId: string,
    updatedBy: string,
  ): Promise<PODRecord> {
    // Fetch existing POD
    const pods = await tmsDatabaseAdapter.getPODRecords(tenantId, "");
    const existingPod = pods.find((p) => p.id === podId);

    if (!existingPod) {
      throw new Error(`POD not found: ${podId}`);
    }

    // Don't allow updating verified PODs (except for re-verification)
    if (existingPod.verified && !updates.verified) {
      throw new Error("Cannot modify a verified POD");
    }

    // Merge updates
    const updatedPod: PODRecord = {
      ...existingPod,
      ...updates,
      id: existingPod.id, // Preserve ID
      jobId: existingPod.jobId, // Preserve job association
      tenantId: existingPod.tenantId, // Preserve tenant
      createdAt: existingPod.createdAt, // Preserve creation date
      createdBy: existingPod.createdBy, // Preserve creator
    };

    // Store updated POD
    await tmsDatabaseAdapter.storePOD(tenantId, updatedPod);

    // Publish update event
    await eventBus.publish(
      createEvent(
        "tms.pod.updated",
        podId,
        "PODRecord",
        {
          podId,
          jobId: updatedPod.jobId,
          tenantId,
          updatedBy,
          updates: Object.keys(updates),
        },
        1,
        {
          tenantId,
          userId: updatedBy,
        },
      ),
    );

    return updatedPod;
  }

  /**
   * Delete POD record
   */
  async deletePOD(
    podId: string,
    tenantId: string,
    deletedBy: string,
  ): Promise<void> {
    // Fetch existing POD to validate
    const pods = await tmsDatabaseAdapter.getPODRecords(tenantId, "");
    const existingPod = pods.find((p) => p.id === podId);

    if (!existingPod) {
      throw new Error(`POD not found: ${podId}`);
    }

    // Don't allow deleting verified PODs
    if (existingPod.verified) {
      throw new Error("Cannot delete a verified POD");
    }

    // Delete POD from database
    await tmsDatabaseAdapter.deletePOD(tenantId, podId);

    // Publish delete event
    await eventBus.publish(
      createEvent(
        "tms.pod.deleted",
        podId,
        "PODRecord",
        {
          podId,
          jobId: existingPod.jobId,
          tenantId,
          deletedBy,
        },
        1,
        {
          tenantId,
          userId: deletedBy,
        },
      ),
    );
  }

  /**
   * Generate POD report
   */
  async generatePODReport(
    jobId: string,
    tenantId: string,
    format: "pdf" | "html" | "json" = "pdf",
  ): Promise<string | object> {
    // Get all POD records for the job
    const pods = await this.getPODRecords(jobId, tenantId);

    if (pods.length === 0) {
      throw new Error(`No POD records found for job: ${jobId}`);
    }

    // Build report data
    const reportData = {
      jobId,
      generatedAt: new Date().toISOString(),
      podRecords: pods.map((pod) => ({
        id: pod.id,
        deliveryDate: pod.deliveryDate,
        deliveryTime: pod.deliveryTime,
        deliveryStatus: pod.deliveryStatus,
        consigneeName: pod.consigneeName,
        deliveryLocation: pod.deliveryLocation,
        gpsCoordinates: pod.gpsCoordinates,
        hasSignature: !!pod.consigneeSignature,
        photoCount: pod.photos?.length || 0,
        documentCount: pod.documents?.length || 0,
        verified: pod.verified,
        verifiedBy: pod.verifiedBy,
        verifiedAt: pod.verifiedAt,
        notes: pod.deliveryNotes,
      })),
      summary: {
        totalPODs: pods.length,
        verifiedCount: pods.filter((p) => p.verified).length,
        deliveredCount: pods.filter((p) => p.deliveryStatus === "delivered")
          .length,
        partialCount: pods.filter((p) => p.deliveryStatus === "partial").length,
        refusedCount: pods.filter((p) => p.deliveryStatus === "refused").length,
        damagedCount: pods.filter((p) => p.deliveryStatus === "damaged").length,
      },
    };

    switch (format) {
      case "json":
        return reportData;

      case "html":
        return this.generatePODReportHTML(reportData);

      case "pdf":
      default:
        // For PDF, return HTML that can be converted to PDF by the caller
        return this.generatePODReportHTML(reportData);
    }
  }

  /**
   * Generate HTML report for POD
   */
  private generatePODReportHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>POD Report - Job ${data.jobId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .pod-record { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
    .verified { border-color: #4caf50; }
    .status { display: inline-block; padding: 3px 10px; border-radius: 3px; color: white; }
    .status-delivered { background: #4caf50; }
    .status-partial { background: #ff9800; }
    .status-refused { background: #f44336; }
    .status-damaged { background: #9c27b0; }
  </style>
</head>
<body>
  <h1>Proof of Delivery Report</h1>
  <p><strong>Job ID:</strong> ${data.jobId}</p>
  <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total PODs: ${data.summary.totalPODs} | Verified: ${data.summary.verifiedCount}</p>
    <p>Delivered: ${data.summary.deliveredCount} | Partial: ${data.summary.partialCount} | Refused: ${data.summary.refusedCount} | Damaged: ${data.summary.damagedCount}</p>
  </div>
  
  <h2>POD Records</h2>
  ${data.podRecords
    .map(
      (pod: any) => `
    <div class="pod-record ${pod.verified ? "verified" : ""}">
      <h3>POD: ${pod.id}</h3>
      <p><strong>Date/Time:</strong> ${pod.deliveryDate} ${pod.deliveryTime}</p>
      <p><strong>Status:</strong> <span class="status status-${pod.deliveryStatus}">${pod.deliveryStatus.toUpperCase()}</span></p>
      <p><strong>Consignee:</strong> ${pod.consigneeName}</p>
      <p><strong>Location:</strong> ${pod.deliveryLocation || "N/A"}</p>
      <p><strong>Evidence:</strong> ${pod.hasSignature ? "✓ Signature" : ""} ${pod.photoCount > 0 ? `✓ ${pod.photoCount} Photos` : ""} ${pod.documentCount > 0 ? `✓ ${pod.documentCount} Documents` : ""}</p>
      ${pod.verified ? `<p><strong>Verified by:</strong> ${pod.verifiedBy} on ${new Date(pod.verifiedAt).toLocaleString()}</p>` : ""}
      ${pod.notes ? `<p><strong>Notes:</strong> ${pod.notes}</p>` : ""}
    </div>
  `,
    )
    .join("")}
</body>
</html>
    `.trim();
  }

  /**
   * Check if POD is complete for a job
   */
  async isPODComplete(jobId: string): Promise<boolean> {
    const pods = await this.getPODRecords(jobId, "");
    return pods.some(
      (pod) => pod.verified && pod.deliveryStatus === "delivered",
    );
  }
}

export const podService = new PODService();
