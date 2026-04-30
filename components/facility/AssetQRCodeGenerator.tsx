"use client";

/**
 * Asset QR Code Generator
 *
 * Generate QR codes for assets for easy scanning and tracking
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
import { Input } from "@/components/ui/input";
import {
  RiQrCodeLine,
  RiDownloadLine,
  RiPrinterLine,
  RiRefreshLine,
} from "react-icons/ri";

interface AssetQRCodeGeneratorProps {
  assetId: string;
  assetName: string;
  assetCode?: string;
}

export default function AssetQRCodeGenerator({
  assetId,
  assetName,
  assetCode,
}: AssetQRCodeGeneratorProps) {
  const [qrSize, setQrSize] = useState(200);
  const [qrData, setQrData] = useState(
    `ASSET:${assetId}|CODE:${assetCode || ""}|NAME:${assetName}`,
  );

  // Generate QR code URL (using a QR code API service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `asset-qr-${assetCode || assetId}.png`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Asset QR Code - ${assetName}</title></head>
          <body style="text-align: center; padding: 20px;">
            <h2>${assetName}</h2>
            <p>${assetCode || assetId}</p>
            <img src="${qrCodeUrl}" alt="QR Code" />
            <p style="margin-top: 20px;">Scan to view asset details</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiQrCodeLine className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate QR code for easy asset scanning and tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-lg">
            <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
          </div>
          <div className="text-center">
            <p className="font-medium">{assetName}</p>
            <p className="text-sm text-muted-foreground">
              {assetCode || assetId}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">QR Code Size</label>
          <Input
            type="number"
            value={qrSize}
            onChange={(e) => setQrSize(parseInt(e.target.value) || 200)}
            min={100}
            max={500}
            step={50}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">QR Code Data</label>
          <Input
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder="QR code data"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={handleDownload}>
            <RiDownloadLine className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <RiPrinterLine className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
