/**
 * Claims Visualization Component
 * Displays extracted claims with validation status
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import type { ExtractedClaim } from "@/lib/services/truth-engine";

interface ClaimsVisualizationProps {
  tenantId: string;
  entityType?: string;
  entityId?: string;
}

export function ClaimsVisualization({
  tenantId,
  entityType,
  entityId,
}: ClaimsVisualizationProps) {
  const [claims, setClaims] = useState<ExtractedClaim[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchClaims = async () => {
    if (!entityType || !entityId) {
      setError("Entity type and ID are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/truth-engine/claims?entityType=${entityType}&entityId=${entityId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch claims");

      const data = await response.json();
      setClaims(data.claims || []);
    } catch (err: any) {
      setError(err.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/truth-engine/claims?statistics=true");
      if (!response.ok) throw new Error("Failed to fetch statistics");

      const data = await response.json();
      setStatistics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityType && entityId) {
      fetchClaims();
    }
    fetchStatistics();
  }, [entityType, entityId]);

  const filteredClaims = claims.filter(
    (claim) =>
      !searchText ||
      claim.text.toLowerCase().includes(searchText.toLowerCase()) ||
      claim.type.toLowerCase().includes(searchText.toLowerCase()),
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "disputed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "false":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            Verified
          </Badge>
        );
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>;
      case "false":
        return <Badge variant="destructive">False</Badge>;
      default:
        return <Badge variant="secondary">Unverified</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Extracted Claims
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="claims" className="w-full">
          <TabsList>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search claims..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {entityType && entityId && (
                <Button
                  onClick={fetchClaims}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            {/* Claims List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredClaims.length > 0 ? (
              <div className="space-y-3">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(claim.verificationStatus)}
                          <span className="font-semibold">{claim.text}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{claim.type}</Badge>
                          {getStatusBadge(claim.verificationStatus)}
                          <Badge variant="secondary">
                            {Math.round(claim.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        {claim.entities && claim.entities.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Entities:{" "}
                            {claim.entities.map((e) => e.text).join(", ")}
                          </div>
                        )}
                        {claim.evidenceLinks &&
                          claim.evidenceLinks.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {claim.evidenceLinks.length} evidence link(s)
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {entityType && entityId
                  ? "No claims found for this entity."
                  : "Enter entity type and ID to view claims."}
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {statistics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {statistics.total}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Claims
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {Math.round(statistics.averageConfidence * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Confidence
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">By Type</h4>
                    <div className="space-y-2">
                      {Object.entries(statistics.byType || {}).map(
                        ([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{type}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">By Status</h4>
                    <div className="space-y-2">
                      {Object.entries(statistics.byStatus || {}).map(
                        ([status, count]) => (
                          <div key={status} className="flex justify-between">
                            <span>{status}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
