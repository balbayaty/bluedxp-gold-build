/**
 * Email Template Service
 *
 * Manages email templates with variable substitution
 * Supports multi-tenant, multi-module templates
 */

import type { EmailTemplate } from "../types";
import { prisma } from "@/lib/services/database/prismaClient";

// In-memory template store (will be replaced with database)
class TemplateStore {
  private templates: Map<string, EmailTemplate> = new Map();
  private useDb: boolean = process.env.NODE_ENV === "production";

  async create(
    template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate> {
    const now = new Date();
    const fullTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: now,
      updatedAt: now,
    };

    if (this.useDb) {
      // TODO: Store in database when email templates table is created
      // For now, use in-memory store
    }

    this.templates.set(fullTemplate.id, fullTemplate);
    return fullTemplate;
  }

  async get(
    templateId: string,
    tenantId: string,
  ): Promise<EmailTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;
    if (template.tenantId && template.tenantId !== tenantId) return null;
    return template;
  }

  async update(
    templateId: string,
    updates: Partial<EmailTemplate>,
  ): Promise<EmailTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updated: EmailTemplate = {
      ...template,
      ...updates,
      id: templateId,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updated);
    return updated;
  }

  async delete(templateId: string, tenantId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;
    if (template.tenantId && template.tenantId !== tenantId) return false;

    return this.templates.delete(templateId);
  }

  async list(tenantId: string, moduleId?: string): Promise<EmailTemplate[]> {
    let templates = Array.from(this.templates.values()).filter(
      (t) => !t.tenantId || t.tenantId === tenantId,
    );

    if (moduleId) {
      templates = templates.filter(
        (t) => !t.moduleId || t.moduleId === moduleId,
      );
    }

    return templates;
  }
}

const templateStore = new TemplateStore();

/**
 * Render template with variables
 */
export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, any>,
): { subject: string; htmlBody: string; textBody?: string } {
  let subject = template.subject;
  let htmlBody = template.htmlBody;
  let textBody = template.textBody;

  // Replace variables in format {{variableName}}
  const variableRegex = /\{\{(\w+)\}\}/g;

  const replaceVariables = (text: string): string => {
    return text.replace(variableRegex, (match, varName) => {
      return variables[varName] !== undefined
        ? String(variables[varName])
        : match;
    });
  };

  subject = replaceVariables(subject);
  htmlBody = replaceVariables(htmlBody);
  if (textBody) {
    textBody = replaceVariables(textBody);
  }

  return { subject, htmlBody, textBody };
}

/**
 * Template Service
 */
export class TemplateService {
  async createTemplate(
    template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate> {
    return templateStore.create(template);
  }

  async getTemplate(
    templateId: string,
    tenantId: string,
  ): Promise<EmailTemplate | null> {
    return templateStore.get(templateId, tenantId);
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<EmailTemplate>,
  ): Promise<EmailTemplate | null> {
    return templateStore.update(templateId, updates);
  }

  async deleteTemplate(templateId: string, tenantId: string): Promise<boolean> {
    return templateStore.delete(templateId, tenantId);
  }

  async listTemplates(
    tenantId: string,
    moduleId?: string,
  ): Promise<EmailTemplate[]> {
    return templateStore.list(tenantId, moduleId);
  }

  renderTemplate(template: EmailTemplate, variables: Record<string, any>) {
    return renderTemplate(template, variables);
  }
}

export const templateService = new TemplateService();
