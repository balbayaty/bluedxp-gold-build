# 🔧 WMS Critical Fixes - Implementation Guide
## Step-by-Step Implementation for Critical Gaps

**Date:** December 2024  
**Priority:** 🔴 **CRITICAL**  
**Estimated Effort:** 4 weeks

---

## 🎯 OVERVIEW

This guide provides detailed implementation steps for the most critical gaps identified in the WMS module:
1. Auto Photo-to-AI Vision Integration
2. Auto Photo-to-Evidence Creation
3. Replace SLA/KPI Mock Data with Real Calculations
4. Complete Service Layer TODOs

---

## 🔴 FIX #1: Auto Photo-to-AI Vision Integration

### Problem
Photos uploaded to ASN/Pallet/Damage records are NOT automatically analyzed by AI Vision. Users must manually click "Analyze" button.

### Solution
Implement automatic AI Vision analysis when photos are uploaded.

### Implementation Steps

#### Step 1.1: Create Photo Upload Hook
**File:** `lib/hooks/usePhotoUpload.ts`

```typescript
import { useState } from 'react'
import { selfLearningVisionService } from '@/lib/services/ai/vision/v2/selfLearningVisionService'
import { evidenceService } from '@/lib/services/evidence/evidenceService'
import { lifecycleService } from '@/lib/services/process-lifecycle/lifecycle/lifecycleService'
import { liabilityEngine } from '@/lib/services/liability/liabilityEngine'

interface PhotoUploadContext {
  entityId: string
  entityType: 'ASN' | 'PALLET' | 'DAMAGE' | 'TASK'
  stageId?: string
  area?: string
  equipment?: string[]
  carrier?: string
  tenantId: string
}

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const uploadPhotoWithAutoAnalysis = async (
    file: File,
    context: PhotoUploadContext
  ) => {
    setUploading(true)
    setAnalyzing(true)

    try {
      // 1. Upload file to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', context.entityType)
      formData.append('entityId', context.entityId)
      formData.append('tenantId', context.tenantId)

      const uploadResponse = await fetch('/api/storage/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('File upload failed')
      }

      const { fileUrl, fileId } = await uploadResponse.json()

      // 2. Auto-trigger AI Vision analysis
      const visionAnalysis = await selfLearningVisionService.analyzeDamagePhoto(
        file,
        {
          damageRecordId: context.entityId,
          area: context.area,
          equipment: context.equipment,
          carrier: context.carrier,
          tenantId: context.tenantId,
        }
      )

      // 3. Auto-create Evidence record
      const fileBuffer = await file.arrayBuffer()
      const hash = await generateFileHash(fileBuffer)

      const evidence = await evidenceService.create({
        type: 'photo',
        category: 'operational',
        title: `Photo: ${context.entityType} ${context.entityId}`,
        description: `Auto-uploaded photo for ${context.entityType}`,
        fileUrl,
        hash,
        hashAlgorithm: 'sha256',
        relatedEntities: [{
          entityType: context.entityType,
          entityId: context.entityId,
        }],
        metadata: {
          visionAnalysis,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
        tenantId: context.tenantId,
      })

      // 4. Link to Lifecycle stage (if stageId provided)
      if (context.stageId) {
        await lifecycleService.attachEvidence(
          context.entityId,
          context.entityType as any,
          context.stageId,
          {
            evidenceId: evidence.id,
            evidenceType: 'photo',
            description: `Photo evidence for ${context.entityType}`,
          }
        )
      }

      // 5. Auto-liability assessment (if damage)
      let liabilityAssessment = null
      if (context.entityType === 'DAMAGE') {
        liabilityAssessment = await liabilityEngine.assessLiability(
          context.entityId,
          {
            damagePhoto: file,
            damageType: 'UNKNOWN', // Get from damage record
            severity: 'UNKNOWN', // Get from damage record
            area: context.area,
          }
        )
      }

      return {
        fileUrl,
        fileId,
        visionAnalysis,
        evidence,
        liabilityAssessment,
      }
    } catch (error) {
      console.error('Photo upload with auto-analysis failed:', error)
      throw error
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  return {
    uploadPhotoWithAutoAnalysis,
    uploading,
    analyzing,
  }
}

// Helper function to generate file hash
async function generateFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

#### Step 1.2: Update File Upload API
**File:** `app/api/storage/files/upload/route.ts`

Add auto-trigger hook after successful upload:

```typescript
// ... existing code ...

