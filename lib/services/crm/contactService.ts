/**
 * Contact Service
 * Contact management linked to accounts and HR employees
 */

import { eventBus } from "@/lib/services/event-bus";
import type { Contact } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class ContactService {
  private contacts: Map<string, Contact> = new Map();

  /**
   * Create contact
   */
  async createContact(input: {
    tenantId: string;
    accountId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    mobile?: string;
    title?: string;
    department?: string;
    isPrimary?: boolean;
    isDecisionMaker?: boolean;
    employeeId?: string; // Links to HR employee if internal
    notes?: string;
    tags?: string[];
  }): Promise<Contact> {
    const contact: Contact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      accountId: input.accountId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      title: input.title,
      department: input.department,
      isPrimary: input.isPrimary || false,
      isDecisionMaker: input.isDecisionMaker || false,
      employeeId: input.employeeId,
      notes: input.notes,
      tags: input.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.contacts.set(contact.id, contact);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.contact.created",
      aggregateId: contact.id,
      aggregateType: "contact",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: contact,
    });

    return contact;
  }

  /**
   * Get contacts
   */
  async getContacts(filters: {
    tenantId: string;
    accountId?: string;
    isPrimary?: boolean;
    employeeId?: string;
  }): Promise<Contact[]> {
    let contacts = Array.from(this.contacts.values()).filter(
      (c) => c.tenantId === filters.tenantId,
    );

    if (filters.accountId) {
      contacts = contacts.filter((c) => c.accountId === filters.accountId);
    }

    if (filters.isPrimary !== undefined) {
      contacts = contacts.filter((c) => c.isPrimary === filters.isPrimary);
    }

    if (filters.employeeId) {
      contacts = contacts.filter((c) => c.employeeId === filters.employeeId);
    }

    return contacts.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<Contact | null> {
    return this.contacts.get(contactId) || null;
  }

  /**
   * Get contact by ID (alias for API compatibility)
   */
  async getContactById(contactId: string): Promise<Contact | null> {
    return this.getContact(contactId);
  }

  /**
   * Update contact
   */
  async updateContact(
    contactId: string,
    updates: Partial<Contact>,
  ): Promise<Contact> {
    const contact = this.contacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    const updated = {
      ...contact,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.contacts.set(contactId, updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.contact.updated",
      aggregateId: contactId,
      aggregateType: "contact",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<void> {
    const contact = this.contacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    this.contacts.delete(contactId);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.contact.deleted",
      aggregateId: contactId,
      aggregateType: "contact",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { contactId },
    });
  }
}

export const contactService = new ContactService();
