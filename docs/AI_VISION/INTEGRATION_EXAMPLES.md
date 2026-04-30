# AI Vision Integration Examples
## How to Use Unified Vision Service Across Modules

---

## 📋 **Overview**

The Unified Vision Service provides a single, powerful API for all vision capabilities across all modules. It integrates:
- Enhanced vision analysis with RAG
- Object tracking
- Anomaly detection
- Video analysis
- Module-specific intelligence

---

## 🚀 **Quick Start**

### **Basic Usage:**
```typescript
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

const result = await unifiedVisionService.analyze(
  imageFile,
  'Context description',
  {
    module: 'wms',
    enableObjectTracking: true,
    enableAnomalyDetection: true,
  }
)
```

### **API Usage:**
```javascript
const formData = new FormData()
formData.append('media', imageFile)
formData.append('module', 'wms')
formData.append('context', 'Package damage inspection')

const response = await fetch('/api/ai/vision/unified', {
  method: 'POST',
  body: formData,
})

const { result } = await response.json()
```

---

## 📦 **WMS Module Integration**

### **Damage Report with Vision:**
```typescript
// In WMS damage report component
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

async function handleDamageInspection(imageFile: File) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    'Package damage inspection',
    {
      module: 'wms',
      enableAnomalyDetection: true,
    }
  )

  // Use analysis results
  if (analysis.integration?.wms?.inventoryImpact?.damageDetected) {
    // Create damage report
    const damageReport = {
      imageId: analysis.vision.id,
      damageDetails: analysis.vision.analysis.qualityIssues
        .filter(q => q.type === 'damage')
        .map(q => ({
          type: q.type,
          severity: q.severity,
          description: q.issue,
        })),
      recommendations: analysis.integration.wms.recommendations,
      riskLevel: analysis.summary.riskLevel,
    }
    
    // Save to database
    await createDamageReport(damageReport)
  }
}
```

### **Inventory Counting:**
```typescript
async function countInventoryFromImage(imageFile: File) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    'Inventory counting',
    {
      module: 'wms',
    }
  )

  const itemCount = analysis.integration?.wms?.inventoryImpact?.itemsDetected || 0
  
  return {
    count: itemCount,
    detectedItems: analysis.vision.analysis.detectedObjects?.map(o => o.object) || [],
    confidence: analysis.summary.overallScore,
  }
}
```

---

## 🛡️ **QHSE Module Integration**

### **Safety Inspection:**
```typescript
// In QHSE safety inspection component
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

async function performSafetyInspection(imageFile: File) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    'Safety compliance inspection',
    {
      module: 'qhse',
      enableAnomalyDetection: true,
    }
  )

  // Extract safety data
  const safetyData = {
    compliant: analysis.integration?.qhse?.safetyCompliance.compliant || false,
    violations: analysis.integration?.qhse?.safetyCompliance.violations || [],
    score: analysis.integration?.qhse?.safetyCompliance.score || 0,
    incidentRisk: analysis.integration?.qhse?.incidentRisk.level || 'low',
    recommendations: analysis.integration?.qhse?.recommendations || [],
  }

  // Create safety report
  if (!safetyData.compliant) {
    await createSafetyIncident({
      type: 'compliance_violation',
      severity: analysis.summary.riskLevel,
      violations: safetyData.violations,
      recommendations: safetyData.recommendations,
      imageId: analysis.vision.id,
    })
  }

  return safetyData
}
```

### **PPE Compliance Check:**
```typescript
async function checkPPECompliance(imageFile: File) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    'PPE compliance verification',
    {
      module: 'qhse',
    }
  )

  // Check for PPE in detected objects
  const ppeItems = ['helmet', 'hard hat', 'safety glasses', 'goggles', 'gloves', 'vest']
  const detectedPPE = analysis.vision.analysis.detectedObjects?.filter(
    obj => ppeItems.some(item => obj.object.toLowerCase().includes(item))
  ) || []

  return {
    compliant: detectedPPE.length >= 3, // At least 3 PPE items
    detectedPPE: detectedPPE.map(o => o.object),
    missingPPE: ppeItems.filter(item => 
      !detectedPPE.some(d => d.object.toLowerCase().includes(item))
    ),
    recommendations: analysis.integration?.qhse?.recommendations || [],
  }
}
```