export async function POST(request: NextRequest) {
  try {
    // ... existing upload logic ...

    // After successful upload, trigger auto-analysis
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const tenantId = formData.get('tenantId') as string

    if (entityType && entityId && tenantId) {
      // Trigger async analysis (don't wait)
      processPhotoAnalysis(file, {
        entityId,
        entityType: entityType as any,
        tenantId,
        fileUrl: uploadedFileUrl,
      }).catch(error => {
        console.error('Auto photo analysis failed:', error)
        // Don't fail upload if analysis fails
      })
    }

    return NextResponse.json({
      success: true,
      fileUrl: uploadedFileUrl,
      fileId: fileId,
    })
  } catch (error) {
    // ... error handling ...
  }
}

// Background processing function
async function processPhotoAnalysis(
  file: File,
  context: {
    entityId: string
    entityType: 'ASN' | 'PALLET' | 'DAMAGE'
    tenantId: string
    fileUrl: string
  }
) {
  // Import services
  const { selfLearningVisionService } = await import('@/lib/services/ai/vision/v2/selfLearningVisionService')
  const { evidenceService } = await import('@/lib/services/evidence/evidenceService')

  // 1. AI Vision analysis
  const visionAnalysis = await selfLearningVisionService.analyzeDamagePhoto(
    file,
    {
      damageRecordId: context.entityId,
      tenantId: context.tenantId,
    }
  )

  // 2. Create evidence
  const fileBuffer = await file.arrayBuffer()
  const hash = await generateFileHash(fileBuffer)

  await evidenceService.create({
    type: 'photo',
    category: 'operational',
    title: `Photo: ${context.entityType} ${context.entityId}`,
    fileUrl: context.fileUrl,
    hash,
    hashAlgorithm: 'sha256',
    relatedEntities: [{
      entityType: context.entityType,
      entityId: context.entityId,
    }],
    metadata: {
      visionAnalysis,
      uploadedAt: new Date().toISOString(),
    },
    tenantId: context.tenantId,
  })

  // 3. Publish event
  const { eventBus } = await import('@/lib/services/event-bus/eventBus')
  await eventBus.publish('photo.analyzed', {
    entityId: context.entityId,
    entityType: context.entityType,
    visionAnalysis,
  })
}
```

#### Step 1.3: Update InboundDetail Component
**File:** `components/InboundDetail.tsx`

Replace manual photo display with auto-analysis:

```typescript
import { usePhotoUpload } from '@/lib/hooks/usePhotoUpload'

export default function InboundDetail({ asn, onClose }: InboundDetailProps) {
  const { uploadPhotoWithAutoAnalysis, analyzing } = usePhotoUpload()
  const [photoAnalysis, setPhotoAnalysis] = useState<Record<string, any>>({})

  const handlePhotoUpload = async (file: File, photoType: 'truck' | 'driver' | 'paperwork') => {
    try {
      const result = await uploadPhotoWithAutoAnalysis(file, {
        entityId: asn.id,
        entityType: 'ASN',
        stageId: 'asn_received', // Get from lifecycle
        tenantId: asn.tenantId || 'default',
      })

      // Update state with analysis results
      setPhotoAnalysis(prev => ({
        ...prev,
        [photoType]: result.visionAnalysis,
      }))

      // Show success notification
      // ... notification code ...
    } catch (error) {
      // Show error notification
      // ... error handling ...
    }
  }

  // ... rest of component ...
}
```

---

## 🔴 FIX #2: Replace SLA/KPI Mock Data

### Problem
All KPI calculations return hardcoded mock values instead of real data.

### Solution
Replace all mock calculations with real database queries.

### Implementation Steps

#### Step 2.1: Update KPI Calculation Methods
**File:** `lib/services/process-lifecycle/wms/wmsSlaKpiService.ts`

Replace all mock calculations:

```typescript
// BEFORE (Mock):
private async calculatePickingEfficiency(): Promise<number> {
  return 92.5  // ❌ HARDCODED
}

