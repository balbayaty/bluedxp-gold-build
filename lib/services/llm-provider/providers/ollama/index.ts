/**
 * Ollama Provider Registration
 * Auto-registers Ollama local LLM provider
 */

import { OllamaProvider } from "./OllamaProvider";
import { providerRegistry } from "../../core/providerRegistry";

// Create and register provider
export const ollamaProvider = new OllamaProvider();
providerRegistry.register(ollamaProvider);
