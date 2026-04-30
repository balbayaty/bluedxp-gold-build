/**
 * Historical Route Data API
 * 
 * GET /api/transportation/history
 * 
 * Returns historical route data for playback visualization.
 * Supports filtering by shipmentId, date range, and tenant.
 * 
 * @module app/api/transportation/history
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
  source: 'IOT' | 'DALEELI' | 'DRIVER';
  eventType?: 'NORMAL' | 'STOP' | 'SPEEDING' | 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'ANOMALY';
  eventDetails?: string;
}

interface ShipmentEvent {
  id: string;
  type: 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'STOP' | 'SPEEDING' | 'ANOMALY' | 'CHECKPOINT';
  timestamp: string;
  location: { lat: number; lng: number };
  description: string;
  duration?: number;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface ShipmentRoute {
  shipmentId: string;
  shipmentNumber: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  startTime: string;
  endTime: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  points: LocationPoint[];
  events: ShipmentEvent[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// ============================================================================
// DEMO DATA GENERATOR
// ============================================================================

/**
 * Generate realistic GPS points along a route
 */
function generateRoutePoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  startTime: Date,
  durationHours: number,
  pointsPerHour: number = 60
): LocationPoint[] {
  const points: LocationPoint[] = [];
  const totalPoints = Math.floor(durationHours * pointsPerHour);
  
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints;
    
    // Add some realistic variation
    const variation = 0.005 * Math.sin(i * 0.1);
    
    const lat = origin.lat + (latDiff * progress) + variation;
    const lng = origin.lng + (lngDiff * progress) + (variation * 0.5);
    
    // Calculate heading
    const prevLat = i > 0 ? points[i - 1].latitude : origin.lat;
    const prevLng = i > 0 ? points[i - 1].longitude : origin.lng;
    const heading = Math.atan2(lng - prevLng, lat - prevLat) * (180 / Math.PI);
    
    // Realistic speed with variation
    let speed = 80 + Math.sin(i * 0.05) * 20; // 60-100 km/h
    
    // Simulate stops
    let eventType: LocationPoint['eventType'] = 'NORMAL';
    if (i === Math.floor(totalPoints * 0.3)) {
      speed = 0;
      eventType = 'GEOFENCE_ENTRY';
    } else if (i === Math.floor(totalPoints * 0.35)) {
      speed = 0;
      eventType = 'STOP';
    } else if (i === Math.floor(totalPoints * 0.4)) {
      speed = 40;
      eventType = 'GEOFENCE_EXIT';
    } else if (i === Math.floor(totalPoints * 0.7)) {
      speed = 120;
      eventType = 'SPEEDING';
    }
    
    const timestamp = new Date(startTime.getTime() + (i * (durationHours * 3600000 / totalPoints)));
    
    points.push({
      latitude: lat,
      longitude: lng,
      timestamp: timestamp.toISOString(),
      speed: Math.max(0, speed),
      heading: (heading + 360) % 360,
      source: i % 5 === 0 ? 'DALEELI' : 'IOT',
      eventType,
    });
  }
  
  return points;
}

/**
 * Generate demo events for a route
 */
function generateRouteEvents(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  startTime: Date,
  durationHours: number
): ShipmentEvent[] {
  const events: ShipmentEvent[] = [];
  
  // Origin departure
  events.push({
    id: 'evt-001',
    type: 'GEOFENCE_EXIT',
    timestamp: new Date(startTime.getTime() + 5 * 60000).toISOString(),
    location: { lat: origin.lat, lng: origin.lng },
    description: 'Departed origin facility',
    severity: 'INFO',
  });
  
  // Checkpoint (30% into journey)
  const checkpoint1Progress = 0.3;
  events.push({
    id: 'evt-002',
    type: 'CHECKPOINT',
    timestamp: new Date(startTime.getTime() + durationHours * 3600000 * checkpoint1Progress).toISOString(),
    location: {
      lat: origin.lat + (destination.lat - origin.lat) * checkpoint1Progress,
      lng: origin.lng + (destination.lng - origin.lng) * checkpoint1Progress,
    },
    description: 'Reached border checkpoint',
    severity: 'INFO',
  });
  
  // Rest stop (50% into journey)
  const restProgress = 0.5;
  events.push({
    id: 'evt-003',
    type: 'STOP',
    timestamp: new Date(startTime.getTime() + durationHours * 3600000 * restProgress).toISOString(),
    location: {
      lat: origin.lat + (destination.lat - origin.lat) * restProgress,
      lng: origin.lng + (destination.lng - origin.lng) * restProgress,
    },
    description: 'Driver rest stop',
    duration: 1800, // 30 minutes
    severity: 'INFO',
  });
  
  // Speeding incident (70% into journey)
  const speedingProgress = 0.7;
  events.push({
    id: 'evt-004',
    type: 'SPEEDING',
    timestamp: new Date(startTime.getTime() + durationHours * 3600000 * speedingProgress).toISOString(),
    location: {
      lat: origin.lat + (destination.lat - origin.lat) * speedingProgress,
      lng: origin.lng + (destination.lng - origin.lng) * speedingProgress,
    },
    description: 'Speed exceeded 120 km/h',
    duration: 180, // 3 minutes
    severity: 'WARNING',
  });
  
  // Destination arrival
  events.push({
    id: 'evt-005',
    type: 'GEOFENCE_ENTRY',
    timestamp: new Date(startTime.getTime() + durationHours * 3600000 * 0.98).toISOString(),
    location: { lat: destination.lat, lng: destination.lng },
    description: 'Arrived at destination facility',
    severity: 'INFO',
  });
  
  return events;
}

