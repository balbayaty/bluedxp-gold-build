/**
 * ERPNext Trainings API Route
 * Returns list of training records from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employee = searchParams.get("employee");
    const status = searchParams.get("status");

    // Training records might be in a custom doctype
    // For now, return mock data that can be integrated with ERPNext later

    let trainings = [
      {
        name: "TRN-2025-001",
        employee: employee || "b.albayaty@scsflex.com",
        employee_name: "Bashir Albayaty",
        training_topic: "Safety Procedures",
        training_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        trainer: "safety.manager@scsflex.com",
        duration: 4,
        status: "Completed",
        certificate: "CERT-001",
        expiry_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        iso_requirement: "ISO 45001:2018 Clause 7.2",
      },
      {
        name: "TRN-2025-002",
        employee: employee || "b.albayaty@scsflex.com",
        employee_name: "Bashir Albayaty",
        training_topic: "Quality Management",
        training_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        trainer: "quality.manager@scsflex.com",
        duration: 8,
        status: "Scheduled",
        iso_requirement: "ISO 9001:2015 Clause 7.2",
      },
    ];

    // Filter by employee if provided
    if (employee) {
      trainings = trainings.filter((t) => t.employee === employee);
    }

    // Filter by status if provided
    if (status) {
      trainings = trainings.filter((t) => t.status === status);
    }

    return NextResponse.json({
      success: true,
      trainings: trainings,
      data: trainings,
    });
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trainings" },
      { status: 500 },
    );
  }
}
