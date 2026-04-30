# Forensic Email Investigation Report
## Domain: `scsflex.com`
## Rogue IP: `212.12.191.41`
## Date: 2025-01-27

---

## A. EXECUTIVE SUMMARY

### Capability Assessment

**Question 1: Does this repository contain any code or config capable of sending emails?**

**Answer: NO** - This repository does NOT contain any functional email-sending code.

**Evidence:**
- No email-sending libraries installed (nodemailer, sendgrid, mailgun, etc.)
- No SMTP configuration code
- No SMTP host/port configurations
- All email-sending code is stubbed (logs only) or missing (endpoint doesn't exist)

**Question 2: Could any code theoretically send email through a non-Google SMTP host?**

**Answer: NO** - No code in this repository can send emails through any SMTP host, Google or otherwise.

**Evidence:**
- No SMTP connection code exists
- No email transport mechanisms implemented
- Missing email endpoint that's called but doesn't exist

**Conclusion:** This repository is **NOT responsible** for emails being sent from `@scsflex.com` via IP `212.12.191.41`.

---

## B. COMPLETE INVENTORY OF EMAIL-SENDING LOGIC

### 1. Missing Email Endpoint (Non-Functional)

**File:** `app/msds/page.tsx`
**Line Numbers:** 378-393, 446-460, 1229-1253
**Email Library/Mechanism:** None - Endpoint doesn't exist
**FROM Domain:** UNKNOWN (endpoint missing)
**SMTP Host/Mechanism:** UNKNOWN (endpoint missing)
**Explicit/Implicit SMTP:** N/A - Endpoint doesn't exist
**Status:** **NON-FUNCTIONAL** - Calls to `/api/erpnext/send-email` will fail (404)

**Details:**
- Code attempts to POST to `/api/erpnext/send-email`
- Endpoint file `app/api/erpnext/send-email/route.ts` does NOT exist
- Requests will return 404 Not Found
- No emails can be sent through this path

**Code Evidence:**
```typescript
// Line 378-393: app/msds/page.tsx
await fetch('/api/erpnext/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: submission.customerEmail || 'customer@example.com',
    subject: `✅ MSDS Approved: ${submission.extractedData?.productName || 'MSDS'}`,
    message: `...`,
    reference_doctype: 'Item',
    reference_name: saveResult.itemId || ''
  })
})
```

---

### 2. Notification Service Email Channel (Stubbed)

**File:** `lib/services/notifications/notificationService.ts`
**Line Numbers:** 268-271
**Email Library/Mechanism:** None - Console.log only
**FROM Domain:** UNKNOWN (not implemented)
**SMTP Host/Mechanism:** None (stubbed)
**Explicit/Implicit SMTP:** N/A - No SMTP code
**Status:** **STUBBED** - Only logs to console, does not send emails

**Code Evidence:**
```typescript
// Line 268-271: lib/services/notifications/notificationService.ts
// Handle other channels (email, SMS, etc.) - would integrate with external services
if (notification.channel === 'email') {
  console.log('Would send email notification:', newNotification.message)
}
```

---

### 3. Intelligent Orchestration Communications (Stubbed)

**File:** `data/intelligentOrchestrationEngine.ts`
**Line Numbers:** 482-524
**Email Library/Mechanism:** None - In-memory logging only
**FROM Domain:** UNKNOWN (not implemented)
**SMTP Host/Mechanism:** None (stubbed)
**Explicit/Implicit SMTP:** N/A - No SMTP code
**Status:** **STUBBED** - Only logs to memory, does not send emails

**Code Evidence:**
```typescript
// Line 502-524: data/intelligentOrchestrationEngine.ts
export async function sendNotification(
  recipient: CommunicationRecipient,
  templateId: string,
  data: Record<string, any>
): Promise<CommunicationLog> {
  // Generate message from template
  const message = `Alert: ${data.message || 'System notification'}`
  
  const log: CommunicationLog = {
    id: `comm-${Date.now()}`,
    orchestrationId: 'auto',
    recipient,
    channel: recipient.channel,
    templateId,
    message,
    sentAt: new Date().toISOString(),
    status: 'SENT',
    metadata: data,
  }
  
  communicationLogs.set(log.id, log)
  return log
}
```

---

### 4. ERPNext API Integration (Authentication Only)

**File:** `lib/adapters/erpnext/api.ts`
**Line Numbers:** 9-11, 24-48
**Email Library/Mechanism:** HTTP fetch to ERPNext API (authentication only)
**FROM Domain:** N/A - This is for authentication, not email sending
**SMTP Host/Mechanism:** N/A - Uses ERPNext API over HTTPS
**Explicit/Implicit SMTP:** N/A - No email sending, only API authentication
**Status:** **ACTIVE** - But only for ERPNext login, NOT for sending emails

**Details:**
- Uses `b.albayaty@scsflex.com` as login email
- Connects to ERPNext at `https://erp.hazalyze.com` or `https://erp.scsflex.com`
- Does NOT send emails from this codebase
- **UNCERTAIN:** Whether ERPNext instance itself sends emails (requires external verification)

**Code Evidence:**
```typescript
// Line 9-11: lib/adapters/erpnext/api.ts
const ERP_URL = process.env.ERP_NEXT_API_URL || "https://erp.hazalyze.com";
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY || "b.albayaty@scsflex.com";
const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET || "Bashir@2025";

// Line 24-48: Login function
async login() {
  const response = await fetch(`${ERP_URL}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      usr: ERP_EMAIL,
      pwd: ERP_PASSWORD,
    }),
    credentials: 'include',
  });
  // ... login logic only, no email sending
}
```

---

## C. LIST OF ALL REFERENCES TO IP ADDRESSES, HOSTNAMES, SMTP VARIABLES, OR MAIL CONFIGS

### IP Addresses Found

**Result:** **NO IP ADDRESSES FOUND** related to email or SMTP

**IP Addresses Found (Non-Email Related):**
- `127.0.0.1` - `lib/services/webhooks/webhookService.ts` Line 293 (webhook validation, not email)
- `0.0.0.0` - `TROUBLESHOOTING.md` Line 79 (server binding, not email)

**Specific Search for `212.12.191.41`:**
- **NOT FOUND** - No references to this IP address anywhere in the repository

---

### SMTP-Related Hostnames

**Result:** **NO SMTP HOSTNAMES FOUND**

**Searched for:**
- `smtp.*`
- `mail.*`
- Ports 25, 465, 587
- SMTP configuration variables

**Findings:**
- No SMTP hostnames found
- No SMTP ports found
- No SMTP configuration found

---

### Email-Related Environment Variables

**Result:** **NO EMAIL ENVIRONMENT VARIABLES FOUND**

**Variables Found (Non-Email Related):**
- `ERP_NEXT_API_URL` - ERPNext API URL (not SMTP)
- `ERP_NEXT_API_KEY` - ERPNext login email (not SMTP)
- `ERP_NEXT_API_SECRET` - ERPNext login password (not SMTP)
- `RABBITMQ_URL` - Message queue (not email)
- `ZOHO_API_URL` - Zoho integration (not email)
- `DOCUMENT_API_URL` - Document service (not email)
- AI API keys (OpenAI, Anthropic) - Not email related

**SMTP Variables Searched (NOT FOUND):**
- `SMTP_HOST` / `MAIL_HOST` - Not found
- `SMTP_PORT` / `MAIL_PORT` - Not found
- `SMTP_USER` / `MAIL_USERNAME` - Not found
- `SMTP_PASS` / `MAIL_PASSWORD` - Not found
- `SENDGRID_API_KEY` - Not found
- `MAILGUN_API_KEY` - Not found
- `AWS_SES_*` - Not found
- `POSTMARK_*` - Not found
- `RESEND_*` - Not found

---

### Mail Configuration Files

**Result:** **NO MAIL CONFIGURATION FILES FOUND**

**Searched:**
- `.env*` files - None found in repository (gitignored)
- `docker-compose.yml` - Not found
- `Dockerfile` - Not found
- `.github/workflows` - Not found
- `.gitlab-ci.yml` - Not found
- `vercel.json` - Not found

---

## D. LIST OF ALL EXTERNAL SERVICE CALLS THAT COULD POTENTIALLY TRIGGER EMAIL SENDING

### 1. ERPNext API Calls

**Files:** Multiple files calling ERPNext API
**Mechanism:** HTTP fetch to ERPNext instance
**Could Trigger Email:** **UNCERTAIN** - Depends on ERPNext configuration (external verification required)

**ERPNext API Endpoints Called:**
- `/api/method/login` - Authentication only
- `/api/resource/File` - Document retrieval
- `/api/resource/Issue` - NCR creation
- `/api/resource/Task` - CAPA creation
- `/api/resource/User` - User retrieval
- `/api/resource/Customer` - Customer retrieval
- `/api/resource/Supplier` - Supplier retrieval
- `/api/resource/Warehouse` - Warehouse retrieval

**ERPNext URLs Referenced:**
- `https://erp.hazalyze.com` (default)
- `https://erp.scsflex.com` (in mock data)

