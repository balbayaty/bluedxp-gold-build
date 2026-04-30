/**
 * Equipment-Facility Matrix API Route
 *
 * Get equipment-facility compatibility information.
 *
 * @route GET /api/gcc-compliance/equipment-matrix
 * @route POST /api/gcc-compliance/equipment-matrix
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  equipmentFacilityMatcher,
  EQUIPMENT_FACILITY_MATRIX,
  EQUIPMENT_LABELS,
  FACILITY_LABELS,
} from '@/lib/services/gcc-compliance';
import type { EquipmentType, FacilityCapabilityType } from '@/types/gcc-compliance';

/**
 * GET - Get the full equipment-facility matrix
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipment = searchParams.get('equipment') as EquipmentType;
    const facility = searchParams.get('facility') as FacilityCapabilityType;

    // If specific equipment requested, get compatible facilities
    if (equipment && !facility) {
      const compatibleFacilities = equipmentFacilityMatcher.getCompatibleFacilities(equipment);
      return NextResponse.json({
        success: true,
        data: {
          equipment,
          equipmentLabel: EQUIPMENT_LABELS[equipment],
          compatibleFacilities: compatibleFacilities.map((f) => ({
            type: f,
            label: FACILITY_LABELS[f],
          })),
        },
      });
    }

    // If specific facility requested, get compatible equipment
    if (facility && !equipment) {
      const compatibleEquipment = equipmentFacilityMatcher.getCompatibleEquipment(facility);
      return NextResponse.json({
        success: true,
        data: {
          facility,
          facilityLabel: FACILITY_LABELS[facility],
          compatibleEquipment: compatibleEquipment.map((e) => ({
            type: e,
            label: EQUIPMENT_LABELS[e],
          })),
        },
      });
    }

    // If both specified, check specific compatibility
    if (equipment && facility) {
      const result = equipmentFacilityMatcher.checkSingleFacility(equipment, facility);
      return NextResponse.json({
        success: true,
        data: {
          equipment,
          facility,
          equipmentLabel: EQUIPMENT_LABELS[equipment],
          facilityLabel: FACILITY_LABELS[facility],
          ...result,
        },
      });
    }

    // Return full matrix
    const fullMatrix = equipmentFacilityMatcher.getFullMatrix();
    return NextResponse.json({
      success: true,
      data: {
        matrix: EQUIPMENT_FACILITY_MATRIX,
        labels: {
          equipment: EQUIPMENT_LABELS,
          facilities: FACILITY_LABELS,
        },
        structured: fullMatrix,
      },
    });
  } catch (error) {
    console.error('[Equipment Matrix] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get equipment matrix',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Validate equipment for a journey
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.equipmentType || !body.facilities) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: equipmentType, facilities',
        },
        { status: 400 }
      );
    }

    const result = equipmentFacilityMatcher.validateEquipmentForJourney({
      equipmentType: body.equipmentType,
      facilities: body.facilities,
      cargo: body.cargo,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Equipment Matrix] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Equipment validation failed',
      },
      { status: 500 }
    );
  }
}
