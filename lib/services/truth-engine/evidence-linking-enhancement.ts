/**
 * Truth Engine Evidence Linking Enhancement
 *
 * Enhanced evidence linking and verification
 * Improved evidence chain, validation
 *
 * @module truth-engine
 */

import { truthEngine } from "./truthEngineService";
import { evidencePacketService } from "@/lib/services/evidence/packet-service";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

/**
 * Enhanced evidence linking
 */
export async function enhancedEvidenceLinking(
  eventId: string,
  evidenceIds: string[],
  tenantId: string,
): Promise<{
  linked: boolean;
  evidenceChain: string[];
  integrityScore: number;
  recommendations: string[];
}> {
  // Link evidence to event
  await truthEngine.linkEvidenceToEvent(eventId, evidenceIds);

  // Generate evidence packet
  const packet = await evidencePacketService.generatePacket(
    {
      entityType: "TruthEvent",
      entityId: eventId,
      claimType: "service_completion",
    },
    {
      id: "truth-engine",
      name: "Truth Engine",
      tenantId,
      type: "system",
    },
  );

  // Verify integrity
  const verification = await evidencePacketService.verifyPacket(packet.id);

  const recommendations: string[] = [];
  if (!verification.valid) {
    recommendations.push(
      "Evidence integrity issues detected - review evidence chain",
    );
  }
  if (verification.contradictionsFound > 0) {
    recommendations.push(
      `${verification.contradictionsFound} contradiction(s) found - investigate`,
    );
  }

  return {
    linked: true,
    evidenceChain: evidenceIds,
    integrityScore: verification.verificationScore,
    recommendations,
  };
}
