/**
 * TextLocate-Style Location Request Service
 *
 * Replicates TextLocate functionality for driver location requests:
 * - Send WhatsApp/Telegram message with "Provide Location" button
 * - Driver clicks link → opens webpage → captures GPS coordinates
 * - Coordinates sent back to system for verification
 *
 * @module gcc-compliance/textLocateService
 */

import type { LocationRequestResult, LocationSourceType } from '@/types/gcc-compliance';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, createEvent } from '@/lib/services/event-store';

// ============================================================================
// TYPES
// ============================================================================

export interface LocationRequestConfig {
  driverId: string;
  phoneNumber: string;
  channel: 'WHATSAPP' | 'TELEGRAM' | 'SMS';
  shipmentId?: string;
  bayanNumber?: string;
  customMessage?: string;
  includePhoto?: boolean;
  expiryMinutes?: number;
  language?: 'en' | 'ar';
}

export interface LocationCaptureResult {
  requestId: string;
  coordinates: { lat: number; lng: number };
  accuracy: number;
  timestamp: Date;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  captureMethod: 'GPS' | 'NETWORK' | 'IP_BASED';
  photoUrl?: string;
}

// ============================================================================
// IN-MEMORY STORAGE (Replace with Redis/Database in production)
// ============================================================================

const pendingRequests: Map<string, {
  config: LocationRequestConfig;
  sentAt: Date;
  expiresAt: Date;
  status: LocationRequestResult['status'];
  response?: LocationCaptureResult;
}> = new Map();

// ============================================================================
// TEXTLOCATE SERVICE
// ============================================================================

