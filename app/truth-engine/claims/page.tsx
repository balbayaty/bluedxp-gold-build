/**
 * Claims Extraction Page
 * View and manage extracted claims from Truth Engine
 */

"use client";

import { ClaimsVisualization } from "@/components/truth-engine/ClaimsVisualization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function ClaimsPage() {
  const searchParams = useSearchParams();
  const entityType = searchParams.get("entityType") || undefined;
  const entityId = searchParams.get("entityId") || undefined;
  const tenantId = searchParams.get("tenantId") || "default";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Extracted Claims</h1>
        <p className="text-muted-foreground mt-2">
          View and validate claims extracted from events, documents, and text
        </p>
      </div>

      <ClaimsVisualization
        tenantId={tenantId}
        entityType={entityType}
        entityId={entityId}
      />

      <Card>
        <CardHeader>
          <CardTitle>About Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Claim Types:</strong> Claims are automatically extracted and
            categorized as factual, numerical, temporal, causal, comparative, or
            predictive.
          </p>
          <p>
            <strong>Verification Status:</strong> Claims can be unverified,
            verified, disputed, or marked as false based on evidence validation.
          </p>
          <p>
            <strong>Confidence Scores:</strong> Each claim has a confidence
            score (0-100%) indicating how certain we are about its accuracy.
          </p>
          <p>
            <strong>Evidence Linking:</strong> Verified claims are linked to
            supporting evidence for click-to-proof verification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
