# Email Deliverability & Security Audit Report
## Domain: `scsflex.com`
## Date: 2025-01-27

---

## Executive Summary

This audit scanned the entire codebase for email-sending functionality, SMTP configurations, and references to the `scsflex.com` domain. 

**Key Findings:**
- ✅ **No active email-sending libraries** found in dependencies (no nodemailer, sendgrid, mailgun, etc.)
- ⚠️ **Missing API endpoint**: `/api/erpnext/send-email` is called but doesn't exist
- ⚠️ **Hardcoded email addresses** with `@scsflex.com` domain found in multiple files
- ⚠️ **Notification service** has email channel support but only logs (doesn't actually send)
- ⚠️ **ERPNext integration** uses `b.albayaty@scsflex.com` as authentication email
- ✅ **No SMTP credentials** found in code (good security practice)
- ⚠️ **No environment variables** for email configuration found

**Risk Level**: **LOW-MEDIUM** - No active email sending is happening, but there are references and missing implementations that could be activated.

---

## High-Level Integration Table

| # | Integration Name | Language | Status | From Address | Provider/Mechanism | Risk |
|---|-----------------|----------|--------|--------------|-------------------|------|
| 1 | ERPNext Email API (Missing) | TypeScript/Next.js | **MISSING** | Unknown | ERPNext API | ⚠️ HIGH |
| 2 | Notification Service Email Channel | TypeScript | **STUBBED** | Unknown | Console.log only | ✅ LOW |
| 3 | ERPNext Authentication | TypeScript | **ACTIVE** | `b.albayaty@scsflex.com` | ERPNext Login | ⚠️ MEDIUM |
| 4 | Intelligent Orchestration Communications | TypeScript | **STUBBED** | Unknown | Logging only | ✅ LOW |

---

## Detailed Findings

### 1. ERPNext Email API Endpoint (MISSING - HIGH PRIORITY)

**Status**: ⚠️ **MISSING IMPLEMENTATION** - Called but endpoint doesn't exist

**Overview:**
The code attempts to send emails through `/api/erpnext/send-email` endpoint, but this API route file does not exist in the repository. This is a broken integration that will fail silently.

**Files Calling This Endpoint:**
- `app/msds/page.tsx` (Lines 378-393, 446-460, 1229-1253)
  - Sends MSDS approval emails
  - Sends MSDS rejection emails  
  - Sends "additional information required" emails

**Email Details:**
- **To**: `submission.customerEmail || 'customer@example.com'`
- **From**: **UNKNOWN** (endpoint doesn't exist)
- **Subject Examples**:
  - `✅ MSDS Approved: {productName}`
  - `❌ MSDS Rejected: {productName}`
  - `Additional Information Required: {productName}`
- **Provider**: ERPNext API (assumed, but endpoint missing)

**Code References:**
```378:393:app/msds/page.tsx
        await fetch('/api/erpnext/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: submission.customerEmail || 'customer@example.com',
            subject: `✅ MSDS Approved: ${submission.extractedData?.productName || 'MSDS'}`,
            message: `
              <h2>Your MSDS has been approved!</h2>
              <p><strong>Product:</strong> ${submission.extractedData?.productName || 'N/A'}</p>
              <p><strong>CAS Number:</strong> ${submission.extractedData?.casNumber || 'N/A'}</p>
              <p>This chemical has been added to our database.</p>
            `,
            reference_doctype: 'Item',
            reference_name: saveResult.itemId || ''
          })
        })
```

**Recommendation**: 
- **URGENT REVIEW** - This endpoint is being called but doesn't exist
- **Option A**: Create the endpoint at `app/api/erpnext/send-email/route.ts` if you want email functionality
- **Option B**: Remove all calls to this endpoint if email is not needed
- **If implementing**: Ensure proper SPF/DKIM/DMARC configuration for `scsflex.com` domain

---

### 2. Notification Service Email Channel (STUBBED - LOW RISK)

**Status**: ✅ **STUBBED** - Email channel exists but only logs to console

**Overview:**
The notification service has email channel support, but it only logs to console and doesn't actually send emails. This is safe from a deliverability perspective.

**File:**
- `lib/services/notifications/notificationService.ts` (Lines 268-271)

**Email Details:**
- **From**: **UNKNOWN** (not implemented)
- **Channel**: `'email'` (but only logs)
- **Provider**: None (stubbed)

**Code Reference:**
```268:271:lib/services/notifications/notificationService.ts
    // Handle other channels (email, SMS, etc.) - would integrate with external services
    if (notification.channel === 'email') {
      console.log('Would send email notification:', newNotification.message)
    }
```

**Recommendation**: 
- **KEEP & FIX CONFIG** - If you want email notifications, implement actual email sending here
- **If implementing**: Use a proper email service (SendGrid, Mailgun, AWS SES) with proper domain configuration
- **Current status is safe** - no emails are being sent

---

### 3. ERPNext API Authentication (ACTIVE - MEDIUM RISK)

**Status**: ⚠️ **ACTIVE** - Uses `scsflex.com` email for ERPNext login

**Overview:**
The ERPNext API adapter uses `b.albayaty@scsflex.com` as the authentication email when logging into ERPNext. This is used for API authentication, not for sending emails, but it's a reference to your domain.

**File:**
- `lib/adapters/erpnext/api.ts` (Line 10)

**Email Details:**
- **Email**: `b.albayaty@scsflex.com` (hardcoded fallback)
- **Environment Variable**: `ERP_NEXT_API_KEY` (can override)
- **Usage**: ERPNext API authentication/login
- **Provider**: ERPNext (https://erp.hazalyze.com or https://erp.scsflex.com)

**Code Reference:**
```9:11:lib/adapters/erpnext/api.ts
const ERP_URL = process.env.ERP_NEXT_API_URL || "https://erp.hazalyze.com";
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY || "b.albayaty@scsflex.com";
const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET || "Bashir@2025";
```

**Security Concern:**
- ⚠️ **Hardcoded password** in code: `"Bashir@2025"` (Line 11)
- ⚠️ This should be moved to environment variables immediately

**Recommendation**: 
- **KEEP & FIX CONFIG** - This is for authentication, not email sending
- **URGENT**: Remove hardcoded password from code, use environment variable only
- **Verify**: Ensure ERPNext instance is properly configured for email sending if it sends emails on your behalf

---

### 4. Intelligent Orchestration Communications (STUBBED - LOW RISK)

**Status**: ✅ **STUBBED** - Communication functions exist but don't send emails

**Overview:**
The intelligent orchestration engine has communication functions, but they only log to memory and don't actually send emails.

**File:**
- `data/intelligentOrchestrationEngine.ts` (Lines 482-524)

**Email Details:**
- **From**: **UNKNOWN** (not implemented)
- **Channel**: Supports multiple channels including email, but implementation is stubbed
- **Provider**: None (in-memory logging only)

**Code Reference:**
```502:524:data/intelligentOrchestrationEngine.ts
export async function sendNotification(
  recipient: CommunicationRecipient,
  templateId: string,
  data: Record<string, any>
): Promise<CommunicationLog> {
  // Generate message from template
  const message = `Alert: ${data.message || 'System notification'}` // Would use template
  
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

**Recommendation**: 
- **KEEP & FIX CONFIG** - Safe as-is, but if implementing, ensure proper email configuration
- **Current status is safe** - no emails are being sent

---

## Hardcoded Email Addresses Found

### `@scsflex.com` Domain References

| File | Line | Email Address | Context | Risk |
|------|------|--------------|---------|------|
| `lib/adapters/erpnext/api.ts` | 10 | `b.albayaty@scsflex.com` | ERPNext API auth (fallback) | ⚠️ MEDIUM |
| `data/flexLogisticsCustomer.ts` | 101 | `b.albayaty@scsflex.com` | Customer contact (mock data) | ✅ LOW |
| `data/flexLogisticsCustomer.ts` | 109 | `finance@scsflex.com` | Billing contact (mock data) | ✅ LOW |
| `data/flexLogisticsCustomer.ts` | 118 | `warehouse@scsflex.com` | Warehouse contact (mock data) | ✅ LOW |
| `app/my-tasks/page.tsx` | 36 | `b.albayaty@scsflex.com` | User email fallback | ✅ LOW |
| `app/msds/page.tsx` | 368, 371, 438, 441 | `b.albayaty@scsflex.com` | Approval tracking (mock data) | ✅ LOW |

**Analysis:**
- Most references are in **mock/test data** files (`data/flexLogisticsCustomer.ts`)
- One reference is used for **ERPNext authentication** (needs environment variable)
- No actual email sending is happening from these addresses

**Recommendation**: 
- Replace hardcoded email in `lib/adapters/erpnext/api.ts` with environment variable only (remove fallback)
- Mock data emails are fine for development, but consider using test domains in production

---

## Environment Variables Analysis

### Email-Related Environment Variables Found

| Variable Name | File | Usage | Status |
|--------------|------|-------|--------|
| `ERP_NEXT_API_KEY` | `lib/adapters/erpnext/api.ts` | ERPNext login email | ⚠️ Has hardcoded fallback |
| `ERP_NEXT_API_SECRET` | `lib/adapters/erpnext/api.ts` | ERPNext login password | ⚠️ Has hardcoded fallback |
| `ERP_NEXT_API_URL` | `lib/adapters/erpnext/api.ts` | ERPNext API URL | ✅ Safe |
| `ERP_NEXT_URL` | `app/api/erpnext/save-msds/route.ts` | ERPNext URL | ✅ Safe |

### Missing Environment Variables (If Email Functionality is Added)

If you plan to implement email sending, you'll need:
- `SMTP_HOST` / `MAIL_HOST`
- `SMTP_PORT` / `MAIL_PORT`
- `SMTP_USER` / `MAIL_USERNAME`
- `SMTP_PASS` / `MAIL_PASSWORD`
- `MAIL_FROM` / `EMAIL_FROM` (e.g., `noreply@scsflex.com`)
- `SENDGRID_API_KEY` (if using SendGrid)
- `MAILGUN_API_KEY` (if using Mailgun)
- `AWS_SES_REGION` / `AWS_SES_ACCESS_KEY` (if using AWS SES)

**Current Status**: ✅ **No email environment variables found** - Good, means no email is configured

---

## Email Libraries Analysis

### Dependencies Checked

**Result**: ✅ **NO EMAIL-SENDING LIBRARIES FOUND**

Checked `package.json` for:
- ❌ `nodemailer` - Not found
- ❌ `@sendgrid/mail` - Not found
- ❌ `mailgun-js` - Not found
- ❌ `aws-sdk` (SES) - Not found
- ❌ `resend` - Not found
- ❌ `postmark` - Not found
- ❌ `emailjs` - Not found
- ❌ Any SMTP transport libraries - Not found

**Conclusion**: No email-sending libraries are installed, confirming that no emails are being sent from this codebase.

---

## Suspicious/Legacy Patterns

### 1. Missing API Endpoint Called Multiple Times
- **Pattern**: Code calls `/api/erpnext/send-email` but endpoint doesn't exist
- **Impact**: Silent failures, emails never sent
- **Files**: `app/msds/page.tsx` (3 locations)
- **Recommendation**: Either implement the endpoint or remove the calls

### 2. Hardcoded Credentials
- **Pattern**: Password hardcoded in `lib/adapters/erpnext/api.ts`
- **Impact**: Security risk if code is exposed
- **Recommendation**: Remove hardcoded password immediately, use environment variable only

### 3. Stubbed Email Functionality
- **Pattern**: Email channels exist but only log to console
- **Impact**: No emails sent, but code suggests email capability
- **Recommendation**: Document that email is not implemented, or implement properly

### 4. Multiple ERP URLs
- **Pattern**: References to both `erp.hazalyze.com` and `erp.scsflex.com`
- **Files**: 
  - `lib/adapters/erpnext/api.ts`: `https://erp.hazalyze.com`
  - `data/flexLogisticsCustomer.ts`: `https://erp.scsflex.com`
- **Recommendation**: Standardize on one ERP URL

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **🔴 URGENT: Remove Hardcoded Password**
   - File: `lib/adapters/erpnext/api.ts` Line 11
   - Remove: `"Bashir@2025"` fallback
   - Use: Environment variable only

2. **🔴 URGENT: Fix Missing Email Endpoint**
   - Either create `app/api/erpnext/send-email/route.ts`
   - Or remove all calls to `/api/erpnext/send-email` from `app/msds/page.tsx`

3. **🟡 MEDIUM: Remove Hardcoded Email Fallback**
   - File: `lib/adapters/erpnext/api.ts` Line 10
   - Remove: `"b.albayaty@scsflex.com"` fallback
   - Use: Environment variable only (fail if not set)

### If Implementing Email Functionality

4. **🟢 LOW: Choose Email Provider**
   - Recommended: SendGrid, Mailgun, or AWS SES
   - Set up SPF, DKIM, and DMARC records for `scsflex.com`
   - Configure "From" address (e.g., `noreply@scsflex.com`)

5. **🟢 LOW: Implement Notification Service Email Channel**
   - File: `lib/services/notifications/notificationService.ts`
   - Replace console.log with actual email sending
   - Use environment variables for configuration

6. **🟢 LOW: Standardize ERP URLs**
   - Decide on single ERP URL (`erp.hazalyze.com` or `erp.scsflex.com`)
   - Update all references consistently

### If NOT Implementing Email Functionality

7. **🟡 MEDIUM: Clean Up Email References**
   - Remove calls to `/api/erpnext/send-email`
   - Document that email is not implemented
   - Consider removing email channel from notification service

---

## SPF/DKIM/DMARC Recommendations

Since no active email sending is happening, you have time to properly configure:

1. **SPF Record**: Add to DNS for `scsflex.com`
   ```
   v=spf1 include:_spf.google.com include:sendgrid.net ~all
   ```
   (Adjust based on your email provider)

2. **DKIM**: Configure with your email provider
   - Generate DKIM keys
   - Add DNS records as provided by provider

3. **DMARC**: Start with monitoring mode
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@scsflex.com
   ```
   - Monitor for 30 days
   - Gradually tighten policy

4. **Verify**: Use tools like:
   - https://mxtoolbox.com/spf.aspx
   - https://www.dmarcanalyzer.com/
   - https://dmarcian.com/dmarc-inspector/

---

## Conclusion

**Current Status**: ✅ **SAFE** - No emails are being sent from this codebase

**Main Concerns**:
1. Missing email endpoint that's being called (will fail silently)
2. Hardcoded credentials (security risk)
3. Hardcoded email addresses (should use environment variables)

**Action Items**:
1. Remove hardcoded password immediately
2. Either implement or remove the missing email endpoint
3. Replace hardcoded email with environment variable
4. If implementing email: Set up proper SPF/DKIM/DMARC first

**Risk Assessment**: **LOW-MEDIUM**
- Low risk because no emails are actually being sent
- Medium risk because there are broken integrations and security issues (hardcoded credentials)

---

## Appendix: File Inventory

### Files with Email References

1. `app/msds/page.tsx` - Calls missing email endpoint (3 locations)
2. `lib/adapters/erpnext/api.ts` - ERPNext auth with hardcoded email/password
3. `lib/services/notifications/notificationService.ts` - Stubbed email channel
4. `data/intelligentOrchestrationEngine.ts` - Stubbed communication functions
5. `data/flexLogisticsCustomer.ts` - Mock customer data with email addresses
6. `app/my-tasks/page.tsx` - User email fallback
7. `app/api/erpnext/save-msds/route.ts` - ERPNext URL reference

### Files Checked But No Email Found

- `package.json` - No email libraries
- All API routes (except missing send-email)
- All service files
- All component files
- Environment files (none found)

---

**Report Generated**: 2025-01-27
**Auditor**: Security & Email Deliverability Audit
**Scope**: Entire codebase (excluding node_modules, .next, dist)

