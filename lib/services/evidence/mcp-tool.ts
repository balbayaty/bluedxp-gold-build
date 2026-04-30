/**
 * MCP Tool Integration for Evidence Packets
 *
 * Makes evidence packet generation accessible via MCP
 * Allows AI agents to generate court-ready evidence packets
 *
 * @module evidence
 */

import { evidencePacketService } from "./packet-service";
import type { MCPTool } from "@/lib/mcp/server";

/**
 * Generate evidence packet - MCP Tool
 */
export const generateEvidencePacketTool: MCPTool = {
  name: "generate_evidence_packet",
  description:
    "Generate a court-ready evidence packet with Merkle tree integrity, contradiction detection, and chain of custody. Returns tamper-evident packet suitable for legal proceedings.",
  inputSchema: {
    type: "object",
    properties: {
      entityType: {
        type: "string",
        description: 'Type of entity (e.g., "Shipment", "Invoice", "Contract")',
      },
      entityId: {
        type: "string",
        description: "ID of the entity",
      },
      claimType: {
        type: "string",
        enum: [
          "delivery_proof",
          "payment_dispute",
          "compliance_violation",
          "contract_breach",
          "service_completion",
          "custom",
        ],
        description: "Type of claim this packet proves",
      },
      claim: {
        type: "string",
        description: "Optional custom claim description",
      },
      includeEvents: {
        type: "boolean",
        description: "Include events in packet (default: true)",
      },
      includeDocuments: {
        type: "boolean",
        description: "Include documents in packet (default: true)",
      },
      includeSignatures: {
        type: "boolean",
        description: "Include signatures in packet (default: true)",
      },
    },
    required: ["entityType", "entityId", "claimType"],
  },
  handler: async (params: {
    entityType: string;
    entityId: string;
    claimType: string;
    claim?: string;
    includeEvents?: boolean;
    includeDocuments?: boolean;
    includeSignatures?: boolean;
  }) => {
    try {
      const packet = await evidencePacketService.generatePacket(
        {
          entityType: params.entityType,
          entityId: params.entityId,
          claimType: params.claimType as any,
          claim: params.claim,
          includeEvents: params.includeEvents !== false,
          includeDocuments: params.includeDocuments !== false,
          includeSignatures: params.includeSignatures !== false,
        },
        {
          id: "mcp-agent",
          name: "MCP Agent",
          tenantId: "default",
          type: "system",
        },
      );

      return {
        success: true,
        data: {
          packetId: packet.id,
          evidenceId: packet.evidenceId,
          claim: packet.claim,
          merkleRoot: packet.merkleRoot,
          contentHash: packet.contentHash,
          contradictionIndex: packet.contradictionIndex,
          contradictionsCount: packet.contradictions.length,
          eventsCount: packet.events.length,
          documentsCount: packet.documents.length,
          signaturesCount: packet.signatures.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Verify evidence packet - MCP Tool
 */
export const verifyEvidencePacketTool: MCPTool = {
  name: "verify_evidence_packet",
  description:
    "Verify the integrity of an evidence packet. Checks Merkle tree, content hash, signatures, and chain of custody.",
  inputSchema: {
    type: "object",
    properties: {
      packetId: {
        type: "string",
        description: "The evidence packet ID to verify",
      },
    },
    required: ["packetId"],
  },
  handler: async (params: { packetId: string }) => {
    try {
      const verification = await evidencePacketService.verifyPacket(
        params.packetId,
      );

      return {
        success: true,
        data: {
          valid: verification.valid,
          verificationScore: verification.verificationScore,
          merkleTreeValid: verification.merkleTreeValid,
          contentHashValid: verification.contentHashValid,
          signaturesValid: verification.signaturesValid,
          chainOfCustodyValid: verification.chainOfCustodyValid,
          contradictionsFound: verification.contradictionsFound,
          issues: verification.issues,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Register MCP tools
 */
export function registerMCPTools(mcpServer: any): void {
  if (mcpServer && typeof mcpServer.registerTool === "function") {
    mcpServer.registerTool(generateEvidencePacketTool);
    mcpServer.registerTool(verifyEvidencePacketTool);
    console.log("✅ Evidence Packet MCP tools registered");
  }
}
