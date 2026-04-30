# Rabet.sa Integration Guide

## Overview

Rabet.sa is the official Saudi Arabia government platform (ELM - Electronic Government Services) that provides unified access to government services and APIs. This document outlines the integration requirements and architecture for connecting Hazalyze Platform with Rabet.sa services.

## 🔗 Official Resources

- **Website**: https://www.rabet.sa/
- **API Portal**: [To be discovered]
- **Documentation**: [To be discovered]
- **Developer Portal**: [To be discovered]

---

## 🎯 Integration Objectives

### Primary Goals
1. **Compliance**: Ensure all government-required integrations are supported
2. **Unified Access**: Single integration point for all Saudi government services
3. **Future-Proof**: Architecture ready for all Rabet.sa tools and services
4. **Security**: Enterprise-grade security for government API access
5. **Scalability**: Support for all current and future Rabet.sa services

---

## 🏗️ Architecture Design

### Integration Layer Structure

```
┌─────────────────────────────────────────┐
│         Hazalyze Platform               │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Rabet.sa Adapter Layer             │
│  ┌──────────────────────────────────┐  │
│  │  Authentication & Authorization  │  │
│  │  - OAuth 2.0 / SAML              │  │
│  │  - API Key Management            │  │
│  │  - Certificate-based Auth        │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Service Discovery & Routing      │  │
│  │  - Service Registry              │  │
│  │  - API Versioning                 │  │
│  │  - Endpoint Management            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Request/Response Handling       │  │
│  │  - Request Transformation        │  │
│  │  - Response Parsing              │  │
│  │  - Error Handling                │  │
│  │  - Retry Logic                   │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Rabet.sa Platform               │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Service  │  │ Service  │  │ ...  │ │
│  │   1      │  │   2      │  │      │ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
```

---

## 📋 Services to Integrate

### Discovered Rabet.sa Services

Based on reverse engineering of https://www.rabet.sa/, the following services are available:

#### 1. Digital Identity Services
- **Nuha** - Digital identity verification service
- **Nafath** - National authentication service
- **Mobile Verification** - Mobile number verification
- **IBAN Verification** - Bank account verification
- **Zawil** - Digital identity management

#### 2. Business Solutions
- **Dhamen** - Business guarantee/insurance services
- **Ajer** - Business registration and licensing
- **Smart Gate** - Automated business services gateway
- **Oqoud** - Contract management services
- **Wael** - Business information services

#### 3. Mobility Services
- Transportation and mobility-related services
- Public transport integration
- Mobility permits and licenses

#### 4. Vehicle Services
- Vehicle registration
- Driver license services
- Vehicle-related permits
- Vehicle information verification

#### 5. Import & Trade Services
- **Import Info** - Import documentation and tracking
- Customs clearance services
- Trade permits
- Import/export documentation

#### 6. Safety & Security Services
- Safety certifications
- Security clearances
- Compliance verification
- Safety permits

#### 7. Financial Sector Services
- Financial services integration
- Banking services
- Financial compliance
- Payment gateway services

### Additional Services (From Legacy Portal)

From https://legacy.rabet.sa/services, additional services include:

#### Customs & Trade
- Customs clearance APIs
- Import/export documentation
- Trade permit management

#### Labor & Employment
- Work permit services
- Employee registration
- Labor compliance verification

#### Real Estate & Property
- Property registration
- Land records access
- Building permits

#### Utilities & Infrastructure
- Utility service connections
- Infrastructure permits
- Service registrations

---

## 🔐 Authentication & Security

### Authentication Methods (To be Confirmed)

#### Option 1: OAuth 2.0
```typescript
// Expected flow
1. Redirect to Rabet.sa authorization endpoint
2. User authenticates with government credentials
3. Receive authorization code
4. Exchange code for access token
5. Use token for API requests
```

#### Option 2: API Key + Certificate
```typescript
// Expected flow
1. Register application on Rabet.sa developer portal
2. Receive API key and client certificate
3. Use certificate for mTLS authentication
4. Include API key in requests
```

#### Option 3: SAML 2.0
```typescript
// Expected flow
1. Configure SAML identity provider
2. User SSO through Rabet.sa
3. Receive SAML assertion
4. Use assertion for API access
```

### Security Requirements

- ✅ **HTTPS Only**: All API calls must use TLS 1.3
- ✅ **Certificate Pinning**: Pin Rabet.sa certificates
- ✅ **Token Encryption**: Encrypt tokens at rest
- ✅ **Rate Limiting**: Respect API rate limits
- ✅ **Audit Logging**: Log all government API calls
- ✅ **Data Encryption**: Encrypt sensitive data
- ✅ **Compliance**: Follow Saudi data residency laws

---

## 🛠️ Implementation Plan

### Phase 1: Discovery & Research (Week 1)
- [ ] Access Rabet.sa developer portal
- [ ] Review API documentation
- [ ] Identify all available services
- [ ] Understand authentication flow
- [ ] Document API endpoints
- [ ] Test sandbox environment

### Phase 2: Adapter Development (Week 2-3)
- [ ] Create `lib/adapters/rabet/` directory structure
- [ ] Implement authentication adapter
- [ ] Create service discovery mechanism
- [ ] Build request/response transformers
- [ ] Implement error handling
- [ ] Add retry logic and circuit breaker

