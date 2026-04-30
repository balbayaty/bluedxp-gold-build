/**
 * AI-Powered Process Extractor
 * Uses AI/ML to extract process information from documents
 * Converts documents into process models, workflows, and visualizations
 */

import OpenAI from "openai";
import type { ParsedDocument } from "./documentParser";
import type {
  Workflow,
  WorkflowStep,
} from "@/lib/services/process-lifecycle/workflow/workflowService";

export interface ExtractedProcess {
  id: string;
  name: string;
  description: string;
  type: ProcessType;
  steps: ExtractedStep[];
  actors: string[]; // People/roles involved
  inputs: string[]; // Inputs required
  outputs: string[]; // Outputs produced
  decisions: DecisionPoint[];
  timeline?: {
    estimatedDuration?: number;
    stages?: string[];
  };
  metadata: {
    confidence: number;
    source: string;
    extractedAt: string;
  };
}

export type ProcessType =
  | "workflow"
  | "procedure"
  | "checklist"
  | "approval-process"
  | "data-processing"
  | "integration"
  | "compliance"
  | "unknown";

export interface ExtractedStep {
  id: string;
  name: string;
  description: string;
  order: number;
  type: "action" | "decision" | "approval" | "notification" | "integration";
  actor?: string;
  inputs?: string[];
  outputs?: string[];
  conditions?: string[];
  duration?: number;
}

export interface DecisionPoint {
  id: string;
  question: string;
  options: {
    value: string;
    nextStepId: string;
    condition?: string;
  }[];
}

export interface ProcessVisualization {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  layout: "hierarchical" | "flow" | "timeline";
}

export interface ProcessNode {
  id: string;
  label: string;
  type: "start" | "step" | "decision" | "end";
  position?: { x: number; y: number };
  data?: any;
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export class AIProcessExtractor {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Extract process from document using AI
   */
  async extractProcess(
    document: ParsedDocument,
    options?: {
      processType?: ProcessType;
      useAI?: boolean;
    },
  ): Promise<ExtractedProcess> {
    const useAI = options?.useAI !== false && this.openai !== null;

    if (useAI) {
      return await this.extractWithAI(document, options);
    } else {
      return await this.extractWithPatterns(document, options);
    }
  }

  /**
   * Extract process using AI (GPT-4)
   */
  private async extractWithAI(
    document: ParsedDocument,
    options?: { processType?: ProcessType },
  ): Promise<ExtractedProcess> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = this.buildExtractionPrompt(document, options?.processType);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert process analyst. Extract process information from documents and return structured JSON.
          Focus on: steps, actors, decisions, inputs/outputs, timeline.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const extracted = JSON.parse(response.choices[0].message.content || "{}");

    return this.normalizeExtractedProcess(extracted, document);
  }

