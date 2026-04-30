/**
 * Anthropic Provider Registration
 * Auto-registers Anthropic provider with the registry
 */

import { AnthropicProvider } from "./AnthropicProvider";
import { providerRegistry } from "../../core/providerRegistry";

// Create and register provider
export const anthropicProvider = new AnthropicProvider();
providerRegistry.register(anthropicProvider);
