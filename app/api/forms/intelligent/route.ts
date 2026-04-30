/**
 * Intelligent Form API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentFormService } from "@/lib/services/forms/intelligentFormService";

// POST - Initialize form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.formId || !body.fields || !body.context) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: formId, fields, context",
        },
        { status: 400 },
      );
    }

    const state = await intelligentFormService.initializeForm(
      body.formId,
      body.fields,
      body.context,
    );

    return NextResponse.json({
      success: true,
      data: {
        suggestions: Array.from(state.suggestions.values()),
        recommendations: state.recommendations,
      },
    });
  } catch (error) {
    console.error("Error initializing intelligent form:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to initialize form",
      },
      { status: 500 },
    );
  }
}

// PUT - Update field
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.formId || !body.fieldId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: formId, fieldId" },
        { status: 400 },
      );
    }

    const state = await intelligentFormService.updateField(
      body.formId,
      body.fieldId,
      body.value,
    );

    return NextResponse.json({
      success: true,
      data: {
        suggestions: Array.from(state.suggestions.values()),
        recommendations: state.recommendations,
      },
    });
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update field",
      },
      { status: 500 },
    );
  }
}

// PATCH - Auto-fill field
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.formId || !body.fieldId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: formId, fieldId" },
        { status: 400 },
      );
    }

    const state = await intelligentFormService.autoFillField(
      body.formId,
      body.fieldId,
    );

    return NextResponse.json({
      success: true,
      data: {
        fieldId: body.fieldId,
        value: state.fields.find((f) => f.id === body.fieldId)?.value,
      },
    });
  } catch (error) {
    console.error("Error auto-filling field:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to auto-fill field",
      },
      { status: 500 },
    );
  }
}

// GET - Get form state
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: formId" },
        { status: 400 },
      );
    }

    const state = intelligentFormService.getFormState(formId);

    if (!state) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions: Array.from(state.suggestions.values()),
        recommendations: state.recommendations,
        autoFilledFields: Array.from(state.autoFilledFields),
        validationErrors: Object.fromEntries(state.validationErrors),
      },
    });
  } catch (error) {
    console.error("Error getting form state:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get form state",
      },
      { status: 500 },
    );
  }
}
