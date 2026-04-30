/**
 * Process Visualizer
 * Converts extracted processes into visual representations
 * Supports multiple visualization formats
 */

import type {
  ExtractedProcess,
  ProcessVisualization,
  ProcessNode,
  ProcessEdge,
} from "./processExtractor";
import type { Workflow } from "@/lib/services/process-lifecycle/workflow/workflowService";

export interface VisualizationOptions {
  layout: "hierarchical" | "flow" | "timeline" | "bpmn";
  direction: "horizontal" | "vertical";
  showLabels: boolean;
  showDetails: boolean;
  theme?: "light" | "dark";
}

export class ProcessVisualizer {
  /**
   * Generate visualization from extracted process
   */
  generateVisualization(
    process: ExtractedProcess,
    options: VisualizationOptions = {
      layout: "flow",
      direction: "horizontal",
      showLabels: true,
      showDetails: false,
    },
  ): ProcessVisualization {
    const nodes: ProcessNode[] = [];
    const edges: ProcessEdge[] = [];

    // Calculate positions based on layout
    const positions = this.calculatePositions(process, options);

    // Add start node
    nodes.push({
      id: "start",
      label: "Start",
      type: "start",
      position: positions.start,
      data: { type: "start" },
    });

    // Add step nodes
    process.steps.forEach((step, index) => {
      nodes.push({
        id: step.id,
        label: step.name,
        type: step.type === "decision" ? "decision" : "step",
        position: positions.steps[index] || { x: 0, y: 0 },
        data: {
          ...step,
          description: step.description,
          actor: step.actor,
          duration: step.duration,
        },
      });

      // Add edge from previous
      if (index === 0) {
        edges.push({
          id: `edge-start-${step.id}`,
          source: "start",
          target: step.id,
          label: options.showLabels ? "Begin" : undefined,
        });
      } else {
        const prevStep = process.steps[index - 1];
        edges.push({
          id: `edge-${prevStep.id}-${step.id}`,
          source: prevStep.id,
          target: step.id,
          label: options.showLabels ? undefined : undefined,
        });
      }
    });

    // Add decision branches
    process.decisions.forEach((decision) => {
      // Find step that contains this decision
      const decisionStep = process.steps.find((s) =>
        s.description?.toLowerCase().includes(decision.question.toLowerCase()),
      );

      if (decisionStep) {
        decision.options.forEach((option, optIndex) => {
          const targetStep =
            process.steps.find((s) => s.id === option.nextStepId) ||
            process.steps[
              process.steps.findIndex((s) => s.id === decisionStep.id) + 1
            ];

          if (targetStep) {
            edges.push({
              id: `edge-${decisionStep.id}-${targetStep.id}-${optIndex}`,
              source: decisionStep.id,
              target: targetStep.id,
              label: option.value,
              condition: option.condition,
            });
          }
        });
      }
    });

    // Add end node
    const endId = "end";
    const lastStep = process.steps[process.steps.length - 1];
    nodes.push({
      id: endId,
      label: "End",
      type: "end",
      position: positions.end,
      data: { type: "end" },
    });

    if (lastStep) {
      edges.push({
        id: `edge-${lastStep.id}-end`,
        source: lastStep.id,
        target: endId,
        label: options.showLabels ? "Complete" : undefined,
      });
    }

    return {
      nodes,
      edges,
      layout: options.layout,
    };
  }

  /**
   * Calculate node positions based on layout
   */
  private calculatePositions(
    process: ExtractedProcess,
    options: VisualizationOptions,
  ): {
    start: { x: number; y: number };
    steps: { x: number; y: number }[];
    end: { x: number; y: number };
  } {
    const stepCount = process.steps.length;
    const spacing = options.direction === "horizontal" ? 250 : 150;
    const verticalSpacing = options.direction === "vertical" ? 150 : 100;

    const start = { x: 0, y: 0 };
    const steps: { x: number; y: number }[] = [];
    const end = { x: 0, y: 0 };

    if (options.layout === "hierarchical") {
      // Hierarchical layout (tree-like)
      process.steps.forEach((step, index) => {
        const level = Math.floor(index / 3);
        const positionInLevel = index % 3;

        steps.push({
          x: level * spacing,
          y: (positionInLevel - 1) * verticalSpacing,
        });
      });

      end.x = Math.ceil(stepCount / 3) * spacing;
      end.y = 0;
    } else if (options.layout === "flow") {
      // Flow layout (linear with branches)
      process.steps.forEach((step, index) => {
        if (options.direction === "horizontal") {
          steps.push({
            x: (index + 1) * spacing,
            y: 0,
          });
        } else {
          steps.push({
            x: 0,
            y: (index + 1) * verticalSpacing,
          });
        }
      });

      if (options.direction === "horizontal") {
        end.x = (stepCount + 1) * spacing;
        end.y = 0;
      } else {
        end.x = 0;
        end.y = (stepCount + 1) * verticalSpacing;
      }
    } else {
      // Timeline layout
      process.steps.forEach((step, index) => {
        steps.push({
          x: index * spacing,
          y: 0,
        });
      });

      end.x = stepCount * spacing;
      end.y = 0;
    }

    return { start, steps, end };
  }

