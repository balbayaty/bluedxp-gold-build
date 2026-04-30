# ETW Module - Operator Manual

## Overview

The Flex Smart e-Waybill (ETW) module is a production-grade system for managing electronic waybills across various transport scenarios:
- **Local** (within city) transport
- **Inter-city** domestic (KSA) shipments
- **Cross-border** shipments
- **Multimodal** legs (Road/Sea/Rail/Air combinations)

## Key Features

### 1. Evidence-Grade Chain of Custody
- Every ETW is a legally and operationally auditable artifact
- Immutable event logs for all custody changes
- Digital signatures and cryptographic verification
- Complete audit trail with who, what, when tracking

### 2. Dual-Purpose Design
- **Human-readable UI**: Full-featured web interface with dark/light themes
- **Machine-readable JSON**: Canonical data model for API integration

### 3. Multi-Tenant Architecture
- Multiple customers and operations teams
- Role-based access control (11 roles supported)
- Tenant isolation enforced at database level

### 4. Policy-Driven Rules Engine
- Declarative rules control required fields based on:
  - Transport scope (local/intercity/cross-border/multimodal)
  - Transport mode (air/sea/land/rail)
  - Cargo class (hazardous/non-hazardous)
  - Permit requirements
  - Compliance flags

### 5. Arabic/English i18n
- Full UI translation support
- RTL (Right-to-Left) layout for Arabic
- Language toggle in UI

### 6. Print-Ready PDFs
- A4 format optimized for printing
- Mono-printer safe
- Includes all sections and verification data

### 7. World-Class QR Verification
- Cryptographic verification (SHA-256 hash + Ed25519 signature)
- Token-based access (short token, not full data)
- Access policies (public/customer/authority/restricted)
- Tamper detection
- Offline robustness
- Forensics and abuse detection
- Proof bundle generation

### 8. Intelligence Services
- Delay range predictions
- Detention exposure calculations
- Permit processing ETA
- Milestone timeline estimates
- Pluggable strategy pattern for multiple data sources

## User Roles

The ETW module supports the following roles:

1. **Admin**: Full access to all ETW operations
2. **Ops**: Create, edit, and manage ETWs
3. **CustomerViewer**: Read-only access to customer-facing ETWs
4. **Driver**: Add events and update ETW status
5. **ComplianceOfficer**: Manage permits and compliance
6. **Auditor**: Read-only access for audit purposes

## Quick Start

### 1. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 2. Seed Demo Data

```bash
# Create 4 example ETWs (local, inter-city, cross-border, multimodal)
curl -X POST http://localhost:3002/api/etw/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Access ETW Module

Navigate to: `http://localhost:3002/etw`

## Common Operations

### Creating an ETW

1. Click "Create e-Waybill" button
2. Fill in required fields:
   - Transport scope (Local/Inter-city/Cross-border/Multimodal)
   - Transport mode (Air/Sea/Land/Rail/Multimodal)
   - Parties (Shipper, Consignee, Carrier, Broker)
   - Cargo details (items, weights, values)
   - Route (origin, destination, borders, ports)
   - Commercial terms
3. Click "Create e-Waybill"

### Adding Events (Chain of Custody)

1. Open ETW detail page
2. Scroll to "Event Timeline" section
3. Click "Add Event"
4. Select event type:
   - `PICKED_UP`: Cargo picked up from origin
   - `IN_TRANSIT`: Cargo in transit
   - `BORDER_CROSSING`: Crossed border checkpoint
   - `PORT_ARRIVAL`: Arrived at port
   - `PORT_DEPARTURE`: Departed from port
   - `HANDOVER`: Handed over to next carrier (multimodal)
   - `DELIVERED`: Delivered to consignee
   - `EXCEPTION`: Exception occurred
5. Add location (GPS coordinates or address)
6. Add verification method (GPS, Signature, OTP, etc.)
7. Save event

### Generating QR Code

1. Open ETW detail page
2. Scroll to "Digital Verification" section
3. Click "Generate QR Code"
4. Select access policy:
   - `PUBLIC`: Anyone with token can verify
   - `CUSTOMER`: Only customer can verify
   - `AUTHORITY`: Only authorities can verify
   - `RESTRICTED`: One-time access only
5. Set expiration (default: 365 days)
6. QR code and verification URL will be generated

### Verifying ETW

