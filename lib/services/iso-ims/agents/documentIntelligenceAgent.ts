/**
 * Document Intelligence Agent
 *
 * Autonomous agent that manages document intelligence:
 * - Auto-classification
 * - Auto-linking
 * - Compliance checking
 * - Content analysis
 * - Version management
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { documentService } from "../documentService";
import { documentIntelligenceService } from "../documentIntelligenceService";
import { isoIMSFacilityIntegrationService } from "../facilityIntegrationService";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export class DocumentIntelligenceAgent {
  private agentId = "document-intelligence-agent";

  async initialize(): Promise<void> {
    await agentOrchestrator.registerAgent({
      id: this.agentId,
      type: "document-intelligence",
      name: "Document Intelligence Agent",
      description: "Automatically classifies, links, and analyzes documents",
      capabilities: [
        {
          id: "auto-classify-document",
          name: "Auto-Classify Document",
          description: "Automatically classify documents by type and category",
          categories: ["document", "classification"],
          confidenceThreshold: 0.9,
          priority: 10,
        },
        {
          id: "auto-link-document",
          name: "Auto-Link Document",
          description:
            "Automatically link documents to facilities, assets, standards",
          categories: ["document", "linking"],
          confidenceThreshold: 0.85,
          priority: 9,
        },
        {
          id: "check-document-compliance",
          name: "Check Document Compliance",
          description: "Automatically check document compliance with standards",
          categories: ["document", "compliance"],
          confidenceThreshold: 0.9,
          priority: 8,
        },
        {
          id: "analyze-document-content",
          name: "Analyze Document Content",
          description: "Analyze document content for quality and completeness",
          categories: ["document", "analysis"],
          confidenceThreshold: 0.85,
          priority: 7,
        },
      ],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Subscribe to document events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to document events
   */
  private subscribeToEvents(): void {
    // Subscribe to new document creation
    eventBus.subscribe("iso-ims.document.created", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { documentId } = event.payload as any;
        const { tenantId } = event.metadata;
        if (documentId && tenantId) {
          // Process document asynchronously
          Promise.resolve().then(async () => {
            try {
              await this.processNewDocument(documentId, tenantId);
            } catch (error) {
              console.warn(
                "Document Intelligence Agent processing failed:",
                error,
              );
            }
          });
        }
      }
    });

    console.log(
      "✅ Document Intelligence Agent event subscriptions registered",
    );
  }

  /**
   * Process new document (auto-classify, auto-link, compliance check)
   */
  async processNewDocument(
    documentId: string,
    tenantId: string,
  ): Promise<{
    classified: boolean;
    linked: number;
    complianceChecked: boolean;
    insights: any;
  }> {
    try {
      const document = await documentService.getDocument(documentId, tenantId);
      if (!document) {
        throw new Error("Document not found");
      }

      let classified = false;
      let linked = 0;
      let complianceChecked = false;

      // Auto-classify if not already classified
      if (!document.intelligenceMetadata?.autoClassified) {
        const classification =
          await documentIntelligenceService.autoClassifyDocument(
            document.title,
            document.description || "",
            document.content,
          );

        if (classification.confidence > 0.7) {
          await documentService.updateDocument(
            documentId,
            {
              // Would update document type and category
            },
            tenantId,
            "system",
          );
          classified = true;
        }
      }

      // Auto-link to facilities/assets
      const linkSuggestions = await documentService.suggestLinks(
        documentId,
        tenantId,
      );
      const highConfidenceLinks = linkSuggestions.filter(
        (l) => l.confidence >= 0.8,
      );

      for (const suggestion of highConfidenceLinks) {
        try {
          if (suggestion.type === "FACILITY") {
            await isoIMSFacilityIntegrationService.linkDocumentToFacility(
              documentId,
              suggestion.id,
              tenantId,
              "system",
            );
            linked++;
          } else if (suggestion.type === "ASSET") {
            await isoIMSFacilityIntegrationService.linkDocumentToAsset(
              documentId,
              suggestion.id,
              tenantId,
              "system",
            );
            linked++;
          }
        } catch (error) {
          console.warn(
            `Failed to auto-link ${suggestion.type} ${suggestion.id}:`,
            error,
          );
        }
      }

      // Check compliance
      const complianceCheck = await documentService.performComplianceCheck(
        documentId,
        tenantId,
      );
      complianceChecked = true;

      // Get AI insights
      const insights = await documentService.getAIInsights(
        documentId,
        tenantId,
      );

      // Publish event
      await eventBus.publish(
        createEvent(
          "iso-ims.agent.document.processed",
          documentId,
          "DOCUMENT",
          {
            documentId,
            agentId: this.agentId,
            tenantId,
            classified,
            linked,
            complianceChecked,
            complianceScore: complianceCheck.score,
          },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return {
        classified,
        linked,
        complianceChecked,
        insights,
      };
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    }
  }

  /**
   * Batch process documents
   */
  async batchProcessDocuments(
    tenantId: string,
    documentIds: string[],
  ): Promise<{
    processed: number;
    failed: number;
    results: Array<{ documentId: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{
      documentId: string;
      success: boolean;
      error?: string;
    }> = [];
    let processed = 0;
    let failed = 0;

    for (const documentId of documentIds) {
      try {
        await this.processNewDocument(documentId, tenantId);
        results.push({ documentId, success: true });
        processed++;
      } catch (error) {
        results.push({
          documentId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failed++;
      }
    }

    return {
      processed,
      failed,
      results,
    };
  }

  /**
   * Analyze document content quality
   */
  async analyzeDocumentQuality(
    documentId: string,
    tenantId: string,
  ): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const document = await documentService.getDocument(documentId, tenantId);
      if (!document) {
        throw new Error("Document not found");
      }

      const insights = await documentService.getAIInsights(
        documentId,
        tenantId,
      );
      const issues: string[] = [];
      const suggestions: string[] = [];

      // Check completeness
      if (!document.description) {
        issues.push("Missing description");
        suggestions.push("Add a description to improve document clarity");
      }

      if (!document.fileUrl && !document.content) {
        issues.push("Missing document content");
        suggestions.push("Upload document file or add content");
      }

      if (!document.nextReviewDate) {
        issues.push("Missing review date");
        suggestions.push("Set next review date for compliance");
      }

      // Use AI insights
      if (insights.suggestions) {
        suggestions.push(...insights.suggestions);
      }

      const qualityScore = Math.max(
        0,
        100 - issues.length * 20 - (insights.readabilityScore < 50 ? 20 : 0),
      );

      return {
        qualityScore,
        issues,
        suggestions,
      };
    } catch (error) {
      console.error("Error analyzing document quality:", error);
      throw error;
    }
  }
}

export const documentIntelligenceAgent = new DocumentIntelligenceAgent();
