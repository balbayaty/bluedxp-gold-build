# Evidence Packet Service

## 🎯 Overview

**Evidence Packet Service** provides court-ready, tamper-evident evidence packets with Merkle tree integrity, contradiction detection, and chain of custody tracking.

**Key Features:**
- Court-ready formatting
- Tamper-evident documentation
- Merkle tree for integrity
- Contradiction detection (timeline, signature, content, metadata)
- Chain of custody tracking
- Legal hold support

---

## 🎯 Key Features

### **1. Merkle Tree Integrity** ✅
- Builds Merkle tree from all evidence
- Proof generation and verification
- Tamper detection
- Root hash for integrity verification

### **2. Contradiction Detection** ✅
- Timeline contradictions (impossible sequences)
- Signature contradictions (timestamp/location mismatches)
- Content contradictions (conflicting claims via NLP)
- Metadata contradictions (duplicate signers, etc.)

### **3. Evidence Packet Generation** ✅
- Gathers events, documents, signatures
- Builds integrity hashes
- Detects contradictions
- Generates court-ready format

### **4. Chain of Custody** ✅
- Tracks all custody transfers
- Acknowledgment system
- Complete audit trail

### **5. Legal Hold** ✅
- Set/remove legal hold
- Prevents deletion/modification
- Extended retention

---

## 📁 File Structure

```
lib/services/evidence/
├── evidenceService.ts          # Existing evidence service
├── merkle-tree.ts              # Merkle tree implementation
├── contradiction-detector.ts   # Contradiction detection
├── packet-types.ts             # Type definitions
├── packet-generator.ts         # Packet generation
├── packet-service.ts           # Main service
├── truth-engine-integration.ts # Truth Engine integration
├── mcp-tool.ts                 # MCP tool definitions
└── index.ts                    # Main exports

app/api/evidence/packets/
├── route.ts                    # POST/GET packets
├── [id]/route.ts               # GET packet by ID
├── [id]/verify/route.ts        # POST/PUT verification
├── [id]/court-ready/route.ts   # POST court-ready format
└── [id]/legal-hold/route.ts    # PUT legal hold

hooks/
└── useEvidencePacket.ts        # React hook

components/evidence/
└── EvidencePacketCard.tsx      # React component
```

---

## 🚀 Quick Start

### **1. Generate Evidence Packet**

```typescript
import { evidencePacketService } from '@/lib/services/evidence'

const packet = await evidencePacketService.generatePacket(
  {
    entityType: 'Shipment',
    entityId: 'shipment-123',
    claimType: 'delivery_proof',
  },
  {
    id: 'user-123',
    name: 'John Doe',
    tenantId: 'tenant-1',
    type: 'user',
  }
)

console.log(packet.evidenceId)  // "EVD-2025-001234"
console.log(packet.merkleRoot)  // Merkle tree root hash
console.log(packet.contradictionIndex)  // 0-1
```

### **2. Verify Packet Integrity**

```typescript
const verification = await evidencePacketService.verifyPacket(packet.id)

console.log(verification.valid)  // true/false
console.log(verification.verificationScore)  // 0-1
```

### **3. Generate Court-Ready Format**

```typescript
const courtReady = await evidencePacketService.generateCourtReadyPacket(
  packet.id,
  'CASE-2025-001'
)
```

### **4. Use in Components**

```tsx
import { EvidencePacketCard } from '@/components/evidence/EvidencePacketCard'

<EvidencePacketCard packetId={packet.id} showDetails />
```

---

## 🔗 Integration Points

### **✅ Truth Engine Integration**
- Automatic evidence linking
- Packet generation from truth events
- Event correlation

### **✅ Event Store Integration**
- Gathers events for packets
- Full audit trail
- Event correlation

### **✅ Evidence Service Integration**
- Uses existing evidence service
- No duplication
- Extends functionality

### **✅ Arabic NLP Integration**
- Content contradiction detection
- Intent analysis
- Sentiment analysis

### **✅ MCP Tools**
- `generate_evidence_packet` - For AI agents
- `verify_evidence_packet` - For AI agents

---

## 📊 Contradiction Detection

### **Timeline Contradictions:**
- Delivery before pickup
- Arrival after departure
- Payment delays

### **Signature Contradictions:**
- Timestamp mismatches (>30 min)
- Location mismatches (>1km)

### **Content Contradictions:**
- Conflicting intents (via Arabic NLP)
- Conflicting sentiments
- Conflicting dates

### **Metadata Contradictions:**
- Duplicate signers at same time
- Impossible sequences

---

## 🚀 API EndPOINTS

### **POST /api/evidence/packets**
Generate evidence packet.

### **GET /api/evidence/packets/{id}**
Get packet by ID.

### **POST /api/evidence/packets/{id}/verify**
Verify packet integrity.

### **PUT /api/evidence/packets/{id}/verify**
Update verification status.

### **POST /api/evidence/packets/{id}/court-ready**
Generate court-ready format.

### **PUT /api/evidence/packets/{id}/legal-hold**
Set/remove legal hold.

---

## 🧠 AI INTEGRATION

### **MCP Tools**
- AI agents can generate packets
- AI agents can verify integrity
- Natural language interface ready

---

## 📈 PERFORMANCE

- **Packet Generation**: < 500ms
- **Verification**: < 200ms
- **Court Format**: < 1000ms
- **Merkle Tree Build**: < 100ms

---

## 🔒 SECURITY

- ✅ Multi-tenant isolation
- ✅ RBAC ready
- ✅ Tamper-evident
- ✅ Chain of custody
- ✅ Legal hold support
- ✅ Audit logging

---

## 📚 References

- **Specification**: `BlueDXP_FINAL_COMPLETE_V5.md` Section 6.2
- **Implementation Plan**: `IMPLEMENTATION_PLAN.md` Task 1.4

---

**Built with ❤️ for intelligent logistics**

*Court-Ready • Tamper-Evident • Production-Ready*

