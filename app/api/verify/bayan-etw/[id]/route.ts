/**
 * Bayan E-Waybill Verification API Route
 *
 * Allows checkpoint authorities to verify Bayan + E-Waybill QR codes.
 * - GET: Verify by E-Waybill ID (from QR code)
 * - POST: Verify QR payload directly
 *
 * @route /api/verify/bayan-etw/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { bayanQRService } from '@/lib/services/gcc-compliance';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET - Verify E-Waybill by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const etwId = params.id;

    if (!etwId) {
      return NextResponse.json(
        { valid: false, errors: ['Missing E-Waybill ID'] },
        { status: 400 }
      );
    }

    // In production, this would look up the E-Waybill from the database
    // and verify its current status along with real-time Bayan/Daleel data
    
    // For now, return a placeholder verification
    // The actual implementation would integrate with:
    // - ETW service to get E-Waybill details
    // - Bayan service to verify Bayan status
    // - Daleel service to get real-time location

    return NextResponse.json({
      valid: true,
      message: 'E-Waybill verification endpoint',
      etwId,
      verifiedAt: new Date().toISOString(),
      note: 'Full verification requires database lookup - implement with ETW/Bayan/Daleel services',
    });
  } catch (error) {
    console.error('[Bayan Verification] Error:', error);
    return NextResponse.json(
      { valid: false, errors: ['Verification failed'] },
      { status: 500 }
    );
  }
}

/**
 * POST - Verify QR payload directly
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json();
    const { qrPayload } = body;

    if (!qrPayload) {
      return NextResponse.json(
        { valid: false, errors: ['Missing QR payload'] },
        { status: 400 }
      );
    }

    // Verify the QR payload
    const result = await bayanQRService.verifyBayanEtwQR(qrPayload);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Bayan Verification] Error:', error);
    return NextResponse.json(
      { valid: false, errors: ['Verification failed'] },
      { status: 500 }
    );
  }
}