---

## 📋 **ISO-IMS Module Integration**

### **Compliance Verification:**
```typescript
// In ISO-IMS compliance component
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

async function verifyCompliance(imageFile: File, standard: string) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    `ISO compliance verification for ${standard}`,
    {
      module: 'iso-ims',
      enableAnomalyDetection: true,
    }
  )

  const complianceData = {
    compliant: analysis.integration?.isoIms?.complianceStatus.compliant || false,
    score: analysis.integration?.isoIms?.complianceStatus.score || 0,
    deviations: analysis.integration?.isoIms?.complianceStatus.deviations || [],
    documentation: {
      complete: analysis.integration?.isoIms?.documentation.complete || false,
      missing: analysis.integration?.isoIms?.documentation.missing || [],
    },
    recommendations: analysis.integration?.isoIms?.recommendations || [],
  }

  // Create compliance record
  await createComplianceRecord({
    standard,
    status: complianceData.compliant ? 'compliant' : 'non_compliant',
    score: complianceData.score,
    deviations: complianceData.deviations,
    evidence: {
      imageId: analysis.vision.id,
      analysis: analysis.vision.analysis.description,
    },
  })

  return complianceData
}
```

---

## 🚚 **TMS Module Integration**

### **Shipment Verification:**
```typescript
// In TMS shipment component
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

async function verifyShipment(imageFile: File, shipmentId: string) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    `Shipment verification for ${shipmentId}`,
    {
      module: 'tms',
      enableAnomalyDetection: true,
    }
  )

  const verificationData = {
    verified: analysis.integration?.tms?.shipmentVerification.verified || false,
    issues: analysis.integration?.tms?.shipmentVerification.issues || [],
    loadingCompliant: analysis.integration?.tms?.loadingCompliance.compliant || false,
    loadingViolations: analysis.integration?.tms?.loadingCompliance.violations || [],
    recommendations: analysis.integration?.tms?.recommendations || [],
  }

  // Update shipment status
  await updateShipmentStatus(shipmentId, {
    verified: verificationData.verified,
    verificationImage: analysis.vision.id,
    issues: verificationData.issues,
    status: verificationData.verified ? 'verified' : 'needs_review',
  })

  return verificationData
}
```

### **Loading Documentation:**
```typescript
async function documentLoading(imageFile: File) {
  const analysis = await unifiedVisionService.analyze(
    imageFile,
    'Loading documentation',
    {
      module: 'tms',
    }
  )

  // Extract loading information
  const loadingData = {
    compliant: analysis.integration?.tms?.loadingCompliance.compliant || false,
    detectedItems: analysis.vision.analysis.detectedObjects?.map(o => o.object) || [],
    issues: analysis.integration?.tms?.loadingCompliance.violations || [],
    recommendations: analysis.integration?.tms?.recommendations || [],
  }

  return loadingData
}
```

---

## 🎥 **Video Analysis**

### **Real-Time Safety Monitoring:**
```typescript
import unifiedVisionService from '@/lib/services/ai/unifiedVisionService'

async function monitorSafetyVideo(videoFile: File) {
  const analysis = await unifiedVisionService.analyze(
    videoFile,
    'Real-time safety monitoring',
    {
      module: 'qhse',
      enableVideoAnalysis: true,
      enableObjectTracking: true,
      enableAnomalyDetection: true,
    }
  )

  // Process video analysis
  if (analysis.videoAnalysis) {
    const safetyScore = analysis.videoAnalysis.summary.safetyScore
    const alerts = analysis.videoAnalysis.alerts || []

    // Handle alerts
    for (const alert of alerts) {
      if (alert.severity === 'critical') {
        await sendSafetyAlert({
          type: alert.type,
          message: alert.message,
          timestamp: alert.timestamp,
          frameNumber: alert.frameNumber,
        })
      }
    }

    return {
      safetyScore,
      alerts,
      recommendations: analysis.summary.recommendedActions,
    }
  }
}
```

