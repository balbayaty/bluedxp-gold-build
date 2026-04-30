/**
 * TMS Core Service
 * Main business logic service for Transport Management System
 * Orchestrates all TMS operations
 */

import { TransportJob, JobStatus, JobType } from "@/types/tms/transportJob";
import { csvImportService, ImportResult } from "./csvImportService";
import { podService } from "./podService";
import { detentionService } from "./detentionService";
import { transitTimeService } from "./transitTimeService";
import { laneService } from "./laneService";
import { tmsDatabaseAdapter } from "./database/tmsDatabaseAdapter";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export interface CreateJobData {
  jobName: string;
  jobNumber?: string;
  jobType: JobType;
  customerId?: string;
  transporterId?: string;
  origin: string;
  destination: string;
  requestDate?: Date;
  eta?: Date;
  tenantId: string;
  createdBy: string;
  [key: string]: any; // Allow additional fields
}

export interface JobFilters {
  tenantId: string;
  jobType?: JobType;
  jobStatus?: JobStatus;
  customerId?: string;
  transporterId?: string;
  laneId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface JobUpdateData {
  [key: string]: any;
}

/**
 * TMS Core Service
 */
export class TMSCoreService {
  /**
   * Create transport job
   */
  async createJob(data: CreateJobData): Promise<TransportJob> {
    // Validate required fields
    if (!data.jobName) {
      throw new Error("Job name is required");
    }
    if (!data.jobType) {
      throw new Error("Job type is required");
    }
    if (!data.tenantId) {
      throw new Error("Tenant ID is required");
    }

    // Generate job number if not provided
    const jobNumber = data.jobNumber || `FX-${Date.now()}`;

    // Create job - extract base fields first, then merge rest
    const {
      jobName,
      jobNumber: _,
      jobType,
      tenantId,
      createdBy,
      origin,
      destination,
      ...restData
    } = data;

    const job: TransportJob = {
      id: `job_${jobNumber}_${Date.now()}`,
      jobName: jobName || "Untitled Job",
      jobNumber,
      jobType: jobType || JobType.CROSS_BORDER,
      jobStatus: JobStatus.PENDING,
      customerId: restData.customerId,
      transporterId: restData.transporterId,
      shipmentOrigin: origin || restData.shipmentOrigin,
      shipmentDestination: destination || restData.shipmentDestination,
      requestDate: restData.requestDate || new Date(),
      eta: restData.eta,
      tenantId: tenantId || "",
      createdBy: createdBy || "system",
      createdTime: new Date(),
      modifiedTime: new Date(),
      currency: "SAR",
      ...restData, // Merge additional fields
    };

    // Save to database
    await tmsDatabaseAdapter.storeJob(job.tenantId, job);

    // Publish event
    await eventBus.publish(
      createEvent(
        "tms.job.created",
        job.id,
        "TransportJob",
        {
          jobId: job.id,
          jobNumber: job.jobNumber,
          jobType: job.jobType,
          tenantId: job.tenantId,
          createdBy: job.createdBy,
        },
        1,
        {
          tenantId: job.tenantId,
          userId: job.createdBy,
        },
      ),
    );

    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string, tenantId: string): Promise<TransportJob | null> {
    const job = await tmsDatabaseAdapter.getJob(tenantId, jobId);
    if (job) {
      // Load related data
      job.podRecords = await tmsDatabaseAdapter.getPODRecords(tenantId, jobId);
      job.detentionDetails = await tmsDatabaseAdapter.getDetentionRecords(
        tenantId,
        jobId,
      );
      job.transitTimeRecords = await tmsDatabaseAdapter.getTransitTimeRecords(
        tenantId,
        jobId,
      );
      if (job.laneId) {
        job.lane =
          (await tmsDatabaseAdapter.getLane(tenantId, job.laneId)) || undefined;
      }
    }
    return job;
  }

  /**
   * Get jobs with filters
   */
  async getJobs(
    filters: JobFilters,
    pagination?: {
      page: number;
      pageSize: number;
    },
  ): Promise<{ jobs: TransportJob[]; total: number }> {
    return tmsDatabaseAdapter.getJobs(
      filters.tenantId,
      {
        jobType: filters.jobType,
        jobStatus: filters.jobStatus,
        customerId: filters.customerId,
        transporterId: filters.transporterId,
        laneId: filters.laneId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search,
      },
      pagination,
    );
  }

