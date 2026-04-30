"use client";

/**
 * Asset Bulk Actions Component
 *
 * Perform bulk actions on selected assets:
 * - Bulk status update
 * - Bulk ownership change
 * - Bulk export
 * - Bulk maintenance schedule
 * - Bulk delete
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RiCheckboxMultipleLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiCalendarLine,
  RiRefreshLine,
  RiCloseLine,
} from "react-icons/ri";

interface AssetBulkActionsProps {
  selectedAssets: string[];
  onBulkUpdate: (action: string, data: any) => void;
  onClearSelection: () => void;
}

export default function AssetBulkActions({
  selectedAssets,
  onBulkUpdate,
  onClearSelection,
}: AssetBulkActionsProps) {
  const [showActions, setShowActions] = useState(false);

  if (selectedAssets.length === 0) return null;

  return (
    <Card className="border-cyan-500/50 bg-cyan-500/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RiCheckboxMultipleLine className="h-5 w-5" />
              {selectedAssets.length} Asset
              {selectedAssets.length > 1 ? "s" : ""} Selected
            </CardTitle>
            <CardDescription>
              Perform bulk actions on selected assets
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <RiCloseLine className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newStatus = prompt(
                "Enter new status (operational, maintenance, out-of-service, retired):",
              );
              if (newStatus) {
                onBulkUpdate("status", { status: newStatus });
              }
            }}
          >
            <RiEditLine className="h-4 w-4 mr-2" />
            Update Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newOwnership = prompt(
                "Enter new ownership type (owned, landlord, leased, rented):",
              );
              if (newOwnership) {
                onBulkUpdate("ownership", { ownershipType: newOwnership });
              }
            }}
          >
            <RiEditLine className="h-4 w-4 mr-2" />
            Change Ownership
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const date = prompt("Enter maintenance date (YYYY-MM-DD):");
              if (date) {
                onBulkUpdate("maintenance", { date: new Date(date) });
              }
            }}
          >
            <RiCalendarLine className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkUpdate("export", {})}
          >
            <RiDownloadLine className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  `Are you sure you want to delete ${selectedAssets.length} asset(s)?`,
                )
              ) {
                onBulkUpdate("delete", {});
              }
            }}
            className="text-red-400 hover:text-red-300"
          >
            <RiDeleteBinLine className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
