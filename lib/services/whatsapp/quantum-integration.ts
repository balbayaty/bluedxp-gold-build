/**
 * WhatsApp Quantum Integration
 *
 * Quantum state triggers for WhatsApp
 * Arabic message templates
 * Command handlers
 *
 * @module whatsapp
 */

import { schrodingersTruckService } from "@/lib/services/schrodingers-truck/service";
import { cargoPsychologyService } from "@/lib/services/cargo-psychology/service";
import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * WhatsApp message templates (Arabic)
 */
export const WHATSAPP_ARABIC_TEMPLATES = {
  QUANTUM_STATE_UPDATE: {
    ar: "📊 حالة الشحنة {shipment_id}: {state}\nالاحتمالية: {probability}%",
    en: "📊 Shipment {shipment_id} state: {state}\nProbability: {probability}%",
  },
  PSYCHOLOGY_ALERT: {
    ar: "⚠️ تنبيه نفسية الشحنة: {state}\nالنتيجة: {score}",
    en: "⚠️ Shipment psychology alert: {state}\nScore: {score}",
  },
  INTERVENTION_RECOMMENDED: {
    ar: "🔔 يوصى بالتدخل للشحنة {shipment_id}\nالإجراء: {action}",
    en: "🔔 Intervention recommended for shipment {shipment_id}\nAction: {action}",
  },
};

/**
 * Handle WhatsApp message and update quantum state
 */
export async function handleWhatsAppMessageForQuantum(
  shipmentId: string,
  message: string,
  senderId: string,
  tenantId: string,
): Promise<{
  processed: boolean;
  quantumStateUpdated: boolean;
  response?: string;
}> {
  try {
    // Analyze message with Arabic NLP
    const analysis = await arabicNLPService.analyze(message);

    // Update quantum state based on message
    if (analysis.intent.intent === "CONFIRMATION") {
      await schrodingersTruckService.updateQuantumState(shipmentId, {
        trigger: "WHATSAPP_MESSAGE",
        positiveSignal: true,
        messageAnalysis: analysis,
      } as any);
    } else if (
      analysis.intent.intent === "CANCELLATION" ||
      analysis.intent.intent === "DELAY"
    ) {
      await schrodingersTruckService.updateQuantumState(shipmentId, {
        trigger: "WHATSAPP_MESSAGE",
        negativeSignal: true,
        messageAnalysis: analysis,
      } as any);
    }

    // Update psychology state
    await cargoPsychologyService.updatePsychologyFromMessage(
      shipmentId,
      message,
      analysis,
    );

    // Generate response
    const response =
      analysis.intent.intent === "CONFIRMATION"
        ? "شكراً للتأكيد"
        : "تم استلام الرسالة";

    return {
      processed: true,
      quantumStateUpdated: true,
      response,
    };
  } catch (error) {
    console.warn("Error handling WhatsApp message for quantum:", error);
    return {
      processed: false,
      quantumStateUpdated: false,
    };
  }
}

/**
 * Send WhatsApp notification based on quantum state
 */
export async function sendQuantumStateWhatsAppNotification(
  shipmentId: string,
  quantumState: any,
  recipientPhone: string,
  tenantId: string,
): Promise<void> {
  try {
    const template = WHATSAPP_ARABIC_TEMPLATES.QUANTUM_STATE_UPDATE;

    const messageAr = template.ar
      .replace("{shipment_id}", shipmentId)
      .replace(
        "{state}",
        this.translateStateToArabic(quantumState.currentState),
      )
      .replace(
        "{probability}",
        (quantumState.probabilities.onTime * 100).toFixed(0),
      );

    const messageEn = template.en
      .replace("{shipment_id}", shipmentId)
      .replace("{state}", quantumState.currentState)
      .replace(
        "{probability}",
        (quantumState.probabilities.onTime * 100).toFixed(0),
      );

    // Send WhatsApp (would integrate with WhatsApp service)
    await eventBus.publish(
      createEvent(
        "WhatsAppMessageSent",
        shipmentId,
        "Shipment",
        {
          to: recipientPhone,
          messageAr,
          messageEn,
          type: "quantum_state_update",
        },
        1,
        {
          tenantId,
          correlationId: `whatsapp-quantum-${Date.now()}`,
          userId: "whatsapp-service",
        },
      ),
    );
  } catch (error) {
    console.warn("Error sending WhatsApp notification:", error);
  }
}

/**
 * Translate state to Arabic
 */
function translateStateToArabic(state: string): string {
  const translations: Record<string, string> = {
    COMMITTED: "ملتزم",
    CONTINGENT: "مشروط",
    PHANTOM: "شبح",
  };
  return translations[state] || state;
}

/**
 * Handle WhatsApp commands
 */
export async function handleWhatsAppCommand(
  command: string,
  shipmentId: string,
  senderId: string,
  tenantId: string,
): Promise<{
  processed: boolean;
  response?: string;
}> {
  const commandLower = command.toLowerCase().trim();

  if (commandLower === "/status" || commandLower === "/حالة") {
    // Get quantum state
    const quantumState = await schrodingersTruckService.getQuantumState(
      shipmentId,
      tenantId,
    );
    const response = `حالة الشحنة: ${translateStateToArabic(quantumState.currentState)}\nالاحتمالية: ${(quantumState.probabilities.onTime * 100).toFixed(0)}%`;
    return { processed: true, response };
  }

  if (commandLower.startsWith("/delay") || commandLower.startsWith("/تأخير")) {
    // Report delay
    const reason = commandLower.split(" ").slice(1).join(" ");
    await schrodingersTruckService.updateQuantumState(shipmentId, {
      trigger: "WHATSAPP_DELAY_REPORT",
      negativeSignal: true,
      reason,
    } as any);
    return { processed: true, response: "تم تسجيل التأخير" };
  }

  if (commandLower === "/arrived" || commandLower === "/وصل") {
    // Confirm arrival
    await schrodingersTruckService.collapseState(
      shipmentId,
      tenantId,
      "COMMITTED",
    );
    return { processed: true, response: "شكراً لتأكيد الوصول" };
  }

  if (commandLower === "/help" || commandLower === "/مساعدة") {
    const response = `الأوامر المتاحة:
/status - حالة الشحنة
/delay [سبب] - الإبلاغ عن تأخير
/arrived - تأكيد الوصول
/help - المساعدة`;
    return { processed: true, response };
  }

  return { processed: false };
}
