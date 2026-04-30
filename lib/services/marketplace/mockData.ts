/**
 * Mock Data for Marketplace
 * Provides sample data for testing and development
 */

import type {
  StorageServiceListing,
  TransportationServiceListing,
  ConsultingServiceListing,
  ServiceProvider,
} from "@/types/marketplace";

export const mockProviders: ServiceProvider[] = [
  {
    id: "provider-1",
    name: "Al-Rajhi Logistics",
    type: "COMPANY",
    description: "Leading logistics provider in Saudi Arabia",
    contact: {
      email: "info@alrajhi-logistics.com",
      phone: "+966-11-123-4567",
      website: "https://alrajhi-logistics.com",
      address: "Riyadh, Saudi Arabia",
    },
    services: ["STORAGE", "TRANSPORTATION", "FREIGHT"],
    rating: 4.8,
    totalBookings: 1245,
    totalRevenue: 2500000,
    verified: true,
    certifications: ["ISO 9001", "SABER", "MODON"],
    joinedDate: "2023-01-15",
    status: "ACTIVE",
  },
  {
    id: "provider-2",
    name: "Salamah Safety Consultants",
    type: "COMPANY",
    description: "Expert Civil Defense and Safety consulting",
    contact: {
      email: "info@salamah-safety.com",
      phone: "+966-11-234-5678",
      website: "https://salamah-safety.com",
    },
    services: ["CONSULTING"],
    rating: 4.9,
    totalBookings: 456,
    totalRevenue: 850000,
    verified: true,
    certifications: ["NEBOSH", "OSHA", "Civil Defense Certified"],
    joinedDate: "2023-03-20",
    status: "ACTIVE",
  },
];

export const mockStorageListings: StorageServiceListing[] = [
  {
    id: "listing-storage-1",
    providerId: "provider-1",
    providerName: "Al-Rajhi Logistics",
    serviceType: "GENERAL_STORAGE",
    warehouseName: "Riyadh Main Warehouse",
    location: {
      address: "Industrial Area, Block 5",
      city: "Riyadh",
      country: "Saudi Arabia",
      coordinates: { lat: 24.7136, lng: 46.6753 },
    },
    capacity: {
      total: 50000,
      available: 15000,
      unit: "CUBIC_METERS",
    },
    features: [
      "24/7 Access",
      "Security",
      "Climate Control",
      "Fire Suppression",
    ],
    pricing: {
      model: "PER_MONTH",
      basePrice: 150,
      currency: "SAR",
      unit: "m³",
    },
    capabilities: {
      handling: true,
      inventoryManagement: true,
      realTimeTracking: true,
      reporting: true,
    },
    certifications: ["ISO 9001", "SABER", "MODON"],
    rating: 4.8,
    totalBookings: 234,
    availability: "AVAILABLE",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "listing-storage-2",
    providerId: "provider-1",
    providerName: "Al-Rajhi Logistics",
    serviceType: "COLD_STORAGE",
    warehouseName: "Jeddah Cold Storage",
    location: {
      address: "Port Area, Jeddah",
      city: "Jeddah",
      country: "Saudi Arabia",
      coordinates: { lat: 21.4858, lng: 39.1925 },
    },
    capacity: {
      total: 20000,
      available: 5000,
      unit: "CUBIC_METERS",
    },
    features: [
      "24/7 Access",
      "Security",
      "Temperature Control",
      "Real-time Monitoring",
    ],
    pricing: {
      model: "PER_MONTH",
      basePrice: 250,
      currency: "SAR",
      unit: "m³",
    },
    capabilities: {
      handling: true,
      inventoryManagement: true,
      realTimeTracking: true,
      reporting: true,
    },
    certifications: ["ISO 9001", "SFDA"],
    rating: 4.7,
    totalBookings: 156,
    availability: "AVAILABLE",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
];

export const mockTransportationListings: TransportationServiceListing[] = [
  {
    id: "listing-transport-1",
    providerId: "provider-1",
    providerName: "Al-Rajhi Logistics",
    serviceType: "FTL",
    routes: [
      {
        origin: "Riyadh",
        destination: "Jeddah",
        distance: 950,
        estimatedTime: 10,
      },
      {
        origin: "Riyadh",
        destination: "Dammam",
        distance: 400,
        estimatedTime: 4,
      },
    ],
    fleet: {
      totalVehicles: 150,
      availableVehicles: 45,
      vehicleTypes: ["Truck", "Refrigerated", "Flatbed"],
    },
    pricing: {
      model: "PER_KM",
      basePrice: 2.5,
      currency: "SAR",
      fuelSurcharge: 15,
      minimumCharge: 500,
    },
    capabilities: {
      tracking: true,
      temperatureControl: true,
      hazmat: true,
      insurance: true,
    },
    certifications: ["Transport License", "Insurance"],
    rating: 4.6,
    onTimePerformance: 96,
    totalBookings: 567,
    availability: "AVAILABLE",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
  },
];

export const mockConsultingListings: ConsultingServiceListing[] = [
  {
    id: "listing-consulting-1",
    providerId: "provider-2",
    providerName: "Salamah Safety Consultants",
    consultantId: "consultant-1",
    consultantName: "Ahmed Al-Salamah",
    serviceType: "CIVIL_DEFENSE",
    specialties: [
      "Civil Defense Licensing",
      "Fire Safety",
      "Chemical Storage Planning",
    ],
    serviceAreas: ["Riyadh", "Jeddah", "Dammam"],
    pricing: {
      model: "PROJECT",
      basePrice: 5000,
      currency: "SAR",
      minimumHours: 10,
    },
    experience: {
      years: 15,
      totalProjects: 245,
      successRate: 96,
    },
    certifications: ["NEBOSH", "OSHA", "Civil Defense Certified"],
    languages: ["Arabic", "English"],
    availability: "AVAILABLE",
    rating: 4.9,
    totalBookings: 189,
    averageResponseTime: 4,
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z",
  },
];
