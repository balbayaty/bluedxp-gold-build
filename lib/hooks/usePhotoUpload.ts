/**
 * Comprehensive Photo Upload Hook
 * Auto-triggers AI Vision, Evidence Creation, Lifecycle Linking, and Liability Assessment
 * Fully integrated with all WMS modules and services
 */

import { useState, useCallback } from 'react'
import { selfLearningVisionService } from '@/lib/services/ai/vision/v2/selfLearningVisionService'
import { evidenceService } from '@/lib/services/evidence/evidenceService'
import { lifecycleService } from '@/lib/services/process-lifecycle/lifecycle/lifecycleService'
import { liabilityEngine } from '@/lib/services/liability/liabilityEngine'
import { eventBus } from '@/lib/services/event-bus'
import type { Evidence } from '@/types/evidence'
import type { EntityType } from '@/types/lifecycle'

export interface PhotoUploadContext {
  entityId: string
  entityType: 'ASN' | 'PALLET' | 'DAMAGE' | 'TASK' | 'GOODS_RECEIPT' | 'PICKING' | 'PUTAWAY'
  stageId?: string
  area?: string
  equipment?: string[]
  carrier?: string
  supplier?: string
  customer?: string
  tenantId: string
  userId?: string
  damageType?: string
  severity?: string
  totalValue?: number
  reportedAt?: Date | string
}

export interface PhotoUploadResult {
  fileUrl: string
  fileId: string
  visionAnalysis?: any
  evidence?: Evidence
  liabilityAssessment?: any
  lifecycleLinked?: boolean
  error?: string
}

/**
 * Generate SHA-256 hash for file integrity verification
 * Uses browser crypto API (works in client-side)
 */
async function generateFileHash(buffer: ArrayBuffer): Promise<string> {
  // Use browser crypto API (available in client-side)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for server-side (shouldn't happen in this hook, but just in case)
  // In server-side, we'd use Node.js crypto, but this hook is client-side only
  throw new Error('Crypto API not available - this hook is client-side only')
}

/**
 * Get current lifecycle stage for entity
 */
async function getCurrentLifecycleStage(
  entityId: string,
  entityType: EntityType
): Promise<string | null> {
  try {
    const lifecycle = await lifecycleService.getLifecycle(entityId, entityType)
    if (!lifecycle) return null

    // Find current in-progress stage
    const currentStage = lifecycle.stages.find(s => s.status === 'in_progress')
    return currentStage?.stageId || lifecycle.stages[lifecycle.stages.length - 1]?.stageId || null
  } catch (error) {
    console.warn('Could not get lifecycle stage:', error)
    return null
  }
}

/**
 * Comprehensive Photo Upload Hook with Full Integration
 */
