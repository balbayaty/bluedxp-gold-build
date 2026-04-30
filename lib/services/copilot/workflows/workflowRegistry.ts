import type { CopilotWorkflowDefinition } from "@/types/copilotWorkflows";

export const COPILOT_WORKFLOWS: CopilotWorkflowDefinition[] = [
  {
    id: "wf.customs.clearance.v1",
    name: "Customs Clearance (V1)",
    description:
      "Declaration -> required docs -> attach docs -> submit (event queue) -> evidence packet.",
    moduleId: "tms",
    steps: [
      {
        id: "create_declaration",
        title: "Create draft declaration",
        kind: "tool",
        toolId: "tms.customs.declaration.create",
        inputHint: {
          shipmentId: "Optional shipment ID",
          countryOfOrigin: "Country name",
          countryOfDestination: "Country name",
          customsValue: "Number",
          currency: "SAR (default)",
        },
      },
      {
        id: "required_docs",
        title: "Check required documents",
        kind: "tool",
        toolId: "tms.customs.declaration.required_documents",
        requires: [
          {
            key: "declarationId",
            description: "A declarationId (from step 1)",
          },
        ],
        inputHint: {
          declarationId: "Customs declaration id",
          transportMode: "SEA|AIR|LAND|RAIL|MULTIMODAL",
          isExport: "true/false",
          isImport: "true/false",
        },
      },
      {
        id: "attach_doc",
        title: "Attach a document (optional)",
        kind: "tool",
        toolId: "tms.customs.document.attach",
        requires: [
          {
            key: "declarationId",
            description: "A declarationId (from step 1)",
          },
          {
            key: "shipmentId",
            description: "A shipmentId (provided or inferred)",
          },
        ],
        inputHint: {
          declarationId: "Customs declaration id",
          shipmentId: "Shipment id",
          docType:
            "COMMERCIAL_INVOICE|PACKING_LIST|BILL_OF_LADING|AIRWAY_BILL|…",
          name: "Document name",
          fileUrl: "Uploaded file URL",
        },
      },
      {
        id: "submit_queue",
        title: "Submit declaration (integration queue)",
        kind: "tool",
        toolId: "tms.customs.declaration.submit",
        requires: [
          {
            key: "declarationId",
            description: "A declarationId (from step 1)",
          },
        ],
        inputHint: {
          declarationId: "Customs declaration id",
          system: "fasah|nafeza|… (optional)",
          countryCode: "SA|EG|… (optional)",
        },
      },
      {
        id: "evidence_packet",
        title: "Generate court-ready evidence packet",
        kind: "tool",
        toolId: "tms.customs.declaration.evidence_packet",
        requires: [
          {
            key: "declarationId",
            description: "A declarationId (from step 1)",
          },
        ],
        inputHint: { declarationId: "Customs declaration id" },
      },
    ],
  },
  {
    id: "wf.msds.intake.v1",
    name: "MSDS Intake (V1)",
    description:
      "Ingest MSDS text -> store + emit events/evidence -> optionally generate evidence packet.",
    moduleId: "msds",
    steps: [
      {
        id: "ingest_text",
        title: "Ingest MSDS from text",
        kind: "tool",
        toolId: "msds.ingest_from_text",
        inputHint: {
          text: "Raw MSDS/SDS text",
          language: "en (default)",
        },
      },
      {
        id: "evidence_packet",
        title: "Generate evidence packet (optional)",
        kind: "tool",
        toolId: "evidence.generate_packet",
        requires: [
          { key: "msdsId", description: "An msdsId (from step 1 output)" },
        ],
        inputHint: {
          entityType: "MSDS",
          entityId: "msdsId from step 1",
          claimType: "msds_compliance",
        },
      },
    ],
  },
  {
    id: "wf.evidence.packet.v1",
    name: "Evidence Packet (V1)",
    description:
      "Generate a tamper-evident packet for any entity (shipment, declaration, MSDS, etc.).",
    moduleId: "reports",
    steps: [
      {
        id: "generate_packet",
        title: "Generate evidence packet",
        kind: "tool",
        toolId: "evidence.generate_packet",
        inputHint: {
          entityType: "Entity type (e.g., CustomsDeclaration)",
          entityId: "Entity id",
          claimType: "Claim type (e.g., customs_clearance)",
        },
      },
    ],
  },
  {
    id: "wf.proposals.draft.v1",
    name: "Proposal Draft (V1)",
    description:
      "Create a DB-backed proposal draft, then optionally generate an evidence packet.",
    moduleId: "proposals-rfq",
    steps: [
      {
        id: "create_proposal",
        title: "Create proposal draft",
        kind: "tool",
        toolId: "proposals-rfq.proposal.create_draft",
        inputHint: {
          title: "Proposal title",
          description: "Optional description",
          proposalType: "Optional: SERVICE_PROPOSAL (default)",
          customerName: "Optional customer name",
          customerEmail: "Optional customer email",
          currency: "SAR (default)",
        },
      },
      {
        id: "list_proposals",
        title: "List recent proposals (optional)",
        kind: "tool",
        toolId: "proposals-rfq.proposal.list",
        inputHint: {
          status: "Optional: DRAFT|SENT|ACCEPTED|…",
          limit: "Optional: 20 default, max 50",
        },
      },
      {
        id: "evidence_packet",
        title: "Generate evidence packet (optional)",
        kind: "tool",
        toolId: "evidence.generate_packet",
        inputHint: {
          entityType: "Proposal",
          entityId: "Proposal id",
          claimType: "proposal_generation",
        },
      },
    ],
  },
];

export function listCopilotWorkflows() {
  return COPILOT_WORKFLOWS;
}

export function getCopilotWorkflow(id: string) {
  return COPILOT_WORKFLOWS.find((w) => w.id === id);
}
