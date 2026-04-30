"use client";

/**
 * Asset Quick Actions Component
 *
 * Quick action buttons for assets:
 * - Create Work Order
 * - Link to CAPA
 * - View Maintenance History
 * - Export Asset Data
 * - Generate QR Code
 */

import { Button } from "@/components/ui/button";
import {
  RiFileListLine,
  RiShieldCheckLine,
  RiHistoryLine,
  RiDownloadLine,
  RiQrCodeLine,
  RiLinksLine,
  RiCalendarLine,
  RiToolsLine,
} from "react-icons/ri";

interface AssetQuickActionsProps {
  assetId: string;
  assetName: string;
  onCreateWorkOrder?: () => void;
  onLinkCAPA?: () => void;
  onViewHistory?: () => void;
  onExport?: () => void;
  onGenerateQR?: () => void;
}

export default function AssetQuickActions({
  assetId,
  assetName,
  onCreateWorkOrder,
  onLinkCAPA,
  onViewHistory,
  onExport,
  onGenerateQR,
}: AssetQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={onCreateWorkOrder}
        className="gap-2"
      >
        <RiFileListLine className="h-4 w-4" />
        Create Work Order
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onLinkCAPA}
        className="gap-2"
      >
        <RiShieldCheckLine className="h-4 w-4" />
        Link CAPA
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewHistory}
        className="gap-2"
      >
        <RiHistoryLine className="h-4 w-4" />
        Maintenance History
      </Button>
      <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
        <RiDownloadLine className="h-4 w-4" />
        Export Data
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateQR}
        className="gap-2"
      >
        <RiQrCodeLine className="h-4 w-4" />
        Generate QR Code
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/facility/assets/${assetId}`, "_blank")}
        className="gap-2"
      >
        <RiLinksLine className="h-4 w-4" />
        View Details
      </Button>
    </div>
  );
}

("use client");

/**
 * Asset Quick Actions Component
 *
 * Quick action buttons for assets:
 * - Create Work Order
 * - Link to CAPA
 * - View Maintenance History
 * - Export Asset Data
 * - Generate QR Code
 */

import { Button } from "@/components/ui/button";
import {
  RiFileListLine,
  RiShieldCheckLine,
  RiHistoryLine,
  RiDownloadLine,
  RiQrCodeLine,
  RiLinksLine,
  RiCalendarLine,
  RiToolsLine,
} from "react-icons/ri";

interface AssetQuickActionsProps {
  assetId: string;
  assetName: string;
  onCreateWorkOrder?: () => void;
  onLinkCAPA?: () => void;
  onViewHistory?: () => void;
  onExport?: () => void;
  onGenerateQR?: () => void;
}

export default function AssetQuickActions({
  assetId,
  assetName,
  onCreateWorkOrder,
  onLinkCAPA,
  onViewHistory,
  onExport,
  onGenerateQR,
}: AssetQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={onCreateWorkOrder}
        className="gap-2"
      >
        <RiFileListLine className="h-4 w-4" />
        Create Work Order
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onLinkCAPA}
        className="gap-2"
      >
        <RiShieldCheckLine className="h-4 w-4" />
        Link CAPA
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewHistory}
        className="gap-2"
      >
        <RiHistoryLine className="h-4 w-4" />
        Maintenance History
      </Button>
      <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
        <RiDownloadLine className="h-4 w-4" />
        Export Data
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateQR}
        className="gap-2"
      >
        <RiQrCodeLine className="h-4 w-4" />
        Generate QR Code
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/facility/assets/${assetId}`, "_blank")}
        className="gap-2"
      >
        <RiLinksLine className="h-4 w-4" />
        View Details
      </Button>
    </div>
  );
}
