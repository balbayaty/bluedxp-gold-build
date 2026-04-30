/**
 * TMS Seed Sample Data API
 *
 * Loads sample transport jobs into the database
 * One-click solution for demo/testing
 *
 * POST /api/tms/seed-sample-data
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { tmsCoreService } from "@/lib/services/tms/tmsCoreService";
import { podService } from "@/lib/services/tms/podService";
import { detentionService } from "@/lib/services/tms/detentionService";
import { transitTimeService } from "@/lib/services/tms/transitTimeService";
import { laneService } from "@/lib/services/tms/laneService";
import { getAllSampleJobs } from "@/data/tms/sampleJobs";
import { JobStatus } from "@/types/tms/transportJob";

interface SeedResult {
  success: boolean;
  jobs: number;
  lanes: number;
  podRecords: number;
  detentionRecords: number;
  transitRecords: number;
  errors: string[];
  message: string;
}

/**
 * POST /api/tms/seed-sample-data - Seed sample TMS data
 */
async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
): Promise<NextResponse<SeedResult>> {
  const tenantId = context.tenantId || "demo-tenant";
  const userId = context.userId || "system";

  const result: SeedResult = {
    success: false,
    jobs: 0,
    lanes: 0,
    podRecords: 0,
    detentionRecords: 0,
    transitRecords: 0,
    errors: [],
    message: "",
  };

  try {
    console.log("🌱 Seeding TMS sample data...");

    // Get all sample jobs
    const jobs = getAllSampleJobs();

    if (jobs.length === 0) {
      return NextResponse.json(
        {
          ...result,
          success: false,
          message: "No sample jobs found in data/tms/sampleJobs.ts",
        },
        { status: 404 },
      );
    }

    // Create unique lanes first
    const uniqueLanes = new Map<string, any>();
    for (const job of jobs) {
      if (job.laneName) {
        uniqueLanes.set(job.laneName, {
          name: job.laneName,
          origin: job.polLocation || job.shipmentOrigin || "",
          destination: job.podLocation || job.shipmentDestination || "",
          truckType: job.truckType,
          mode: "ROAD",
        });
      }
    }

    // Create lanes
    for (const [laneName, laneData] of uniqueLanes.entries()) {
      try {
        await laneService.createOrUpdateLane({
          tenantId,
          name: laneData.name,
          origin: laneData.origin,
          destination: laneData.destination,
          truckType: laneData.truckType,
          isActive: true,
        });
        result.lanes++;
      } catch (error) {
        result.errors.push(
          `Lane ${laneName}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Create transport jobs
    for (const sampleJob of jobs) {
      try {
        const job = await tmsCoreService.createJob({
          tenantId,
          createdBy: userId,
          jobName: sampleJob.jobName || `Sample Job ${sampleJob.jobNumber}`,
          jobNumber: sampleJob.jobNumber,
          jobType: sampleJob.jobType!,
          jobStatus: sampleJob.jobStatus || JobStatus.COMPLETED,
          customer: sampleJob.customer,
          customerId: sampleJob.customer
            ? `cust-${sampleJob.customer.toLowerCase().replace(/\s+/g, "-")}`
            : undefined,
          transporter: sampleJob.transporter,
          transporterId: sampleJob.transporter
            ? `trans-${sampleJob.transporter.toLowerCase().replace(/\s+/g, "-")}`
            : undefined,
          origin: sampleJob.shipmentOrigin || sampleJob.polLocation || "",
          destination:
            sampleJob.shipmentDestination || sampleJob.podLocation || "",
          polLocation: sampleJob.polLocation,
          podLocation: sampleJob.podLocation,
          polCountry: sampleJob.polCountry,
          podCountry: sampleJob.podCountry,
          truckType: sampleJob.truckType,
          driverName: sampleJob.driverName,
          vehiclePlateNumber: sampleJob.vehiclePlateNumber,
          driverMobileNumber: sampleJob.driverMobileNumber,
          driverNationality: sampleJob.driverNationality,
          requestDate: sampleJob.requestDate,
          loadingDate: sampleJob.loadingDate,
          shipperArrival: sampleJob.shipperArrival,
          shipperDeparture: sampleJob.shipperDeparture,
          consigneeArrival: sampleJob.consigneeArrival,
          consigneeDeparture: sampleJob.consigneeDeparture,
          transitTime: sampleJob.transitTime,
          detentionLoadingDays: sampleJob.detentionLoadingDays,
          detentionOffloadingDays: sampleJob.detentionOffloadingDays,
          shipmentWeight: sampleJob.shipmentWeight,
          shipmentType: sampleJob.shipmentType,
          laneName: sampleJob.laneName,
          currency: sampleJob.currency || "SAR",
          costTRP: sampleJob.costTRP,
          otherExpenses: sampleJob.otherExpenses,
          bridgeClearanceFees: sampleJob.bridgeClearanceFees,
          totalCost: sampleJob.totalCost,
        });

        result.jobs++;

        // Create POD record if completed
        if (job.jobStatus === JobStatus.COMPLETED && job.consigneeDeparture) {
          try {
            await podService.createPOD({
              tenantId,
              jobId: job.id,
              deliveryDate: job.consigneeDeparture,
              deliveryTime: job.consigneeDeparture.toTimeString().split(" ")[0],
              consigneeName: `${job.customer} - Warehouse`,
              deliveryStatus: "delivered",
              deliveryNotes: "Sample POD - Auto-generated from seed data",
              signature: "SAMPLE_SIGNATURE",
              createdBy: userId,
            });
            result.podRecords++;
          } catch (error) {
            result.errors.push(
              `POD for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        // Create detention record if applicable
        if (
          job.detentionLoadingDays &&
          job.detentionLoadingDays > 0 &&
          job.shipperArrival &&
          job.shipperDeparture
        ) {
          try {
            await detentionService.createDetentionRecord({
              jobId: job.id,
              startDate: job.shipperArrival,
              endDate: job.shipperDeparture,
              freeTimeDays: 0,
              detentionType: "loading",
              location: job.polLocation || job.shipmentOrigin || "",
              detentionRate: 100, // 100 SAR per day
            });
            result.detentionRecords++;
          } catch (error) {
            result.errors.push(
              `Detention for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        // Create transit time record
        if (job.transitTime && job.shipperDeparture && job.consigneeArrival) {
          try {
            await transitTimeService.createTransitTimeRecord(
              job.id,
              {
                segment: "full",
                origin: job.polLocation || job.shipmentOrigin || "",
                destination: job.podLocation || job.shipmentDestination || "",
                startDate: job.shipperDeparture,
                endDate: job.consigneeArrival,
                plannedTime: job.transitTime,
                actualTime: job.transitTime,
              },
              tenantId,
            );
            result.transitRecords++;
          } catch (error) {
            result.errors.push(
              `Transit for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } catch (error) {
        result.errors.push(
          `Job ${sampleJob.jobNumber}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    result.success = result.jobs > 0;
    result.message = result.success
      ? `Successfully seeded ${result.jobs} transport jobs with related records`
      : "Failed to seed any transport jobs";

    console.log("✅ TMS sample data seeded:", result);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("Error seeding TMS sample data:", error);
    return NextResponse.json(
      {
        ...result,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        errors: [error instanceof Error ? error.message : String(error)],
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "tms",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
