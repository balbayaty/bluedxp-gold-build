/**
 * Sample TMS Jobs Data
 * Example data for testing and development
 */

import { TransportJob, JobType, JobStatus, ShipmentType, TruckType } from '@/types/tms/transportJob';

export const sampleJobs: Partial<TransportJob>[] = [
  {
    jobName: 'Cross Border - Dammam to Muscat - FX-166',
    jobNumber: 'FX-166',
    jobType: JobType.CROSS_BORDER,
    jobStatus: JobStatus.COMPLETED,
    customer: 'Ismail Abudawood and Procter & Gamble Limited',
    transporter: 'Cash Personl',
    shipmentOrigin: 'Dammam',
    shipmentDestination: 'Muscat',
    polLocation: 'Dammam',
    podLocation: 'Muscat',
    polCountry: 'Saudi Arabia',
    podCountry: 'Oman',
    truckType: TruckType.BOX_TRAILER_DRY,
    driverName: 'Hassan Sharzad',
    vehiclePlateNumber: '2263',
    driverMobileNumber: '96699644',
    driverNationality: 'Pakistan',
    requestDate: new Date('2023-01-01'),
    loadingDate: new Date('2023-01-01'),
    shipperArrival: new Date('2023-01-01T16:00:00'),
    shipperDeparture: new Date('2023-01-01T16:00:00'),
    consigneeArrival: new Date('2023-01-02T14:00:00'),
    consigneeDeparture: new Date('2023-01-02T14:00:00'),
    transitTime: 22,
    detentionLoadingDays: 0,
    shipmentWeight: 150,
    shipmentType: ShipmentType.BOXES_CASES,
    laneName: 'Dammam - Muscat - Box Trailer Dry',
    currency: 'SAR',
    totalCost: 2400,
    tenantId: 'flex-logistics',
  },
  {
    jobName: 'Cross Border - Dammam to Cairo Nuwaibah - FX-167',
    jobNumber: 'FX-167',
    jobType: JobType.CROSS_BORDER,
    jobStatus: JobStatus.COMPLETED,
    customer: 'Ismail Abudawood and Procter & Gamble Limited',
    transporter: 'Cash Personl',
    shipmentOrigin: 'Dammam',
    shipmentDestination: 'Cairo Nuwaibah',
    polLocation: 'Dammam',
    podLocation: 'Cairo Nuwaibah',
    polCountry: 'Saudi Arabia',
    podCountry: 'Egypt',
    truckType: TruckType.BOX_TRAILER_DRY,
    driverName: 'Samer Ibrahim Kamel Abdul Hameed',
    vehiclePlateNumber: '5845, 7456',
    driverMobileNumber: '23211346',
    driverNationality: 'Egypt',
    requestDate: new Date('2023-01-04'),
    loadingDate: new Date('2023-01-03'),
    shipperArrival: new Date('2023-01-04T16:00:00'),
    shipperDeparture: new Date('2023-01-04T16:00:00'),
    consigneeArrival: new Date('2023-01-05T10:00:00'),
    consigneeDeparture: new Date('2023-01-05T10:00:00'),
    transitTime: 18,
    detentionLoadingDays: 9,
    shipmentWeight: 100,
    shipmentType: ShipmentType.BOXES_CASES,
    laneName: 'Dammam - Cairo Nuwaibah - Box Trailer Dry',
    currency: 'SAR',
    costTRP: 6250,
    otherExpenses: 5000,
    bridgeClearanceFees: 1250,
    totalCost: 11720,
    tenantId: 'flex-logistics',
  },
  {
    jobName: 'Cross Border - Riyadh to Dubai - FX-175',
    jobNumber: 'FX-175',
    jobType: JobType.CROSS_BORDER,
    jobStatus: JobStatus.COMPLETED,
    customer: 'DHL Global Forwarding Saudi Arabia',
    transporter: 'Cash Personl',
    shipmentOrigin: 'Riyadh',
    shipmentDestination: 'Dubai',
    polLocation: 'Riyadh',
    podLocation: 'Dubai',
    polCountry: 'Saudi Arabia',
    podCountry: 'UAE',
    truckType: TruckType.REEFER_TRAILER,
    driverName: 'FadelAllah Mohamed Saeed',
    vehiclePlateNumber: '4792',
    driverMobileNumber: '220781938',
    driverNationality: 'Syria',
    requestDate: new Date('2023-01-08'),
    loadingDate: new Date('2023-01-08'),
    shipperArrival: new Date('2023-01-08T21:00:00'),
    shipperDeparture: new Date('2023-01-08T21:00:00'),
    consigneeArrival: new Date('2023-01-09T14:00:00'),
    consigneeDeparture: new Date('2023-01-09T14:00:00'),
    transitTime: 17,
    detentionLoadingDays: 0,
    shipmentType: ShipmentType.BOXES_CASES,
    laneName: 'Riyadh - Dubai - Reefer Trailer',
    currency: 'SAR',
    costTRP: 1400,
    bridgeClearanceFees: 975,
    totalCost: 3057,
    tenantId: 'flex-logistics',
  },
];

/**
 * Get sample job by job number
 */
export function getSampleJob(jobNumber: string): Partial<TransportJob> | undefined {
  return sampleJobs.find(job => job.jobNumber === jobNumber);
}

/**
 * Get all sample jobs
 */
export function getAllSampleJobs(): Partial<TransportJob>[] {
  return sampleJobs;
}


