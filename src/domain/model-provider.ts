/**
 * AgentVault X — Open-Weight Model Provider Layer
 * 
 * Implements native support for Open-Weight models (Google Gemma 2, Llama, etc.)
 * via:
 * 1. Ollama (local open-weight inference: gemma2:9b, gemma2:2b)
 * 2. OpenAI-compatible Open-Weight endpoints (Groq gemma2-9b-it, vLLM, Hugging Face, OpenRouter)
 * 3. Google Gemini (optional secondary provider)
 * 4. High-Fidelity Deterministic Engine (air-gapped / offline fallback)
 */

export type ModelProviderType = 'open-weight' | 'ollama' | 'gemini' | 'offline-engine';

export interface ModelProviderInfo {
  provider: ModelProviderType;
  model: string;
  isOpenWeight: boolean;
  status: 'connected' | 'offline' | 'unconfigured' | 'error';
  endpoint?: string;
  license: string;
  details?: string;
}

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelResponse {
  text: string;
  provider: ModelProviderType;
  model: string;
  durationMs: number;
  rawJson?: any;
}

/**
 * Parses JSON safely from an LLM response string, handling markdown code fences.
 */
export function extractJsonFromText<T = any>(text: string): T {
  let cleaned = text.trim();
  // Strip markdown ```json ... ``` wrappers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return JSON.parse(cleaned);
}
