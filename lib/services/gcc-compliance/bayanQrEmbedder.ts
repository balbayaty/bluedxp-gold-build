/**
 * Bayan QR Code Embedder for E-Waybill
 *
 * Integrates Bayan information into QR codes on E-Waybill documents
 * for checkpoint verification by authorities.
 *
 * ARCHITECTURE:
 * - Uses existing QR infrastructure (documentQRService, etwQRVerificationService)
 * - Extends QR capabilities for Bayan-specific data
 * - Integrates with Event Bus for audit trail
 *
 * @module gcc-compliance/bayanQrEmbedder
 */

import type { BayanQRData, BayanQRVerificationResult, GCCCountry } from '@/types/gcc-compliance';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, createEvent } from '@/lib/services/event-store';
import * as crypto from 'crypto';
import QRCode from 'qrcode';

// ============================================================================
// QR CODE SERVICE
// ============================================================================

export class BayanQRService {
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bluedxp.com';
    
    // SECURITY: Require secret key from environment variable
    // Never hardcode secrets in source code
    this.secretKey = process.env.BAYAN_QR_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error(
        'BAYAN_QR_SECRET_KEY environment variable is required. Set it in your .env.local file.',
      );
    }
  }

  /**
   * Generate QR code with embedded Bayan + E-Waybill data
   */
  async generateBayanEtwQR(data: BayanQRData): Promise<{
    qrCodeBase64: string;
    qrCodeUrl: string;
    verificationUrl: string;
    payload: string;
    qrCodeSvg: string;
  }> {
    // Create verification URL
    const verificationUrl = `${this.baseUrl}/api/gcc-compliance/verify-bayan/${data.etwId}`;

    // Create compact payload for QR code
    const payload = this.createCompactPayload(data, verificationUrl);

    // Generate digital signature
    const signature = this.createDigitalSignature(payload);

    // Full payload with signature
    const fullPayload = JSON.stringify({
      ...JSON.parse(payload),
      sig: signature,
    });

    // Generate QR code using qrcode library
    const qrCodeBase64 = await this.generateQRCodeImage(fullPayload, 'base64');
    const qrCodeSvg = await this.generateQRCodeImage(fullPayload, 'svg');
    const qrCodeUrl = `${this.baseUrl}/api/gcc-compliance/qr-image/${data.etwId}`;

    // Emit event for audit trail
    try {
      await eventBus.publish(
        createEvent('bayan.qr.generated', {
          etwId: data.etwId,
          bayanNumber: data.bayanNumber,
          verificationUrl,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn('[BayanQR] Event bus publish failed:', error);
    }

    return {
      qrCodeBase64,
      qrCodeUrl,
      verificationUrl,
      payload: fullPayload,
      qrCodeSvg,
    };
  }

  /**
   * Verify QR code (for checkpoint authorities)
   */
  async verifyBayanEtwQR(qrPayload: string): Promise<BayanQRVerificationResult> {
    try {
      const payload = JSON.parse(qrPayload);

      // Verify signature
      const { sig, ...dataWithoutSig } = payload;
      const expectedSig = this.createDigitalSignature(JSON.stringify(dataWithoutSig));

      if (sig !== expectedSig) {
        return {
          valid: false,
          errors: ['Invalid signature - document may have been tampered with'],
          verifiedAt: new Date(),
        };
      }

      // Check expiry
      if (payload.exp && payload.exp < Date.now()) {
        return {
          valid: false,
          errors: ['E-Waybill has expired'],
          verifiedAt: new Date(),
        };
      }

      // Expand payload to full data
      const data = this.expandPayload(payload);

      // Get real-time status (optional - may fail if offline)
      let realTimeStatus;
      try {
        realTimeStatus = await this.getRealTimeStatus(payload.b, payload.s);
      } catch {
        // Offline verification still valid
      }

      // Emit verification event
      try {
        await eventBus.publish(
          createEvent('bayan.qr.verified', {
            etwId: payload.e,
            bayanNumber: payload.b,
            valid: true,
            verifiedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.warn('[BayanQR] Event bus publish failed:', error);
      }

      return {
        valid: true,
        data,
        realTimeStatus,
        verifiedAt: new Date(),
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid QR code format'],
        verifiedAt: new Date(),
      };
    }
  }

  /**
   * Generate QR code for display on E-Waybill PDF
   */
  async generateForPDF(data: BayanQRData): Promise<{
    svgString: string;
    pngBase64: string;
    size: number;
  }> {
    const { qrCodeBase64, qrCodeSvg } = await this.generateBayanEtwQR(data);

    return {
      svgString: qrCodeSvg,
      pngBase64: qrCodeBase64,
      size: 200, // 200x200 pixels
    };
  }

  /**
   * Create QR data for a shipment
   */
  createQRDataFromShipment(shipment: {
    id: string;
    etwNumber: string;
    bayanNumber: string;
    bayanStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    origin: { city: string; country: GCCCountry };
    destination: { city: string; country: GCCCountry };
    carrier: { crNumber: string; name: string };
    vehicle: { plateNumber: string; plateType: string; sequenceNumber: string };
    driver: { name: string; idNumber: string };
    cargo: { description: string; weight: number; packages: number };
  }): BayanQRData {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      etwId: shipment.id,
      etwNumber: shipment.etwNumber,
      bayanNumber: shipment.bayanNumber,
      bayanStatus: shipment.bayanStatus,
      bayanCreatedDate: now,
      origin: shipment.origin,
      destination: shipment.destination,
      carrierCR: shipment.carrier.crNumber,
      carrierName: shipment.carrier.name,
      plateNumber: shipment.vehicle.plateNumber,
      plateType: shipment.vehicle.plateType,
      sequenceNumber: shipment.vehicle.sequenceNumber,
      driverName: shipment.driver.name,
      driverIdNumber: shipment.driver.idNumber,
      cargoDescription: shipment.cargo.description,
      totalWeight: shipment.cargo.weight,
      numberOfPackages: shipment.cargo.packages,
      verificationUrl: `${this.baseUrl}/api/gcc-compliance/verify-bayan/${shipment.id}`,
      digitalSignature: '', // Will be set during generation
      issuedAt: now,
      validUntil,
    };
  }

  /**
   * Generate QR code for an existing ETW with Bayan data
   * Integrates with existing ETW QR verification service
   */
  async generateForETW(etwId: string, bayanNumber: string, tenantId: string): Promise<{
    qrCodeBase64: string;
    qrCodeSvg: string;
    verificationUrl: string;
    payload: string;
  }> {
    // Import ETW service dynamically to avoid circular dependencies
    const { etwService } = await import('@/lib/services/etw/etwService');
    
    try {
      const etw = await etwService.get(etwId, tenantId);
      
      if (!etw) {
        throw new Error(`ETW not found: ${etwId}`);
      }

      // Create Bayan QR data from ETW
      const qrData = this.createQRDataFromShipment({
        id: etw.id,
        etwNumber: etw.etwNumber,
        bayanNumber: bayanNumber,
        bayanStatus: 'ACTIVE',
        origin: {
          city: etw.route?.origin?.city || 'Unknown',
          country: (etw.route?.origin?.country || 'SA') as GCCCountry,
        },
        destination: {
          city: etw.route?.destination?.city || 'Unknown',
          country: (etw.route?.destination?.country || 'SA') as GCCCountry,
        },
        carrier: {
          crNumber: etw.parties?.carrier?.registrationNumber || '',
          name: etw.parties?.carrier?.name || '',
        },
        vehicle: {
          plateNumber: etw.cargo?.transport?.vehiclePlate || '',
          plateType: '1',
          sequenceNumber: etw.cargo?.transport?.trackingNumber || '',
        },
        driver: {
          name: etw.parties?.driver?.name || '',
          idNumber: etw.parties?.driver?.idNumber || '',
        },
        cargo: {
          description: etw.cargo?.description || '',
          weight: etw.cargo?.grossWeight || 0,
          packages: etw.cargo?.packages || 0,
        },
      });

      return await this.generateBayanEtwQR(qrData);
    } catch (error) {
      console.error('[BayanQR] ETW integration failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Create compact payload for QR code (minimize size for better scanning)
   */
  private createCompactPayload(data: BayanQRData, verificationUrl: string): string {
    return JSON.stringify({
      t: 'BAYAN_ETW', // type
      e: data.etwNumber, // etw number
      b: data.bayanNumber, // bayan number
      s: data.sequenceNumber, // sequence number for Daleel
      c: data.carrierCR, // carrier CR
      p: data.plateNumber, // plate number
      pt: data.plateType, // plate type
      o: `${data.origin.city},${data.origin.country}`, // origin
      d: `${data.destination.city},${data.destination.country}`, // destination
      w: data.totalWeight, // weight
      n: data.numberOfPackages, // packages
      dr: data.driverIdNumber, // driver ID
      v: verificationUrl, // verification URL
      exp: data.validUntil.getTime(), // expiry timestamp
      iat: data.issuedAt.getTime(), // issued at
    });
  }

  /**
   * Expand compact payload to full BayanQRData
   */
  private expandPayload(payload: Record<string, unknown>): BayanQRData {
    const origin = String(payload.o || '').split(',');
    const dest = String(payload.d || '').split(',');
    const originCity = origin[0] || '';
    const originCountry = origin[1] || 'SA';
    const destCity = dest[0] || '';
    const destCountry = dest[1] || 'SA';

    return {
      etwId: String(payload.e || ''),
      etwNumber: String(payload.e || ''),
      bayanNumber: String(payload.b || ''),
      bayanStatus: 'ACTIVE',
      bayanCreatedDate: new Date(Number(payload.iat) || Date.now()),
      origin: { city: originCity, country: originCountry as GCCCountry },
      destination: { city: destCity, country: destCountry as GCCCountry },
      carrierCR: String(payload.c || ''),
      carrierName: '',
      plateNumber: String(payload.p || ''),
      plateType: String(payload.pt || ''),
      sequenceNumber: String(payload.s || ''),
      driverName: '',
      driverIdNumber: String(payload.dr || ''),
      cargoDescription: '',
      totalWeight: Number(payload.w) || 0,
      numberOfPackages: Number(payload.n) || 0,
      verificationUrl: String(payload.v || ''),
      digitalSignature: String(payload.sig || ''),
      issuedAt: new Date(Number(payload.iat) || Date.now()),
      validUntil: new Date(Number(payload.exp) || Date.now()),
    };
  }

  /**
   * Create digital signature for tamper-proof verification
   */
  private createDigitalSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('base64')
      .substring(0, 16); // Truncate for QR size optimization
  }

  /**
   * Get real-time status from Bayan and Daleel
   */
  private async getRealTimeStatus(
    bayanNumber: string,
    sequenceNumber: string
  ): Promise<BayanQRVerificationResult['realTimeStatus']> {
    try {
      // Import services dynamically
      const { bayanService } = await import('@/lib/services/bayan/bayanService');
      const { daleelLocationService } = await import('@/lib/services/daleel/daleelLocationService');

      // Check Bayan status
      const bayanStatus = await bayanService.getTripStatus(bayanNumber);

      // Get location from Daleel
      let vehicleLocation;
      let lastLocationTime;
      try {
        const location = await daleelLocationService.getLocationBySequence(sequenceNumber);
        if (location) {
          vehicleLocation = { lat: location.latitude, lng: location.longitude };
          lastLocationTime = new Date(location.locationTime);
        }
      } catch {
        // Location not available
      }

      return {
        bayanActive: bayanStatus?.status === 'ACTIVE',
        vehicleLocation,
        lastLocationTime,
        currentStatus: bayanStatus?.status,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Generate QR code image using qrcode library
   */
  private async generateQRCodeImage(data: string, format: 'base64' | 'svg'): Promise<string> {
    try {
      if (format === 'svg') {
        return await QRCode.toString(data, {
          type: 'svg',
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 200,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      } else {
        return await QRCode.toDataURL(data, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 400,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      }
    } catch (error) {
      console.error('[BayanQR] QR generation failed:', error);
      throw error;
    }
  }
}

// Export singleton
export const bayanQRService = new BayanQRService();
