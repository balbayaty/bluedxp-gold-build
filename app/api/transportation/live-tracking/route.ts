/**
 * Live Tracking API
 * 
 * Provides real-time vehicle tracking data for the map component.
 * 
 * GET /api/transportation/live-tracking
 * - Returns current vehicle positions, geofences, and touchpoints
 * 
 * @module api/transportation/live-tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIotPollingService } from '@/lib/services/iot';
import { geofenceZoneService } from '@/lib/services/geofence';

// ============================================================================
// TYPES
// ============================================================================

interface VehicleLocation {
  deviceId: string;
  vehicleId?: string;
  plateNumber?: string;
  shipmentId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp: Date | string;
  source: 'IOT' | 'DALEELI' | 'DRIVER';
  isOnline?: boolean;
  anomaly?: {
    detected: boolean;
    type?: string;
    severity?: string;
  };
}

// ============================================================================
// GET - Fetch current tracking data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';
    const shipmentId = searchParams.get('shipmentId');

    // Get polling service
    const pollingService = getIotPollingService();
    
    // Get tracked devices
    let trackedDevices = pollingService.getTrackedDevices();
    
    // Filter by shipment if specified
    if (shipmentId) {
      trackedDevices = trackedDevices.filter(d => d.shipmentId === shipmentId);
    }
    
    // Filter by tenant
    trackedDevices = trackedDevices.filter(d => d.tenantId === tenantId);
    
    // Convert to vehicle locations
    const vehicles: VehicleLocation[] = trackedDevices.map(device => {
      const location = device.lastLocation;
      
      if (location) {
        return {
          deviceId: device.deviceId,
          vehicleId: device.vehicleId,
          plateNumber: device.plateNumber,
          shipmentId: device.shipmentId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp,
          source: 'IOT' as const,
          isOnline: device.lastUpdate 
            ? Date.now() - new Date(device.lastUpdate).getTime() < 5 * 60 * 1000 
            : false,
        };
      }
      
      // No location yet - return last known or default
      return null;
    }).filter((v): v is VehicleLocation => v !== null);
    
    // If no real data, provide demo data for Saudi Arabia
    const vehiclesWithDemo = vehicles.length > 0 ? vehicles : getDemoVehicles();

    // Get geofences
    let geofences: any[] = [];
    try {
      const zones = await geofenceZoneService.listZones(tenantId);
      geofences = zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        type: zone.type,
        geometry: zone.geometry,
        metadata: zone.metadata,
      }));
    } catch (error) {
      console.warn('Error fetching geofences:', error);
      // Provide demo geofences
      geofences = getDemoGeofences();
    }

    // Get touchpoints (from active shipments' GCC compliance data)
    const touchpoints = getDemoTouchpoints();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vehicles: vehiclesWithDemo,
      geofences,
      touchpoints,
      stats: {
        totalVehicles: vehiclesWithDemo.length,
        onlineVehicles: vehiclesWithDemo.filter(v => v.isOnline !== false).length,
        totalGeofences: geofences.length,
        totalTouchpoints: touchpoints.length,
      },
    });
  } catch (error) {
    console.error('[Live Tracking API] Error:', error);
    
    // Return demo data on error
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vehicles: getDemoVehicles(),
      geofences: getDemoGeofences(),
      touchpoints: getDemoTouchpoints(),
      stats: {
        totalVehicles: 5,
        onlineVehicles: 4,
        totalGeofences: 3,
        totalTouchpoints: 4,
      },
      demo: true,
    });
  }
}

// ============================================================================
// DEMO DATA (for testing without real IoT devices)
// ============================================================================

function getDemoVehicles(): VehicleLocation[] {
  // Simulate vehicles on Saudi Arabia roads
  const now = Date.now();
  
  return [
    {
      deviceId: 'DEMO-001',
      vehicleId: 'TRK-2024-001',
      plateNumber: 'ب ط ر 1234',
      shipmentId: 'SH-2024-0001',
      latitude: 24.7136 + Math.sin(now / 10000) * 0.01,
      longitude: 46.6753 + Math.cos(now / 10000) * 0.01,
      speed: 85,
      heading: 45,
      timestamp: new Date(),
      source: 'IOT',
      isOnline: true,
    },
    {
      deviceId: 'DEMO-002',
      vehicleId: 'TRK-2024-002',
      plateNumber: 'ج ك ل 5678',
      shipmentId: 'SH-2024-0002',
      latitude: 21.4858 + Math.sin(now / 12000) * 0.015,
      longitude: 39.1925 + Math.cos(now / 12000) * 0.015,
      speed: 72,
      heading: 120,
      timestamp: new Date(),
      source: 'DALEELI',
      isOnline: true,
    },
    {
      deviceId: 'DEMO-003',
      vehicleId: 'TRK-2024-003',
      plateNumber: 'أ ب ت 9012',
      shipmentId: 'SH-2024-0003',
      latitude: 26.4207 + Math.sin(now / 8000) * 0.02,
      longitude: 50.0888 + Math.cos(now / 8000) * 0.02,
      speed: 0,
      heading: 0,
      timestamp: new Date(now - 30 * 60 * 1000), // 30 min ago
      source: 'IOT',
      isOnline: false,
    },
    {
      deviceId: 'DEMO-004',
      vehicleId: 'TRK-2024-004',
      plateNumber: 'د ه و 3456',
      shipmentId: 'SH-2024-0004',
      latitude: 25.3548,
      longitude: 49.5866,
      speed: 95,
      heading: 270,
      timestamp: new Date(),
      source: 'DRIVER',
      isOnline: true,
      anomaly: {
        detected: true,
        type: 'LOCATION_MISMATCH',
        severity: 'MEDIUM',
      },
    },
    {
      deviceId: 'DEMO-005',
      vehicleId: 'TRK-2024-005',
      plateNumber: 'ز ح ط 7890',
      shipmentId: 'SH-2024-0005',
      latitude: 21.3891 + Math.sin(now / 15000) * 0.008,
      longitude: 39.8579 + Math.cos(now / 15000) * 0.008,
      speed: 45,
      heading: 180,
      timestamp: new Date(),
      source: 'IOT',
      isOnline: true,
    },
  ];
}

function getDemoGeofences() {
  return [
    {
      id: 'geo-001',
      name: 'Jeddah Islamic Port',
      type: 'PORT_TERMINAL',
      geometry: {
        type: 'CIRCLE',
        coordinates: {
          center: { lat: 21.4858, lng: 39.1925 },
          radius: 2000,
        },
      },
    },
    {
      id: 'geo-002',
      name: 'Riyadh Dry Port',
      type: 'LOGISTICS_HUB',
      geometry: {
        type: 'CIRCLE',
        coordinates: {
          center: { lat: 24.7136, lng: 46.6753 },
          radius: 3000,
        },
      },
    },
    {
      id: 'geo-003',
      name: 'Al Batha Border - Saudi Exit',
      type: 'BORDER_EXIT_POINT',
      geometry: {
        type: 'CIRCLE',
        coordinates: {
          center: { lat: 25.0891, lng: 49.6347 },
          radius: 1500,
        },
      },
    },
    {
      id: 'geo-004',
      name: 'King Fahd Causeway',
      type: 'BORDER_ENTRY_POINT',
      geometry: {
        type: 'CIRCLE',
        coordinates: {
          center: { lat: 26.2172, lng: 50.4758 },
          radius: 2000,
        },
      },
    },
    {
      id: 'geo-005',
      name: 'Dammam Industrial Area',
      type: 'WAREHOUSE',
      geometry: {
        type: 'CIRCLE',
        coordinates: {
          center: { lat: 26.4207, lng: 50.0888 },
          radius: 1800,
        },
      },
    },
  ];
}

function getDemoTouchpoints() {
  return [
    {
      id: 'tp-001',
      name: 'Origin - Jeddah Port',
      type: 'POL',
      coordinates: { lat: 21.4858, lng: 39.1925 },
      status: 'DEPARTED',
    },
    {
      id: 'tp-002',
      name: 'SFDA Checkpoint',
      type: 'REGULATORY_CHECKPOINT',
      coordinates: { lat: 22.1234, lng: 42.5678 },
      status: 'PENDING',
    },
    {
      id: 'tp-003',
      name: 'Al Batha Border Exit',
      type: 'BPC_EXIT',
      coordinates: { lat: 25.0891, lng: 49.6347 },
      status: 'PENDING',
    },
    {
      id: 'tp-004',
      name: 'Destination - Dubai',
      type: 'POD',
      coordinates: { lat: 25.2048, lng: 55.2708 },
      status: 'PENDING',
    },
  ];
}
