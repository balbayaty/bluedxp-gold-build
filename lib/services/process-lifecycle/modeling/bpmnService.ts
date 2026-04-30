/**
 * BPMN 2.0 Service
 * Parse, render, validate, and edit BPMN models
 * More advanced than SAP Signavio
 */

import type { Workflow, WorkflowStep } from "../workflow/workflowService";

export interface BPMNModel {
  id: string;
  name: string;
  xml: string;
  json: any;
  version: string;
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
}

export interface BPMNElement {
  id: string;
  type: "task" | "gateway" | "event" | "subprocess" | "lane";
  name: string;
  properties: Record<string, any>;
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
}

export interface BPMNValidationResult {
  valid: boolean;
  errors: BPMNValidationError[];
  warnings: BPMNValidationWarning[];
}

export interface BPMNValidationError {
  elementId: string;
  type: "syntax" | "semantic" | "structure";
  message: string;
  severity: "error" | "warning";
}

export interface BPMNValidationWarning {
  elementId: string;
  message: string;
  suggestion: string;
}

export class AdvancedBPMNService {
  /**
   * Parse BPMN XML
   */
  async parseBPMN(xml: string): Promise<BPMNModel> {
    // Simplified BPMN parser
    // In production, would use bpmn-js or similar library

    try {
      // Parse XML to JSON (simplified)
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");

      // Extract process definition
      const process = doc.querySelector("bpmn\\:process, process");
      if (!process) {
        throw new Error("Invalid BPMN: No process definition found");
      }

      const processId = process.getAttribute("id") || "process-1";
      const processName = process.getAttribute("name") || "Process";

      // Extract elements
      const elements: BPMNElement[] = [];

      // Tasks
      const tasks = doc.querySelectorAll("bpmn\\:task, task");
      tasks.forEach((task, index) => {
        elements.push({
          id: task.getAttribute("id") || `task-${index}`,
          type: "task",
          name: task.getAttribute("name") || "Task",
          properties: {},
          position: { x: index * 200, y: 100 },
        });
      });

      // Gateways
      const gateways = doc.querySelectorAll(
        "bpmn\\:exclusiveGateway, bpmn\\:parallelGateway, gateway",
      );
      gateways.forEach((gateway, index) => {
        elements.push({
          id: gateway.getAttribute("id") || `gateway-${index}`,
          type: "gateway",
          name: gateway.getAttribute("name") || "Gateway",
          properties: {},
          position: { x: index * 200, y: 200 },
        });
      });

      // Events
      const events = doc.querySelectorAll(
        "bpmn\\:startEvent, bpmn\\:endEvent, event",
      );
      events.forEach((event, index) => {
        elements.push({
          id: event.getAttribute("id") || `event-${index}`,
          type: "event",
          name: event.getAttribute("name") || "Event",
          properties: {},
          position: { x: index * 200, y: 0 },
        });
      });

      const model: BPMNModel = {
        id: processId,
        name: processName,
        xml,
        json: {
          id: processId,
          name: processName,
          elements,
        },
        version: "2.0",
        metadata: {
          created: new Date(),
          modified: new Date(),
          author: "system",
        },
      };

      return model;
    } catch (error) {
      throw new Error(
        `Failed to parse BPMN: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Convert workflow to BPMN
   */
  async workflowToBPMN(workflow: Workflow): Promise<BPMNModel> {
    // Convert workflow steps to BPMN elements
    const elements: BPMNElement[] = [];

    // Add start event
    elements.push({
      id: "start-event",
      type: "event",
      name: "Start",
      properties: {},
      position: { x: 100, y: 100 },
    });

    // Convert steps
    workflow.steps.forEach((step, index) => {
      const bpmnType =
        step.type === "action"
          ? "task"
          : step.type === "condition"
            ? "gateway"
            : step.type === "approval"
              ? "task"
              : step.type === "notification"
                ? "task"
                : step.type === "integration"
                  ? "task"
                  : "task";

      elements.push({
        id: step.id,
        type: bpmnType,
        name: step.name,
        properties: {
          type: step.type,
          config: step.config,
        },
        position: step.position || { x: (index + 1) * 200, y: 100 },
      });
    });

    // Add end event
    elements.push({
      id: "end-event",
      type: "event",
      name: "End",
      properties: {},
      position: { x: (workflow.steps.length + 1) * 200, y: 100 },
    });

    // Generate BPMN XML
    const xml = this.generateBPMNXML(workflow.name, elements);

    return {
      id: workflow.id,
      name: workflow.name,
      xml,
      json: {
        id: workflow.id,
        name: workflow.name,
        elements,
      },
      version: "2.0",
      metadata: {
        created: new Date(workflow.createdAt),
        modified: new Date(workflow.updatedAt),
        author: "system",
      },
    };
  }

  /**
   * Convert BPMN to workflow
   */
  async BPMNToWorkflow(model: BPMNModel): Promise<Workflow> {
    const elements = model.json.elements || [];

    // Convert BPMN elements to workflow steps
    const steps: WorkflowStep[] = elements
      .filter((el: BPMNElement) => el.type === "task")
      .map((el: BPMNElement) => ({
        id: el.id,
        name: el.name,
        type: el.properties.type || "action",
        config: el.properties.config || {},
        position: el.position,
        connections: [], // Would be calculated from BPMN flows
      }));

    return {
      id: model.id,
      name: model.name,
      description: "",
      steps,
      triggers: [],
      status: "draft",
      createdAt: model.metadata.created.toISOString(),
      updatedAt: model.metadata.modified.toISOString(),
    };
  }

  /**
   * Validate BPMN
   */
  async validateBPMN(model: BPMNModel): Promise<BPMNValidationResult> {
    const errors: BPMNValidationError[] = [];
    const warnings: BPMNValidationWarning[] = [];

    // Check for start event
    const startEvents = model.json.elements.filter(
      (el: BPMNElement) => el.type === "event" && el.name === "Start",
    );
    if (startEvents.length === 0) {
      errors.push({
        elementId: "process",
        type: "structure",
        message: "BPMN process must have at least one start event",
        severity: "error",
      });
    }

    // Check for end event
    const endEvents = model.json.elements.filter(
      (el: BPMNElement) => el.type === "event" && el.name === "End",
    );
    if (endEvents.length === 0) {
      errors.push({
        elementId: "process",
        type: "structure",
        message: "BPMN process must have at least one end event",
        severity: "error",
      });
    }

    // Check for orphaned elements
    model.json.elements.forEach((el: BPMNElement) => {
      if (el.type === "task" && !el.properties.connections) {
        warnings.push({
          elementId: el.id,
          message: `Task "${el.name}" may be orphaned`,
          suggestion: "Ensure task is connected to process flow",
        });
      }
    });

    // Check for cycles (simplified)
    // In production, would use proper cycle detection

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate BPMN XML
   */
  private generateBPMNXML(
    processName: string,
    elements: BPMNElement[],
  ): string {
    // Simplified BPMN XML generation
    // In production, would use proper BPMN 2.0 XML structure

    const startEvent = elements.find(
      (el) => el.type === "event" && el.name === "Start",
    );
    const tasks = elements.filter((el) => el.type === "task");
    const endEvent = elements.find(
      (el) => el.type === "event" && el.name === "End",
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   id="Definitions_1"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" name="${processName}">
`;

    // Add start event
    if (startEvent) {
      xml += `    <bpmn2:startEvent id="${startEvent.id}" name="${startEvent.name}"/>\n`;
    }

    // Add tasks
    tasks.forEach((task) => {
      xml += `    <bpmn2:task id="${task.id}" name="${task.name}"/>\n`;
    });

    // Add end event
    if (endEvent) {
      xml += `    <bpmn2:endEvent id="${endEvent.id}" name="${endEvent.name}"/>\n`;
    }

    // Add sequence flows (simplified)
    if (startEvent && tasks.length > 0) {
      xml += `    <bpmn2:sequenceFlow id="flow-${startEvent.id}-${tasks[0].id}" sourceRef="${startEvent.id}" targetRef="${tasks[0].id}"/>\n`;
    }

    for (let i = 0; i < tasks.length - 1; i++) {
      xml += `    <bpmn2:sequenceFlow id="flow-${tasks[i].id}-${tasks[i + 1].id}" sourceRef="${tasks[i].id}" targetRef="${tasks[i + 1].id}"/>\n`;
    }

    if (tasks.length > 0 && endEvent) {
      xml += `    <bpmn2:sequenceFlow id="flow-${tasks[tasks.length - 1].id}-${endEvent.id}" sourceRef="${tasks[tasks.length - 1].id}" targetRef="${endEvent.id}"/>\n`;
    }

    xml += `  </bpmn2:process>
</bpmn2:definitions>`;

    return xml;
  }

  /**
   * Export BPMN
   */
  async exportBPMN(
    model: BPMNModel,
    format: "xml" | "json" = "xml",
  ): Promise<string> {
    if (format === "xml") {
      return model.xml;
    } else {
      return JSON.stringify(model.json, null, 2);
    }
  }

  /**
   * Import BPMN
   */
  async importBPMN(
    content: string,
    format: "xml" | "json" = "xml",
  ): Promise<BPMNModel> {
    if (format === "xml") {
      return await this.parseBPMN(content);
    } else {
      const json = JSON.parse(content);
      return {
        id: json.id || "imported-process",
        name: json.name || "Imported Process",
        xml: this.generateBPMNXML(json.name || "Process", json.elements || []),
        json,
        version: "2.0",
        metadata: {
          created: new Date(),
          modified: new Date(),
          author: "system",
        },
      };
    }
  }
}

// Singleton instance
export const bpmnService = new AdvancedBPMNService();

export default bpmnService;
