/**
 * Dynamic Touchpoint Generation API Route
 *
 * Generates touchpoints for a shipment based on route and cargo type.
 *
 * @route POST /api/gcc-compliance/touchpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { touchpointGenerator } from '@/lib/services/gcc-compliance';
import type { DynamicTouchpointRequest, GCCCountry, EquipmentType, CargoType } from '@/types/gcc-compliance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.origin || !body.destination) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: origin, destination',
        },
        { status: 400 }
      );
    }

    // Build touchpoint request
    const touchpointRequest: DynamicTouchpointRequest = {
      shipmentId: body.shipmentId || `TP-${Date.now()}`,
      origin: {
        city: body.origin.city,
        country: (body.origin.country || 'SA') as GCCCountry,
        facilityId: body.origin.facilityId || '',
        facilityType: body.origin.facilityType || 'DOCK_WAREHOUSE',
        coordinates: body.origin.coordinates || { lat: 0, lng: 0 },
      },
      destination: {
        city: body.destination.city,
        country: (body.destination.country || 'SA') as GCCCountry,
        facilityId: body.destination.facilityId || '',
        facilityType: body.destination.facilityType || 'DOCK_WAREHOUSE',
        coordinates: body.destination.coordinates || { lat: 0, lng: 0 },
      },
      equipmentType: (body.equipmentType || 'FLATBED') as EquipmentType,
      carrierNationality: (body.carrierNationality || 'SA') as GCCCountry | 'OTHER',
      cargoType: (body.cargoType || 'GENERAL') as CargoType,
      requiresCrossDock: body.requiresCrossDock || false,
      plannedDeparture: new Date(body.plannedDeparture || Date.now()),
      hasBackloadRestriction: body.hasBackloadRestriction,
    };

    // Generate touchpoints
    const result = await touchpointGenerator.generateTouchpoints(touchpointRequest);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Touchpoint Generation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Touchpoint generation failed',
      },
      { status: 500 }
    );
  }
}