---

## 🔍 **Advanced Features**

### **Object Tracking:**
```typescript
// Track objects across video frames
const analysis = await unifiedVisionService.analyze(
  videoFile,
  'Object tracking analysis',
  {
    enableObjectTracking: true,
    objectTracking: {
      minConfidence: 70,
      enableTrajectoryAnalysis: true,
      enableAnomalyDetection: true,
    },
  }
)

if (analysis.objectTracking) {
  const trackedObjects = analysis.objectTracking.trackedObjects
  const anomalies = analysis.objectTracking.anomalies

  // Process tracked objects
  for (const obj of trackedObjects) {
    console.log(`Object ${obj.name}: ${obj.trajectory?.direction} movement`)
    if (obj.behavior?.anomalyScore && obj.behavior.anomalyScore > 70) {
      console.log(`Anomaly detected in ${obj.name}`)
    }
  }
}
```

### **Anomaly Detection:**
```typescript
const analysis = await unifiedVisionService.analyze(
  imageFile,
  'Anomaly detection',
  {
    enableAnomalyDetection: true,
    anomalyDetection: {
      sensitivity: 'high',
      minConfidence: 70,
      enablePredictiveAlerts: true,
    },
  }
)

if (analysis.anomalyDetection) {
  const anomalies = analysis.anomalyDetection.anomalies
  const riskScore = analysis.anomalyDetection.summary.riskScore

  // Handle anomalies
  for (const anomaly of anomalies) {
    if (anomaly.requiresAction) {
      await createAnomalyAlert({
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        recommendations: anomaly.recommendations,
      })
    }
  }
}
```

---

## 📊 **Response Structure**

### **Unified Vision Analysis Response:**
```typescript
{
  vision: {
    // Enhanced vision analysis with RAG
    analysis: { ... },
    contextualInsights: { ... },
    learning: { ... },
    industryAnalysis: { ... },
  },
  objectTracking: {
    // Object tracking results (if video)
    trackedObjects: [ ... ],
    anomalies: [ ... ],
    summary: { ... },
  },
  anomalyDetection: {
    // Anomaly detection results
    anomalies: [ ... ],
    summary: { ... },
    patterns: { ... },
  },
  videoAnalysis: {
    // Video analysis results (if video)
    frameAnalyses: [ ... ],
    summary: { ... },
  },
  integration: {
    // Module-specific integration
    wms: { ... },
    qhse: { ... },
    isoIms: { ... },
    tms: { ... },
  },
  summary: {
    overallScore: 85,
    riskLevel: 'low',
    keyFindings: [ ... ],
    recommendedActions: [ ... ],
    requiresAttention: false,
  },
}
```

---

## 🎯 **Best Practices**

1. **Always specify module context** for better analysis
2. **Enable anomaly detection** for safety-critical applications
3. **Use object tracking** for video analysis
4. **Enable RAG** for contextual understanding
5. **Enable learning** for continuous improvement
6. **Handle errors gracefully** - vision analysis may fail
7. **Store results** for future reference and learning

---

## 🔗 **Related Documentation**

- `AI_VISION_COMPREHENSIVE_ENHANCEMENT_PLAN.md` - Full enhancement plan
- `AI_VISION_ENHANCEMENT_STATUS.md` - Implementation status
- `lib/services/ai/unifiedVisionService.ts` - Service implementation
- `app/api/ai/vision/unified/route.ts` - API implementation











