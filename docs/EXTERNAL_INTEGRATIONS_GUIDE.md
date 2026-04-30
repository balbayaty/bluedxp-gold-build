# External Integrations Guide

## Overview

The BlueDXP platform now supports comprehensive external integrations, allowing users to connect and display content from LinkedIn, Telegram, WhatsApp, News Sites, and any generic website directly in their workspace dashboard.

## Supported Integrations

### 1. LinkedIn Integration
- **Type**: OAuth2-based API integration
- **Features**:
  - Profile information
  - Company pages
  - Posts feed
  - Connection management
- **Setup**: Requires LinkedIn App credentials (Client ID, Client Secret)
- **Display**: Feed widget showing latest posts

### 2. Telegram Integration
- **Type**: Bot API integration
- **Features**:
  - Bot messaging
  - Group/channel support
  - Webhook support for real-time updates
  - Message history
- **Setup**: Requires bot token from @BotFather
- **Display**: Messages widget with real-time updates

### 3. WhatsApp Integration
- **Type**: Multi-provider API integration
- **Features**:
  - WhatsApp Business API
  - Twilio integration
  - Meta Cloud API
  - Message sending and receiving
- **Setup**: Requires provider-specific credentials
- **Display**: Messages widget

### 4. News Sites Integration
- **Type**: RSS feed parsing and web scraping
- **Features**:
  - RSS/Atom feed support
  - JSON Feed support
  - Web scraping (optional)
  - Article filtering by keywords, categories, date
  - Auto-refresh at configurable intervals
- **Setup**: Just provide RSS feed URL
- **Display**: News feed widget with articles

### 5. Generic Site Integration
- **Type**: Flexible integration (iframe, API, scraping)
- **Features**:
  - **Iframe Embed**: Embed any website in dashboard
  - **API Integration**: Connect to REST APIs with authentication
  - **Web Scraping**: Extract content from websites
- **Setup**: URL + mode selection
- **Display**: Iframe widget or custom data display

## Architecture

### Service Layer
- **Base Integration Service** (`lib/services/external-integrations/baseIntegrationService.ts`)
  - Abstract base class for all integrations
  - Common error handling and event emission
  - Unified interface

- **Integration Services**:
  - `linkedInService.ts` - LinkedIn OAuth and API
  - `telegramService.ts` - Telegram Bot API
  - `newsSiteService.ts` - RSS parsing and scraping
  - `genericSiteService.ts` - Generic site integration

- **Integration Manager** (`lib/services/external-integrations/integrationManager.ts`)
  - Central service for managing all integrations
  - Unified API for all integration types
  - Event bus integration

### API Routes
- `GET /api/integrations` - List all integrations
- `POST /api/integrations` - Create new integration
- `GET /api/integrations/[id]` - Get integration details
- `PUT /api/integrations/[id]` - Update integration
- `DELETE /api/integrations/[id]` - Delete integration
- `POST /api/integrations/[id]/sync` - Sync integration data
- `GET /api/integrations/[id]/data` - Get integration data
- `GET /api/integrations/linkedin/auth` - Get LinkedIn OAuth URL
- `POST /api/integrations/linkedin/auth/callback` - Handle LinkedIn callback
- `POST /api/integrations/telegram/webhook` - Telegram webhook handler

### UI Components
- **IntegrationManager** (`components/integrations/IntegrationManager.tsx`)
  - Main UI for managing integrations
  - Add, edit, delete, sync integrations
  - Status monitoring

- **Integration Widgets** (`components/integrations/IntegrationWidgets.tsx`)
  - LinkedInFeedWidget
  - TelegramMessagesWidget
  - NewsFeedWidget
  - GenericSiteWidget
  - IntegrationWidget (router)

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```bash
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Telegram (optional - webhook URL)
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# WhatsApp (already configured in existing service)
WHATSAPP_PROVIDER=WHATSAPP_BUSINESS
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### 2. LinkedIn Setup

1. Create LinkedIn App at https://www.linkedin.com/developers/apps
2. Add redirect URI: `https://your-domain.com/integrations/callback`
3. Request permissions: `r_liteprofile`, `r_emailaddress`, `r_basicprofile`
4. Add Client ID and Secret to environment variables

### 3. Telegram Setup

1. Create bot with @BotFather on Telegram
2. Get bot token
3. (Optional) Set up webhook for real-time updates:
   ```
   POST https://api.telegram.org/bot<token>/setWebhook
   {
     "url": "https://your-domain.com/api/integrations/telegram/webhook"
   }
   ```

### 4. News Site Setup

1. Find RSS feed URL (usually `/rss` or `/feed`)
2. Add integration with feed URL
3. Configure refresh interval (default: 1 hour)

### 5. Generic Site Setup

**For Iframe Embed:**
1. Add integration with site URL
2. Select "IFRAME" mode
3. Configure iframe settings (sandbox, fullscreen, etc.)

**For API Integration:**
1. Add integration with API base URL
2. Select "API" mode
3. Configure authentication (API key, OAuth, etc.)
4. Define endpoints

**For Web Scraping:**
1. Add integration with site URL
2. Select "SCRAPING" mode
3. Configure CSS selectors for content extraction

## Usage

### Adding an Integration

1. Navigate to `/integrations` page
2. Click "Add Integration"
3. Select integration type
4. Fill in configuration
5. Click "Connect"

### Viewing Integration Content

Integrations can be displayed as widgets in the dashboard:

1. Go to dashboard
2. Add widget
3. Select integration widget type
4. Choose integration to display

### Syncing Data

- Manual sync: Click refresh button on integration card
- Automatic sync: Configured per integration (default intervals)

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **OAuth Tokens**: Stored securely, refreshed automatically
3. **Webhooks**: Verify webhook signatures
4. **Iframe Sandbox**: Use sandbox attributes for security
5. **CORS**: Handle CORS for API integrations
6. **Rate Limiting**: Respect API rate limits

## Troubleshooting

### LinkedIn
- **Error: "Invalid redirect URI"**: Ensure redirect URI matches LinkedIn app settings exactly
- **Error: "Token expired"**: Tokens auto-refresh, but may need re-authorization

### Telegram
- **Error: "Unauthorized"**: Verify bot token is correct
- **Webhook not working**: Check webhook URL is accessible and returns 200 OK

### News Sites
- **Error: "Invalid RSS feed"**: Verify feed URL is correct and accessible
- **No articles**: Check feed format (RSS, Atom, JSON Feed)

### Generic Sites
- **Iframe not loading**: Check CORS and X-Frame-Options headers
- **API errors**: Verify authentication and endpoint URLs
- **Scraping fails**: Site may block scraping or require authentication

## Future Enhancements

- [ ] Database persistence for integrations
- [ ] Advanced filtering and search
- [ ] Integration templates
- [ ] Bulk operations
- [ ] Integration analytics
- [ ] Custom widget configurations
- [ ] Integration marketplace
- [ ] Webhook management UI
- [ ] Integration health monitoring
- [ ] Automated sync scheduling

## Support

For issues or questions:
- Check integration status in Integration Manager
- Review API logs for errors
- Verify environment variables are set correctly
- Test integration connection manually













