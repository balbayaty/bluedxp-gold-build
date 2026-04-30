/**
 * ERPNext Users API Route
 * Returns list of users from ERPNext
 */

import { NextResponse } from "next/server";
import { erpNextAPI } from "@/lib/adapters/erpnext/api";

export async function GET() {
  try {
    const result = await erpNextAPI.getUsers();

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        users: result.data,
      });
    }

    // Return mock data if ERPNext is not available
    return NextResponse.json({
      success: true,
      users: [
        {
          name: "user1",
          email: "admin@hazalyze.com",
          full_name: "System Administrator",
          enabled: 1,
        },
        {
          name: "user2",
          email: "manager@hazalyze.com",
          full_name: "Quality Manager",
          enabled: 1,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
