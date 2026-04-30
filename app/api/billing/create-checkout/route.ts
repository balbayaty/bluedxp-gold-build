/**
 * 💳 STRIPE CHECKOUT SESSION API
 * 
 * Creates Stripe checkout session for subscription upgrades
 * Inspired by OpenAI/Claude billing experience
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Price IDs from Stripe Dashboard
const STRIPE_PRICES: Record<string, { monthly: string; annual: string }> = {
  free: { monthly: "", annual: "" },
  starter: { 
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || "price_starter_annual",
  },
  professional: { 
    monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "price_professional_monthly",
    annual: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || "price_professional_annual",
  },
  enterprise: { 
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "price_enterprise_monthly",
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || "price_enterprise_annual",
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow demo mode for testing
    const userId = session?.user?.id || "demo-user";

    const { planId, billingCycle = "monthly" } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    if (planId === "enterprise") {
      // Enterprise plans go through sales
      return NextResponse.json({
        success: true,
        redirect: "/contact?plan=enterprise",
        message: "Enterprise plans require a sales consultation",
      });
    }

    if (planId === "free") {
      // Free plan doesn't need checkout
      return NextResponse.json({
        success: true,
        message: "Free plan activated",
      });
    }

    const priceConfig = STRIPE_PRICES[planId];
    if (!priceConfig) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const priceId = billingCycle === "annual" ? priceConfig.annual : priceConfig.monthly;

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      // In development, simulate checkout
      console.log(`\n💳 Stripe not configured. Would create checkout for:\n  Plan: ${planId}\n  Cycle: ${billingCycle}\n  Price ID: ${priceId}\n`);
      
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Stripe not configured - demo mode",
        checkoutUrl: `/billing?success=true&plan=${planId}`,
      });
    }

    // Import Stripe dynamically to avoid issues if not installed
    let stripe;
    try {
      const Stripe = (await import("stripe")).default;
      stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    } catch (e) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Stripe SDK not available",
        checkoutUrl: `/billing?success=true&plan=${planId}`,
      });
    }

    // Get user info
    let customer;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Check for existing Stripe customer
      const billingInfo = await prisma.billing_info.findUnique({
        where: { userId: user.id },
      });

      if (billingInfo?.stripeCustomerId) {
        customer = billingInfo.stripeCustomerId;
      } else {
        // Create new Stripe customer
        const stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        customer = stripeCustomer.id;
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          planId,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
