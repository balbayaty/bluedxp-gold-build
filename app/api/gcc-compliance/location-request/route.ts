/**
 * Location Request API Route
 *
 * TextLocate-style location request management
 * - POST: Send location request to driver
 * - GET: Check request status
 */

import { NextRequest, NextResponse } from 'next/server';
import { textLocateService } from '@/lib/services/gcc-compliance/textLocateService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      driverId,
      phoneNumber,
      channel = 'WHATSAPP',
      shipmentId,
      bayanNumber,
      customMessage,
      includePhoto = false,
      expiryMinutes = 30,
      language = 'en',
    } = body;

    if (!driverId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, phoneNumber' },
        { status: 400 }
      );
    }

    // Validate channel
    const validChannels = ['WHATSAPP', 'TELEGRAM', 'SMS'];
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await textLocateService.requestDriverLocation({
      driverId,
      phoneNumber,
      channel,
      shipmentId,
      bayanNumber,
      customMessage,
      includePhoto,
      expiryMinutes,
      language,
    });

    return NextResponse.json({
      success: result.status !== 'FAILED',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Location Request] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to send location request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');
    const shipmentId = searchParams.get('shipmentId');

    if (requestId) {
      const status = await textLocateService.getRequestStatus(requestId);
      
      if (!status) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    }

    if (shipmentId) {
      const requests = await textLocateService.getShipmentRequests(shipmentId);
      
      return NextResponse.json({
        success: true,
        data: requests,
        count: requests.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Please provide requestId or shipmentId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Location Request] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get request status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId parameter' },
        { status: 400 }
      );
    }

    const success = await textLocateService.cancelRequest(requestId);

    if (!success) {
      return NextResponse.json(
        { error: 'Request not found or already responded' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Location Request] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
