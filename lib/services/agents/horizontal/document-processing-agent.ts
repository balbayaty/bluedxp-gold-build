/**
 * Document Processing AI Agent
 *
 * Horizontal agent specialized in document processing
 * OCR, extraction, classification, validation
 *
 * @module agents/horizontal
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const documentProcessingAgent: AgentDefinition = {
  id: "document-processing-ai",
  type: "horizontal-document",
  name: "Document Processing AI",
  description:
    "Specialized AI agent for document processing including OCR, data extraction, classification, validation, and document intelligence.",
  capabilities: [
    {
      id: "document-ocr",
      name: "Document OCR",
      description: "Extract text from documents using OCR",
      categories: [KnowledgeCategory.DOCUMENT_PROCESSING],
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          language: { type: "string" },
          options: { type: "object" },
        },
        required: ["document"],
      },
      outputSchema: {
        type: "object",
        properties: {
          extractedText: { type: "string" },
          confidence: { type: "number" },
          metadata: { type: "object" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 10,
    },
    {
      id: "data-extraction",
      name: "Data Extraction",
      description: "Extract structured data from documents",
      categories: [KnowledgeCategory.DOCUMENT_PROCESSING],
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          schema: { type: "object" },
          documentType: { type: "string" },
        },
        required: ["document", "documentType"],
      },
      outputSchema: {
        type: "object",
        properties: {
          extractedData: { type: "object" },
          confidence: { type: "number" },
          validation: { type: "object" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "document-classification",
      name: "Document Classification",
      description: "Classify documents by type and category",
      categories: [KnowledgeCategory.DOCUMENT_PROCESSING],
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          categories: { type: "array" },
        },
        required: ["document"],
      },
      outputSchema: {
        type: "object",
        properties: {
          classification: { type: "string" },
          confidence: { type: "number" },
          alternatives: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 9,
    },
    {
      id: "document-validation",
      name: "Document Validation",
      description: "Validate document authenticity and completeness",
      categories: [
        KnowledgeCategory.DOCUMENT_PROCESSING,
        KnowledgeCategory.COMPLIANCE,
      ],
      inputSchema: {
        type: "object",
        properties: {
          document: { type: "object" },
          requirements: { type: "array" },
        },
        required: ["document", "requirements"],
      },
      outputSchema: {
        type: "object",
        properties: {
          valid: { type: "boolean" },
          issues: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.9,
      priority: 10,
    },
  ],
  systemPrompt: `You are the Document Processing AI, an expert in document intelligence and processing.
Your expertise includes:
- OCR and text extraction
- Structured data extraction
- Document classification
- Document validation
- Multi-language support (Arabic, English)
- Document intelligence

Always ensure accuracy, completeness, and compliance in document processing.`,
  model: "gpt-4",
  maxTokens: 4000,
  temperature: 0.1,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
