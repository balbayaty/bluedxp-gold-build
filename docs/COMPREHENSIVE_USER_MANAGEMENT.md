# 🔐 Comprehensive User Management System

## Overview

The Hazalyze platform features the **most advanced, flexible, and resilient user management system** in the industry. It integrates seamlessly with APIs, AI Agents, Billing, Compliance, and Security - providing complete control and visibility.

---

## 🌟 Key Features

### 1. **Hierarchical Permission System**
- **Module Level** - Control access to entire modules (WMS, TMS, ISO-IMS, etc.)
- **Feature Level** - Control access to specific features within modules
- **Tab Level** - Control access to specific tabs within features
- **Action Level** - Granular control over specific actions (read, write, delete, approve, etc.)
- **Field Level** - Partial edit permissions (can edit specific fields only)
- **Time-Based** - Restrict access based on time of day or day of week

### 2. **API Key & Token Management**
- **Secure Generation** - Cryptographically secure API key generation
- **Key Rotation** - Automatic and manual key rotation
- **Rate Limiting** - Per-key rate limits (requests per minute/hour/day)
- **Usage Quotas** - API call quotas, data transfer limits, storage limits
- **IP Whitelisting** - Restrict API access to specific IP addresses
- **CORS Configuration** - Control allowed origins
- **Token Management** - Bearer tokens, JWT, OAuth2, Session tokens
- **Webhook Management** - Event subscriptions with retry policies

### 3. **AI Agent Access Control**
- **Agent Permissions** - Control which agents each user can access
- **Action Restrictions** - Allow/restrict specific agent actions
- **Rate Limiting** - Max actions per hour/day
- **Budget Limits** - Cost and token limits per agent
- **Approval Workflows** - Require approval for sensitive agent actions
- **Usage Tracking** - Track agent usage and costs

### 4. **Usage Tracking & Billing**
- **Real-Time Tracking** - Track API calls, agent actions, storage, compute, data transfer
- **Usage Metrics** - Detailed metrics with timestamps and metadata
- **Usage Quotas** - Hourly, daily, monthly, yearly quotas
- **Cost Calculation** - Automatic cost calculation per metric
- **Billing Tiers** - Flexible pricing tiers with included quotas
- **Overage Handling** - Configurable overage rates
- **Invoice Generation** - Automatic invoice generation
- **Payment Tracking** - Payment status and history

### 5. **Global Compliance**
- **GDPR Compliance** (EU)
  - Consent management
  - Right to be forgotten
  - Data portability
  - Data retention policies
  - Privacy by design
  
- **CCPA Compliance** (California)
  - Opt-out of sale
  - Do not sell requests
  - Privacy rights
  
- **PIPEDA Compliance** (Canada)
  - Consent requirements
  - Data protection
  
- **LGPD Compliance** (Brazil)
  - Data subject rights
  - Consent management
  
- **HIPAA Compliance** (Healthcare)
  - Protected health information
  - Security controls
  
- **SOC 2 Compliance**
  - Security controls
  - Availability
  - Processing integrity
  
- **ISO 27001 Compliance**
  - Information security management

### 6. **Security Features**
- **Two-Factor Authentication** - TOTP, SMS, Email, Hardware keys
- **Password Policies** - Configurable password requirements
- **Session Management** - Session timeout and management
- **Failed Login Protection** - Account lockout after failed attempts
- **Security Events** - Real-time security event tracking
- **Audit Logging** - Comprehensive audit trail
- **IP Tracking** - Track IP addresses for all actions
- **Location Tracking** - Geographic location tracking

### 7. **Audit & Compliance Logging**
- **Comprehensive Logging** - All user actions logged
- **Event Categories** - Authentication, Authorization, Data Access, Configuration, Compliance, Billing
- **Search & Filter** - Search audit logs by user, event type, date range
- **Export** - Export audit logs for compliance
- **Retention** - Configurable retention periods

---

## 📋 User Management Tabs

### 1. **Profile Tab**
- Basic user information
- Role and status management
- Statistics (API calls, agent actions, costs)
- Last activity tracking

### 2. **Permissions Tab**
- Hierarchical permission management
- Module/Feature/Tab tree view
- Granular action control
- Scope configuration

### 3. **API Keys Tab**
- Create/manage API keys
- View key usage
- Revoke keys
- Configure rate limits and quotas

### 4. **Agents Tab**
- Enable/disable agents per user
- Configure agent permissions
- Set rate limits and budgets
- Track agent usage

### 5. **Usage Tab**
- View usage metrics
- Filter by type, resource, date
- Export usage data
- Usage analytics

### 6. **Billing Tab**
- View invoices
- Payment history
- Billing tier information
- Cost breakdown

### 7. **Compliance Tab**
- GDPR consent management
- CCPA opt-out
- Data rights (export, deletion)
- Terms acceptance
- Privacy settings

### 8. **Security Tab**
- Two-factor authentication
- Security events
- Password management
- Session management

### 9. **Audit Logs Tab**
- View all user actions
- Filter by event type
- Search functionality
- Export logs

---

## 🔧 Integration Points

### API Gateway Integration
- All API calls authenticated via API keys
- Rate limiting enforced at gateway level
- Usage tracking automatic
- IP whitelisting enforced

### Agent Framework Integration
- Agent access controlled per user
- Agent actions tracked and billed
- Budget limits enforced
- Approval workflows integrated

### Billing System Integration
- Usage metrics automatically sent to billing
- Invoices generated automatically
- Payment processing integrated
- Cost alerts and notifications

### Compliance System Integration
- Consent records stored
- Terms acceptance tracked
- Data retention enforced
- Right to be forgotten processed

---

## 🛡️ Security Best Practices

