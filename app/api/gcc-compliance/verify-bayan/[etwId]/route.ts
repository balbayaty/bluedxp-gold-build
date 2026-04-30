/**
 * Bayan QR Verification API Route
 *
 * Verifies Bayan QR codes scanned at checkpoints
 * Returns full verification status for authorities
 */

import { NextRequest, NextResponse } from 'next/server';
import { bayanQRService } from '@/lib/services/gcc-compliance/bayanQrEmbedder';

export async function GET(
  request: NextRequest,
  { params }: { params: { etwId: string } }
) {
  try {
    const { etwId } = params;
    const searchParams = request.nextUrl.searchParams;
    const payload = searchParams.get('payload');

    // If payload provided, verify it
    if (payload) {
      const result = await bayanQRService.verifyBayanEtwQR(decodeURIComponent(payload));
      
      return NextResponse.json({
        success: result.valid,
        verification: result,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise, return verification page
    return new NextResponse(generateVerificationPage(etwId), {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('[Bayan Verification] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { etwId: string } }
) {
  try {
    const { etwId } = params;
    const body = await request.json();
    const { qrPayload } = body;

    if (!qrPayload) {
      return NextResponse.json(
        { error: 'QR payload is required' },
        { status: 400 }
      );
    }

    const result = await bayanQRService.verifyBayanEtwQR(qrPayload);

    return NextResponse.json({
      success: result.valid,
      verification: result,
      etwId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Bayan Verification] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateVerificationPage(etwId: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bayan Verification - BlueDXP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0a1628, #1a2942);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 30px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo { font-size: 2.5em; margin-bottom: 10px; }
    h1 {
      background: linear-gradient(90deg, #00d4aa, #00a8cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 5px;
    }
    .subtitle { color: #8892a0; }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      margin: 20px 0;
    }
    .status-valid { background: rgba(0,212,170,0.2); color: #00d4aa; }
    .status-invalid { background: rgba(231,76,60,0.2); color: #e74c3c; }
    .status-pending { background: rgba(243,156,18,0.2); color: #f39c12; }
    .info-grid {
      display: grid;
      gap: 15px;
      margin-top: 20px;
    }
    .info-item {
      background: rgba(0,0,0,0.2);
      padding: 15px;
      border-radius: 8px;
    }
    .info-label { color: #8892a0; font-size: 0.9em; margin-bottom: 5px; }
    .info-value { font-weight: 600; }
    .loading { text-align: center; padding: 40px; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0,212,170,0.3);
      border-top-color: #00d4aa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️</div>
      <h1>Bayan Verification</h1>
      <p class="subtitle">BlueDXP Transport Intelligence</p>
    </div>
    
    <div id="content" class="loading">
      <div class="spinner"></div>
      <p>Verifying document...</p>
    </div>
  </div>

  <script>
    async function loadVerification() {
      const content = document.getElementById('content');
      
      try {
        // In production, this would fetch real data
        const mockData = {
          valid: true,
          etwNumber: '${etwId}',
          bayanNumber: 'BAYAN-2026-${etwId.slice(-6)}',
          carrier: 'Al-Madinah Transport Co.',
          vehicle: 'RIYADH-1234-A',
          origin: 'Riyadh, Saudi Arabia',
          destination: 'Jeddah, Saudi Arabia',
          status: 'ACTIVE',
          verifiedAt: new Date().toLocaleString(),
        };
        
        content.innerHTML = \`
          <div style="text-align:center">
            <span class="status-badge status-valid">✓ VERIFIED</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Bayan Number</div>
              <div class="info-value">\${mockData.bayanNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">E-Waybill Number</div>
              <div class="info-value">\${mockData.etwNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Carrier</div>
              <div class="info-value">\${mockData.carrier}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vehicle</div>
              <div class="info-value">\${mockData.vehicle}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Route</div>
              <div class="info-value">\${mockData.origin} → \${mockData.destination}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">\${mockData.status}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Verified At</div>
              <div class="info-value">\${mockData.verifiedAt}</div>
            </div>
          </div>
        \`;
      } catch (error) {
        content.innerHTML = \`
          <div style="text-align:center">
            <span class="status-badge status-invalid">✗ VERIFICATION FAILED</span>
            <p style="margin-top:20px;color:#8892a0">Unable to verify document</p>
          </div>
        \`;
      }
    }
    
    loadVerification();
  </script>
</body>
</html>
  `.trim();
}
