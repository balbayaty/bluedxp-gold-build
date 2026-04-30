"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AssetDetailView from "@/components/facility/AssetDetailView";
import { RiLoaderLine } from "react-icons/ri";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch asset data
    setTimeout(() => {
      setAsset({
        id: assetId,
        name: "HVAC System - Building A",
        code: "HVAC-A-001",
        type: "building-system",
        status: "operational",
        location: {
          facilityId: "facility-1",
          building: "Building A",
          floor: "3",
          room: "301",
          warehouseId: "wh-001",
          warehouseLocationCode: "A-01-02-03",
          warehouseZoneId: "zone-a",
        },
        ownership: {
          ownershipType: "owned",
          maintenanceResponsibility: "owner",
          maintenanceOwner: "Facility Team",
        },
        currentValue: 125000,
        nextMaintenance: new Date("2025-02-15"),
        criticality: "critical",
        capaIds: ["capa-001"],
        workOrderIds: ["wo-001"],
        manufacturer: "Carrier",
        model: "Infinity 19VS",
        serialNumber: "HVAC-2023-001",
        specifications: {
          dimensions: {
            length: 2.5,
            width: 1.8,
            height: 2.0,
            unit: "meters",
          },
          powerConsumption: 15.5,
          operatingTemperature: {
            min: -10,
            max: 50,
            unit: "celsius",
          },
        },
        maintenance: {
          lastMaintenanceDate: new Date("2024-12-15"),
          nextMaintenanceDate: new Date("2025-02-15"),
          maintenanceFrequency: 60,
          maintenanceHistory: [],
        },
        financial: {
          acquisitionCost: 150000,
          currentValue: 125000,
          depreciationMethod: "straight-line",
        },
        documentation: {
          manuals: ["manual-1.pdf"],
          drawings: ["drawing-1.dwg"],
          certificates: ["cert-1.pdf"],
        },
      });
      setLoading(false);
    }, 500);
  }, [assetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RiLoaderLine className="h-8 w-8 animate-spin mx-auto text-cyan-500 mb-4" />
          <p className="text-[#9ca3af]">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[#9ca3af]">Asset not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AssetDetailView
        asset={asset}
        onEdit={() => {
          // Navigate to edit page
          window.location.href = `/facility/assets/${assetId}/edit`;
        }}
        onClose={() => {
          window.location.href = "/facility/assets";
        }}
      />
    </div>
  );
}
