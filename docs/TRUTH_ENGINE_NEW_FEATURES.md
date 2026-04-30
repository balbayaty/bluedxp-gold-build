# Truth Engine - New Features Guide

## Overview

This guide covers the new competitive features added to the Truth Engine:
1. **Multimodal Evidence Verification**
2. **Knowledge Graph Integration**
3. **Real-Time Claim Extraction**

---

## 1. Multimodal Evidence Verification

### Purpose
Verify evidence authenticity across multiple media types (image, video, audio, document) with tampering detection and metadata extraction.

### Services

#### Image Verification
```typescript
import { imageVerificationService } from '@/lib/services/truth-engine'

const result = await imageVerificationService.verifyImage(evidence)
// Returns: ImageVerificationResult with:
// - verified: boolean
// - confidence: number
// - tamperingDetected: boolean
// - ocrText?: string
// - metadata?: {...}
```

#### Video Verification
```typescript
import { videoVerificationService } from '@/lib/services/truth-engine'

const result = await videoVerificationService.verifyVideo(evidence)
// Returns: VideoVerificationResult with:
// - verified: boolean
// - tamperingDetected: boolean
// - frameAnalysis: {...}
// - transcription?: string
```

#### Audio Verification
```typescript
import { audioVerificationService } from '@/lib/services/truth-engine'

const result = await audioVerificationService.verifyAudio(evidence)
// Returns: AudioVerificationResult with:
// - verified: boolean
// - voiceAuthentication: {...}
// - transcription?: string
```

#### Unified Multimodal Verification
```typescript
import { multimodalVerificationService } from '@/lib/services/truth-engine'

// Verify any evidence type
const result = await multimodalVerificationService.verifyEvidence(evidence)

// Batch verify multiple items
const results = await multimodalVerificationService.verifyBatch([evidence1, evidence2])
```

### API Usage

```bash
POST /api/truth-engine/verification
Content-Type: application/json

{
  "evidence": {
    "id": "evidence-1",
    "type": "image",
    "fileUrl": "https://example.com/image.jpg",
    ...
  }
}
```

### Features
- ✅ Deepfake detection (image/video)
- ✅ Tampering detection (manipulation, editing)
- ✅ OCR text extraction
- ✅ Signature and watermark detection
- ✅ Voice authentication
- ✅ Audio-video synchronization
- ✅ Cross-modal validation

---

## 2. Knowledge Graph Integration

### Purpose
Build and query a knowledge graph of entities, events, claims, and evidence relationships for deep insights and path analysis.

### Service

```typescript
import { truthKnowledgeGraphService } from '@/lib/services/truth-engine'

// Build graph from events
const graph = await truthKnowledgeGraphService.buildGraphFromEvents(events)

// Query graph
const result = await truthKnowledgeGraphService.queryGraph({
  entityId: 'shipment-1',
  entityType: 'shipment',
  depth: 2,
  filters: { tenantId: 'tenant-1' }
})

// Find paths between entities
const paths = await truthKnowledgeGraphService.findPaths(
  'entity-1',
  'entity-2',
  5 // max depth
)

// Extract claims
const claims = await truthKnowledgeGraphService.extractClaims(events)

// Detect anomalies
const anomalies = await truthKnowledgeGraphService.detectAnomalies(graph)
```

### API Usage

```bash
# Query graph
GET /api/truth-engine/knowledge-graph?entityId=shipment-1&depth=2&tenantId=tenant-1

# Build graph from events
POST /api/truth-engine/knowledge-graph
Content-Type: application/json

{
  "events": [...]
}

# Find paths
POST /api/truth-engine/knowledge-graph
Content-Type: application/json

{
  "entityId": "entity-1",
  "targetId": "entity-2",
  "maxDepth": 5
}
```

### UI Component

```tsx
import { KnowledgeGraphVisualization } from '@/components/truth-engine/KnowledgeGraphVisualization'

<KnowledgeGraphVisualization
  tenantId="tenant-1"
  initialEntityId="shipment-1"
  initialEntityType="shipment"
/>
```

### Features
- ✅ Automatic graph building from events
- ✅ Entity relationship mapping
- ✅ Path finding between entities
- ✅ Claim extraction and linking
- ✅ Anomaly detection
- ✅ Interactive visualization

---

## 3. Real-Time Claim Extraction

### Purpose
Automatically extract and validate claims from text, documents, and events in real-time.

### Service

```typescript
import { claimExtractionService } from '@/lib/services/truth-engine'

// Extract from text
const claims = await claimExtractionService.extractFromText(
  'The shipment contained 150 units delivered on December 18, 2024'
)

// Extract from event
const claims = await claimExtractionService.extractFromEvent(truthEvent)

// Validate claim
const result = await claimExtractionService.validateClaim(
  claimId,
  ['evidence-1', 'evidence-2']
)

// Get claims for entity
const claims = await claimExtractionService.getClaimsForEntity('shipment', 'shipment-1')

// Get statistics
const stats = claimExtractionService.getClaimStatistics()

// Initialize real-time extraction
const cleanup = claimExtractionService.initializeRealTimeExtraction(tenantId)
// ... later
cleanup()
```

### API Usage

