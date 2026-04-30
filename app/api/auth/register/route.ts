/**
 * User Registration API Endpoint
 * POST /api/auth/register
 *
 * Creates a new user account with validation and security
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import {
  hashPassword,
  validatePasswordStrength,
} from "@/lib/services/auth/passwordService";
import { UserRole, getDefaultPermissions } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role = "CUSTOMER_USER",
      tenantId,
      phone,
      department,
      jobTitle,
    } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet security requirements",
          issues: passwordValidation.issues,
          suggestions: passwordValidation.suggestions,
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Get default permissions for role
    const defaultPermissions = getDefaultPermissions(role as UserRole);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role,
        tenantId: tenantId || "default-tenant", // In production, this should come from context
        status: "PENDING", // Require email verification or admin approval
        phone,
        department,
        jobTitle,
        permissions: defaultPermissions as any,
        preferences: {
          theme: "dark",
          language: "en",
          timezone: "UTC",
          dateFormat: "MM/dd/yyyy",
          timeFormat: "HH:mm",
          defaultView: "table",
          notifications: { email: true, sms: false, push: true, desktop: true },
          dashboard: { widgets: [], layout: "grid" },
        },
        emailVerified: false, // Require email verification
        lastPasswordChange: new Date(),
      },
    });

    // In production, send verification email here
    // await sendVerificationEmail(user.email, verificationToken)

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please verify your email.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user account" },
      { status: 500 },
    );
  }
}
