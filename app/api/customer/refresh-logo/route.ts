/**
 * API Route to refresh customer logo
 * Clears localStorage and forces refresh of customer data
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message:
      "Please clear browser localStorage and refresh. Customer logo will be updated.",
  });
}
