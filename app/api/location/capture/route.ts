/**
 * Location Capture API Route
 *
 * Handles TextLocate-style location capture from drivers
 * - GET: Returns HTML page for location capture
 * - POST: Receives location coordinates from driver
 */

import { NextRequest, NextResponse } from 'next/server';
import { textLocateService } from '@/lib/services/gcc-compliance/textLocateService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('rid');
    const language = (searchParams.get('lang') || 'en') as 'en' | 'ar';

    if (!requestId) {
      return new NextResponse(
        '<h1>Invalid Request</h1><p>Missing request ID</p>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Check if request is valid and not expired
    const status = await textLocateService.getRequestStatus(requestId);
    
    if (!status) {
      return new NextResponse(
        generateErrorPage('Request not found or expired', language),
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (status.status === 'EXPIRED') {
      return new NextResponse(
        generateErrorPage('This location request has expired', language),
        { status: 410, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (status.status === 'RESPONDED') {
      return new NextResponse(
        generateSuccessPage('Location already submitted', language),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Generate and return location capture page
    const html = textLocateService.generateLocationCapturePage(requestId, language);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Location Capture] GET Error:', error);
    return new NextResponse(
      '<h1>Error</h1><p>An error occurred</p>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, lat, lng, accuracy, deviceInfo } = body;

    if (!requestId || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, lat, lng' },
        { status: 400 }
      );
    }

    // Process the location response
    const result = await textLocateService.processLocationResponse(
      requestId,
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      accuracy || 0,
      deviceInfo
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location captured successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Location Capture] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process location', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateErrorPage(message: string, language: 'en' | 'ar'): string {
  const isArabic = language === 'ar';
  return `
<!DOCTYPE html>
<html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isArabic ? 'خطأ' : 'Error'} - BlueDXP</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0a1628, #1a2942);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 400px; }
    .icon { font-size: 4em; margin-bottom: 20px; }
    h1 { color: #e74c3c; margin-bottom: 15px; }
    p { color: #8892a0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>${isArabic ? 'خطأ' : 'Error'}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `.trim();
}

function generateSuccessPage(message: string, language: 'en' | 'ar'): string {
  const isArabic = language === 'ar';
  return `
<!DOCTYPE html>
<html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isArabic ? 'نجاح' : 'Success'} - BlueDXP</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0a1628, #1a2942);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 400px; }
    .icon { font-size: 4em; margin-bottom: 20px; }
    h1 { color: #00d4aa; margin-bottom: 15px; }
    p { color: #8892a0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>${isArabic ? 'تم بنجاح' : 'Success'}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `.trim();
}