**Email Sending Potential:**
- **UNCERTAIN** - ERPNext may send emails when documents are created/updated
- **UNCERTAIN** - ERPNext email configuration is external to this repository
- **UNCERTAIN** - ERPNext SMTP settings are configured in ERPNext admin panel (not in this code)

**Files Making ERPNext Calls:**
- `lib/adapters/erpnext/api.ts` - Main ERPNext adapter
- `app/api/erpnext/save-msds/route.ts` - MSDS saving
- `app/api/erpnext/users/route.ts` - User retrieval
- `app/api/erpnext/customers/route.ts` - Customer retrieval
- `app/api/erpnext/suppliers/route.ts` - Supplier retrieval
- `app/api/erpnext/iso-stats/route.ts` - Statistics
- Multiple page components calling ERPNext APIs

---

### 2. Webhook Service

**File:** `lib/services/webhooks/webhookService.ts`
**Mechanism:** HTTP POST to external webhook URLs
**Could Trigger Email:** **UNCERTAIN** - Depends on webhook receiver configuration (external verification required)

**Details:**
- Webhooks send HTTP POST requests to external URLs
- External webhook receivers could potentially trigger email sending
- Webhook URLs are user-configured (not hardcoded)
- No email sending code in webhook service itself

**Code Evidence:**
```typescript
// Line 153-165: lib/services/webhooks/webhookService.ts
const response = await fetch(webhook.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Event': payload.event,
    'X-Webhook-Signature': signature,
    'X-Webhook-Timestamp': payload.timestamp,
    'X-Webhook-Id': payload.id,
    'User-Agent': 'Hazalyze-Webhooks/1.0'
  },
  body: payloadString,
  signal: AbortSignal.timeout(30000)
})
```