export class TextLocateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bluedxp.com';
  }

  /**
   * Send location request to driver (TextLocate-style)
   */
  async requestDriverLocation(config: LocationRequestConfig): Promise<LocationRequestResult> {
    const requestId = uuidv4();
    const expiryMinutes = config.expiryMinutes || 30;
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + expiryMinutes * 60 * 1000);

    // Generate tracking URL
    const trackingUrl = this.generateTrackingUrl(requestId, config);

    // Store pending request
    pendingRequests.set(requestId, {
      config,
      sentAt,
      expiresAt,
      status: 'SENT',
    });

    // Build message based on language
    const message = this.buildMessage(config, trackingUrl);

    // Send via appropriate channel
    try {
      switch (config.channel) {
        case 'WHATSAPP':
          await this.sendWhatsAppMessage(config.phoneNumber, message, trackingUrl, config.language);
          break;
        case 'TELEGRAM':
          await this.sendTelegramMessage(config.phoneNumber, message, trackingUrl);
          break;
        case 'SMS':
          await this.sendSmsMessage(config.phoneNumber, message);
          break;
      }

      // Update status
      const request = pendingRequests.get(requestId);
      if (request) {
        request.status = 'DELIVERED';
        pendingRequests.set(requestId, request);
      }

      // Emit event (non-blocking)
      try {
        await eventBus.publish(
          createEvent('location.request.sent', {
            requestId,
            driverId: config.driverId,
            shipmentId: config.shipmentId,
            channel: config.channel,
          })
        );
      } catch (error) {
        console.warn('[TextLocate] Event publish failed:', error);
      }

      return {
        requestId,
        sentAt,
        channel: config.channel,
        phoneNumber: config.phoneNumber,
        status: 'DELIVERED',
        trackingUrl,
        expiresAt,
      };
    } catch (error) {
      // Update status to failed
      const request = pendingRequests.get(requestId);
      if (request) {
        request.status = 'FAILED';
        pendingRequests.set(requestId, request);
      }

      return {
        requestId,
        sentAt,
        channel: config.channel,
        phoneNumber: config.phoneNumber,
        status: 'FAILED',
        trackingUrl,
        expiresAt,
      };
    }
  }

  /**
   * Process location response from driver
   */
  async processLocationResponse(
    requestId: string,
    coordinates: { lat: number; lng: number },
    accuracy: number,
    deviceInfo?: LocationCaptureResult['deviceInfo']
  ): Promise<{
    success: boolean;
    message: string;
    data?: LocationCaptureResult;
  }> {
    const request = pendingRequests.get(requestId);

    if (!request) {
      return { success: false, message: 'Request not found or expired' };
    }

    if (new Date() > request.expiresAt) {
      request.status = 'EXPIRED';
      pendingRequests.set(requestId, request);
      return { success: false, message: 'Location request has expired' };
    }

    // Create response
    const response: LocationCaptureResult = {
      requestId,
      coordinates,
      accuracy,
      timestamp: new Date(),
      deviceInfo,
      captureMethod: accuracy < 50 ? 'GPS' : accuracy < 500 ? 'NETWORK' : 'IP_BASED',
    };

    // Update request
    request.status = 'RESPONDED';
    request.response = response;
    pendingRequests.set(requestId, request);

    // Emit event (non-blocking)
    try {
      await eventBus.publish(
        createEvent('location.response.received', {
          requestId,
          driverId: request.config.driverId,
          shipmentId: request.config.shipmentId,
          coordinates,
          accuracy,
          captureMethod: response.captureMethod,
        })
      );
    } catch (error) {
      console.warn('[TextLocate] Event publish failed:', error);
    }

    return {
      success: true,
      message: 'Location captured successfully',
      data: response,
    };
  }

  /**
   * Get request status
   */
  async getRequestStatus(requestId: string): Promise<LocationRequestResult | null> {
    const request = pendingRequests.get(requestId);

    if (!request) {
      return null;
    }

    // Check expiry
    if (new Date() > request.expiresAt && request.status !== 'RESPONDED') {
      request.status = 'EXPIRED';
      pendingRequests.set(requestId, request);
    }

    return {
      requestId,
      sentAt: request.sentAt,
      channel: request.config.channel,
      phoneNumber: request.config.phoneNumber,
      status: request.status,
      trackingUrl: this.generateTrackingUrl(requestId, request.config),
      expiresAt: request.expiresAt,
      response: request.response
        ? {
            receivedAt: request.response.timestamp,
            coordinates: request.response.coordinates,
            accuracy: request.response.accuracy,
            deviceInfo: request.response.deviceInfo?.userAgent,
          }
        : undefined,
    };
  }

  /**
   * Get all pending requests for a shipment
   */
  async getShipmentRequests(shipmentId: string): Promise<LocationRequestResult[]> {
    const results: LocationRequestResult[] = [];

    for (const [requestId, request] of pendingRequests.entries()) {
      if (request.config.shipmentId === shipmentId) {
        const status = await this.getRequestStatus(requestId);
        if (status) {
          results.push(status);
        }
      }
    }

    return results.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  /**
   * Cancel a pending request
   */
  async cancelRequest(requestId: string): Promise<boolean> {
    const request = pendingRequests.get(requestId);

    if (!request || request.status === 'RESPONDED') {
      return false;
    }

    pendingRequests.delete(requestId);
    return true;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate tracking URL for location capture
   */
  private generateTrackingUrl(requestId: string, config: LocationRequestConfig): string {
    const params = new URLSearchParams({
      rid: requestId,
      lang: config.language || 'en',
    });

    if (config.includePhoto) {
      params.set('photo', '1');
    }

    return `${this.baseUrl}/api/location/capture?${params.toString()}`;
  }

  /**
   * Build message content
   */
  private buildMessage(config: LocationRequestConfig, trackingUrl: string): {
    text: string;
    buttonText: string;
  } {
    const isArabic = config.language === 'ar';

    if (config.customMessage) {
      return {
        text: config.customMessage,
        buttonText: isArabic ? '📍 تحديد الموقع' : '📍 Provide Location',
      };
    }

    const defaultMessages = {
      en: {
        text: `Please confirm your current location for shipment tracking.\n\nClick the button below when safe to do so.\n\n⚠️ This link expires in 30 minutes.`,
        buttonText: '📍 Provide Location',
      },
      ar: {
        text: `يرجى تأكيد موقعك الحالي لتتبع الشحنة.\n\nانقر على الزر أدناه عندما يكون ذلك آمناً.\n\n⚠️ تنتهي صلاحية هذا الرابط خلال 30 دقيقة.`,
        buttonText: '📍 تحديد الموقع',
      },
    };

    return defaultMessages[isArabic ? 'ar' : 'en'];
  }

  /**
   * Send WhatsApp message with interactive button
   */
  private async sendWhatsAppMessage(
    phoneNumber: string,
    message: { text: string; buttonText: string },
    trackingUrl: string,
    language?: 'en' | 'ar'
  ): Promise<void> {
    // In production, integrate with WhatsApp Business API
    // This is a placeholder that would call the actual WhatsApp service

    try {
      // Import WhatsApp service dynamically to avoid circular dependencies
      const { whatsappService } = await import('@/lib/services/whatsapp/whatsappService');

      await whatsappService.sendInteractiveMessage({
        to: phoneNumber,
        type: 'button',
        header: {
          type: 'text',
          text: language === 'ar' ? '🚛 طلب تحديد الموقع' : '🚛 Location Request',
        },
        body: {
          text: message.text,
        },
        footer: {
          text: 'BlueDXP Transport Intelligence',
        },
        action: {
          buttons: [
            {
              type: 'url',
              url: trackingUrl,
              title: message.buttonText,
            },
          ],
        },
      });
    } catch (error) {
      console.error('[TextLocate] WhatsApp send failed:', error);
      // Fallback to simple message
      throw error;
    }
  }

  /**
   * Send Telegram message with inline button
   */
  private async sendTelegramMessage(
    phoneNumber: string,
    message: { text: string; buttonText: string },
    trackingUrl: string
  ): Promise<void> {
    try {
      const { telegramService } = await import('@/lib/services/external-integrations/telegramService');

      await telegramService.sendMessageWithButton({
        chatId: phoneNumber, // In production, this would be the Telegram chat ID
        text: message.text,
        buttonText: message.buttonText,
        buttonUrl: trackingUrl,
      });
    } catch (error) {
      console.error('[TextLocate] Telegram send failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS message with link
   */
  private async sendSmsMessage(
    phoneNumber: string,
    message: { text: string; buttonText: string }
  ): Promise<void> {
    // In production, integrate with SMS gateway
    console.log(`[TextLocate] SMS to ${phoneNumber}: ${message.text}`);
    // Placeholder - would call actual SMS service
  }

  /**
   * Generate HTML page for location capture
   */
  generateLocationCapturePage(requestId: string, language: 'en' | 'ar' = 'en'): string {
    const isArabic = language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';

    const texts = {
      en: {
        title: 'Share Your Location',
        subtitle: 'BlueDXP Transport Intelligence',
        instruction: 'Click the button below to share your current location',
        button: 'Share Location',
        success: 'Location shared successfully!',
        error: 'Unable to get location. Please enable GPS.',
        loading: 'Getting your location...',
        accuracy: 'Accuracy',
        meters: 'meters',
      },
      ar: {
        title: 'مشاركة موقعك',
        subtitle: 'نظام النقل الذكي BlueDXP',
        instruction: 'انقر على الزر أدناه لمشاركة موقعك الحالي',
        button: 'مشاركة الموقع',
        success: 'تم مشاركة الموقع بنجاح!',
        error: 'تعذر الحصول على الموقع. يرجى تمكين GPS.',
        loading: 'جاري الحصول على موقعك...',
        accuracy: 'الدقة',
        meters: 'متر',
      },
    };

    const t = texts[language];

    return `
<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title} - BlueDXP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
      max-width: 400px;
    }
    .logo {
      font-size: 3em;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 1.8em;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #00d4aa, #00a8cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #8892a0;
      margin-bottom: 30px;
    }
    .instruction {
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .btn {
      background: linear-gradient(135deg, #00d4aa, #00a8cc);
      border: none;
      padding: 16px 40px;
      border-radius: 12px;
      color: #fff;
      font-size: 1.1em;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,212,170,0.3);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .status {
      margin-top: 30px;
      padding: 20px;
      border-radius: 12px;
      display: none;
    }
    .status.success {
      background: rgba(0,212,170,0.2);
      border: 1px solid #00d4aa;
      display: block;
    }
    .status.error {
      background: rgba(231,76,60,0.2);
      border: 1px solid #e74c3c;
      display: block;
    }
    .status.loading {
      background: rgba(243,156,18,0.2);
      border: 1px solid #f39c12;
      display: block;
    }
    .accuracy-info {
      margin-top: 15px;
      font-size: 0.9em;
      color: #8892a0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📍</div>
    <h1>${t.title}</h1>
    <p class="subtitle">${t.subtitle}</p>
    <p class="instruction">${t.instruction}</p>
    
    <button class="btn" id="shareBtn" onclick="shareLocation()">
      <span>📍</span> ${t.button}
    </button>
    
    <div class="status" id="status"></div>
  </div>

  <script>
    const requestId = '${requestId}';
    const apiUrl = '${this.baseUrl}/api/location/capture';
    
    async function shareLocation() {
      const btn = document.getElementById('shareBtn');
      const status = document.getElementById('status');
      
      btn.disabled = true;
      status.className = 'status loading';
      status.style.display = 'block';
      status.textContent = '${t.loading}';
      
      if (!navigator.geolocation) {
        status.className = 'status error';
        status.textContent = '${t.error}';
        btn.disabled = false;
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId,
                lat: latitude,
                lng: longitude,
                accuracy,
                deviceInfo: {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform,
                  language: navigator.language,
                },
              }),
            });
            
            if (response.ok) {
              status.className = 'status success';
              status.innerHTML = \`
                <div>✅ ${t.success}</div>
                <div class="accuracy-info">${t.accuracy}: \${Math.round(accuracy)} ${t.meters}</div>
              \`;
            } else {
              throw new Error('Server error');
            }
          } catch (error) {
            status.className = 'status error';
            status.textContent = '${t.error}';
            btn.disabled = false;
          }
        },
        (error) => {
          status.className = 'status error';
          status.textContent = '${t.error}';
          btn.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    }
  </script>
</body>
</html>
    `.trim();
  }
}

// Export singleton
export const textLocateService = new TextLocateService();
