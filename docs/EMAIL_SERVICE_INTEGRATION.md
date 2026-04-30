# 📧 Email Service Module - Integration Guide

## Overview

The **Email Service Module** is a centralized, event-driven email service for the BlueDXP Platform. It provides unified email functionality for all modules without direct connections - all communication happens via the Event Bus.

## 🏗️ Architecture

### Key Principles

1. **No Direct Module Connections**: Modules never connect directly to the Email Service
2. **Event-Driven**: All email requests go through the Event Bus
3. **Multi-Tenant**: Full tenant isolation support
4. **Multi-Provider**: Supports multiple email providers (SMTP, SendGrid, AWS SES, etc.)
5. **Provider Failover**: Automatic failover between providers
6. **Template Management**: Centralized email template system

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ANY MODULE                                │
│  (WMS, TMS, MSDS, QHSE, Compliance, etc.)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Publishes: email.send event
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENT BUS                                 │
│  (lib/services/event-store)                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Listens to: email.send events
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              EMAIL SERVICE MODULE                            │
│  (lib/services/email)                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Email Service Core                                 │   │
│  │  • Multi-tenant support                            │   │
│  │  • Provider management                             │   │
│  │  • Template rendering                              │   │
│  └────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Email Adapters                                     │   │
│  │  • SMTP Adapter                                     │   │
│  │  • SendGrid Adapter                                 │   │
│  │  • AWS SES Adapter                                  │   │
│  │  • (More providers can be added)                     │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Sends email via selected provider
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              EMAIL PROVIDER                                  │
│  (SMTP Server, SendGrid, AWS SES, etc.)                     │
└─────────────────────────────────────────────────────────────┘
```

## 📋 How Modules Send Emails

### Method 1: Via Event Bus (Recommended)

Modules publish `email.send` events to the Event Bus. The Email Service listens to these events and handles them automatically.

```typescript
import { eventBus } from '@/lib/services/event-store'
import type { EmailMessage } from '@/lib/services/email/types'

// In your module service
async function sendNotificationEmail(userEmail: string, data: any) {
  const emailMessage: EmailMessage = {
    tenantId: 'tenant-1', // Get from context
    to: { email: userEmail },
    subject: 'New Notification',
    htmlBody: '<h1>You have a new notification</h1>',
    textBody: 'You have a new notification',
    moduleId: 'wms', // Your module ID
    entityId: 'shipment-123', // Related entity ID (optional)
    entityType: 'shipment', // Related entity type (optional)
    tags: ['notification', 'wms'], // For categorization (optional)
  }

  // Publish to Event Bus - Email Service will handle it
  await eventBus.publish({
    type: 'email.send',
    payload: emailMessage,
    timestamp: new Date(),
    source: 'wms', // Your module ID
  })
}
```

### Method 2: Using Helper Function

For convenience, you can use the helper function:

```typescript
import { sendEmailViaEvent } from '@/lib/services/email/integration/eventIntegration'
import type { EmailMessage } from '@/lib/services/email/types'

async function sendEmail(userEmail: string) {
  const emailMessage: EmailMessage = {
    tenantId: 'tenant-1',
    to: { email: userEmail },
    subject: 'Hello',
    htmlBody: '<p>Hello from WMS module!</p>',
    moduleId: 'wms',
  }

  await sendEmailViaEvent(emailMessage, 'wms')
}
```

### Method 3: Using Templates

For reusable email templates:

```typescript
import { eventBus } from '@/lib/services/event-store'

async function sendTemplateEmail(userEmail: string, variables: Record<string, any>) {
  await eventBus.publish({
    type: 'email.send',
    payload: {
      tenantId: 'tenant-1',
      to: { email: userEmail },
      templateId: 'welcome-email', // Template ID
      templateVariables: variables, // Variables for template
      moduleId: 'wms',
    },
    timestamp: new Date(),
    source: 'wms',
  })
}
```

## 📧 Email Templates

### Creating Templates

Templates can be created via API or programmatically:

```typescript
import { emailService } from '@/lib/services/email'

const template = await emailService.createTemplate({
  tenantId: 'tenant-1',
  name: 'Welcome Email',
  subject: 'Welcome to {{companyName}}!',
  htmlBody: `
    <h1>Welcome {{userName}}!</h1>
    <p>Thank you for joining {{companyName}}.</p>
  `,
  textBody: 'Welcome {{userName}}! Thank you for joining {{companyName}}.',
  variables: ['userName', 'companyName'], // Optional: list of variables
  moduleId: 'wms', // Optional: module this template belongs to
})
```

### Using Templates

```typescript
await eventBus.publish({
  type: 'email.send',
  payload: {
    tenantId: 'tenant-1',
    to: { email: 'user@example.com' },
    templateId: 'welcome-email',
    templateVariables: {
      userName: 'John Doe',
      companyName: 'BlueDXP',
    },
    moduleId: 'wms',
  },
  timestamp: new Date(),
  source: 'wms',
})
```

## 🔧 Configuration

### Environment Variables

Configure email providers via environment variables:

#### SMTP Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=BlueDXP Platform
```

#### SendGrid Configuration
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=BlueDXP Platform
```

#### AWS SES Configuration
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_SES_FROM_NAME=BlueDXP Platform
```

### Tenant-Specific Configuration

Each tenant can have its own email configuration:

```typescript
import { emailService } from '@/lib/services/email'

await emailService.updateConfig('tenant-1', {
  defaultProvider: 'SENDGRID',
  providers: [
    {
      provider: 'SENDGRID',
      enabled: true,
      priority: 1, // Lower = higher priority
      config: { apiKey: '...' },
    },
    {
      provider: 'SMTP',
      enabled: true,
      priority: 2, // Fallback provider
      config: { host: '...' },
    },
  ],
  retryAttempts: 3,
  retryDelay: 1000,
})
```