**Email Sending Potential:**
- **UNCERTAIN** - If webhook receiver is configured to send emails, it could trigger email sending
- **UNCERTAIN** - Webhook receiver configuration is external to this repository

---

### 3. External API Integrations (Non-Email)

**Files:** Various integration adapters
**Mechanism:** HTTP API calls
**Could Trigger Email:** **NO** - These are data retrieval/update APIs, not email services

**Integrations Found:**
- Zoho API (`lib/adapters/transportation/erp/ZohoAdapter.ts`)
- Rabet API (`lib/adapters/rabet/index.ts`)
- Firebase (`lib/services/firebase/config.ts`)
- AI Services (OpenAI, Anthropic)

**Email Sending Potential:**
- **NO** - These integrations do not send emails
- **NO** - No email-sending code in these adapters

---

## E. WHAT IS UNKNOWN OR CANNOT BE CONFIRMED FROM THE REPOSITORY ALONE

### UNCERTAIN: ERPNext Email Configuration

**Status:** **UNCERTAIN** - Requires external environment verification

**What Cannot Be Confirmed:**
1. Whether ERPNext instance (`https://erp.hazalyze.com` or `https://erp.scsflex.com`) is configured to send emails
2. What SMTP server ERPNext uses (if configured)
3. Whether ERPNext sends emails when documents are created/updated via API
4. What "From" address ERPNext uses when sending emails
5. Whether ERPNext email sending could originate from IP `212.12.191.41`

