/**
 * Backload Compliance Validation API Route
 *
 * Validates backload compliance under TGA October 2024 rules.
 *
 * @route POST /api/gcc-compliance/backload
 */

import { NextRequest, NextResponse } from 'next/server';
import { backloadValidator } from '@/lib/services/gcc-compliance';
import type { GCCCountry } from '@/types/gcc-compliance';

/**
 * POST - Validate backload compliance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.carrierNationality || !body.originalTrip || !body.proposedBackload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: carrierNationality, originalTrip, proposedBackload',
        },
        { status: 400 }
      );
    }

    // Quick check endpoint
    if (body.quickCheck) {
      const result = backloadValidator.quickCheck(
        body.originalTrip.arrivalLocation,
        body.proposedBackload.pickupLocation,
        body.carrierNationality as GCCCountry | 'OTHER'
      );

      return NextResponse.json({
        success: true,
        data: {
          quickCheck: true,
          ...result,
        },
      });
    }

    // Full validation
    const result = await backloadValidator.validateBackload({
      carrierId: body.carrierId || '',
      carrierNationality: body.carrierNationality as GCCCountry | 'OTHER',
      plateNumber: body.plateNumber || '',
      plateType: body.plateType || '1',
      originalTrip: {
        bayanNumber: body.originalTrip.bayanNumber,
        arrivalCity: body.originalTrip.arrivalCity,
        arrivalLocation: body.originalTrip.arrivalLocation,
        arrivalDate: new Date(body.originalTrip.arrivalDate),
      },
      proposedBackload: {
        pickupLocation: body.proposedBackload.pickupLocation,
        pickupCity: body.proposedBackload.pickupCity,
        destinationCity: body.proposedBackload.destinationCity,
        destinationCountry: body.proposedBackload.destinationCountry as GCCCountry,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Backload Validation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Backload validation failed',
      },
      { status: 500 }
    );
  }
}
