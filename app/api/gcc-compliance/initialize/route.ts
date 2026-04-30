/**
 * GCC Compliance Module Initialization API
 * 
 * POST /api/gcc-compliance/initialize
 * 
 * Initializes the GCC Compliance module and starts event subscriptions.
 * Should be called once during application startup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeGCCCompliance, isGCCComplianceInitialized } from '@/lib/services/gcc-compliance';

export async function POST(request: NextRequest) {
  try {
    // Check if already initialized
    if (isGCCComplianceInitialized) {
      return NextResponse.json({
        success: true,
        message: 'GCC Compliance module already initialized',
        alreadyInitialized: true,
      });
    }

    // Initialize the module
    await initializeGCCCompliance();

    return NextResponse.json({
      success: true,
      message: 'GCC Compliance module initialized successfully',
      alreadyInitialized: false,
      features: [
        'Pre-dispatch validation (8 steps)',
        'Backload validation (TGA Oct 2024)',
        'Truck ban monitoring',
        'Daleeli tracking & billing',
        'Bayan QR embedding',
        'TextLocate location requests',
        'Multi-source location fusion',
        'Industry standards compliance',
      ],
    });
  } catch (error) {
    console.error('[GCC Compliance API] Initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize GCC Compliance module',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    initialized: isGCCComplianceInitialized,
    module: 'GCC Compliance Intelligence Framework',
    version: '1.0.0',
    description: 'Saudi Arabia and GCC transport compliance validation, tracking, and monitoring',
    endpoints: {
      validate: '/api/gcc-compliance/validate',
      truckBan: '/api/gcc-compliance/truck-ban',
      backload: '/api/gcc-compliance/backload',
      touchpoints: '/api/gcc-compliance/touchpoints',
      equipmentMatrix: '/api/gcc-compliance/equipment-matrix',
      locationRequest: '/api/gcc-compliance/location-request',
      generateQr: '/api/gcc-compliance/generate-qr',
      verifyBayan: '/api/gcc-compliance/verify-bayan/[etwId]',
      dashboard: '/api/gcc-compliance/dashboard',
    },
  });
}