**Investigation Required:**
- Check ERPNext admin panel → Email Settings
- Check ERPNext SMTP configuration
- Check ERPNext email queue/logs
- Verify if ERPNext sends emails on document creation/update
- Check if ERPNext email server IP matches `212.12.191.41`

---

### UNCERTAIN: Webhook Receiver Configuration

**Status:** **UNCERTAIN** - Requires external verification

**What Cannot Be Confirmed:**
1. What URLs are configured as webhook receivers
2. Whether webhook receivers are configured to send emails
3. Whether webhook receivers use SMTP server at IP `212.12.191.41`

**Investigation Required:**
- Check webhook configuration in application database/settings
- Verify webhook receiver URLs
- Check if webhook receivers send emails
- Verify webhook receiver SMTP configuration

---

### UNCERTAIN: Server Environment Configuration

**Status:** **UNCERTAIN** - Requires external environment verification

**What Cannot Be Confirmed:**
1. Whether server has system-level mailer configured (sendmail, postfix)
2. Whether environment variables are set outside this repository
3. Whether Docker/container configuration includes email settings
4. Whether CI/CD pipelines send emails
5. Whether hosting provider has email services configured

**Investigation Required:**
- Check server environment variables (`.env` files not in repo)
- Check Docker configuration (if used)
- Check CI/CD pipeline configuration
- Check hosting provider email settings
- Check system mailer configuration on server

---

### UNCERTAIN: Missing Email Endpoint Implementation

**Status:** **UNCERTAIN** - Endpoint doesn't exist, but could be implemented elsewhere

**What Cannot Be Confirmed:**
1. Whether `/api/erpnext/send-email` endpoint exists in production but not in repository
2. Whether endpoint is implemented in a different branch
3. Whether endpoint is proxied/forwarded to another service
4. What the endpoint would do if implemented

**Investigation Required:**
- Check production deployment for endpoint existence
- Check other Git branches
- Check reverse proxy/API gateway configuration
- Check if endpoint is handled by external service

---

## F. SUMMARY OF FINDINGS

### Direct Email-Sending Code: **NONE FOUND**

- No email-sending libraries installed
- No SMTP configuration code
- No email transport mechanisms
- All email code is stubbed or missing

### Indirect Email Triggers: **UNCERTAIN**

- ERPNext integration could trigger emails (external verification required)
- Webhook receivers could trigger emails (external verification required)
- Server environment could have email configured (external verification required)

### IP Address `212.12.191.41`: **NOT FOUND**

- No references to this IP address in repository
- No SMTP host configuration pointing to this IP
- No email-related code using this IP

### Domain `scsflex.com` References: **FOUND (Non-Email)**

- Email addresses found: `b.albayaty@scsflex.com`, `finance@scsflex.com`, `warehouse@scsflex.com`
- Usage: Mock data, authentication, contact information
- **NOT used for email sending** - Only references in data/auth code

---

## G. CONCLUSION

**This repository is NOT responsible for emails being sent from `@scsflex.com` via IP `212.12.191.41`.**

**Evidence:**
1. No functional email-sending code exists
2. No SMTP configuration exists
3. No references to IP `212.12.191.41`
4. All email functionality is stubbed or missing

**However, external systems connected to this repository COULD be responsible:**
1. **ERPNext instance** - If configured to send emails, could be source
2. **Webhook receivers** - If configured to send emails, could be source
3. **Server environment** - If system mailer is configured, could be source
4. **Hosting provider** - If email services are configured, could be source

**Investigation should focus on:**
- ERPNext email configuration and SMTP settings
- Server environment and system mailer configuration
- Webhook receiver configurations
- Hosting provider email services

---

**Report Generated:** 2025-01-27
**Investigation Type:** Forensic Email Analysis
**Scope:** Complete repository scan for email-sending capabilities
**Method:** Static code analysis, pattern matching, dependency scanning