export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [creatingEvidence, setCreatingEvidence] = useState(false)
  const [assessingLiability, setAssessingLiability] = useState(false)

  /**
   * Upload photo with automatic AI Vision, Evidence, Lifecycle, and Liability integration
   */
  const uploadPhotoWithAutoAnalysis = useCallback(
    async (file: File, context: PhotoUploadContext): Promise<PhotoUploadResult> => {
      setUploading(true)
      setAnalyzing(false)
      setCreatingEvidence(false)
      setAssessingLiability(false)

      try {
        // Step 1: Upload file to storage
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entityType', context.entityType)
        formData.append('entityId', context.entityId)
        formData.append('tenantId', context.tenantId)
        if (context.userId) {
          formData.append('userId', context.userId)
        }

        const uploadResponse = await fetch('/api/storage/files/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'File upload failed')
        }

        const uploadResult = await uploadResponse.json()
        const { fileUrl, fileId } = uploadResult

        if (!fileUrl || !fileId) {
          throw new Error('Invalid upload response: missing fileUrl or fileId')
        }

        const result: PhotoUploadResult = {
          fileUrl,
          fileId,
        }

        // Step 2: Get current lifecycle stage if not provided
        let stageId = context.stageId
        if (!stageId) {
          setAnalyzing(true)
          stageId = await getCurrentLifecycleStage(
            context.entityId,
            context.entityType as EntityType
          ) || undefined
        }

        // Step 3: Auto-trigger AI Vision analysis (async, don't block)
        setAnalyzing(true)
        const visionAnalysisPromise = selfLearningVisionService
          .analyzeDamagePhoto(file, {
            damageRecordId: context.entityId,
            area: context.area,
            equipment: context.equipment,
            carrier: context.carrier,
            supplier: context.supplier,
            tenantId: context.tenantId,
          })
          .catch(error => {
            console.error('AI Vision analysis failed:', error)
            return null
          })

        // Step 4: Generate file hash for integrity
        const fileBuffer = await file.arrayBuffer()
        const hash = await generateFileHash(fileBuffer)

        // Step 5: Auto-create Evidence record
        setCreatingEvidence(true)
        let evidence: Evidence | undefined
        try {
          evidence = await evidenceService.create({
            type: 'photo',
            category: context.entityType === 'DAMAGE' ? 'safety' : 'operational',
            title: `Photo: ${context.entityType} ${context.entityId}`,
            description: `Auto-uploaded photo for ${context.entityType} ${context.entityId}`,
            fileUrl,
            hash,
            hashAlgorithm: 'sha256',
            relatedEntities: [
              {
                entityType: context.entityType,
                entityId: context.entityId,
              },
            ],
            metadata: {
              originalFileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              uploadedAt: new Date().toISOString(),
              uploadedBy: context.userId || 'system',
              area: context.area,
              equipment: context.equipment,
              carrier: context.carrier,
              supplier: context.supplier,
            },
            tenantId: context.tenantId,
            createdBy: context.userId,
          })

          result.evidence = evidence

          // Step 6: Link to Lifecycle stage (if stageId available)
          if (stageId && evidence) {
            try {
              await lifecycleService.attachEvidence(
                context.entityId,
                context.entityType as EntityType,
                stageId,
                {
                  evidenceId: evidence.id,
                  evidenceType: 'photo',
                  description: `Photo evidence for ${context.entityType} at stage ${stageId}`,
                  context: {
                    userId: context.userId,
                    tenantId: context.tenantId,
                  },
                }
              )
              result.lifecycleLinked = true
            } catch (error) {
              console.warn('Failed to link evidence to lifecycle:', error)
              // Don't fail entire operation if lifecycle linking fails
            }
          }

          // Step 7: Wait for vision analysis and update evidence
          const visionAnalysis = await visionAnalysisPromise
          if (visionAnalysis && evidence) {
            result.visionAnalysis = visionAnalysis

            // Update evidence with vision analysis results
            try {
              await evidenceService.update(
                evidence.id,
                {
                  metadata: {
                    ...evidence.metadata,
                    visionAnalysis,
                    analyzedAt: new Date().toISOString(),
                  },
                },
                'Added AI Vision analysis results'
              )
            } catch (error) {
              console.warn('Failed to update evidence with vision analysis:', error)
            }
          }

          // Step 8: Auto-liability assessment (if damage)
          if (context.entityType === 'DAMAGE' && context.totalValue !== undefined) {
            setAssessingLiability(true)
            try {
              const liabilityAssessment = await liabilityEngine.assessLiability(
                context.entityId,
                {
                  damagePhoto: file,
                  damageType: context.damageType || 'UNKNOWN',
                  severity: context.severity || 'UNKNOWN',
                  area: context.area,
                  equipment: context.equipment,
                  carrier: context.carrier,
                  supplier: context.supplier,
                  customer: context.customer,
                  totalValue: context.totalValue,
                  reportedAt: context.reportedAt || new Date(),
                  tenantId: context.tenantId,
                }
              )
              result.liabilityAssessment = liabilityAssessment
            } catch (error) {
              console.warn('Liability assessment failed:', error)
              // Don't fail entire operation if liability assessment fails
            }
          }

          // Step 9: Publish integration events
          try {
            await eventBus.publish('photo.uploaded', {
              entityId: context.entityId,
              entityType: context.entityType,
              fileUrl,
              fileId,
              evidenceId: evidence?.id,
              hasVisionAnalysis: !!visionAnalysis,
              hasLiabilityAssessment: !!result.liabilityAssessment,
              tenantId: context.tenantId,
            })

            if (visionAnalysis) {
              await eventBus.publish('photo.analyzed', {
                entityId: context.entityId,
                entityType: context.entityType,
                visionAnalysis,
                evidenceId: evidence?.id,
                tenantId: context.tenantId,
              })
            }

            if (result.liabilityAssessment) {
              await eventBus.publish('liability.assessed', {
                entityId: context.entityId,
                entityType: context.entityType,
                liabilityAssessment: result.liabilityAssessment,
                tenantId: context.tenantId,
              })
            }
          } catch (error) {
            console.warn('Event publishing failed:', error)
            // Don't fail operation if event publishing fails
          }

          return result
        } catch (evidenceError) {
          console.error('Evidence creation failed:', evidenceError)
          // Continue even if evidence creation fails
          return result
        }
      } catch (error) {
        console.error('Photo upload with auto-analysis failed:', error)
        return {
          fileUrl: '',
          fileId: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      } finally {
        setUploading(false)
        setAnalyzing(false)
        setCreatingEvidence(false)
        setAssessingLiability(false)
      }
    },
    []
  )

  return {
    uploadPhotoWithAutoAnalysis,
    uploading,
    analyzing,
    creatingEvidence,
    assessingLiability,
  }
}