**Internal Verification:**
1. Open ETW detail page
2. Click "Verify Document" button
3. View verification result (Verified/Tampered/Pending)

**Public Verification:**
1. Share verification URL: `https://your-domain.com/v/{token}`
2. Recipient opens URL in browser
3. System displays verification status and ETW details (based on access policy)

### Exporting PDF

1. Open ETW detail page
2. Click "Download PDF" button
3. PDF will be generated with all ETW sections
4. Options available:
   - Include QR code
   - Include digital signature
   - Language (English/Arabic)

### Exporting Proof Bundle

1. Open ETW detail page
2. Click "Export Proof Bundle" (if available)
3. ZIP file will be generated containing:
   - ETW JSON data
   - Digital signature
   - Event logs
   - PDF document
   - Timestamp

### Reporting Exceptions

1. Open ETW detail page
2. Click "Report Exception" button
3. Fill in exception details:
   - Exception type
   - Description
   - Severity
   - Affected parties
4. Exception will be linked to ETW and create CAPA/NCR record

## API Endpoints

### ETW Management

- `GET /api/etw` - List ETWs (with filters)
- `POST /api/etw` - Create ETW
- `GET /api/etw/[id]` - Get ETW by ID
- `PUT /api/etw/[id]` - Update ETW
- `DELETE /api/etw/[id]` - Delete ETW

### Events

- `GET /api/etw/[id]/events` - List events for ETW
- `POST /api/etw/[id]/events` - Add event

### QR Verification

- `POST /api/etw/[id]/qr` - Generate QR token
- `POST /api/etw/[id]/verify` - Verify ETW (internal)
- `GET /api/v/[token]` - Public verification endpoint

### Export

- `GET /api/etw/[id]/export/pdf` - Export PDF
- `GET /api/etw/[id]/export/proof-bundle` - Export proof bundle

### Intelligence

- `GET /api/etw/[id]/intelligence` - Get intelligence data (delays, detention, milestones)

### Seed Data

- `POST /api/etw/seed` - Create seed data (development only)

## Integration Points

The ETW module integrates with:

1. **Shipment Module**: Link ETW to shipments
2. **Invoice Module**: Generate invoices from ETW
3. **POD Module**: Link proof of delivery documents
4. **MSDS (Hazalyze) Module**: Link material safety data sheets
5. **Permits Module**: Link regulatory permits
6. **Exceptions/CAPA Module**: Link exceptions and corrective actions
7. **WhatsApp Location**: Optional event source for location updates

## Troubleshooting

### ETW Not Appearing in List

- Check tenant ID matches your user's tenant
- Verify ETW status (draft ETWs may be filtered)
- Check user permissions (role-based access)

### QR Verification Failing

- Ensure ETW has been finalized (not in DRAFT status)
- Check token expiration date
- Verify token hasn't been revoked
- Check access policy matches user role

### PDF Generation Failing

- Ensure ETW has all required data
- Check PDF service is properly configured
- Verify jsPDF library is installed

### Events Not Saving

- Check user has permission to add events
- Verify event type is valid
- Ensure location data is provided
- Check tenant ID matches

## Security Considerations

1. **API Keys**: Never hardcode API keys. Use environment variables.
2. **Tenant Isolation**: Always verify tenant ID in API calls.
3. **Role-Based Access**: Check user permissions before operations.
4. **Token Expiration**: QR tokens expire after set period. Regenerate if needed.
5. **Tamper Detection**: System automatically detects ETW tampering.
6. **Audit Logging**: All operations are logged for compliance.

## Best Practices

1. **Complete Data Entry**: Fill all required fields before finalizing ETW
2. **Regular Event Updates**: Add events promptly for accurate chain of custody
3. **QR Code Management**: Generate QR codes only when ETW is finalized
4. **Exception Reporting**: Report exceptions immediately for faster resolution
5. **PDF Archiving**: Export and archive PDFs for record-keeping
6. **Regular Verification**: Periodically verify ETWs to ensure integrity

## Support

For issues or questions:
1. Check this manual first
2. Review API documentation
3. Check system logs
4. Contact system administrator

## Version History

- **v1.0.0** (Current): Initial production release
  - Full ETW CRUD operations
  - QR verification system
  - PDF export
  - Event timeline
  - Intelligence services
  - Multi-tenant support
  - Arabic/English i18n




