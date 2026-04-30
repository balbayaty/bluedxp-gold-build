/**
 * Smart Detection Form Service
 * Auto-detects and populates form fields from documents, context, and patterns
 * Originally from chemcollab/chemcheck - NCR and related features
 * Much more comprehensive than source apps
 */

import { callAI } from "@/utils/aiClient";
import { documentIntelligenceService } from "@/lib/services/trade-compliance/documentIntelligenceService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";

export interface DetectedField {
  fieldId: string;
  fieldName: string;
  detectedValue: any;
  confidence: number; // 0-100
  source:
    | "DOCUMENT"
    | "CONTEXT"
    | "PATTERN"
    | "AI_ANALYSIS"
    | "KNOWLEDGE_BASE"
    | "USER_HISTORY";
  method: string; // How it was detected
  alternatives?: Array<{ value: any; confidence: number }>;
}

export interface DetectionContext {
  formType:
    | "NCR"
    | "CAPA"
    | "INCIDENT"
    | "AUDIT"
    | "INSPECTION"
    | "TRAINING"
    | "DOCUMENT"
    | "OTHER";
  moduleId: string;
  uploadedDocuments?: File[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  userRole?: string;
  tenantId?: string;
  previousForms?: Array<Record<string, any>>;
  location?: string;
  department?: string;
}

export interface SmartDetectionResult {
  detectedFields: DetectedField[];
  suggestions: Array<{
    fieldId: string;
    suggestion: string;
    confidence: number;
    reasoning: string;
  }>;
  warnings: Array<{
    fieldId: string;
    warning: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
  }>;
  autoFilledCount: number;
  confidence: number; // Overall confidence
}

class SmartDetectionService {
  /**
   * Detect and populate form fields intelligently
   */
  async detectFormFields(
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
  ): Promise<SmartDetectionResult> {
    const detectedFields: DetectedField[] = [];
    const suggestions: Array<{
      fieldId: string;
      suggestion: string;
      confidence: number;
      reasoning: string;
    }> = [];
    const warnings: Array<{
      fieldId: string;
      warning: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
    }> = [];

    // 1. Document-based detection
    if (context.uploadedDocuments && context.uploadedDocuments.length > 0) {
      const documentDetections = await this.detectFromDocuments(
        context.uploadedDocuments,
        fields,
        context,
      );
      detectedFields.push(...documentDetections);
    }

    // 2. Context-based detection
    const contextDetections = await this.detectFromContext(fields, context);
    detectedFields.push(...contextDetections);

    // 3. Pattern-based detection
    if (context.previousForms && context.previousForms.length > 0) {
      const patternDetections = await this.detectFromPatterns(fields, context);
      detectedFields.push(...patternDetections);
    }

    // 4. AI-powered detection
    const aiDetections = await this.detectWithAI(
      fields,
      context,
      detectedFields,
    );
    detectedFields.push(...aiDetections);

    // 5. Knowledge base detection
    const kbDetections = await this.detectFromKnowledgeBase(fields, context);
    detectedFields.push(...kbDetections);

    // Merge detections (keep highest confidence)
    const mergedDetections = this.mergeDetections(detectedFields);

    // Generate suggestions and warnings
    for (const field of fields) {
      const detection = mergedDetections.find((d) => d.fieldId === field.id);

      if (detection && detection.confidence >= 70) {
        // High confidence - auto-fill
        suggestions.push({
          fieldId: field.id,
          suggestion: `Auto-detected: ${detection.detectedValue}`,
          confidence: detection.confidence,
          reasoning: `Detected from ${detection.source} using ${detection.method}`,
        });
      } else if (detection && detection.confidence >= 50) {
        // Medium confidence - suggest
        suggestions.push({
          fieldId: field.id,
          suggestion: `Suggested: ${detection.detectedValue}`,
          confidence: detection.confidence,
          reasoning: `Possible value from ${detection.source}`,
        });
      }

      // Generate warnings for missing critical fields
      if (this.isCriticalField(field, context) && !detection) {
        warnings.push({
          fieldId: field.id,
          warning: `${field.label} is critical but could not be auto-detected`,
          severity: "MEDIUM",
        });
      }
    }

    const autoFilledCount = mergedDetections.filter(
      (d) => d.confidence >= 70,
    ).length;
    const overallConfidence =
      mergedDetections.length > 0
        ? mergedDetections.reduce((sum, d) => sum + d.confidence, 0) /
          mergedDetections.length
        : 0;

    // Publish event
    eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "form.smart_detection.completed",
      aggregateId: context.formType,
      aggregateType: "SMART_DETECTION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        formType: context.formType,
        detectedCount: mergedDetections.length,
        autoFilledCount,
        overallConfidence,
      },
    });

    return {
      detectedFields: mergedDetections,
      suggestions,
      warnings,
      autoFilledCount,
      confidence: overallConfidence,
    };
  }

  /**
   * Detect fields from uploaded documents
   */
  private async detectFromDocuments(
    documents: File[],
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
  ): Promise<DetectedField[]> {
    const detections: DetectedField[] = [];

    for (const document of documents) {
      try {
        // Use document intelligence service
        const extraction = await documentIntelligenceService.extractDocument(
          document,
          context.formType,
        );

        // Map extracted data to form fields
        for (const field of fields) {
          const extractedValue = this.extractFieldFromDocument(
            field,
            extraction.fields,
          );

          if (extractedValue) {
            detections.push({
              fieldId: field.id,
              fieldName: field.name,
              detectedValue: extractedValue,
              confidence: extraction.confidence * 100,
              source: "DOCUMENT",
              method: `OCR + AI extraction from ${document.name}`,
            });
          }
        }
      } catch (error) {
        console.error("Error detecting from document:", error);
      }
    }

    return detections;
  }

  /**
   * Extract field value from document extraction
   */
  private extractFieldFromDocument(
    field: { name: string; label: string },
    extractedFields: Record<string, any>,
  ): any {
    // Try exact match
    if (extractedFields[field.name]) {
      return extractedFields[field.name];
    }

    // Try label match
    const labelKey = Object.keys(extractedFields).find((key) =>
      key.toLowerCase().includes(field.label.toLowerCase()),
    );
    if (labelKey) {
      return extractedFields[labelKey];
    }

    // Try partial match
    const partialKey = Object.keys(extractedFields).find(
      (key) =>
        field.name.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(field.name.toLowerCase()),
    );
    if (partialKey) {
      return extractedFields[partialKey];
    }

    return null;
  }

  /**
   * Detect fields from context
   */
  private async detectFromContext(
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
  ): Promise<DetectedField[]> {
    const detections: DetectedField[] = [];

    // Detect based on form type
    if (context.formType === "NCR") {
      // NCR-specific detections
      const ncrField = fields.find(
        (f) => f.name.includes("ncr") || f.name.includes("non_conformance"),
      );
      if (ncrField && context.relatedEntityId) {
        detections.push({
          fieldId: ncrField.id,
          fieldName: ncrField.name,
          detectedValue: context.relatedEntityId,
          confidence: 80,
          source: "CONTEXT",
          method: "Related entity detection",
        });
      }
    }

    // Detect location
    const locationField = fields.find(
      (f) =>
        f.name.includes("location") ||
        f.name.includes("site") ||
        f.name.includes("warehouse"),
    );
    if (locationField && context.location) {
      detections.push({
        fieldId: locationField.id,
        fieldName: locationField.name,
        detectedValue: context.location,
        confidence: 90,
        source: "CONTEXT",
        method: "Location context",
      });
    }

    // Detect department
    const departmentField = fields.find(
      (f) => f.name.includes("department") || f.name.includes("dept"),
    );
    if (departmentField && context.department) {
      detections.push({
        fieldId: departmentField.id,
        fieldName: departmentField.name,
        detectedValue: context.department,
        confidence: 90,
        source: "CONTEXT",
        method: "Department context",
      });
    }

    // Detect date fields (set to today)
    const dateFields = fields.filter((f) => f.type === "date");
    dateFields.forEach((field) => {
      if (
        field.name.includes("date") ||
        field.name.includes("occurred") ||
        field.name.includes("reported")
      ) {
        detections.push({
          fieldId: field.id,
          fieldName: field.name,
          detectedValue: new Date().toISOString().split("T")[0],
          confidence: 70,
          source: "CONTEXT",
          method: "Current date detection",
        });
      }
    });

    return detections;
  }

  /**
   * Detect fields from patterns in previous forms
   */
  private async detectFromPatterns(
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
  ): Promise<DetectedField[]> {
    const detections: DetectedField[] = [];

    if (!context.previousForms || context.previousForms.length === 0) {
      return detections;
    }

    // Analyze patterns in previous forms
    for (const field of fields) {
      const values = context.previousForms
        .map((form) => form[field.name])
        .filter((v) => v !== undefined && v !== null && v !== "");

      if (values.length > 0) {
        // Get most common value
        const valueCounts = new Map<any, number>();
        values.forEach((v) => {
          valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
        });

        const mostCommon = Array.from(valueCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];

        if (mostCommon && mostCommon[1] >= 2) {
          const confidence = Math.min(
            75,
            (mostCommon[1] / values.length) * 100,
          );
          detections.push({
            fieldId: field.id,
            fieldName: field.name,
            detectedValue: mostCommon[0],
            confidence,
            source: "PATTERN",
            method: `Pattern from ${mostCommon[1]} previous forms`,
          });
        }
      }
    }

    return detections;
  }

  /**
   * Detect fields using AI
   */
  private async detectWithAI(
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
    existingDetections: DetectedField[],
  ): Promise<DetectedField[]> {
    const detections: DetectedField[] = [];

    try {
      const prompt = `You are a smart form detection assistant. Analyze the context and suggest values for form fields.

Form Type: ${context.formType}
Module: ${context.moduleId}
${context.relatedEntityType ? `Related Entity: ${context.relatedEntityType} (${context.relatedEntityId})` : ""}
${context.location ? `Location: ${context.location}` : ""}
${context.department ? `Department: ${context.department}` : ""}

Fields to detect:
${fields.map((f) => `- ${f.label} (${f.name}, type: ${f.type})`).join("\n")}

Already detected:
${existingDetections.map((d) => `- ${d.fieldName}: ${d.detectedValue} (${d.confidence}% confidence)`).join("\n")}

Suggest values for fields that haven't been detected yet. Return JSON:
{
  "detections": [
    {
      "fieldName": "field_name",
      "value": "suggested_value",
      "confidence": 0-100,
      "reasoning": "why this value makes sense"
    }
  ]
}`;

      const response = await callAI(
        [
          {
            role: "system",
            content:
              "You are a smart form detection assistant that analyzes context and suggests appropriate form field values.",
          },
          { role: "user", content: prompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 1000,
        },
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.detections) {
          for (const detection of data.detections) {
            const field = fields.find((f) => f.name === detection.fieldName);
            if (
              field &&
              !existingDetections.find((d) => d.fieldId === field.id)
            ) {
              detections.push({
                fieldId: field.id,
                fieldName: field.name,
                detectedValue: detection.value,
                confidence: detection.confidence || 60,
                source: "AI_ANALYSIS",
                method: detection.reasoning || "AI analysis",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in AI detection:", error);
    }

    return detections;
  }

  /**
   * Detect fields from knowledge base
   */
  private async detectFromKnowledgeBase(
    fields: Array<{ id: string; name: string; type: string; label: string }>,
    context: DetectionContext,
  ): Promise<DetectedField[]> {
    const detections: DetectedField[] = [];

    try {
      const query = `${context.formType} ${context.moduleId} form fields`;
      const results = await knowledgeBaseService.search(query, {
        limit: 5,
        tenantId: context.tenantId,
      });

      if (results.length > 0) {
        // Extract relevant information from knowledge base
        for (const field of fields) {
          const relevantResult = results.find(
            (r) =>
              r.content.toLowerCase().includes(field.name.toLowerCase()) ||
              r.content.toLowerCase().includes(field.label.toLowerCase()),
          );

          if (relevantResult) {
            detections.push({
              fieldId: field.id,
              fieldName: field.name,
              detectedValue: relevantResult.content.substring(0, 200), // Simplified
              confidence: Math.min(65, relevantResult.relevance * 100),
              source: "KNOWLEDGE_BASE",
              method: `Knowledge base: ${relevantResult.entity}`,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error detecting from knowledge base:", error);
    }

    return detections;
  }

  /**
   * Merge detections (keep highest confidence)
   */
  private mergeDetections(detections: DetectedField[]): DetectedField[] {
    const merged = new Map<string, DetectedField>();

    for (const detection of detections) {
      const existing = merged.get(detection.fieldId);
      if (!existing || detection.confidence > existing.confidence) {
        merged.set(detection.fieldId, detection);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Check if field is critical
   */
  private isCriticalField(
    field: { name: string; label: string },
    context: DetectionContext,
  ): boolean {
    const criticalFields = [
      "title",
      "subject",
      "description",
      "priority",
      "severity",
      "location",
      "occurred",
      "reported",
      "assigned",
      "owner",
    ];

    return criticalFields.some(
      (cf) =>
        field.name.toLowerCase().includes(cf) ||
        field.label.toLowerCase().includes(cf),
    );
  }
}

export const smartDetectionService = new SmartDetectionService();
export default smartDetectionService;