### Phase 3: Service Integration (Week 4+)
- [ ] Integrate priority services (one by one)
- [ ] Create service-specific adapters
- [ ] Implement caching layer
- [ ] Add monitoring and logging
- [ ] Create integration tests

### Phase 4: Production Ready (Week 6+)
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation
- [ ] Training materials
- [ ] Production deployment

---

## 📁 File Structure

```
lib/
└── adapters/
    └── rabet/
        ├── index.ts                 # Main adapter export
        ├── auth/
        │   ├── oauth.ts            # OAuth 2.0 implementation
        │   ├── saml.ts             # SAML implementation
        │   ├── certificate.ts      # Certificate-based auth
        │   └── tokenManager.ts     # Token management
        ├── services/
        │   ├── registry.ts         # Service registry
        │   ├── business.ts         # Business services
        │   ├── customs.ts          # Customs services
        │   ├── tax.ts              # Tax services
        │   ├── labor.ts            # Labor services
        │   └── ...                 # Other services
        ├── client/
        │   ├── httpClient.ts       # HTTP client wrapper
        │   ├── retry.ts            # Retry logic
        │   ├── circuitBreaker.ts   # Circuit breaker
        │   └── cache.ts            # Response caching
        ├── types/
        │   ├── auth.ts             # Auth types
        │   ├── services.ts         # Service types
        │   └── responses.ts        # Response types
        └── utils/
            ├── transformers.ts     # Request/response transformers
            ├── validators.ts       # Input validation
            └── errors.ts           # Error handling
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Rabet.sa Configuration
RABET_API_BASE_URL=https://api.rabet.sa
RABET_API_VERSION=v1
RABET_CLIENT_ID=your-client-id
RABET_CLIENT_SECRET=your-client-secret
RABET_CERTIFICATE_PATH=/path/to/certificate.pem
RABET_CERTIFICATE_KEY_PATH=/path/to/key.pem

# Authentication
RABET_AUTH_TYPE=oauth2  # oauth2, saml, certificate
RABET_AUTH_ENDPOINT=https://auth.rabet.sa/oauth/token
RABET_REDIRECT_URI=https://your-app.com/auth/rabet/callback

# Environment
RABET_ENVIRONMENT=sandbox  # sandbox, production
RABET_TIMEOUT=30000  # 30 seconds
RABET_RETRY_ATTEMPTS=3
```

---

## 💻 Code Examples

### Basic Adapter Usage

```typescript
import { RabetAdapter } from '@/lib/adapters/rabet'

// Initialize adapter
const rabet = new RabetAdapter({
  clientId: process.env.RABET_CLIENT_ID,
  clientSecret: process.env.RABET_CLIENT_SECRET,
  environment: 'sandbox',
})

// Authenticate
await rabet.authenticate()

// Call a service
const businessInfo = await rabet.services.business.getCompanyInfo({
  registrationNumber: '1234567890',
})

// Handle response
console.log(businessInfo)
```

### Service-Specific Integration

```typescript
// Customs service
const customs = rabet.services.customs

// Submit customs declaration
const declaration = await customs.submitDeclaration({
  shipmentId: 'SH123456',
  items: [...],
  documents: [...],
})

// Track customs status
const status = await customs.getStatus(declaration.id)
```

---

## 📊 Monitoring & Logging

### Metrics to Track
- API request count
- Response times
- Error rates
- Token refresh frequency
- Rate limit hits
- Service availability

### Logging Requirements
- All API requests (with sanitized data)
- Authentication events
- Error details
- Performance metrics
- Compliance events

---

## 🧪 Testing Strategy

### Unit Tests
- Adapter initialization
- Authentication flows
- Request transformation
- Response parsing
- Error handling

### Integration Tests
- End-to-end service calls
- Authentication scenarios
- Error scenarios
- Rate limiting
- Retry logic

### Sandbox Testing
- Use Rabet.sa sandbox environment
- Test all services
- Validate responses
- Performance testing

---

## 📚 Documentation Requirements

- [ ] API endpoint documentation
- [ ] Authentication guide
- [ ] Service-specific guides
- [ ] Error code reference
- [ ] Rate limiting guide
- [ ] Best practices
- [ ] Troubleshooting guide

---

## 🔄 Maintenance & Updates

### Regular Tasks
- Monitor API changes
- Update adapters for new services
- Security updates
- Performance optimization
- Documentation updates

### Version Management
- API versioning support
- Backward compatibility
- Deprecation handling
- Migration guides

---

## 🚨 Important Notes

1. **Data Residency**: All data must remain in Saudi Arabia
2. **Compliance**: Follow all Saudi government regulations
3. **Security**: Highest security standards required
4. **Documentation**: Keep documentation updated
5. **Testing**: Thorough testing before production

---

## 📞 Support & Resources

- **Rabet.sa Support**: [To be discovered]
- **Developer Portal**: [To be discovered]
- **API Documentation**: [To be discovered]
- **Status Page**: [To be discovered]

---

## ✅ Next Steps

1. **Immediate**: Research Rabet.sa API documentation
2. **This Week**: Set up sandbox environment
3. **Next Week**: Begin adapter development
4. **Ongoing**: Integrate services as needed

---

**Last Updated**: 2025-01-XX
**Status**: Research Phase
**Priority**: High

