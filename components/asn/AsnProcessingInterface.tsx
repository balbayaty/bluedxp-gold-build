/**
 * ASN Processing Interface Component
 * Interactive interface for processing ASNs
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ASN, ASNItem, ASNException } from "@/types/asn";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFileList3Line,
  RiAlertLine,
  RiSaveLine,
  RiSendPlaneLine,
} from "react-icons/ri";

interface AsnProcessingInterfaceProps {
  asnId: string;
  onUpdate?: (asn: ASN) => void;
}

export function AsnProcessingInterface({
  asnId,
  onUpdate,
}: AsnProcessingInterfaceProps) {
  const [asn, setAsn] = useState<ASN | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAsn();
  }, [asnId]);

  const loadAsn = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/asn/${asnId}?includeItems=true&includeExceptions=true&includeDocuments=true`,
      );

      if (!response.ok) {
        throw new Error("Failed to load ASN");
      }

      const asnData = await response.json();
      setAsn(asnData);
    } catch (error: any) {
      console.error("Error loading ASN:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!asn) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/asn/${asnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedAsn = await response.json();
      setAsn(updatedAsn);
      onUpdate?.(updatedAsn);
    } catch (error: any) {
      console.error("Error updating status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleItemUpdate = async (itemId: string, receivedQuantity: number) => {
    if (!asn) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/asn/${asnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: itemId,
              receivedQuantity,
              status: receivedQuantity > 0 ? "received" : "pending",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      const updatedAsn = await response.json();
      setAsn(updatedAsn);
      onUpdate?.(updatedAsn);
    } catch (error: any) {
      console.error("Error updating item:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading ASN...</div>;
  }

  if (!asn) {
    return <div className="text-center py-8">ASN not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "exception":
        return "bg-red-100 text-red-800";
      case "receiving":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{asn.asnNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {asn.supplierName} • {asn.warehouseName || asn.warehouseId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(asn.status)}>
                {asn.status.replace("_", " ")}
              </Badge>
              {asn.priority === "urgent" && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Total Items
              </Label>
              <p className="text-lg font-semibold">{asn.totalItems}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Total Quantity
              </Label>
              <p className="text-lg font-semibold">{asn.totalQuantity}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Total Value
              </Label>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: asn.currency || "SAR",
                }).format(asn.totalValue)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Expected Arrival
              </Label>
              <p className="text-lg font-semibold">
                {asn.expectedArrivalDate
                  ? new Date(asn.expectedArrivalDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            {asn.status === "pending" && (
              <Button
                onClick={() => handleStatusUpdate("receiving")}
                disabled={saving}
              >
                <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
                Start Receiving
              </Button>
            )}
            {asn.status === "receiving" && (
              <Button
                onClick={() => handleStatusUpdate("received")}
                disabled={saving}
              >
                <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
                Mark as Received
              </Button>
            )}
            {asn.status === "received" && (
              <Button
                onClick={() => handleStatusUpdate("completed")}
                disabled={saving}
              >
                <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            {asn.exceptions.length > 0 && (
              <Button variant="outline" disabled={saving}>
                <RiAlertLine className="h-4 w-4 mr-2" />
                View Exceptions ({asn.exceptions.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({asn.items.length})</TabsTrigger>
          <TabsTrigger value="exceptions">
            Exceptions ({asn.exceptions.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({asn.documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ASN Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ASN Number</Label>
                  <p className="font-medium">{asn.asnNumber}</p>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <p className="font-medium">{asn.supplierName}</p>
                </div>
                <div>
                  <Label>Warehouse</Label>
                  <p className="font-medium">
                    {asn.warehouseName || asn.warehouseId}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(asn.status)}>
                    {asn.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Expected Arrival</Label>
                  <p className="font-medium">
                    {asn.expectedArrivalDate
                      ? new Date(asn.expectedArrivalDate).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label>Actual Arrival</Label>
                  <p className="font-medium">
                    {asn.actualArrivalDate
                      ? new Date(asn.actualArrivalDate).toLocaleString()
                      : "Not arrived"}
                  </p>
                </div>
              </div>

              {asn.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground">{asn.notes}</p>
                </div>
              )}

              {/* Intelligence Metrics */}
              {(asn.predictedArrivalTime ||
                asn.exceptionProbability !== undefined ||
                asn.qualityScore) && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm font-semibold">
                    Intelligence Metrics
                  </Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {asn.predictedArrivalTime && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Predicted Arrival
                        </Label>
                        <p className="text-sm font-medium">
                          {new Date(asn.predictedArrivalTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {asn.exceptionProbability !== undefined && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Exception Risk
                        </Label>
                        <p className="text-sm font-medium">
                          {(asn.exceptionProbability * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {asn.qualityScore && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Quality Score
                        </Label>
                        <p className="text-sm font-medium">
                          {asn.qualityScore.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asn.items.map((item) => (
                  <AsnItemCard
                    key={item.id}
                    item={item}
                    onUpdate={(receivedQuantity) =>
                      handleItemUpdate(item.id, receivedQuantity)
                    }
                    disabled={saving}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exceptions</CardTitle>
            </CardHeader>
            <CardContent>
              {asn.exceptions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No exceptions
                </p>
              ) : (
                <div className="space-y-4">
                  {asn.exceptions.map((exception) => (
                    <ExceptionCard key={exception.id} exception={exception} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {asn.documents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No documents
                </p>
              ) : (
                <div className="space-y-2">
                  {asn.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <RiFileList3Line className="h-4 w-4" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <Badge variant="outline">{doc.type}</Badge>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AsnItemCard({
  item,
  onUpdate,
  disabled,
}: {
  item: ASNItem;
  onUpdate: (receivedQuantity: number) => void;
  disabled: boolean;
}) {
  const [receivedQty, setReceivedQty] = useState(item.receivedQuantity || 0);

  const handleSave = () => {
    onUpdate(receivedQty);
  };

  const isComplete = receivedQty >= item.quantity;
  const isPartial = receivedQty > 0 && receivedQty < item.quantity;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">{item.sku}</p>
            {isComplete && (
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            )}
            {isPartial && (
              <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SAR",
            }).format(item.totalPrice)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Expected</Label>
          <Input value={item.quantity} disabled />
        </div>
        <div>
          <Label className="text-xs">Received</Label>
          <Input
            type="number"
            value={receivedQty}
            onChange={(e) => setReceivedQty(Number(e.target.value))}
            min={0}
            max={item.quantity}
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-xs">Difference</Label>
          <Input
            value={item.quantity - receivedQty}
            disabled
            className={
              item.quantity - receivedQty !== 0 ? "border-yellow-500" : ""
            }
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={disabled || receivedQty === item.receivedQuantity}
        className="mt-3"
        size="sm"
      >
        <RiSaveLine className="h-3 w-3 mr-2" />
        Save
      </Button>
    </div>
  );
}

function ExceptionCard({ exception }: { exception: ASNException }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg ${getSeverityColor(exception.severity)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <RiAlertLine className="h-4 w-4" />
            <p className="font-medium">{exception.type.replace("_", " ")}</p>
            <Badge>{exception.severity}</Badge>
          </div>
          <p className="text-sm">{exception.description}</p>
        </div>
        <Badge variant="outline">{exception.status}</Badge>
      </div>

      {exception.aiSuggestedResolution && (
        <div className="mt-3 p-2 bg-white/50 rounded text-sm">
          <p className="font-medium mb-1">AI Suggested Resolution:</p>
          <p>{exception.aiSuggestedResolution}</p>
        </div>
      )}

      {exception.resolution && (
        <div className="mt-3 p-2 bg-white/50 rounded text-sm">
          <p className="font-medium mb-1">Resolution:</p>
          <p>{exception.resolution}</p>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        Detected: {new Date(exception.detectedAt).toLocaleString()}
      </div>
    </div>
  );
}
