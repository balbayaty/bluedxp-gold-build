# WhatsApp API Configuration Guide

## Overview

The BlueDXP platform supports multiple WhatsApp providers for customer approvals and notifications:
- **Meta WhatsApp Business API** (Recommended)
- **Twilio WhatsApp API**
- **Custom Provider** (via webhook)

## Environment Variables

Add the following environment variables to your `.env.local` or production environment:

### Meta WhatsApp Business API (Recommended)

```env
# Enable WhatsApp service
WHATSAPP_ENABLED=true

# Provider selection
WHATSAPP_PROVIDER=META_CLOUD_API

# Meta API credentials
WHATSAPP_API_KEY=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Webhook verification (for receiving status updates)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token
```

### Twilio WhatsApp API

```env
# Enable WhatsApp service
WHATSAPP_ENABLED=true

# Provider selection
WHATSAPP_PROVIDER=TWILIO

# Twilio credentials
WHATSAPP_API_KEY=your_twilio_account_sid
WHATSAPP_API_SECRET=your_twilio_auth_token
WHATSAPP_PHONE_NUMBER_ID=whatsapp:+1234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=your_twilio_account_sid
```

### Custom Provider

```env
# Enable WhatsApp service
WHATSAPP_ENABLED=true

# Provider selection
WHATSAPP_PROVIDER=CUSTOM

# Custom provider configuration
WHATSAPP_BASE_URL=https://your-custom-provider.com/api
WHATSAPP_API_KEY=your_api_key (optional)
```

## Setup Instructions

### Option 1: Meta WhatsApp Business API (Recommended)

1. **Create Meta Business Account**
   - Go to [Meta Business](https://business.facebook.com/)
   - Create or select a business account

2. **Set Up WhatsApp Business Account**
   - Navigate to WhatsApp Manager
   - Create a WhatsApp Business Account
   - Note your Business Account ID

3. **Get Access Token**
   - Go to Meta Developers Console
   - Create a new app or use existing
   - Add "WhatsApp" product
   - Generate a permanent access token
   - Set permissions: `whatsapp_business_messaging`, `whatsapp_business_management`

4. **Get Phone Number ID**
   - In WhatsApp Manager, go to Phone Numbers
   - Select your phone number
   - Copy the Phone Number ID (numeric ID)

5. **Configure Webhook** (Optional, for status updates)
   - In Meta Developers Console, go to Webhooks
   - Set callback URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Set verify token (use same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
   - Subscribe to: `messages`, `message_status`

6. **Add Environment Variables**
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_PROVIDER=META_CLOUD_API
   WHATSAPP_API_KEY=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token
   ```

### Option 2: Twilio WhatsApp API

1. **Create Twilio Account**
   - Sign up at [Twilio](https://www.twilio.com/)
   - Verify your account

2. **Enable WhatsApp Sandbox** (Testing)
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox

3. **Get Production WhatsApp Number** (Production)
   - Request WhatsApp-enabled phone number from Twilio
   - Complete business verification if required

4. **Get Credentials**
   - Account SID (from Twilio Console)
   - Auth Token (from Twilio Console)
   - WhatsApp-enabled phone number

5. **Add Environment Variables**
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_PROVIDER=TWILIO
   WHATSAPP_API_KEY=your_account_sid
   WHATSAPP_API_SECRET=your_auth_token
   WHATSAPP_PHONE_NUMBER_ID=whatsapp:+1234567890
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_sid
   ```

### Option 3: Custom Provider

1. **Set Up Custom Provider**
   - Implement webhook endpoint that accepts WhatsApp messages
   - Endpoint should accept POST requests with message payload

2. **Add Environment Variables**
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_PROVIDER=CUSTOM
   WHATSAPP_BASE_URL=https://your-provider.com/api
   WHATSAPP_API_KEY=your_api_key (if required)
   ```

## Webhook Configuration

### Meta API Webhook

1. **Set Webhook URL**
   - URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Method: GET (verification) and POST (events)

2. **Verification**
   - The webhook handler automatically verifies using `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Meta will send GET request with `hub.verify_token` parameter

3. **Event Handling**
   - POST requests contain message status updates
   - Currently logs events (can be extended for delivery tracking)

### Twilio Webhook

Twilio webhooks are configured in Twilio Console:
- Status Callback URL: `https://yourdomain.com/api/whatsapp/webhook`
- Configure in phone number settings

## Testing

### Test WhatsApp Service

```typescript
import { whatsappService } from '@/lib/services/whatsapp/whatsappService'

// Check if configured
if (whatsappService.isConfigured()) {
  // Send test message
  const result = await whatsappService.sendMessage({
    to: '+966501234567',
    message: 'Test message from BlueDXP'
  })
  
  console.log('Result:', result)
}
```

### Test via API

```bash
curl -X POST https://yourdomain.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+966501234567",
    "message": "Test message"
  }'
```

## Usage in Customer Approval

The WhatsApp service is automatically used when creating customer approval requests:

```typescript
import { customerApprovalService } from '@/lib/services/msds-sku-linking/customerApprovalService'

const request = await customerApprovalService.createApprovalRequest(
  [linkId],
  customerId,
  {
    customerPhone: '+966501234567',
    channels: ['WHATSAPP', 'EMAIL']
  }
)
```

## Security Considerations

1. **Access Tokens**
   - Store securely (use environment variables)
   - Rotate tokens regularly
   - Use permanent tokens for production (not temporary)

2. **Webhook Verification**
   - Always verify webhook tokens
   - Use strong, random tokens
   - Never expose tokens in client-side code

3. **Rate Limiting**
   - WhatsApp has rate limits
   - Implement retry logic with exponential backoff
   - Monitor usage to avoid hitting limits

4. **Phone Number Format**
   - Always use E.164 format: `+[country code][number]`
   - Example: `+966501234567` (Saudi Arabia)

## Troubleshooting

### Common Issues

1. **"WhatsApp service is not configured"**
   - Check `WHATSAPP_ENABLED=true`
   - Verify all required environment variables are set
   - Check `whatsappService.isConfigured()` returns true

2. **"Failed to send message"**
   - Verify phone number format (E.164)
   - Check API credentials are correct
   - Verify phone number is WhatsApp-enabled
   - Check rate limits

3. **Webhook verification fails**
   - Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches
   - Check webhook URL is accessible
   - Verify HTTPS is enabled

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
```

Check server logs for detailed error messages.

## Cost Considerations

- **Meta WhatsApp Business API**: Free tier available, then pay-per-message
- **Twilio**: Pay-per-message pricing
- **Custom Provider**: Varies by provider

Monitor usage and set up billing alerts.

## Support

For issues:
1. Check server logs
2. Verify environment variables
3. Test with WhatsApp service directly
4. Check provider documentation (Meta/Twilio)

## Next Steps

1. Set up environment variables
2. Test WhatsApp service
3. Configure webhooks (optional)
4. Enable in customer approval workflow
5. Monitor usage and costs