## 📊 Email Statistics

Get email statistics for a tenant:

```typescript
import { emailService } from '@/lib/services/email'

const stats = await emailService.getEmailStats('tenant-1', fromDate, toDate)

console.log(stats)
// {
//   tenantId: 'tenant-1',
//   total: 1000,
//   sent: 950,
//   delivered: 900,
//   bounced: 10,
//   failed: 40,
//   opened: 500,
//   clicked: 200,
//   byStatus: { sent: 950, delivered: 900, ... },
//   byModule: { wms: 300, tms: 200, ... },
//   byProvider: { SENDGRID: 800, SMTP: 150, ... },
// }
```

## 🔌 API Endpoints

### Send Email
```http
POST /api/email/send
Content-Type: application/json

{
  "tenantId": "tenant-1",
  "to": { "email": "user@example.com" },
  "subject": "Hello",
  "htmlBody": "<h1>Hello</h1>",
  "textBody": "Hello"
}
```

### Send Template Email
```http
POST /api/email/send
Content-Type: application/json

{
  "tenantId": "tenant-1",
  "to": { "email": "user@example.com" },
  "templateId": "welcome-email",
  "templateVariables": {
    "userName": "John Doe"
  }
}
```

### List Templates
```http
GET /api/email/templates?tenantId=tenant-1&moduleId=wms
```

### Create Template
```http
POST /api/email/templates
Content-Type: application/json

{
  "tenantId": "tenant-1",
  "name": "Welcome Email",
  "subject": "Welcome {{userName}}!",
  "htmlBody": "<h1>Welcome {{userName}}!</h1>",
  "moduleId": "wms"
}
```

### Get Statistics
```http
GET /api/email/stats?tenantId=tenant-1&from=2024-01-01&to=2024-12-31
```

## 🎯 Best Practices

### 1. Always Use Event Bus
- ✅ **DO**: Publish `email.send` events
- ❌ **DON'T**: Import email service directly in modules

### 2. Include Module Context
- Always include `moduleId` in email messages
- Include `entityId` and `entityType` when relevant
- Use `tags` for categorization

### 3. Use Templates for Reusable Emails
- Create templates for common emails (welcome, notifications, etc.)
- Use variables for dynamic content

### 4. Handle Errors Gracefully
- Email sending is asynchronous - don't block operations
- Check email status if needed

### 5. Multi-Tenant Awareness
- Always include `tenantId` in email messages
- Respect tenant-specific configurations

## 🔍 Event Types

### Email Send Event
```typescript
{
  type: 'email.send',
  payload: EmailMessage,
  timestamp: Date,
  source: string // Module ID
}
```

### Email Status Event
```typescript
{
  type: 'email.status',
  payload: {
    messageId: string,
    status: 'sent' | 'delivered' | 'bounced' | 'failed' | ...,
    timestamp: Date,
    details?: any,
    provider?: EmailProvider,
  },
  timestamp: Date,
  source: 'email-service'
}
```

### Module-Specific Events (Backward Compatibility)
Modules can also publish module-specific events:
- `wms.email.send`
- `tms.email.send`
- `msds.email.send`
- etc.

These are automatically converted to `email.send` events.

## 🚀 Adding New Email Providers

To add a new email provider:

1. Create adapter class extending `EmailAdapterBase`:

```typescript
import { EmailAdapterBase } from '@/lib/services/email/adapters/base/EmailAdapterBase'
import type { EmailMessage, EmailSendResult } from '@/lib/services/email/types'

export class CustomProviderAdapter extends EmailAdapterBase {
  readonly id = 'custom-provider'
  readonly name = 'Custom Provider'
  readonly provider = 'CUSTOM' as const

  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Implement connection test
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    // Implement email sending
  }
}
```

2. Register the adapter:

```typescript
import { emailService } from '@/lib/services/email'
import { CustomProviderAdapter } from './adapters/custom/CustomProviderAdapter'

const adapter = new CustomProviderAdapter({ /* config */ })
emailService.registerProvider(adapter)
```

## 📝 Example: WMS Module Sending Email

```typescript
// lib/services/wms/notifications/wmsNotificationService.ts
import { eventBus } from '@/lib/services/event-store'
import type { EmailMessage } from '@/lib/services/email/types'

export class WMSNotificationService {
  async sendShipmentNotification(
    tenantId: string,
    shipmentId: string,
    recipientEmail: string
  ) {
    const emailMessage: EmailMessage = {
      tenantId,
      to: { email: recipientEmail },
      subject: `Shipment ${shipmentId} Status Update`,
      htmlBody: `
        <h1>Shipment ${shipmentId}</h1>
        <p>Your shipment status has been updated.</p>
        <a href="/wms/shipments/${shipmentId}">View Details</a>
      `,
      textBody: `Shipment ${shipmentId} status has been updated.`,
      moduleId: 'wms',
      entityId: shipmentId,
      entityType: 'shipment',
      tags: ['shipment', 'notification'],
    }

    // Send via Event Bus
    await eventBus.publish({
      type: 'email.send',
      payload: emailMessage,
      timestamp: new Date(),
      source: 'wms',
    })
  }
}
```

## ✅ Summary

- ✅ **Centralized**: One email service for all modules
- ✅ **Event-Driven**: No direct connections, all via Event Bus
- ✅ **Multi-Tenant**: Full tenant isolation
- ✅ **Multi-Provider**: Support for multiple email providers
- ✅ **Template System**: Reusable email templates
- ✅ **Failover**: Automatic provider failover
- ✅ **Statistics**: Email tracking and statistics
- ✅ **Extensible**: Easy to add new providers

The Email Service Module is now fully integrated into the BlueDXP Platform and ready to handle all email communications from any module!


