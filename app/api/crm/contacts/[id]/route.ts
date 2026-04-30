/**
 * CRM Contact Detail API
 * GET /api/crm/contacts/[id] - Get contact by ID
 * PATCH /api/crm/contacts/[id] - Update contact
 * DELETE /api/crm/contacts/[id] - Delete contact
 */

import { NextRequest, NextResponse } from "next/server";
import { contactService } from "@/lib/services/crm/contactService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const contact = await contactService.getContactById(params.id);

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch contact" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const contact = await contactService.updateContact(params.id, body);

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contact" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await contactService.deleteContact(params.id);

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete contact" },
      { status: 500 },
    );
  }
}
