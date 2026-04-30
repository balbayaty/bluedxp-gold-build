/**
 * Truck Ban Check API Route
 *
 * Check truck ban restrictions for a city at a given time.
 *
 * @route GET /api/gcc-compliance/truck-ban?city=Riyadh&country=SA&arrival=2026-01-08T14:00:00
 * @route POST /api/gcc-compliance/truck-ban
 */

import { NextRequest, NextResponse } from 'next/server';
import { regulationDatabase, TRUCK_BAN_SCHEDULES } from '@/lib/services/gcc-compliance';
import type { GCCCountry, EquipmentType } from '@/types/gcc-compliance';

/**
 * GET - Check truck ban for a specific city and time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country') as GCCCountry;
    const arrival = searchParams.get('arrival');
    const vehicleType = searchParams.get('vehicleType') as EquipmentType;
    const hasEAppointment = searchParams.get('hasEAppointment') === 'true';
    const isIndustrialZone = searchParams.get('isIndustrialZone') === 'true';

    // If no city specified, return all schedules
    if (!city) {
      return NextResponse.json({
        success: true,
        data: {
          schedules: TRUCK_BAN_SCHEDULES,
          total: TRUCK_BAN_SCHEDULES.length,
        },
      });
    }

    // Check truck ban
    const result = regulationDatabase.checkTruckBan({
      city,
      country: country || 'SA',
      plannedArrival: arrival ? new Date(arrival) : new Date(),
      vehicleType: vehicleType || 'FLATBED',
      hasEAppointment,
      isIndustrialZone,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Truck Ban Check] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Truck ban check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Check truck ban with full request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.city) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: city',
        },
        { status: 400 }
      );
    }

    const result = regulationDatabase.checkTruckBan({
      city: body.city,
      country: body.country || 'SA',
      plannedArrival: body.plannedArrival ? new Date(body.plannedArrival) : new Date(),
      vehicleType: body.vehicleType || 'FLATBED',
      hasEAppointment: body.hasEAppointment || false,
      isIndustrialZone: body.isIndustrialZone || false,
      permitNumber: body.permitNumber,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Truck Ban Check] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Truck ban check failed',
      },
      { status: 500 }
    );
  }
}
