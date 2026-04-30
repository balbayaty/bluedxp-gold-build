/**
 * Generate Bayan QR Code API Route
 *
 * Generates QR codes for E-Waybill with embedded Bayan data
 */

import { NextRequest, NextResponse } from 'next/server';
import { bayanQRService } from '@/lib/services/gcc-compliance/bayanQrEmbedder';
import type { GCCCountry } from '@/types/gcc-compliance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      etwId,
      bayanNumber,
      tenantId,
      // Direct data for standalone generation
      shipmentData,
    } = body;

    // Option 1: Generate QR for existing ETW
    if (etwId && bayanNumber && tenantId) {
      const result = await bayanQRService.generateForETW(etwId, bayanNumber, tenantId);
      
      return NextResponse.json({
        success: true,
        data: {
          qrCodeBase64: result.qrCodeBase64,
          qrCodeSvg: result.qrCodeSvg,
          verificationUrl: result.verificationUrl,
          payload: result.payload,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Option 2: Generate QR from direct shipment data
    if (shipmentData) {
      const qrData = bayanQRService.createQRDataFromShipment({
        id: shipmentData.id,
        etwNumber: shipmentData.etwNumber,
        bayanNumber: shipmentData.bayanNumber,
        bayanStatus: shipmentData.bayanStatus || 'ACTIVE',
        origin: {
          city: shipmentData.origin?.city || '',
          country: (shipmentData.origin?.country || 'SA') as GCCCountry,
        },
        destination: {
          city: shipmentData.destination?.city || '',
          country: (shipmentData.destination?.country || 'SA') as GCCCountry,
        },
        carrier: {
          crNumber: shipmentData.carrier?.crNumber || '',
          name: shipmentData.carrier?.name || '',
        },
        vehicle: {
          plateNumber: shipmentData.vehicle?.plateNumber || '',
          plateType: shipmentData.vehicle?.plateType || '1',
          sequenceNumber: shipmentData.vehicle?.sequenceNumber || '',
        },
        driver: {
          name: shipmentData.driver?.name || '',
          idNumber: shipmentData.driver?.idNumber || '',
        },
        cargo: {
          description: shipmentData.cargo?.description || '',
          weight: shipmentData.cargo?.weight || 0,
          packages: shipmentData.cargo?.packages || 0,
        },
      });

      const result = await bayanQRService.generateBayanEtwQR(qrData);

      return NextResponse.json({
        success: true,
        data: {
          qrCodeBase64: result.qrCodeBase64,
          qrCodeSvg: result.qrCodeSvg,
          verificationUrl: result.verificationUrl,
          payload: result.payload,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Missing required fields. Provide either (etwId, bayanNumber, tenantId) or shipmentData' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Generate QR] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const etwId = searchParams.get('etwId');
    const bayanNumber = searchParams.get('bayanNumber');
    const tenantId = searchParams.get('tenantId');

    if (!etwId || !bayanNumber || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: etwId, bayanNumber, tenantId' },
        { status: 400 }
      );
    }

    const result = await bayanQRService.generateForETW(etwId, bayanNumber, tenantId);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeBase64: result.qrCodeBase64,
        verificationUrl: result.verificationUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Generate QR] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