  /**
   * Convert visualization to React Flow format
   */
  toReactFlowFormat(visualization: ProcessVisualization) {
    return {
      nodes: visualization.nodes.map((node) => ({
        id: node.id,
        type:
          node.type === "decision"
            ? "condition"
            : node.type === "start"
              ? "input"
              : node.type === "end"
                ? "output"
                : "default",
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label,
          ...node.data,
        },
      })),
      edges: visualization.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: true,
        style: { stroke: "#6366f1" },
      })),
    };
  }

  /**
   * Convert visualization to BPMN format (simplified)
   */
  toBPMNFormat(visualization: ProcessVisualization): string {
    // Simplified BPMN XML
    let bpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_1">
`;

    visualization.nodes.forEach((node) => {
      if (node.type === "start") {
        bpmn += `    <bpmn:startEvent id="${node.id}" name="${node.label}"/>\n`;
      } else if (node.type === "end") {
        bpmn += `    <bpmn:endEvent id="${node.id}" name="${node.label}"/>\n`;
      } else if (node.type === "decision") {
        bpmn += `    <bpmn:exclusiveGateway id="${node.id}" name="${node.label}"/>\n`;
      } else {
        bpmn += `    <bpmn:task id="${node.id}" name="${node.label}"/>\n`;
      }
    });

    visualization.edges.forEach((edge) => {
      bpmn += `    <bpmn:sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}"/>\n`;
    });

    bpmn += `  </bpmn:process>
</bpmn:definitions>`;

    return bpmn;
  }

  /**
   * Export visualization as image (SVG)
   */
  toSVG(
    visualization: ProcessVisualization,
    options: VisualizationOptions,
  ): string {
    const width = 1200;
    const height = 800;
    const padding = 50;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .node { fill: #3b82f6; stroke: #1e40af; stroke-width: 2; }
      .start { fill: #10b981; }
      .end { fill: #ef4444; }
      .decision { fill: #f59e0b; }
      .edge { stroke: #6366f1; stroke-width: 2; fill: none; }
      .label { font-family: Arial; font-size: 12px; fill: #1f2937; }
    </style>
  </defs>
`;

    // Draw edges first (so they appear behind nodes)
    visualization.edges.forEach((edge) => {
      const sourceNode = visualization.nodes.find((n) => n.id === edge.source);
      const targetNode = visualization.nodes.find((n) => n.id === edge.target);

      if (sourceNode?.position && targetNode?.position) {
        const x1 = sourceNode.position.x + padding;
        const y1 = sourceNode.position.y + padding;
        const x2 = targetNode.position.x + padding;
        const y2 = targetNode.position.y + padding;

        svg += `  <line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>\n`;

        if (edge.label) {
          svg += `  <text class="label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}">${edge.label}</text>\n`;
        }
      }
    });

    // Draw nodes
    visualization.nodes.forEach((node) => {
      if (node.position) {
        const x = node.position.x + padding;
        const y = node.position.y + padding;
        const width = 120;
        const height = 60;

        let className = "node";
        if (node.type === "start") className = "start";
        else if (node.type === "end") className = "end";
        else if (node.type === "decision") className = "decision";

        svg += `  <rect class="${className}" x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="5"/>\n`;
        svg += `  <text class="label" x="${x}" y="${y + 5}" text-anchor="middle">${node.label}</text>\n`;
      }
    });

    svg += `</svg>`;
    return svg;
  }
}

export const processVisualizer = new ProcessVisualizer();