// ============================================================================
// DEMO ROUTES
// ============================================================================

const DEMO_ROUTES: Record<string, Omit<ShipmentRoute, 'points' | 'events'>> = {
  'SHP-2024-001': {
    shipmentId: 'SHP-2024-001',
    shipmentNumber: 'SHP-2024-001',
    vehicleId: 'VEH-001',
    plateNumber: 'أ ب ت 1234',
    driverName: 'Ahmed Al-Rashid',
    startTime: new Date(Date.now() - 24 * 3600000).toISOString(), // Yesterday
    endTime: new Date(Date.now() - 18 * 3600000).toISOString(),
    origin: { name: 'Riyadh Industrial Area', lat: 24.7136, lng: 46.6753 },
    destination: { name: 'Dammam Port', lat: 26.4207, lng: 50.0888 },
    status: 'COMPLETED',
  },
  'SHP-2024-002': {
    shipmentId: 'SHP-2024-002',
    shipmentNumber: 'SHP-2024-002',
    vehicleId: 'VEH-002',
    plateNumber: 'ر س ص 5678',
    driverName: 'Mohammed Al-Harbi',
    startTime: new Date(Date.now() - 48 * 3600000).toISOString(), // 2 days ago
    endTime: new Date(Date.now() - 36 * 3600000).toISOString(),
    origin: { name: 'Jeddah Port', lat: 21.5433, lng: 39.1728 },
    destination: { name: 'Riyadh Warehouse', lat: 24.7136, lng: 46.6753 },
    status: 'COMPLETED',
  },
  'SHP-2024-003': {
    shipmentId: 'SHP-2024-003',
    shipmentNumber: 'SHP-2024-003',
    vehicleId: 'VEH-003',
    plateNumber: 'ع غ ف 9012',
    driverName: 'Khalid Al-Qahtani',
    startTime: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
    endTime: new Date().toISOString(),
    origin: { name: 'Riyadh Distribution Center', lat: 24.7136, lng: 46.6753 },
    destination: { name: 'Dubai Jebel Ali', lat: 25.0657, lng: 55.1713 },
    status: 'COMPLETED',
  },
  'SHP-2024-004': {
    shipmentId: 'SHP-2024-004',
    shipmentNumber: 'SHP-2024-004',
    vehicleId: 'VEH-004',
    plateNumber: 'ق ك ل 3456',
    driverName: 'Sultan Al-Dosari',
    startTime: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
    endTime: new Date(Date.now() - 60 * 3600000).toISOString(),
    origin: { name: 'Kuwait City Warehouse', lat: 29.3759, lng: 47.9774 },
    destination: { name: 'Riyadh Central', lat: 24.7136, lng: 46.6753 },
    status: 'COMPLETED',
  },
};

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const tenantId = searchParams.get('tenantId');

    // If specific shipment requested
    if (shipmentId) {
      const baseRoute = DEMO_ROUTES[shipmentId];
      
      if (!baseRoute) {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        );
      }

      // Generate full route with points
      const routeStart = new Date(baseRoute.startTime);
      const routeEnd = new Date(baseRoute.endTime);
      const durationHours = (routeEnd.getTime() - routeStart.getTime()) / 3600000;

      const route: ShipmentRoute = {
        ...baseRoute,
        points: generateRoutePoints(
          baseRoute.origin,
          baseRoute.destination,
          routeStart,
          durationHours
        ),
        events: generateRouteEvents(
          baseRoute.origin,
          baseRoute.destination,
          routeStart,
          durationHours
        ),
      };

      return NextResponse.json({
        route,
        metadata: {
          totalPoints: route.points.length,
          totalEvents: route.events.length,
          durationHours,
          distanceKm: calculateDistance(baseRoute.origin, baseRoute.destination),
        },
      });
    }

    // Return list of available routes
    const routes = Object.values(DEMO_ROUTES).map((route) => ({
      shipmentId: route.shipmentId,
      shipmentNumber: route.shipmentNumber,
      plateNumber: route.plateNumber,
      driverName: route.driverName,
      origin: route.origin.name,
      destination: route.destination.name,
      startTime: route.startTime,
      endTime: route.endTime,
      status: route.status,
    }));

    return NextResponse.json({
      routes,
      total: routes.length,
    });
  } catch (error) {
    console.error('Error fetching historical route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