1. **API Keys**
   - Never store plain text keys
   - Always hash keys (SHA-256)
   - Rotate keys regularly (90 days)
   - Use different keys for different environments

2. **Passwords**
   - Minimum 12 characters
   - Require uppercase, lowercase, numbers, special characters
   - Enforce password history
   - Require regular password changes

3. **Two-Factor Authentication**
   - Enable for all admin accounts
   - Use TOTP apps (Google Authenticator, Authy)
   - Store backup codes securely
   - Require 2FA for sensitive operations

4. **Audit Logging**
   - Log all authentication attempts
   - Log all data access
   - Log all configuration changes
   - Retain logs for compliance period

5. **Data Privacy**
   - Encrypt sensitive data at rest
   - Encrypt data in transit (TLS)
   - Implement data retention policies
   - Process deletion requests promptly

---

## 📊 Usage Examples

### Creating an API Key
```typescript
import { createAPIKey } from '@/utils/apiKeyManager'

const { apiKey, plainKey } = createAPIKey(
  userId,
  tenantId,
  'Production API Key',
  'Key for production environment',
  {
    permissions: [...],
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    quotas: {
      apiCallsPerMonth: 100000,
      dataTransferPerMonth: 10000, // MB
    },
  }
)

// Store plainKey securely (only shown once)
// Store apiKey in database
```

### Tracking Usage
```typescript
import { trackAPICall, trackAgentAction } from '@/utils/usageTracker'

// Track API call
const metric = trackAPICall(userId, tenantId, 'api.inventory.get', 0.001)

// Track agent action
const agentMetric = trackAgentAction(
  userId,
  tenantId,
  'inventory-agent',
  'optimize-stock',
  1000, // tokens used
  0.01
)
```

### Managing Compliance
```typescript
import { createGDPRConsent, canExportData } from '@/utils/complianceManager'

// Create GDPR consent
const consent = createGDPRConsent(
  userId,
  tenantId,
  'privacy-policy-v1',
  '1.0',
  {
    marketingConsent: true,
    analyticsConsent: true,
  }
)

// Check if user can export data
if (canExportData(user.dataPrivacy)) {
  // Export user data
}
```

---

## 🌍 Global Compliance Standards

### GDPR (General Data Protection Regulation)
- **Applicable**: EU, EEA
- **Requirements**:
  - Explicit consent for data processing
  - Right to access personal data
  - Right to rectification
  - Right to erasure (right to be forgotten)
  - Right to data portability
  - Right to object to processing
  - Data breach notification
  - Privacy by design and by default

### CCPA (California Consumer Privacy Act)
- **Applicable**: California, USA
- **Requirements**:
  - Right to know what data is collected
  - Right to delete personal information
  - Right to opt-out of sale
  - Non-discrimination for exercising rights
  - Disclosure of data collection practices

### PIPEDA (Personal Information Protection and Electronic Documents Act)
- **Applicable**: Canada
- **Requirements**:
  - Consent for collection, use, disclosure
  - Purpose limitation
  - Data minimization
  - Accuracy
  - Safeguards
  - Openness
  - Individual access
  - Challenging compliance

### LGPD (Lei Geral de Proteção de Dados)
- **Applicable**: Brazil
- **Requirements**:
  - Consent for processing
  - Right to access
  - Right to correction
  - Right to deletion
  - Right to data portability
  - Right to information about sharing
  - Right to revoke consent

### HIPAA (Health Insurance Portability and Accountability Act)
- **Applicable**: USA (Healthcare)
- **Requirements**:
  - Administrative safeguards
  - Physical safeguards
  - Technical safeguards
  - Breach notification
  - Business associate agreements

### SOC 2 (Service Organization Control 2)
- **Applicable**: Global (Cloud services)
- **Requirements**:
  - Security
  - Availability
  - Processing integrity
  - Confidentiality
  - Privacy

### ISO 27001 (Information Security Management)
- **Applicable**: Global
- **Requirements**:
  - Information security management system
  - Risk assessment and treatment
  - Security controls
  - Continuous improvement

---

## 📝 Disclaimers & Legal

### Terms of Service
- Service availability disclaimers
- Limitation of liability
- Intellectual property rights
- User responsibilities
- Termination clauses

### Privacy Policy
- Data collection practices
- Data usage and sharing
- Cookie policy
- Third-party services
- Data retention
- User rights

### Data Processing Agreement
- Data controller/processor roles
- Processing purposes
- Security measures
- Data breach procedures
- Sub-processors

### Service Level Agreement (SLA)
- Uptime guarantees
- Performance metrics
- Support response times
- Service credits
- Exclusions

---

## 🚀 Getting Started

1. **Access User Management**
   - Navigate to Settings → Users
   - Click the shield icon (permissions) for any user

2. **Configure Permissions**
   - Go to Permissions tab
   - Expand modules/features
   - Assign permissions at desired level

3. **Create API Keys**
   - Go to API Keys tab
   - Click "Create API Key"
   - Configure permissions and limits
   - Save the key securely (shown only once)

4. **Enable Agents**
   - Go to Agents tab
   - Enable desired agents
   - Configure permissions and limits

5. **Set Up Compliance**
   - Go to Compliance tab
   - Accept required terms
   - Configure privacy settings

6. **Enable Security**
   - Go to Security tab
   - Enable two-factor authentication
   - Review security events

---

## 📚 Related Documentation

- [Permission System Guide](./PERMISSION_SYSTEM_GUIDE.md)
- [API Documentation](../integration/api/README.md)
- [Agent Framework Documentation](../agents/README.md)
- [Billing Documentation](../billing/README.md)
- [Security Policy](../../SECURITY.md)

---

**Last Updated**: $(Get-Date -Format 'yyyy-MM-dd')
**Version**: 1.0.0
**Status**: Production Ready ✅

