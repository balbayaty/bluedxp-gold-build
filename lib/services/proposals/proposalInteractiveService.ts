/**
 * Proposal Interactive Service
 * Interactive features: calculators, forms, dynamic pricing, real-time updates
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface InteractiveCalculator {
  id: string;
  proposalId: string;
  sectionId?: string;
  type: "PRICING" | "ROUTE" | "CAPACITY" | "CUSTOM";
  title: string;
  description?: string;
  formula: string; // JavaScript expression or formula
  inputs: Array<{
    id: string;
    label: string;
    type: "number" | "text" | "select" | "checkbox";
    defaultValue?: any;
    options?: Array<{ value: any; label: string }>;
    validation?: {
      min?: number;
      max?: number;
      required?: boolean;
      pattern?: string;
    };
  }>;
  outputs: Array<{
    id: string;
    label: string;
    format: "currency" | "number" | "percentage" | "text";
    formula: string;
  }>;
  position: {
    section: string;
    order: number;
  };
  createdAt: Date | string;
}

export interface InteractiveForm {
  id: string;
  proposalId: string;
  sectionId?: string;
  title: string;
  description?: string;
  fields: Array<{
    id: string;
    label: string;
    type: "text" | "email" | "phone" | "date" | "select" | "textarea" | "file";
    required?: boolean;
    placeholder?: string;
    validation?: Record<string, any>;
  }>;
  submitAction: {
    type: "EMAIL" | "WEBHOOK" | "API" | "STORAGE";
    endpoint?: string;
    template?: string;
  };
  position: {
    section: string;
    order: number;
  };
  createdAt: Date | string;
}

export interface DynamicPricing {
  id: string;
  proposalId: string;
  sectionId?: string;
  basePrice: number;
  currency: string;
  factors: Array<{
    id: string;
    name: string;
    type: "QUANTITY" | "DISTANCE" | "WEIGHT" | "VOLUME" | "TIME" | "CUSTOM";
    formula: string;
    multiplier?: number;
  }>;
  discounts?: Array<{
    id: string;
    name: string;
    type: "PERCENTAGE" | "FIXED" | "VOLUME";
    value: number;
    condition?: string;
  }>;
  realTimeUpdate: boolean;
  createdAt: Date | string;
}

// ============================================================================
// INTERACTIVE SERVICE
// ============================================================================

class ProposalInteractiveService {
  private calculators: Map<string, InteractiveCalculator[]> = new Map();
  private forms: Map<string, InteractiveForm[]> = new Map();
  private dynamicPricing: Map<string, DynamicPricing[]> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.deleted",
      async (event: DomainEvent) => {
        const { proposalId } = event.payload || {};
        if (proposalId) {
          this.calculators.delete(proposalId);
          this.forms.delete(proposalId);
          this.dynamicPricing.delete(proposalId);
        }
      },
    );
  }

  /**
   * Add interactive calculator
   */
  async addCalculator(
    calculator: Omit<InteractiveCalculator, "id" | "createdAt">,
  ): Promise<InteractiveCalculator> {
    const newCalculator: InteractiveCalculator = {
      ...calculator,
      id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };

    if (!this.calculators.has(calculator.proposalId)) {
      this.calculators.set(calculator.proposalId, []);
    }
    this.calculators.get(calculator.proposalId)!.push(newCalculator);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.interactive.calculator.added",
      aggregateId: calculator.proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        proposalId: calculator.proposalId,
        calculatorId: newCalculator.id,
      },
    });

    return newCalculator;
  }

  /**
   * Calculate result
   */
  calculate(
    calculatorId: string,
    proposalId: string,
    inputs: Record<string, any>,
  ): Record<string, any> {
    const calculators = this.calculators.get(proposalId) || [];
    const calculator = calculators.find((c) => c.id === calculatorId);
    if (!calculator) {
      throw new Error("Calculator not found");
    }

    const results: Record<string, any> = {};

    // Evaluate outputs
    for (const output of calculator.outputs) {
      try {
        // Replace input variables in formula
        let formula = output.formula;
        for (const [key, value] of Object.entries(inputs)) {
          formula = formula.replace(
            new RegExp(`\\$\\{${key}\\}`, "g"),
            String(value),
          );
        }

        // Evaluate formula (in production, use a safe expression evaluator)
        const result = eval(formula); // WARNING: Use safe evaluator in production

        // Format result
        switch (output.format) {
          case "currency":
            results[output.id] = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SAR",
            }).format(result);
            break;
          case "percentage":
            results[output.id] = `${result.toFixed(2)}%`;
            break;
          case "number":
            results[output.id] = result.toFixed(2);
            break;
          default:
            results[output.id] = result;
        }
      } catch (error) {
        console.error(`Error calculating ${output.id}:`, error);
        results[output.id] = "Error";
      }
    }

    return results;
  }

  /**
   * Add interactive form
   */
  async addForm(
    form: Omit<InteractiveForm, "id" | "createdAt">,
  ): Promise<InteractiveForm> {
    const newForm: InteractiveForm = {
      ...form,
      id: `form-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };

    if (!this.forms.has(form.proposalId)) {
      this.forms.set(form.proposalId, []);
    }
    this.forms.get(form.proposalId)!.push(newForm);

    return newForm;
  }

  /**
   * Submit form
   */
  async submitForm(
    formId: string,
    proposalId: string,
    data: Record<string, any>,
  ): Promise<{ success: boolean; messageId?: string }> {
    const forms = this.forms.get(proposalId) || [];
    const form = forms.find((f) => f.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    // Validate form data
    for (const field of form.fields) {
      if (field.required && !data[field.id]) {
        throw new Error(`Field ${field.label} is required`);
      }
    }

    // Handle submit action
    switch (form.submitAction.type) {
      case "EMAIL":
        // Send email
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "proposals.interactive.form.submitted",
          aggregateId: proposalId,
          aggregateType: "PROPOSAL",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: { formId, proposalId, data, action: "EMAIL" },
        });
        break;

      case "WEBHOOK":
        // Call webhook
        if (form.submitAction.endpoint) {
          await fetch(form.submitAction.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formId, proposalId, data }),
          });
        }
        break;

      case "STORAGE":
        // Store in database
        // Would use Prisma in production
        break;
    }

    return { success: true };
  }

  /**
   * Add dynamic pricing
   */
  async addDynamicPricing(
    pricing: Omit<DynamicPricing, "id" | "createdAt">,
  ): Promise<DynamicPricing> {
    const newPricing: DynamicPricing = {
      ...pricing,
      id: `pricing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };

    if (!this.dynamicPricing.has(pricing.proposalId)) {
      this.dynamicPricing.set(pricing.proposalId, []);
    }
    this.dynamicPricing.get(pricing.proposalId)!.push(newPricing);

    return newPricing;
  }

  /**
   * Calculate dynamic price
   */
  calculateDynamicPrice(
    pricingId: string,
    proposalId: string,
    factors: Record<string, any>,
  ): number {
    const pricingList = this.dynamicPricing.get(proposalId) || [];
    const pricing = pricingList.find((p) => p.id === pricingId);
    if (!pricing) {
      throw new Error("Dynamic pricing not found");
    }

    let price = pricing.basePrice;

    // Apply factors
    for (const factor of pricing.factors) {
      const value = factors[factor.id] || 0;
      const multiplier = factor.multiplier || 1;
      price +=
        eval(factor.formula.replace(/\$\{value\}/g, String(value))) *
        multiplier;
    }

    // Apply discounts
    if (pricing.discounts) {
      for (const discount of pricing.discounts) {
        if (this.evaluateDiscountCondition(discount.condition || "", factors)) {
          if (discount.type === "PERCENTAGE") {
            price = price * (1 - discount.value / 100);
          } else if (discount.type === "FIXED") {
            price = price - discount.value;
          }
        }
      }
    }

    return Math.max(0, price);
  }

  /**
   * Evaluate discount condition
   */
  private evaluateDiscountCondition(
    condition: string,
    factors: Record<string, any>,
  ): boolean {
    if (!condition) return true;

    try {
      // Replace variables in condition
      let expr = condition;
      for (const [key, value] of Object.entries(factors)) {
        expr = expr.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value));
      }

      return eval(expr); // WARNING: Use safe evaluator in production
    } catch {
      return false;
    }
  }

  /**
   * Get calculators for proposal
   */
  getCalculators(
    proposalId: string,
    sectionId?: string,
  ): InteractiveCalculator[] {
    const calculators = this.calculators.get(proposalId) || [];
    if (sectionId) {
      return calculators.filter((c) => c.sectionId === sectionId);
    }
    return calculators;
  }

  /**
   * Get forms for proposal
   */
  getForms(proposalId: string, sectionId?: string): InteractiveForm[] {
    const forms = this.forms.get(proposalId) || [];
    if (sectionId) {
      return forms.filter((f) => f.sectionId === sectionId);
    }
    return forms;
  }

  /**
   * Get dynamic pricing for proposal
   */
  getDynamicPricing(proposalId: string, sectionId?: string): DynamicPricing[] {
    const pricing = this.dynamicPricing.get(proposalId) || [];
    if (sectionId) {
      return pricing.filter((p) => p.sectionId === sectionId);
    }
    return pricing;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalInteractiveService = new ProposalInteractiveService();
