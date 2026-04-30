# IoT, Telegram & WhatsApp Integration Guide

This guide explains how to set up and test the three external integrations for real-time driver communication and GPS tracking.

---

## Table of Contents

1. [Telegram Bot Integration](#1-telegram-bot-integration)
2. [WhatsApp Business API](#2-whatsapp-business-api)
3. [IoT GPS Platforms (Navixy, Wialon, Flespi)](#3-iot-gps-platforms)
4. [Testing Without Credentials](#4-testing-without-credentials)

---

## 1. Telegram Bot Integration

### ✅ Already Fully Integrated

The Telegram service is **already implemented** at `lib/services/external-integrations/telegramService.ts`. You just need to add your bot token.

### Step 1: Create a Telegram Bot (FREE - 2 minutes)

1. Open Telegram app (mobile or desktop)
2. Search for **@BotFather** (the official bot for creating bots)
3. Start a chat and send: `/newbot`
4. Follow the prompts:
   - Enter a **name** for your bot (e.g., "Hazalyze Tracking Bot")
   - Enter a **username** ending in `bot` (e.g., `hazalyze_tracking_bot`)
5. **BotFather will give you an API token** like:
   ```
   7123456789:AAFoxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. **Save this token!** This is your `TELEGRAM_BOT_TOKEN`

### Step 2: Add to Environment Variables

Add to your `.env.local`:

```env
# Telegram Bot API
TELEGRAM_BOT_TOKEN=7123456789:AAFoxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhooks/telegram
```

### Step 3: Get Your Chat ID (for testing)

1. Start a chat with your new bot
2. Send any message to it
3. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find `"chat": {"id": 123456789}` - this is your chat ID

### Step 4: Test It!

```typescript
import { telegramService } from '@/lib/services/external-integrations/telegramService';

// Send a message
await telegramService.sendMessage(
  process.env.TELEGRAM_BOT_TOKEN!,
  'YOUR_CHAT_ID',
  '📍 Location request: Please share your current location',
  { parseMode: 'HTML' }
);
```

### How It's Used in the App

The GCC Compliance module uses Telegram via `textLocateService`:

```typescript
// lib/services/gcc-compliance/textLocateService.ts
// Sends location request to driver via Telegram
await this.sendLocationRequest({
  shipmentId: 'SHP-001',
  driverPhone: '+966501234567',
  driverName: 'Ahmed',
  channel: 'TELEGRAM',
  chatId: '123456789', // Telegram chat ID
});
```

---

## 2. WhatsApp Business API

### Option A: Meta's Cloud API (Recommended for Testing)

Meta offers a **free test environment** with 1,000 free messages/month.

#### Step 1: Create Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create an account or log in with Facebook
3. Create a new App → Select "Business" type

#### Step 2: Set Up WhatsApp

1. In your app, click **Add Product** → **WhatsApp**
2. Click **Get Started**
3. You'll get a **test phone number** and **temporary access token**

#### Step 3: Get Permanent Token

1. Go to **App Settings** → **Basic**
2. Note your **App ID** and **App Secret**
3. Go to **WhatsApp** → **Configuration**
4. Note your **Phone Number ID** and **WhatsApp Business Account ID**

#### Step 4: Environment Variables

```env
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_PROVIDER=WHATSAPP_BUSINESS
WHATSAPP_API_KEY=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
WHATSAPP_ENABLED=true
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_secret_string
```

### Option B: Twilio (Paid but Easy)

Twilio offers a simpler setup with pay-as-you-go pricing.

1. Sign up at [twilio.com](https://www.twilio.com/)
2. Go to **Messaging** → **Try WhatsApp**
3. Follow setup wizard
4. Get your Account SID, Auth Token, and WhatsApp number

```env
WHATSAPP_PROVIDER=TWILIO
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
WHATSAPP_ENABLED=true
```

### Already Implemented

The WhatsApp service is at `lib/services/whatsapp/whatsappService.ts` and supports:
- Message templates
- Location sharing requests
- Interactive buttons
- Media attachments

---

## 3. IoT GPS Platforms

### Option A: Navixy (Recommended for Saudi Arabia)

Navixy has a **Saudi Arabia-hosted instance** and is commonly used with TGA-approved devices.

#### Demo Account

1. Visit [navixy.com](https://www.navixy.com/)
2. Click **Try for Free** → Get 30-day trial
3. Or request a demo at [navixy.com/contact-us](https://www.navixy.com/contact-us/)

#### API Integration

```env
# Navixy API
NAVIXY_ENABLED=true
NAVIXY_BASE_URL=https://api.sa.navixy.com/v2
NAVIXY_USERNAME=your_username
NAVIXY_PASSWORD=your_password
# Or use hash-based auth:
NAVIXY_API_HASH=your_api_hash
```

#### Already Implemented

The adapter is at `lib/adapters/iot/platforms/navixyAdapter.ts`

### Option B: Wialon (Largest Platform)

Wialon supports 2,500+ device types and is one of the largest telematics platforms.

#### Demo/Sandbox

1. Visit [wialon.com](https://wialon.com/)
2. Request a demo account
3. Or use their **Wialon Hosting** free tier for development

```env
# Wialon API
WIALON_ENABLED=true
WIALON_BASE_URL=https://hst-api.wialon.com/wialon/ajax.html
WIALON_TOKEN=your_api_token
```

### Option C: Flespi (Developer-Friendly)

Flespi offers a **free tier** perfect for development/testing.

#### Free Account

1. Visit [flespi.com](https://flespi.com/)
2. Sign up for free (includes 50 devices free)
3. Get your API token from the dashboard

```env
# Flespi API
FLESPI_ENABLED=true
FLESPI_BASE_URL=https://flespi.io
FLESPI_TOKEN=your_flespi_token
```

### TGA-Approved GPS Device Brands

These devices are approved by Saudi Transport General Authority (TGA):

| Brand | Model | CITC/TGA Status | Platform Compatibility |
|-------|-------|-----------------|------------------------|
| **Teltonika** | FMB920, FMB140 | ✅ Certified | Wialon, Navixy, Flespi |
| **Queclink** | GV300, GV500 | ✅ Certified | All platforms |
| **Meitrack** | T366, T622 | ✅ Licensed | Navixy, Flespi |
| **Ruptela** | FM-Pro4 | ✅ Certified | Wialon |
| **Suntech** | ST4915 | ✅ Licensed | Multiple |

---

## 4. Testing Without Credentials

### GPS Data Simulator

The system includes **demo data** that works without any credentials:

```typescript
// The live tracking API returns mock data when no credentials are set
// app/api/transportation/live-tracking/route.ts

// Demo vehicles move around Saudi Arabia
// Demo geofences show common touchpoints
// Demo events simulate real scenarios
```

### Enable Demo Mode

```env
# Use demo data when external services unavailable
IOT_DEMO_MODE=true
DALEELI_DEMO_MODE=true
TELEGRAM_DEMO_MODE=true
WHATSAPP_DEMO_MODE=true
```

### Local GPS Simulator

You can also run a GPS simulator:

```typescript
// Create a simple GPS point generator
function simulateVehicleMovement(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  progress: number // 0-1
) {
  return {
    latitude: origin.lat + (destination.lat - origin.lat) * progress,
    longitude: origin.lng + (destination.lng - origin.lng) * progress,
    speed: 80 + Math.random() * 20,
    heading: Math.random() * 360,
    timestamp: new Date().toISOString(),
  };
}
```

### GPX File Import

Upload GPX files from any GPS device/app to test:

```typescript
// Convert GPX to our format
const gpxToLocationPoints = (gpxXml: string): LocationPoint[] => {
  // Parse GPX XML and convert to LocationPoint[]
};
```

---

## Quick Start Checklist

### Telegram (Fastest - 5 minutes)

- [x] Create bot via @BotFather
- [x] Copy token to `.env.local`
- [x] Test via `/api/transportation/live-tracking`

### WhatsApp (15-30 minutes)

- [ ] Create Meta Developer account
- [ ] Set up WhatsApp Business in app
- [ ] Add test phone number
- [ ] Configure webhook

### IoT Platform (1-2 hours)

- [ ] Choose platform (Navixy recommended for Saudi)
- [ ] Request demo account
- [ ] Add API credentials
- [ ] Configure device or use simulator

---

## Environment Variables Summary

```env
# ============================================
# TELEGRAM (FREE)
# ============================================
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhooks/telegram
TELEGRAM_ENABLED=true

# ============================================
# WHATSAPP (Meta Cloud API)
# ============================================
WHATSAPP_PROVIDER=WHATSAPP_BUSINESS
WHATSAPP_API_KEY=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secret
WHATSAPP_ENABLED=true

# ============================================
# NAVIXY (Recommended for Saudi)
# ============================================
NAVIXY_ENABLED=true
NAVIXY_BASE_URL=https://api.sa.navixy.com/v2
NAVIXY_API_HASH=your_api_hash

# ============================================
# IOT POLLING
# ============================================
IOT_POLLING_ENABLED=true
IOT_POLLING_INTERVAL_MS=30000
IOT_AUTO_GEOFENCE=true

# ============================================
# DEMO MODE (Use if no credentials)
# ============================================
IOT_DEMO_MODE=true
DALEELI_DEMO_MODE=true
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transportation/live-tracking` | GET | Real-time vehicle locations |
| `/api/transportation/history` | GET | Historical route playback |
| `/api/gcc-compliance/location-request` | POST | Send TextLocate request |
| `/api/location/capture` | POST | Receive driver location |
| `/api/webhooks/telegram` | POST | Telegram webhook handler |
| `/api/webhooks/whatsapp` | POST | WhatsApp webhook handler |

---

## Support

For platform-specific questions:

- **Navixy**: [docs.navixy.com](https://docs.navixy.com/)
- **Wialon**: [sdk.wialon.com](https://sdk.wialon.com/)
- **Flespi**: [flespi.com/docs](https://flespi.com/docs)
- **Meta WhatsApp**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Telegram Bot API**: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)
