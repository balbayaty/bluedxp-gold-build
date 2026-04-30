/**
 * Pre-Dispatch Validation API Route
 *
 * Runs the 8-step pre-dispatch validation for GCC compliance.
 *
 * @route POST /api/gcc-compliance/validate
 */

import { NextRequest, NextResponse } from 'next/server';
import { validationOrchestrator } from '@/lib/services/gcc-compliance';
import type { PreDispatchValidationRequest } from '@/types/gcc-compliance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.shipmentId || !body.carrier || !body.equipment || !body.route) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: shipmentId, carrier, equipment, route',
        },
        { status: 400 }
      );
    }

    // Build validation request
    const validationRequest: PreDispatchValidationRequest = {
      shipmentId: body.shipmentId,
      tenantId: body.tenantId || 'default',
      carrier: {
        id: body.carrier.id,
        name: body.carrier.name || '',
        nationality: body.carrier.nationality || 'SA',
        crNumber: body.carrier.crNumber || '',
        waslRegistered: body.carrier.waslRegistered ?? true,
        insuranceValid: body.carrier.insuranceValid ?? true,
        insuranceExpiry: body.carrier.insuranceExpiry
          ? new Date(body.carrier.insuranceExpiry)
          : undefined,
        licensedRoutes: body.carrier.licensedRoutes || ['ALL'],
      },
      equipment: {
        type: body.equipment.type || 'FLATBED',
        plateNumber: body.equipment.plateNumber || '',
        plateType: body.equipment.plateType || '1',
        sequenceNumber: body.equipment.sequenceNumber,
      },
      cargo: {
        type: body.cargo?.type || 'GENERAL',
        weight: body.cargo?.weight || 0,
        dimensions: body.cargo?.dimensions || { length: 0, width: 0, height: 0 },
        value: body.cargo?.value || 0,
        sfdaRequired: body.cargo?.sfdaRequired,
        hazmatClass: body.cargo?.hazmatClass,
        hazmatUnNumber: body.cargo?.hazmatUnNumber,
      },
      route: {
        origin: {
          facilityId: body.route.origin.facilityId || '',
          city: body.route.origin.city,
          country: body.route.origin.country || 'SA',
          coordinates: body.route.origin.coordinates || { lat: 0, lng: 0 },
          facilityType: body.route.origin.facilityType || 'DOCK_WAREHOUSE',
        },
        destination: {
          facilityId: body.route.destination.facilityId || '',
          city: body.route.destination.city,
          country: body.route.destination.country || 'SA',
          coordinates: body.route.destination.coordinates || { lat: 0, lng: 0 },
          facilityType: body.route.destination.facilityType || 'DOCK_WAREHOUSE',
        },
        plannedDeparture: new Date(body.route.plannedDeparture || Date.now()),
        plannedArrival: new Date(
          body.route.plannedArrival || Date.now() + 24 * 60 * 60 * 1000
        ),
        intermediateFacilities: body.route.intermediateFacilities || [],
      },
      documents: {
        bayanEtd: body.documents?.bayanEtd
          ? {
              number: body.documents.bayanEtd.number,
              valid: body.documents.bayanEtd.valid ?? true,
              expiryDate: new Date(body.documents.bayanEtd.expiryDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: body.documents.bayanEtd.status || 'ACTIVE',
            }
          : undefined,
        customsManifest: body.documents?.customsManifest,
        permits: body.documents?.permits || [],
      },
      backloadInfo: body.backloadInfo
        ? {
            originalBayanNumber: body.backloadInfo.originalBayanNumber,
            arrivalCity: body.backloadInfo.arrivalCity,
            arrivalDate: new Date(body.backloadInfo.arrivalDate),
            arrivalLocation: body.backloadInfo.arrivalLocation,
          }
        : undefined,
    };

    // Run validation
    const result = await validationOrchestrator.validate(validationRequest);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[GCC Validation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    );
  }
}
