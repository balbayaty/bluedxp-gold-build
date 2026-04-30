/**
 * Batch Operations Panel for Transportation
 *
 * Allows users to perform batch operations on shipments using background jobs
 */

"use client";

import { useState } from "react";
import { useCreateJob } from "@/hooks/useJob";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { PremiumNotification } from "@/components/PremiumNotificationEnhanced";

interface BatchOperationsPanelProps {
  selectedShipmentIds?: string[];
  onJobCreated?: (jobId: string) => void;
}

export function BatchOperationsPanel({
  selectedShipmentIds = [],
  onJobCreated,
}: BatchOperationsPanelProps) {
  const { create, loading } = useCreateJob();
  const [operation, setOperation] = useState<
    "update_status" | "validate" | "calculate_costs" | "generate_labels"
  >("validate");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<
    "LOW" | "NORMAL" | "HIGH" | "URGENT"
  >("NORMAL");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (selectedShipmentIds.length === 0) {
      PremiumNotification.error(
        "No shipments selected",
        "Please select shipments to process",
      );
      return;
    }

    try {
      const job = await create({
        type: "BATCH_PROCESSING",
        name: `Batch ${operation.replace("_", " ")} - ${selectedShipmentIds.length} shipments`,
        description:
          notes || `Processing ${selectedShipmentIds.length} shipments`,
        priority,
        input: {
          shipmentIds: selectedShipmentIds,
          operation,
          parameters: operation === "update_status" ? { status } : {},
        },
        moduleId: "tms",
      });

      PremiumNotification.success(
        "Batch Job Created",
        `Your batch operation has been queued. Job ID: ${job.id.substring(0, 8)}...`,
      );

      if (onJobCreated) {
        onJobCreated(job.id);
      }

      // Reset form
      setNotes("");
    } catch (error) {
      PremiumNotification.error(
        "Failed to Create Job",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const operationConfig = {
    update_status: {
      icon: RefreshCw,
      title: "Update Status",
      description: "Update status for multiple shipments",
      color: "blue",
    },
    validate: {
      icon: CheckCircle2,
      title: "Validate Shipments",
      description: "Validate shipment data and requirements",
      color: "green",
    },
    calculate_costs: {
      icon: DollarSign,
      title: "Calculate Costs",
      description: "Recalculate freight costs for shipments",
      color: "purple",
    },
    generate_labels: {
      icon: FileText,
      title: "Generate Labels",
      description: "Generate shipping labels for shipments",
      color: "orange",
    },
  };

  const config = operationConfig[operation];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Operations</CardTitle>
        <CardDescription>
          Process multiple shipments in the background. Operations continue even
          if you navigate away.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Count */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div>
            <p className="text-sm font-medium">Selected Shipments</p>
            <p className="text-xs text-muted-foreground">
              {selectedShipmentIds.length} shipment
              {selectedShipmentIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>
          <Badge variant="default">{selectedShipmentIds.length}</Badge>
        </div>

        {selectedShipmentIds.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              Please select shipments from the shipments list to perform batch
              operations.
            </p>
          </div>
        )}

        {/* Operation Selection */}
        <div className="space-y-2">
          <Label>Operation</Label>
          <Select
            value={operation}
            onValueChange={(v) => setOperation(v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(operationConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <cfg.icon className="h-4 w-4" />
                    <span>{cfg.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>

        {/* Operation-specific fields */}
        {operation === "update_status" && (
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREATED">Created</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="CUSTOMS_CLEARANCE">
                  Customs Clearance
                </SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Priority */}
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Add any notes about this batch operation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            selectedShipmentIds.length === 0 ||
            (operation === "update_status" && !status)
          }
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Job...
            </>
          ) : (
            <>
              <config.icon className="h-4 w-4 mr-2" />
              Start Batch {config.title}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Background Processing</p>
          <p>
            This operation will run in the background. You can navigate to other
            pages and check progress using the job monitor in the bottom-right
            corner.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