```bash
# Extract claims
POST /api/truth-engine/claims
Content-Type: application/json

{
  "action": "extract",
  "text": "The shipment contained 150 units"
}

# Validate claim
POST /api/truth-engine/claims
Content-Type: application/json

{
  "action": "validate",
  "claimId": "claim-1",
  "evidenceIds": ["evidence-1", "evidence-2"]
}

# Get claims for entity
GET /api/truth-engine/claims?entityType=shipment&entityId=shipment-1

# Get statistics
GET /api/truth-engine/claims?statistics=true
```

### UI Component

```tsx
import { ClaimsVisualization } from '@/components/truth-engine/ClaimsVisualization'

<ClaimsVisualization
  tenantId="tenant-1"
  entityType="shipment"
  entityId="shipment-1"
/>
```

### Claim Types
- **Factual**: Statements of fact
- **Numerical**: Numbers, quantities, percentages
- **Temporal**: Dates, times, durations
- **Causal**: Cause-effect relationships
- **Comparative**: Comparisons between entities
- **Predictive**: Future predictions or forecasts

### Verification Status
- **Unverified**: Not yet validated
- **Verified**: Validated with evidence
- **Disputed**: Conflicting evidence found
- **False**: Proven to be incorrect

### Features
- ✅ Real-time extraction from events
- ✅ Pattern-based extraction (regex + NER)
- ✅ Entity extraction
- ✅ Conflict detection
- ✅ Evidence linking
- ✅ Statistics tracking
- ✅ Event bus integration

---

## Integration Examples

### Example 1: Verify Evidence After Upload

```typescript
import { truthSDK } from '@/lib/services/truth-engine'
import { multimodalVerificationService } from '@/lib/services/truth-engine'

// Record evidence
const evidence = await truthSDK.recordEvidence({
  type: 'image',
  category: 'operational',
  title: 'Delivery Photo',
  sourceSystem: 'tms',
  fileUrl: 'https://example.com/photo.jpg',
  validationState: 'pending',
  metadata: {
    source: 'tms',
    capturedAt: new Date().toISOString(),
    capturedMethod: 'upload',
    processed: false,
  },
  relatedEntities: [],
  tags: [],
  hash: '...',
  hashAlgorithm: 'sha256',
  lineage: {
    source: 'tms',
    capturedAt: new Date().toISOString(),
    capturedBy: 'user-1',
  },
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// Verify evidence
const verification = await multimodalVerificationService.verifyEvidence(evidence)

if (verification.verified && !verification.imageResult?.tamperingDetected) {
  // Evidence is authentic, proceed
  console.log('Evidence verified:', verification.overallConfidence)
} else {
  // Evidence may be tampered, flag for review
  console.warn('Evidence verification failed:', verification.errors)
}
```

### Example 2: Build Knowledge Graph for Investigation

```typescript
import { truthEngineService } from '@/lib/services/truth-engine'
import { truthKnowledgeGraphService } from '@/lib/services/truth-engine'

// Get events for investigation
const events = await truthEngineService.searchTruthEvents({
  tenantId: 'tenant-1',
  entityRefs: { shipmentId: 'shipment-1' },
  limit: 100,
})

// Build knowledge graph
const graph = await truthKnowledgeGraphService.buildGraphFromEvents(events)

// Find paths between entities
const paths = await truthKnowledgeGraphService.findPaths(
  'customer-1',
  'warehouse-1',
  5
)

// Detect anomalies
const anomalies = await truthKnowledgeGraphService.detectAnomalies(graph)

console.log(`Found ${anomalies.anomalies.length} anomalies`)
```

### Example 3: Real-Time Claim Extraction

```typescript
import { initializeTruthEngine } from '@/lib/services/truth-engine/initialize'
import { claimExtractionService } from '@/lib/services/truth-engine'

// Initialize real-time extraction
const { cleanup } = await initializeTruthEngine({
  tenantId: 'tenant-1',
  enableRealTimeClaims: true,
})

// Claims will be automatically extracted from Truth Events
// Access via API or service:

const claims = await claimExtractionService.getClaimsForEntity('shipment', 'shipment-1')
const stats = claimExtractionService.getClaimStatistics()

// Later, cleanup
cleanup()
```

---

## Best Practices

### 1. Verification
- Always verify evidence before using it in critical decisions
- Check tampering detection results
- Use confidence scores to filter low-quality evidence
- Enable cross-modal validation for multi-evidence scenarios

### 2. Knowledge Graph
- Build graphs incrementally as events occur
- Use appropriate depth levels (2-3 for most cases)
- Monitor for anomalies regularly
- Use path finding for relationship discovery

### 3. Claim Extraction
- Enable real-time extraction for automatic processing
- Validate claims against evidence before trusting them
- Monitor conflict detection results
- Use statistics to track claim quality over time

---

## Performance Considerations

### Verification
- Batch verify multiple items when possible
- Cache verification results
- Use async processing for large files

### Knowledge Graph
- Limit graph depth to avoid performance issues
- Use filters to reduce graph size
- Cache frequently queried graphs

### Claim Extraction
- Real-time extraction is lightweight (pattern-based)
- For production, consider LLM-based extraction
- Cache extracted claims to avoid re-processing

---

## Future Enhancements

### Phase 2
- LLM-based claim extraction
- Advanced NLP for semantic similarity
- Production ML models for tampering detection
- Enhanced graph analytics (community detection, centrality)

### Phase 3
- Blockchain integration for evidence immutability
- Quantum-ready cryptography
- AR/VR visualization for knowledge graphs

---

*Last Updated: 2024-12-18*






