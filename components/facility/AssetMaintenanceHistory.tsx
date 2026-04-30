"use client";

/**
 * Asset Maintenance History Component
 *
 * Comprehensive maintenance history display with:
 * - All maintenance records
 * - Cost tracking
 * - Vendor information
 * - Parts used
 * - Photos and documentation
 * - Timeline view
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiHistoryLine,
  RiCalendarLine,
  RiUserLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
  RiFileTextLine,
  RiImageLine,
  RiDownloadLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiFilterLine,
  RiCloseLine,
} from "react-icons/ri";

interface MaintenanceRecord {
  id: string;
  date: Date;
  type: "preventive" | "corrective" | "emergency" | "inspection" | "upgrade";
  status: "completed" | "in-progress" | "cancelled";
  technician: string;
  vendor?: string;
  description: string;
  workPerformed: string;
  cost: number;
  partsUsed?: Array<{ name: string; quantity: number; cost: number }>;
  attachments?: string[];
  notes?: string;
}

interface AssetMaintenanceHistoryProps {
  assetId: string;
  assetName: string;
  records: MaintenanceRecord[];
}

export default function AssetMaintenanceHistory({
  assetId,
  assetName,
  records,
}: AssetMaintenanceHistoryProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceRecord | null>(null);

  const filteredRecords = records.filter((record) => {
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const averageCost = records.length > 0 ? totalCost / records.length : 0;
  const lastMaintenance = records.length > 0 ? records[0] : null;

  const getTypeBadge = (type: MaintenanceRecord["type"]) => {
    const colors = {
      preventive: "success",
      corrective: "warning",
      emergency: "error",
      inspection: "info",
      upgrade: "purple",
    };
    return <Badge variant={colors[type] as any}>{type.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: MaintenanceRecord["status"]) => {
    const variants = {
      completed: { variant: "success" as const, icon: RiCheckboxCircleLine },
      "in-progress": { variant: "warning" as const, icon: RiTimeLine },
      cancelled: { variant: "error" as const, icon: RiAlertLine },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiHistoryLine className="h-6 w-6 text-primary" />
            Maintenance History
          </h2>
          <p className="text-muted-foreground mt-1">{assetName}</p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Add Maintenance Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCost.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageCost.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {lastMaintenance ? (
                <div>
                  <div className="font-semibold">
                    {new Date(lastMaintenance.date).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {lastMaintenance.type}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">No records</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Maintenance Records</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
              >
                <option value="all">All Types</option>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="emergency">Emergency</option>
                <option value="inspection">Inspection</option>
                <option value="upgrade">Upgrade</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="cursor-pointer hover:border-cyan-500/50 transition-all"
                onClick={() => setSelectedRecord(record)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(record.type)}
                        {getStatusBadge(record.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium mb-1">{record.description}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {record.workPerformed}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <RiUserLine className="h-4 w-4 text-muted-foreground" />
                          {record.technician}
                        </div>
                        {record.vendor && (
                          <div className="flex items-center gap-1">
                            <RiToolsLine className="h-4 w-4 text-muted-foreground" />
                            {record.vendor}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
                          ${record.cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {record.attachments && record.attachments.length > 0 && (
                      <Badge variant="info" className="ml-4">
                        {record.attachments.length} files
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No maintenance records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance Record Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <p className="font-medium">
                    {new Date(selectedRecord.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Type</label>
                  <p>{getTypeBadge(selectedRecord.type)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Technician
                  </label>
                  <p className="font-medium">{selectedRecord.technician}</p>
                </div>
                {selectedRecord.vendor && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Vendor
                    </label>
                    <p className="font-medium">{selectedRecord.vendor}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Cost</label>
                  <p className="text-xl font-bold">
                    ${selectedRecord.cost.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">{selectedRecord.description}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Work Performed
                </label>
                <p className="mt-1 p-3 bg-white/5 rounded-lg">
                  {selectedRecord.workPerformed}
                </p>
              </div>
              {selectedRecord.partsUsed &&
                selectedRecord.partsUsed.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2">
                      Parts Used
                    </label>
                    <div className="space-y-2">
                      {selectedRecord.partsUsed.map((part, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white/5 rounded"
                        >
                          <span>{part.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Qty: {part.quantity} × ${part.cost} = $
                            {(part.quantity * part.cost).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {selectedRecord.notes && (
                <div>
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <p className="mt-1 p-3 bg-white/5 rounded-lg">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
