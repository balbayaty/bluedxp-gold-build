/**
 * React Hook for Brand Messaging
 * Easy access to brand messaging in components
 */

import { useState, useEffect, useCallback } from "react";
import { brandMessagingService } from "./brandMessagingService";
import type {
  BrandMessage,
  MessagingContext,
  MessagingType,
} from "@/types/brand-messaging";
import { i18nService } from "@/lib/services/i18n/i18nService";

export interface UseBrandMessagingReturn {
  getMessage: (
    type: MessagingType,
    context: MessagingContext,
  ) => Promise<string>;
  getBilingualMessage: (
    type: MessagingType,
    context: MessagingContext,
  ) => Promise<BrandMessage>;
  currentLanguage: "en" | "ar";
  isLoading: boolean;
  error: Error | null;
}

export function useBrandMessaging(): UseBrandMessagingReturn {
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ar">("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const lang = i18nService.getLanguage();
    setCurrentLanguage(lang === "ar" ? "ar" : "en");

    const unsubscribe = i18nService.subscribe(() => {
      const newLang = i18nService.getLanguage();
      setCurrentLanguage(newLang === "ar" ? "ar" : "en");
    });

    return unsubscribe;
  }, []);

  const getMessage = useCallback(
    async (type: MessagingType, context: MessagingContext): Promise<string> => {
      setIsLoading(true);
      setError(null);
      try {
        const message = await brandMessagingService.generateMessage({
          type,
          context: {
            ...context,
            language: currentLanguage,
          },
        });

        return brandMessagingService.getMessageText(message, currentLanguage);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to generate message");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage],
  );

  const getBilingualMessage = useCallback(
    async (
      type: MessagingType,
      context: MessagingContext,
    ): Promise<BrandMessage> => {
      setIsLoading(true);
      setError(null);
      try {
        return await brandMessagingService.generateMessage({
          type,
          context: {
            ...context,
            language: "both",
          },
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to generate message");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    getMessage,
    getBilingualMessage,
    currentLanguage,
    isLoading,
    error,
  };
}
