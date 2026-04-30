/**
 * OpenAI Provider Registration
 * Auto-registers OpenAI provider with the registry
 */

import { OpenAIProvider } from "./OpenAIProvider";
import { providerRegistry } from "../../core/providerRegistry";

// Create and register provider
export const openaiProvider = new OpenAIProvider();
providerRegistry.register(openaiProvider);
