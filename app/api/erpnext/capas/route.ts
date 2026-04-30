/**
 * ERPNext CAPAs API Route
 * Returns list of CAPAs (Corrective & Preventive Actions) from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assigned_to");

    const result = await erpNextAPI.getCAPAs();

    if (result.success && result.data) {
      let capas = result.data;

      // Filter by assigned_to if provided
      if (assignedTo) {
        capas = capas.filter(
          (capa: any) =>
            capa.assigned_to === assignedTo ||
            capa.owner === assignedTo ||
            capa.email === assignedTo,
        );
      }

      return NextResponse.json({
        success: true,
        capas: capas,
        data: capas, // Also include 'data' for backward compatibility
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      capas: [
        {
          name: "CAPA-2025-001",
          subject: "Improve Chemical Storage Procedures",
          status: "In Progress",
          priority: "High",
          exp_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          assigned_to: assignedTo || "b.albayaty@scsflex.com",
          capa_type: "Corrective Action",
          capa_source: "NCR",
        },
        {
          name: "CAPA-2025-002",
          subject: "Enhance Quality Control Measures",
          status: "Open",
          priority: "Medium",
          exp_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          assigned_to: assignedTo || "b.albayaty@scsflex.com",
          capa_type: "Preventive Action",
          capa_source: "Audit",
        },
      ],
      data: [],
    });
  } catch (error) {
    console.error("Error fetching CAPAs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch CAPAs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await erpNextAPI.createCAPA(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        capa: result.data,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Failed to create CAPA" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error creating CAPA:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create CAPA" },
      { status: 500 },
    );
  }
}
