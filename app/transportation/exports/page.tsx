/**
 * Export & Reporting Page
 *
 * Comprehensive export and reporting interface
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExportFormat,
  ReportType,
} from "@/lib/services/transportation/exportReportingService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import PageTemplate from "@/components/PageTemplate";

export default function ExportsPage() {
  const [reportType, setReportType] = useState<ReportType>("SHIPMENT_SUMMARY");
  const [format, setFormat] = useState<ExportFormat>("PDF");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/transportation/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          reportType,
          format,
          data: {}, // In production, fetch actual data
          createdBy: "current-user", // In production, use actual user
        }),
      });

      const result = await response.json();
      if (result.export) {
        // Download file
        window.open(result.export.downloadUrl, "_blank");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Export failed", err, {
        module: "transportation",
        service: "exports",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "exports",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Exports & Reports"
      description="Generate comprehensive reports and export data in multiple formats"
      icon="ri-file-download-line"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Export</CardTitle>
            <CardDescription>
              Export data in your preferred format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Report Type
              </label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPMENT_SUMMARY">
                    Shipment Summary
                  </SelectItem>
                  <SelectItem value="SHIPMENT_DETAILED">
                    Detailed Shipment
                  </SelectItem>
                  <SelectItem value="JOURNEY_ANALYSIS">
                    Journey Analysis
                  </SelectItem>
                  <SelectItem value="ROUTE_COMPARISON">
                    Route Comparison
                  </SelectItem>
                  <SelectItem value="COST_ANALYSIS">Cost Analysis</SelectItem>
                  <SelectItem value="EMISSIONS_REPORT">
                    Emissions Report
                  </SelectItem>
                  <SelectItem value="CARRIER_PERFORMANCE">
                    Carrier Performance
                  </SelectItem>
                  <SelectItem value="CUSTOMS_STATUS">Customs Status</SelectItem>
                  <SelectItem value="EXCEPTION_REPORT">
                    Exception Report
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Exporting..." : "Export"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Automated reports delivered to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Schedule reports to be automatically generated and delivered via
              email.
            </p>
            <Button variant="outline" className="mt-4">
              Manage Scheduled Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Templates</CardTitle>
            <CardDescription>
              Create and reuse custom report templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Design custom report templates with your preferred layout and
              sections.
            </p>
            <Button variant="outline" className="mt-4">
              Create Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>
              View and download previous exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access your export history and download files that haven't
              expired.
            </p>
            <Button variant="outline" className="mt-4">
              View History
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}
