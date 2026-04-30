/**
 * Currency Conversion API
 * POST /api/procurement/currency/convert
 */

import { NextRequest, NextResponse } from "next/server";
import { currencyManagementService } from "@/lib/services/procurement/currencyManagementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { fromCurrency, toCurrency, amount, rateType } = body;

    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "From currency, to currency, and amount are required",
        },
        { status: 400 },
      );
    }

    const conversion = await currencyManagementService.convertCurrency(
      fromCurrency,
      toCurrency,
      amount,
      rateType,
    );

    return NextResponse.json({
      success: true,
      data: conversion,
    });
  } catch (error: any) {
    console.error("Error converting currency:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to convert currency",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.currency.convert",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