  /**
   * Update job
   */
  async updateJob(
    jobId: string,
    updates: JobUpdateData,
    tenantId: string,
    updatedBy: string,
  ): Promise<TransportJob> {
    const job = await this.getJob(jobId, tenantId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Apply updates
    const updatedJob: TransportJob = {
      ...job,
      ...updates,
      modifiedTime: new Date(),
      modifiedBy: updatedBy,
    };

    // Recalculate dependent data
    if (
      updates.shipperArrival ||
      updates.shipperDeparture ||
      updates.consigneeArrival ||
      updates.consigneeDeparture ||
      updates.saudiBorderArrival ||
      updates.saudiBorderDeparture
    ) {
      // Recalculate detention
      updatedJob.detentionDetails =
        await detentionService.calculateJobDetention(updatedJob);

      // Recalculate transit times
      updatedJob.transitTimeRecords =
        await transitTimeService.calculateJobTransitTimes(updatedJob);
    }

    // Save to database
    await tmsDatabaseAdapter.storeJob(tenantId, updatedJob);

    // Publish event
    await eventBus.publish(
      createEvent(
        "tms.job.updated",
        jobId,
        "TransportJob",
        {
          jobId,
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

    return updatedJob;
  }

  /**
   * Delete job
   */
  async deleteJob(
    jobId: string,
    tenantId: string,
    deletedBy: string,
  ): Promise<void> {
    const job = await this.getJob(jobId, tenantId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Check if job can be deleted (not in certain states)
    const nonDeletableStatuses = [JobStatus.IN_TRANSIT, JobStatus.DELIVERED];
    if (nonDeletableStatuses.includes(job.jobStatus)) {
      throw new Error(`Cannot delete job in status: ${job.jobStatus}`);
    }

    // Delete from database
    await tmsDatabaseAdapter.deleteJob(tenantId, jobId);

    // Publish event
    await eventBus.publish(
      createEvent(
        "tms.job.deleted",
        jobId,
        "TransportJob",
        {
          jobId,
          jobNumber: job.jobNumber,
          tenantId,
          deletedBy,
          previousStatus: job.jobStatus,
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
   * Import jobs from CSV
   */
  async importJobsFromCSV(
    csvContent: string,
    tenantId: string,
    createdBy: string,
  ): Promise<ImportResult> {
    return csvImportService.importCSV(
      csvContent,
      {
        tenantId,
        createdBy,
        skipValidation: false,
        dryRun: false,
      },
      async (jobData) => {
        // Create job from imported data
        const job = await this.createJob({
          jobName: jobData.jobName || "Imported Job",
          jobNumber: jobData.jobNumber,
          jobType: jobData.jobType || JobType.CROSS_BORDER,
          customerId: jobData.customerId,
          transporterId: jobData.transporterId,
          origin: jobData.shipmentOrigin || jobData.polLocation || "",
          destination: jobData.shipmentDestination || jobData.podLocation || "",
          requestDate: jobData.requestDate,
          eta: jobData.eta,
          tenantId: jobData.tenantId || tenantId,
          createdBy: createdBy,
          ...jobData,
        });

        // Extract and create/update lane
        if (job.shipmentOrigin && job.shipmentDestination) {
          const laneData = laneService.extractLaneFromJob(job);
          if (laneData.origin && laneData.destination) {
            const lane = await laneService.createOrUpdateLane(laneData);
            job.laneId = lane.id;
            job.laneName = lane.name;
          }
        }

        // Calculate detention if dates available
        if (job.shipperArrival || job.consigneeArrival) {
          job.detentionDetails =
            await detentionService.calculateJobDetention(job);
        }

        // Calculate transit times if dates available
        if (job.shipperDeparture || job.consigneeArrival) {
          job.transitTimeRecords =
            await transitTimeService.calculateJobTransitTimes(job);
        }

        // Update job with calculated data
        await this.updateJob(
          job.id,
          {
            laneId: job.laneId,
            laneName: job.laneName,
            detentionDetails: job.detentionDetails,
            transitTimeRecords: job.transitTimeRecords,
          },
          tenantId,
          createdBy,
        );

        return job.id;
      },
    );
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    tenantId: string,
    updatedBy: string,
  ): Promise<TransportJob> {
    return this.updateJob(jobId, { jobStatus: status }, tenantId, updatedBy);
  }

  /**
   * Get job analytics
   */
  async getJobAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    pendingJobs: number;
    inTransitJobs: number;
    cancelledJobs: number;
    averageTransitTime: number;
    onTimeDeliveryRate: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    jobsByType: Record<string, number>;
    jobsByStatus: Record<string, number>;
    topCustomers: Array<{
      customerId: string;
      jobCount: number;
      revenue: number;
    }>;
    topLanes: Array<{
      laneName: string;
      jobCount: number;
      avgTransitTime: number;
    }>;
  }> {
    // Fetch jobs from database with date filters
    const { jobs } = await this.getJobs(
      {
        tenantId,
        dateFrom: startDate,
        dateTo: endDate,
      },
      { page: 1, pageSize: 10000 }, // Get all for analytics
    );

    if (jobs.length === 0) {
      return {
        totalJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        pendingJobs: 0,
        inTransitJobs: 0,
        cancelledJobs: 0,
        averageTransitTime: 0,
        onTimeDeliveryRate: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        jobsByType: {},
        jobsByStatus: {},
        topCustomers: [],
        topLanes: [],
      };
    }

    // Calculate job counts by status
    const statusCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    const customerData = new Map<string, { count: number; revenue: number }>();
    const laneData = new Map<
      string,
      { count: number; transitTimes: number[] }
    >();

    let totalRevenue = 0;
    let totalCost = 0;
    let transitTimeSum = 0;
    let transitTimeCount = 0;
    let onTimeCount = 0;
    let deliveredCount = 0;

    for (const job of jobs) {
      // Count by status
      const status = job.jobStatus || "UNKNOWN";
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

      // Count by type
      const type = job.jobType || "UNKNOWN";
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

      // Aggregate customer data
      if (job.customerId) {
        const customerInfo = customerData.get(job.customerId) || {
          count: 0,
          revenue: 0,
        };
        customerInfo.count++;
        customerInfo.revenue += job.totalRevenue || 0;
        customerData.set(job.customerId, customerInfo);
      }

      // Aggregate lane data
      if (job.laneName) {
        const laneInfo = laneData.get(job.laneName) || {
          count: 0,
          transitTimes: [],
        };
        laneInfo.count++;
        if (job.transitTime) {
          laneInfo.transitTimes.push(job.transitTime);
        }
        laneData.set(job.laneName, laneInfo);
      }

      // Financial calculations
      totalRevenue += job.totalRevenue || 0;
      totalCost += job.totalCost || 0;

      // Transit time calculations
      if (job.transitTime) {
        transitTimeSum += job.transitTime;
        transitTimeCount++;
      }

      // On-time delivery calculation
      if (job.jobStatus === JobStatus.DELIVERED) {
        deliveredCount++;
        if (job.eta && job.consigneeArrival) {
          const eta = new Date(job.eta);
          const actual = new Date(job.consigneeArrival);
          if (actual <= eta) {
            onTimeCount++;
          }
        }
      }
    }

    // Calculate derived metrics
    const averageTransitTime =
      transitTimeCount > 0 ? transitTimeSum / transitTimeCount : 0;
    const onTimeDeliveryRate =
      deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 0;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Convert maps to objects/arrays
    const jobsByStatus: Record<string, number> = {};
    statusCounts.forEach((count, status) => {
      jobsByStatus[status] = count;
    });

    const jobsByType: Record<string, number> = {};
    typeCounts.forEach((count, type) => {
      jobsByType[type] = count;
    });

    const topCustomers = Array.from(customerData.entries())
      .map(([customerId, data]) => ({
        customerId,
        jobCount: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topLanes = Array.from(laneData.entries())
      .map(([laneName, data]) => ({
        laneName,
        jobCount: data.count,
        avgTransitTime:
          data.transitTimes.length > 0
            ? data.transitTimes.reduce((a, b) => a + b, 0) /
              data.transitTimes.length
            : 0,
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 10);

    return {
      totalJobs: jobs.length,
      activeJobs:
        (statusCounts.get(JobStatus.IN_TRANSIT) || 0) +
        (statusCounts.get(JobStatus.LOADING) || 0),
      completedJobs: statusCounts.get(JobStatus.DELIVERED) || 0,
      pendingJobs: statusCounts.get(JobStatus.PENDING) || 0,
      inTransitJobs: statusCounts.get(JobStatus.IN_TRANSIT) || 0,
      cancelledJobs: statusCounts.get(JobStatus.CANCELLED) || 0,
      averageTransitTime: Math.round(averageTransitTime * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      jobsByType,
      jobsByStatus,
      topCustomers,
      topLanes,
    };
  }

  /**
   * Get job timeline
   */
  async getJobTimeline(
    jobId: string,
    tenantId: string,
  ): Promise<
    Array<{
      event: string;
      timestamp: Date;
      location?: string;
      status?: string;
    }>
  > {
    const job = await this.getJob(jobId, tenantId);
    if (!job) {
      return [];
    }

    const timeline: Array<{
      event: string;
      timestamp: Date;
      location?: string;
      status?: string;
    }> = [];

    if (job.requestDate) {
      timeline.push({ event: "Job Requested", timestamp: job.requestDate });
    }
    if (job.loadingDate) {
      timeline.push({ event: "Loading Scheduled", timestamp: job.loadingDate });
    }
    if (job.shipperArrival) {
      timeline.push({
        event: "Arrived at Shipper",
        timestamp: job.shipperArrival,
        location: job.polLocation,
      });
    }
    if (job.shipperDeparture) {
      timeline.push({
        event: "Departed from Shipper",
        timestamp: job.shipperDeparture,
        location: job.polLocation,
      });
    }
    if (job.saudiBorderArrival) {
      timeline.push({
        event: "Arrived at Saudi Border",
        timestamp: job.saudiBorderArrival,
      });
    }
    if (job.saudiBorderDeparture) {
      timeline.push({
        event: "Departed from Saudi Border",
        timestamp: job.saudiBorderDeparture,
      });
    }
    if (job.consigneeArrival) {
      timeline.push({
        event: "Arrived at Consignee",
        timestamp: job.consigneeArrival,
        location: job.podLocation,
      });
    }
    if (job.consigneeDeparture) {
      timeline.push({
        event: "Departed from Consignee",
        timestamp: job.consigneeDeparture,
        location: job.podLocation,
      });
    }
    if (job.podRecords && job.podRecords.length > 0) {
      job.podRecords.forEach((pod) => {
        timeline.push({
          event: "POD Captured",
          timestamp: pod.deliveryTimestamp,
          location: pod.deliveryLocation,
          status: pod.deliveryStatus,
        });
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timeline;
  }
}

export const tmsCoreService = new TMSCoreService();
