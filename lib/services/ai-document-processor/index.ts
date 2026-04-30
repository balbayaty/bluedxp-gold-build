/**
 * AI Document Processor - Universal Service
 * Converts any document into visualized processes
 * Reusable across all modules
 */

export {
  documentParser,
  type ParsedDocument,
  type DocumentType,
} from "./documentParser";
export {
  processExtractor,
  type ExtractedProcess,
  type ExtractedStep,
  type DecisionPoint,
  type ProcessVisualization,
  type ProcessNode,
  type ProcessEdge,
} from "./processExtractor";
export {
  processVisualizer,
  type VisualizationOptions,
} from "./processVisualizer";

/**
 * Complete document-to-process pipeline
 */
export async function processDocumentToWorkflow(
  file: File | Buffer,
  filename: string,
  options?: {
    useAI?: boolean;
    processType?:
      | "workflow"
      | "procedure"
      | "checklist"
      | "approval-process"
      | "data-processing"
      | "integration"
      | "compliance";
  },
) {
  const { documentParser } = await import("./documentParser");
  const { processExtractor } = await import("./processExtractor");
  const { processVisualizer } = await import("./processVisualizer");

  // Step 1: Parse document
  const parsed = await documentParser.parseDocument(file, filename);

  // Step 2: Extract process
  const extracted = await processExtractor.extractProcess(parsed, {
    useAI: options?.useAI,
    processType: options?.processType,
  });

  // Step 3: Generate visualization
  const visualization = processVisualizer.generateVisualization(extracted, {
    layout: "flow",
    direction: "horizontal",
    showLabels: true,
    showDetails: false,
  });

  // Step 4: Convert to workflow
  const workflow = processExtractor.convertToWorkflow(extracted);

  return {
    parsed,
    extracted,
    visualization,
    workflow,
  };
}