// AFTER (Real Data):
private async calculatePickingEfficiency(): Promise<number> {
  // Get picking tasks from last 24 hours
  const yesterday = new Date()
  yesterday.setHours(yesterday.getHours() - 24)

  const pickingTasks = await prisma.task.findMany({
    where: {
      type: 'PICKING',
      status: 'COMPLETED',
      completedAt: { not: null, gte: yesterday },
      tenantId: this.getTenantId(), // Get from context
    },
    include: {
      lifecycle: {
        include: {
          stages: {
            where: {
              stageId: 'picking_complete',
            },
          },
        },
      },
    },
  })

  if (pickingTasks.length === 0) {
    return 100 // No tasks = 100% efficiency
  }

  // Get SLA target from lifecycle config
  const lifecycleConfig = lifecycleService.getLifecycleConfig('PICKING')
  const slaRule = lifecycleConfig?.slaRules?.find(r => r.stageId === 'picking_complete')
  const targetDuration = slaRule?.targetDuration || 1800 // 30 minutes default

  // Calculate on-time completion rate
  const onTimeTasks = pickingTasks.filter(task => {
    if (!task.completedAt) return false

    const stageInstance = task.lifecycle?.stages?.[0]
    if (!stageInstance) return false

    const actualDuration = (new Date(stageInstance.completedAt).getTime() - 
                            new Date(stageInstance.startedAt).getTime()) / 1000

    return actualDuration <= targetDuration
  })

  return (onTimeTasks.length / pickingTasks.length) * 100
}

// Similar updates for:
// - calculatePutawayEfficiency()
// - calculateAsnProcessingTime()
// - calculatePickingAccuracy()
// - calculateCycleCountAccuracy()
```

#### Step 2.2: Add Real-time SLA Tracking
**File:** `lib/services/wms/realTimeSlaKpiService.ts` (NEW)

```typescript
import { lifecycleService } from '@/lib/services/process-lifecycle/lifecycle/lifecycleService'
import { eventBus } from '@/lib/services/event-bus/eventBus'
import { prisma } from '@/lib/prisma'

class RealTimeSlaKpiService {
  private violationAlerts: Map<string, any> = new Map()

  async trackSlaCompliance(entityId: string, entityType: string) {
    const lifecycle = await lifecycleService.getLifecycle(entityId, entityType as any)
    if (!lifecycle) return

    const config = lifecycleService.getLifecycleConfig(entityType as any)
    if (!config) return

    // Check each stage for SLA violations
    for (const stage of lifecycle.stages) {
      const slaRule = config.slaRules?.find(r => r.stageId === stage.stageId)
      if (!slaRule) continue

      if (stage.status === 'in_progress') {
        const elapsed = (Date.now() - new Date(stage.startedAt).getTime()) / 1000
        const remaining = slaRule.targetDuration - elapsed
        const percentageUsed = (elapsed / slaRule.targetDuration) * 100

        // Alert if >80% of time used
        if (percentageUsed > 80 && remaining > 0) {
          await this.triggerSlaWarning(entityId, entityType, stage, remaining)
        }

        // Alert if SLA breached
        if (elapsed > slaRule.targetDuration) {
          await this.triggerSlaViolation(entityId, entityType, stage, elapsed - slaRule.targetDuration)
        }
      }
    }
  }

  private async triggerSlaWarning(
    entityId: string,
    entityType: string,
    stage: any,
    remainingSeconds: number
  ) {
    const alertKey = `${entityId}-${stage.stageId}`
    if (this.violationAlerts.has(alertKey)) return // Already alerted

    this.violationAlerts.set(alertKey, {
      entityId,
      entityType,
      stage,
      remainingSeconds,
      timestamp: new Date(),
    })

    // Publish event
    await eventBus.publish('sla.warning', {
      entityId,
      entityType,
      stageId: stage.stageId,
      stageName: stage.stageName,
      remainingSeconds,
      percentageUsed: ((stage.elapsed || 0) / stage.targetDuration) * 100,
    })

    // Send notification
    // ... notification code ...
  }

