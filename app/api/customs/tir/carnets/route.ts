/**
 * TIR Carnets API
 */

import { NextRequest, NextResponse } from "next/server";
import { tirService } from "@/lib/services/customs/tirService";

export async function GET(request: NextRequest) {
  try {
    // Get carnets from TIR service
    const allCarnets = tirService.getAllCarnets();

    // Apply any filters from query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const country = searchParams.get("country");

    let filteredCarnets = allCarnets;
    if (status) {
      filteredCarnets = filteredCarnets.filter(
        (c) => c.status === status.toUpperCase(),
      );
    }
    if (country) {
      filteredCarnets = filteredCarnets.filter(
        (c) => c.issuingCountry === country,
      );
    }

    return NextResponse.json({
      success: true,
      carnets: filteredCarnets,
      total: filteredCarnets.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Issue carnet
    const carnet = await tirService.issueCarnet(body);

    return NextResponse.json({
      success: true,
      carnet,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
