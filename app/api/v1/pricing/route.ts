/**
 * Pricing Engine API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { pricingEngine } from "@/lib/services/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            { code: "VALIDATION_ERROR", message: "tenantId is required" },
          ],
        },
        { status: 400 },
      );
    }

    const subscription = await pricingEngine.getActiveSubscription(tenantId);

    return NextResponse.json({
      success: true,
      data: subscription,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "calculate":
        if (!data.planId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                { code: "VALIDATION_ERROR", message: "planId is required" },
              ],
            },
            { status: 400 },
          );
        }
        const pricing = await pricingEngine.calculatePricing(
          data.planId,
          data.usage,
        );
        return NextResponse.json({
          success: true,
          data: pricing,
        });

      case "createSubscription":
        if (!data.tenantId || !data.planId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message: "tenantId and planId are required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const subscription = await pricingEngine.createSubscription({
          tenantId: data.tenantId,
          planId: data.planId,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          autoRenew: data.autoRenew,
        });
        return NextResponse.json({
          success: true,
          data: subscription,
        });

      case "cancel":
        if (!data.subscriptionId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message: "subscriptionId is required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const cancelled = await pricingEngine.cancelSubscription(
          data.subscriptionId,
        );
        return NextResponse.json({
          success: true,
          data: cancelled,
        });

      case "renew":
        if (!data.subscriptionId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message: "subscriptionId is required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const renewed = await pricingEngine.renewSubscription(
          data.subscriptionId,
        );
        return NextResponse.json({
          success: true,
          data: renewed,
        });

      case "generateInvoice":
        if (!data.subscriptionId || !data.periodStart || !data.periodEnd) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message:
                    "subscriptionId, periodStart, and periodEnd are required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const invoice = await pricingEngine.generateInvoice(
          data.subscriptionId,
          new Date(data.periodStart),
          new Date(data.periodEnd),
        );
        return NextResponse.json({
          success: true,
          data: invoice,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            errors: [
              { code: "INVALID_ACTION", message: `Unknown action: ${action}` },
            ],
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}