  private async triggerSlaViolation(
    entityId: string,
    entityType: string,
    stage: any,
    delaySeconds: number
  ) {
    // Record violation in database
    await prisma.slaViolation.create({
      data: {
        id: `violation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        entityId,
        entityType,
        stageId: stage.stageId,
        stageName: stage.stageName,
        targetDuration: stage.targetDuration,
        actualDuration: stage.elapsed || 0,
        delaySeconds,
        tenantId: this.getTenantId(),
        createdAt: new Date(),
      },
    })

    // Publish event
    await eventBus.publish('sla.violation', {
      entityId,
      entityType,
      stageId: stage.stageId,
      delaySeconds,
    })

    // Send alert
    // ... alert code ...
  }
}

export const realTimeSlaKpiService = new RealTimeSlaKpiService()
```

#### Step 2.3: Subscribe to Lifecycle Events
**File:** `lib/services/wms/slaKpiEventSubscriber.ts` (NEW)

```typescript
import { eventBus } from '@/lib/services/event-bus/eventBus'
import { realTimeSlaKpiService } from './realTimeSlaKpiService'

class SlaKpiEventSubscriber {
  initialize() {
    // Subscribe to stage transitions
    eventBus.subscribe('lifecycle.stage.started', async (event) => {
      await realTimeSlaKpiService.trackSlaCompliance(
        event.entityId,
        event.entityType
      )
    })

    eventBus.subscribe('lifecycle.stage.completed', async (event) => {
      await realTimeSlaKpiService.trackSlaCompliance(
        event.entityId,
        event.entityType
      )
    })

    // Periodic check for in-progress stages
    setInterval(async () => {
      // Get all in-progress lifecycles
      const inProgress = await lifecycleService.getInProgressLifecycles()
      for (const lifecycle of inProgress) {
        await realTimeSlaKpiService.trackSlaCompliance(
          lifecycle.entityId,
          lifecycle.entityType
        )
      }
    }, 60000) // Check every minute
  }
}

export const slaKpiEventSubscriber = new SlaKpiEventSubscriber()
```

---

## 🔴 FIX #3: Complete Service Layer TODOs

### Problem
Many service methods contain TODO comments indicating incomplete functionality.

### Solution
Complete all critical TODOs in service layer.

### Implementation Steps

#### Step 3.1: Complete Location Service
**File:** `lib/services/wms/locationService.ts`

```typescript
// BEFORE:
tenantId: 'default-tenant', // TODO: Get from context

// AFTER:
import { getTenantFromContext } from '@/lib/utils/context'

const tenantId = await getTenantFromContext() || 'default-tenant'
```

#### Step 3.2: Complete Inventory Service
**File:** `lib/services/wms/inventoryService.ts`

```typescript
// BEFORE:
// TODO: Add InventoryMovement table insert here

// AFTER:
await prisma.inventoryMovement.create({
  data: {
    id: `movement-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    materialId: materialId,
    warehouseId: warehouseId,
    locationId: locationId,
    movementType: 'ADJUSTMENT',
    quantity: quantity,
    reason: reason,
    userId: userId,
    tenantId: tenantId,
    createdAt: new Date(),
  },
})
```

#### Step 3.3: Complete Outbound Service
**File:** `lib/services/wms/OutboundService.ts`

```typescript
// BEFORE:
// TODO: Check if Shipment is Fully Picked and update Status

// AFTER:
const shipment = await prisma.shipment.findUnique({
  where: { id: shipmentId },
  include: {
    items: {
      include: {
        picks: true,
      },
    },
  },
})

if (shipment) {
  const allPicked = shipment.items.every(item => {
    const totalPicked = item.picks.reduce((sum, pick) => sum + pick.quantity, 0)
    return totalPicked >= item.quantity
  })

  if (allPicked) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'FULLY_PICKED',
        updatedAt: new Date(),
      },
    })
  }
}
```

---

## ✅ TESTING CHECKLIST

### Photo Upload Auto-Analysis
- [ ] Photo upload triggers AI Vision automatically
- [ ] Evidence record is created automatically
- [ ] Photo is linked to lifecycle stage
- [ ] Liability assessment runs for damage photos
- [ ] UI updates with analysis results
- [ ] Error handling works correctly

### SLA/KPI Real Data
- [ ] All KPI calculations use real data
- [ ] Real-time SLA tracking works
- [ ] SLA violations are detected
- [ ] Alerts are sent on violations
- [ ] Dashboard shows real metrics
- [ ] Performance is acceptable

### Service Layer TODOs
- [ ] All critical TODOs completed
- [ ] No hardcoded values remain
- [ ] All services use proper context
- [ ] Database operations work correctly
- [ ] Error handling is comprehensive

---

## 📊 SUCCESS METRICS

### Photo Integration
- **Target:** 100% of photos auto-analyzed
- **Current:** 0%
- **Measurement:** Track photo upload → analysis success rate

### SLA/KPI Accuracy
- **Target:** 0% mock data
- **Current:** 100% mock data
- **Measurement:** Audit all KPI calculations

### Service Completeness
- **Target:** 0 critical TODOs
- **Current:** ~15 TODOs
- **Measurement:** Code review and testing

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Implementation Start Date:** TBD