  /**
   * Extract process using pattern matching (fallback)
   */
  private async extractWithPatterns(
    document: ParsedDocument,
    options?: { processType?: ProcessType },
  ): Promise<ExtractedProcess> {
    const text = document.content.text;
    const sections = document.content.structured?.sections || [];

    // Extract steps from text
    const steps = this.extractStepsFromText(text, sections);

    // Extract actors
    const actors = this.extractActors(text);

    // Extract decisions
    const decisions = this.extractDecisions(text);

    // Determine process type
    const processType = options?.processType || this.detectProcessType(text);

    return {
      id: `proc-${Date.now()}`,
      name: this.extractProcessName(document.filename, sections),
      description: this.extractDescription(text, sections),
      type: processType,
      steps,
      actors,
      inputs: this.extractInputs(text),
      outputs: this.extractOutputs(text),
      decisions,
      metadata: {
        confidence: 0.7, // Pattern matching has lower confidence
        source: document.filename,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Build extraction prompt for AI
   */
  private buildExtractionPrompt(
    document: ParsedDocument,
    processType?: ProcessType,
  ): string {
    return `Extract process information from this document:

Filename: ${document.filename}
Document Type: ${document.type}

Content:
${document.content.text.substring(0, 8000)} ${document.content.text.length > 8000 ? "..." : ""}

${processType ? `Process Type: ${processType}` : ""}

Extract and return JSON with this structure:
{
  "name": "Process name",
  "description": "Process description",
  "type": "workflow|procedure|checklist|approval-process|data-processing|integration|compliance",
  "steps": [
    {
      "id": "step-1",
      "name": "Step name",
      "description": "Step description",
      "order": 1,
      "type": "action|decision|approval|notification|integration",
      "actor": "Who performs this step",
      "inputs": ["input1", "input2"],
      "outputs": ["output1"],
      "conditions": ["condition1"],
      "duration": 30
    }
  ],
  "actors": ["actor1", "actor2"],
  "inputs": ["input1", "input2"],
  "outputs": ["output1", "output2"],
  "decisions": [
    {
      "id": "decision-1",
      "question": "Decision question",
      "options": [
        {
          "value": "Yes",
          "nextStepId": "step-2",
          "condition": "if condition"
        }
      ]
    }
  ],
  "timeline": {
    "estimatedDuration": 120,
    "stages": ["stage1", "stage2"]
  }
}`;
  }

  /**
   * Normalize extracted process
   */
  private normalizeExtractedProcess(
    extracted: any,
    document: ParsedDocument,
  ): ExtractedProcess {
    return {
      id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: extracted.name || document.filename,
      description: extracted.description || "",
      type: extracted.type || "unknown",
      steps: (extracted.steps || []).map((step: any, index: number) => ({
        id: step.id || `step-${index + 1}`,
        name: step.name || `Step ${index + 1}`,
        description: step.description || "",
        order: step.order || index + 1,
        type: step.type || "action",
        actor: step.actor,
        inputs: step.inputs || [],
        outputs: step.outputs || [],
        conditions: step.conditions || [],
        duration: step.duration,
      })),
      actors: extracted.actors || [],
      inputs: extracted.inputs || [],
      outputs: extracted.outputs || [],
      decisions: (extracted.decisions || []).map((decision: any) => ({
        id: decision.id || `decision-${Date.now()}`,
        question: decision.question || "",
        options: decision.options || [],
      })),
      timeline: extracted.timeline,
      metadata: {
        confidence: 0.9, // AI extraction has high confidence
        source: document.filename,
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract steps from text using patterns
   */
  private extractStepsFromText(text: string, sections: any[]): ExtractedStep[] {
    const steps: ExtractedStep[] = [];

    // Look for numbered steps
    const stepPatterns = [
      /^\d+\.\s+(.+)/gm, // 1. Step
      /^Step\s+\d+[:\-]\s+(.+)/gim, // Step 1: Step
      /^-\s+(.+)/gm, // - Step (in lists)
    ];

    let order = 1;
    stepPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          steps.push({
            id: `step-${order}`,
            name: this.extractStepName(match[1]),
            description: match[1],
            order: order++,
            type: this.detectStepType(match[1]),
          });
        }
      }
    });

    return steps.length > 0 ? steps : this.extractStepsFromSections(sections);
  }

  /**
   * Extract steps from document sections
   */
  private extractStepsFromSections(sections: any[]): ExtractedStep[] {
    return sections
      .filter((s) => s.title && s.content)
      .map((section, index) => ({
        id: `step-${index + 1}`,
        name: section.title,
        description: section.content.substring(0, 200),
        order: index + 1,
        type: this.detectStepType(section.title + " " + section.content) as any,
      }));
  }

  /**
   * Extract step name from text
   */
  private extractStepName(text: string): string {
    // Take first sentence or first 50 chars
    const sentence = text.split(/[.!?]/)[0];
    return sentence.length > 50 ? sentence.substring(0, 50) + "..." : sentence;
  }

  /**
   * Detect step type from text
   */
  private detectStepType(text: string): ExtractedStep["type"] {
    const lower = text.toLowerCase();

    if (lower.includes("approve") || lower.includes("authorize"))
      return "approval";
    if (
      lower.includes("decide") ||
      lower.includes("check") ||
      lower.includes("if")
    )
      return "decision";
    if (
      lower.includes("notify") ||
      lower.includes("send") ||
      lower.includes("email")
    )
      return "notification";
    if (
      lower.includes("integrate") ||
      lower.includes("api") ||
      lower.includes("webhook")
    )
      return "integration";

    return "action";
  }

  /**
   * Extract actors from text
   */
  private extractActors(text: string): string[] {
    const actors: string[] = [];
    const actorPatterns = [
      /(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:should|must|will|shall)/gi,
      /(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:department|team|group)/gi,
    ];

    actorPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !actors.includes(match[1])) {
          actors.push(match[1]);
        }
      }
    });

    return actors.slice(0, 10); // Limit to 10 actors
  }

  /**
   * Extract decisions from text
   */
  private extractDecisions(text: string): DecisionPoint[] {
    const decisions: DecisionPoint[] = [];
    const decisionPatterns = [
      /if\s+(.+?)\s+then/gi,
      /when\s+(.+?)\s+do/gi,
      /check\s+if\s+(.+?)/gi,
    ];

    let id = 1;
    decisionPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          decisions.push({
            id: `decision-${id++}`,
            question: match[1],
            options: [
              { value: "Yes", nextStepId: "step-next" },
              { value: "No", nextStepId: "step-alternative" },
            ],
          });
        }
      }
    });

    return decisions;
  }

  /**
   * Extract inputs from text
   */
  private extractInputs(text: string): string[] {
    const inputs: string[] = [];
    const inputPatterns = [
      /(?:input|require|need|receive)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:with|using|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ];

    inputPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !inputs.includes(match[1])) {
          inputs.push(match[1]);
        }
      }
    });

    return inputs.slice(0, 10);
  }

  /**
   * Extract outputs from text
   */
  private extractOutputs(text: string): string[] {
    const outputs: string[] = [];
    const outputPatterns = [
      /(?:output|produce|generate|create|return)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:result|deliverable|outcome)\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ];

    outputPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !outputs.includes(match[1])) {
          outputs.push(match[1]);
        }
      }
    });

    return outputs.slice(0, 10);
  }

  /**
   * Detect process type from text
   */
  private detectProcessType(text: string): ProcessType {
    const lower = text.toLowerCase();

    if (lower.includes("workflow") || lower.includes("process flow"))
      return "workflow";
    if (lower.includes("procedure") || lower.includes("standard operating"))
      return "procedure";
    if (lower.includes("checklist")) return "checklist";
    if (lower.includes("approval") || lower.includes("authorization"))
      return "approval-process";
    if (lower.includes("data") && lower.includes("process"))
      return "data-processing";
    if (lower.includes("integrate") || lower.includes("api"))
      return "integration";
    if (lower.includes("compliance") || lower.includes("audit"))
      return "compliance";

    return "unknown";
  }

  /**
   * Extract process name
   */
  private extractProcessName(filename: string, sections: any[]): string {
    if (sections.length > 0 && sections[0].title) {
      return sections[0].title;
    }
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  }

  /**
   * Extract description
   */
  private extractDescription(text: string, sections: any[]): string {
    if (sections.length > 0 && sections[0].content) {
      return sections[0].content.substring(0, 500);
    }
    return text.substring(0, 500);
  }

  /**
   * Convert extracted process to workflow
   */
  convertToWorkflow(
    extracted: ExtractedProcess,
  ): Omit<Workflow, "id" | "createdAt" | "updatedAt"> {
    const steps: WorkflowStep[] = extracted.steps.map((step, index) => ({
      id: step.id,
      name: step.name,
      type: step.type === "decision" ? "condition" : step.type,
      config: {
        action: step.type === "action" ? step.name : undefined,
        condition: step.type === "decision" ? step.conditions?.[0] : undefined,
        approver: step.type === "approval" ? step.actor : undefined,
        notification: step.type === "notification" ? step.name : undefined,
        integration: step.type === "integration" ? step.name : undefined,
      },
      position: { x: index * 200, y: 100 },
      connections: extracted.steps[index + 1]
        ? [extracted.steps[index + 1].id]
        : [],
    }));

    return {
      name: extracted.name,
      description: extracted.description,
      steps,
      triggers: [],
      status: "draft",
    };
  }

  /**
   * Generate visualization from extracted process
   */
  generateVisualization(extracted: ExtractedProcess): ProcessVisualization {
    const nodes: ProcessNode[] = [];
    const edges: ProcessEdge[] = [];

    // Add start node
    nodes.push({
      id: "start",
      label: "Start",
      type: "start",
      position: { x: 0, y: 0 },
    });

    // Add step nodes
    extracted.steps.forEach((step, index) => {
      nodes.push({
        id: step.id,
        label: step.name,
        type: step.type === "decision" ? "decision" : "step",
        position: { x: (index + 1) * 200, y: 0 },
        data: step,
      });

      // Add edge from previous
      if (index === 0) {
        edges.push({
          id: `edge-start-${step.id}`,
          source: "start",
          target: step.id,
        });
      } else {
        edges.push({
          id: `edge-${extracted.steps[index - 1].id}-${step.id}`,
          source: extracted.steps[index - 1].id,
          target: step.id,
        });
      }
    });

    // Add end node
    const endId = "end";
    nodes.push({
      id: endId,
      label: "End",
      type: "end",
      position: { x: (extracted.steps.length + 1) * 200, y: 0 },
    });

    if (extracted.steps.length > 0) {
      edges.push({
        id: `edge-${extracted.steps[extracted.steps.length - 1].id}-end`,
        source: extracted.steps[extracted.steps.length - 1].id,
        target: endId,
      });
    }

    // Add decision branches
    extracted.decisions.forEach((decision) => {
      decision.options.forEach((option, optIndex) => {
        edges.push({
          id: `edge-${decision.id}-${option.nextStepId}-${optIndex}`,
          source: decision.id,
          target: option.nextStepId,
          label: option.value,
          condition: option.condition,
        });
      });
    });

    return {
      nodes,
      edges,
      layout: "flow",
    };
  }
}

export const processExtractor = new AIProcessExtractor();
