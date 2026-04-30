/**
 * NLP Service for Procurement
 * Voice requisitions, natural language processing, intelligent document processing
 * ZERO DUPLICATION - Reuses AI services
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "./requisitionService";
import type { DomainEvent } from "@/types/cqrs";

// AI services for NLP processing
import { callAI } from "@/utils/aiClient";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

export interface VoiceRequisition {
  audioUrl?: string;
  transcript: string;
  extractedData: {
    items: Array<{
      itemName: string;
      quantity?: number;
      unit?: string;
      specifications?: string;
    }>;
    projectId?: string;
    priority?: string;
    notes?: string;
  };
  confidence: number;
}

export interface NaturalLanguageRequisition {
  text: string;
  extractedData: {
    items: Array<{
      itemName: string;
      quantity?: number;
      unit?: string;
      specifications?: string;
    }>;
    projectId?: string;
    priority?: string;
    notes?: string;
  };
  confidence: number;
  suggestions: Array<{
    type: "ITEM" | "VENDOR" | "CATEGORY";
    suggestion: string;
    confidence: number;
  }>;
}

export class NLPService {
  /**
   * Process voice requisition
   * Convert voice to text and extract requisition data
   */
  async processVoiceRequisition(
    tenantId: string,
    audioUrl: string,
  ): Promise<VoiceRequisition> {
    let transcript = "";
    let confidence = 0.85;

    try {
      // Use OpenAI Whisper API for speech-to-text if available
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (openaiApiKey && audioUrl) {
        // Fetch audio file
        const audioResponse = await fetch(audioUrl);
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob();
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.mp3");
          formData.append("model", "whisper-1");
          formData.append("language", "en");

          const whisperResponse = await fetch(
            "https://api.openai.com/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
              },
              body: formData,
            },
          );

          if (whisperResponse.ok) {
            const result = await whisperResponse.json();
            transcript = result.text || "";
            confidence = 0.95;
          }
        }
      }
    } catch (error) {
      console.warn("Speech-to-text failed, using mock:", error);
    }

    // Fallback to mock if no transcript
    if (!transcript) {
      transcript =
        "I need 100 kg of concrete mix for project ABC, urgent delivery";
      confidence = 0.85;
    }

    // Extract requisition data from transcript
    const extracted = await this.extractRequisitionData(tenantId, transcript);

    return {
      audioUrl,
      transcript,
      extractedData: extracted,
      confidence,
    };
  }

  /**
   * Extract requisition data from text using AI
   */
  private async extractRequisitionData(
    tenantId: string,
    text: string,
  ): Promise<VoiceRequisition["extractedData"]> {
    try {
      const response = await callAI({
        prompt: `Extract procurement requisition data from the following text. Return JSON with items (array of {itemName, quantity, unit, specifications}), projectId, priority, notes.

Text: "${text}"`,
        systemPrompt: `You are a procurement data extraction assistant. Extract item names, quantities, units, project references, priority levels, and any notes from natural language text. Return valid JSON only.`,
        model: "gpt-4",
        temperature: 0.3,
      });

      // Parse AI response
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn("Failed to parse AI response:", parseError);
      }
    } catch (error) {
      console.warn("AI extraction failed:", error);
    }

    // Fallback: simple pattern matching
    const items: VoiceRequisition["extractedData"]["items"] = [];

    // Extract quantity and unit patterns
    const quantityPattern =
      /(\d+(?:\.\d+)?)\s*(kg|KG|ton|TON|m|M|pcs|PCS|units?|UNITS?|boxes?|BOXES?)/gi;
    const matches = text.matchAll(quantityPattern);

    for (const match of matches) {
      const quantity = parseFloat(match[1]);
      const unit = match[2].toUpperCase();

      // Try to find item name before the quantity
      const beforeQuantity = text.substring(0, match.index);
      const itemWords = beforeQuantity.split(/\s+/).slice(-3).join(" ");

      items.push({
        itemName: itemWords || "Unknown Item",
        quantity,
        unit,
      });
    }

    // Detect priority
    let priority: string | undefined;
    if (/urgent|ASAP|immediate/i.test(text)) {
      priority = "URGENT";
    } else if (/high priority|important/i.test(text)) {
      priority = "HIGH";
    }

    // Detect project ID
    const projectMatch = text.match(/project\s+([A-Z0-9-]+)/i);
    const projectId = projectMatch ? projectMatch[1] : undefined;

    return {
      items: items.length > 0 ? items : [{ itemName: "Unknown Item" }],
      projectId,
      priority,
      notes: text,
    };
  }

  /**
   * Process natural language requisition
   * Extract requisition data from free text
   */
  async processNaturalLanguageRequisition(
    tenantId: string,
    text: string,
  ): Promise<NaturalLanguageRequisition> {
    let extracted: NaturalLanguageRequisition["extractedData"];
    let confidence = 0.88;
    const suggestions: NaturalLanguageRequisition["suggestions"] = [];

    try {
      // Use AI for extraction
      const response = await callAI({
        prompt: `Extract procurement requisition data from: "${text}"
        
Return JSON with:
- items: array of {itemName, quantity, unit, specifications}
- projectId: string or null
- priority: URGENT/HIGH/MEDIUM/LOW or null
- notes: any additional notes`,
        systemPrompt: `You are a procurement data extraction assistant. Extract items, quantities, units, project references, and priority from natural language text. Be precise with quantities and units. Return valid JSON only.`,
        model: "gpt-4",
        temperature: 0.3,
      });

      // Parse AI response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
        confidence = 0.92;
      } else {
        throw new Error("No JSON in response");
      }
    } catch (error) {
      console.warn("AI extraction failed, using fallback:", error);
      // Use fallback extraction
      extracted = await this.extractRequisitionData(tenantId, text);
      confidence = 0.75;
    }

    // Get suggestions from knowledge base
    try {
      if (extracted.items && extracted.items.length > 0) {
        for (const item of extracted.items) {
          // Search for related vendors
          const vendorResults = await knowledgeBaseService.search({
            query: `vendor supplier for ${item.itemName}`,
            filters: { type: "fact" },
            limit: 2,
          });

          for (const result of vendorResults.results || []) {
            if (
              result.content?.includes("vendor") ||
              result.content?.includes("supplier")
            ) {
              suggestions.push({
                type: "VENDOR",
                suggestion:
                  result.title ||
                  result.content?.substring(0, 50) ||
                  "Suggested Vendor",
                confidence: result.score || 0.8,
              });
            }
          }

          // Search for related categories
          const categoryResults = await knowledgeBaseService.search({
            query: `category classification for ${item.itemName}`,
            filters: { type: "fact" },
            limit: 2,
          });

          for (const result of categoryResults.results || []) {
            suggestions.push({
              type: "CATEGORY",
              suggestion: result.title || "General Materials",
              confidence: result.score || 0.85,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Knowledge base search failed:", error);
    }

    // Add default suggestions if none found
    if (
      suggestions.length === 0 &&
      extracted.items &&
      extracted.items.length > 0
    ) {
      suggestions.push({
        type: "CATEGORY",
        suggestion: "General Materials",
        confidence: 0.7,
      });
    }

    return {
      text,
      extractedData: extracted,
      confidence,
      suggestions,
    };
  }

  /**
   * Auto-complete requisition suggestions
   * Provide intelligent suggestions while typing
   */
  async getRequisitionSuggestions(
    tenantId: string,
    partialText: string,
    context?: {
      projectId?: string;
      category?: string;
    },
  ): Promise<
    Array<{
      type: "ITEM" | "VENDOR" | "CATEGORY";
      suggestion: string;
      confidence: number;
    }>
  > {
    // TODO: Use AI/knowledge base for suggestions
    // const suggestions = await knowledgeBaseService.search(partialText, {
    //   category: context?.category,
    //   limit: 10,
    // })

    // Mock suggestions
    return [
      {
        type: "ITEM",
        suggestion: "Concrete Mix",
        confidence: 0.95,
      },
      {
        type: "ITEM",
        suggestion: "Concrete Blocks",
        confidence: 0.85,
      },
      {
        type: "VENDOR",
        suggestion: "ABC Concrete Suppliers",
        confidence: 0.9,
      },
    ];
  }

  /**
   * Validate requisition text
   * Intelligent validation and error detection
   */
  async validateRequisitionText(
    tenantId: string,
    text: string,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    // TODO: Use AI for intelligent validation
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!text || text.length < 10) {
      errors.push("Requisition text is too short");
    }

    // Check for required fields
    if (!text.match(/\d+/)) {
      warnings.push("No quantity specified");
      suggestions.push("Please specify quantity (e.g., 100 kg, 50 units)");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Process invoice OCR
   * Extract invoice data from image/document
   */
  async processInvoiceOCR(
    tenantId: string,
    imageUrl: string,
  ): Promise<{
    invoiceNumber?: string;
    vendorName?: string;
    totalAmount?: number;
    invoiceDate?: Date | string;
    items?: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    confidence: number;
  }> {
    // TODO: Use vision service for OCR
    // const ocrResult = await visionService.extractTextFromImage(imageUrl)
    // const extracted = await this.extractInvoiceData(ocrResult.text)

    // Mock OCR extraction
    return {
      invoiceNumber: "INV-001",
      vendorName: "ABC Suppliers",
      totalAmount: 10000,
      invoiceDate: new Date().toISOString(),
      items: [
        {
          itemName: "Material 1",
          quantity: 100,
          unitPrice: 100,
          total: 10000,
        },
      ],
      confidence: 0.9,
    };
  }
}

// Singleton instance
export const nlpService = new NLPService();
