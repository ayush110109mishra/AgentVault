/**
 * AgentVault X — Multi-Provider Inference Service
 * 
 * Supports:
 * - Ollama (local open-weight: gemma2:9b, gemma2:2b, etc.)
 * - Open-Weight OpenAI-compatible endpoints (Groq gemma2-9b-it, vLLM, HuggingFace, OpenRouter)
 * - Google Gemini (optional secondary provider)
 * - Deterministic Safe Engine (offline fallback)
 */

import {
  ModelProviderType,
  ModelProviderInfo,
  GenerateOptions,
  ModelResponse,
  extractJsonFromText
} from './model-provider';
import { GoogleGenAI } from '@google/genai';

export interface ProviderConfiguration {
  provider: ModelProviderType;
  model: string;
  ollamaBaseUrl: string;
  openWeightApiUrl: string;
  openWeightApiKey?: string;
  hasGeminiKey: boolean;
}

/**
 * Resolves current provider configuration from environment
 */
export function getProviderConfiguration(): ProviderConfiguration {
  const envProvider = (process.env.MODEL_PROVIDER || '').toLowerCase();
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const openWeightApiUrl = process.env.OPEN_WEIGHT_API_URL || '';
  const openWeightApiKey = process.env.OPEN_WEIGHT_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = !!geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.trim() !== '';

  // Determine active provider with preference for open-weight
  let provider: ModelProviderType = 'offline-engine';
  let model = process.env.OPEN_WEIGHT_MODEL || 'gemma2-9b-it';

  if (envProvider === 'ollama' || (process.env.OLLAMA_MODEL && !envProvider)) {
    provider = 'ollama';
    model = process.env.OLLAMA_MODEL || 'gemma2:9b';
  } else if (envProvider === 'open-weight' || openWeightApiUrl) {
    provider = 'open-weight';
    model = process.env.OPEN_WEIGHT_MODEL || 'gemma2-9b-it';
  } else if (envProvider === 'gemini' && hasGeminiKey) {
    provider = 'gemini';
    model = 'gemini-3.8-flash';
  } else if (openWeightApiUrl) {
    provider = 'open-weight';
    model = process.env.OPEN_WEIGHT_MODEL || 'gemma2-9b-it';
  } else if (hasGeminiKey) {
    // If only Gemini key is provided and no open-weight endpoint specified
    provider = 'gemini';
    model = 'gemini-3.8-flash';
  }

  return {
    provider,
    model,
    ollamaBaseUrl,
    openWeightApiUrl,
    openWeightApiKey,
    hasGeminiKey
  };
}

/**
 * Ping / Healthcheck for the active model provider
 */
export async function checkActiveProviderHealth(): Promise<ModelProviderInfo> {
  const config = getProviderConfiguration();

  if (config.provider === 'ollama') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${config.ollamaBaseUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        return {
          provider: 'ollama',
          model: config.model,
          isOpenWeight: true,
          status: 'connected',
          endpoint: config.ollamaBaseUrl,
          license: 'Gemma Terms of Use / Open-Weight',
          details: 'Connected to local Ollama instance'
        };
      }
    } catch {
      // Ollama not responding
    }

    return {
      provider: 'ollama',
      model: config.model,
      isOpenWeight: true,
      status: 'offline',
      endpoint: config.ollamaBaseUrl,
      license: 'Gemma Terms of Use / Open-Weight',
      details: `Ollama service unreachable at ${config.ollamaBaseUrl}. Falling back to deterministic safe engine.`
    };
  }

  if (config.provider === 'open-weight') {
    if (!config.openWeightApiUrl) {
      return {
        provider: 'open-weight',
        model: config.model,
        isOpenWeight: true,
        status: 'unconfigured',
        license: 'Gemma Terms of Use / Apache-2.0',
        details: 'OPEN_WEIGHT_API_URL not configured'
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.openWeightApiKey) {
        headers['Authorization'] = `Bearer ${config.openWeightApiKey}`;
      }

      // Check models list or simple ping
      const res = await fetch(`${config.openWeightApiUrl}/models`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);

      return {
        provider: 'open-weight',
        model: config.model,
        isOpenWeight: true,
        status: res.ok ? 'connected' : 'error',
        endpoint: config.openWeightApiUrl,
        license: 'Gemma Terms of Use / Open-Weight',
        details: res.ok ? 'Connected to Open-Weight Inference Endpoint' : `Endpoint returned HTTP ${res.status}`
      };
    } catch (err: any) {
      return {
        provider: 'open-weight',
        model: config.model,
        isOpenWeight: true,
        status: 'offline',
        endpoint: config.openWeightApiUrl,
        license: 'Gemma Terms of Use / Open-Weight',
        details: `Endpoint unreachable: ${err?.message || 'Connection error'}`
      };
    }
  }

  if (config.provider === 'gemini') {
    return {
      provider: 'gemini',
      model: config.model,
      isOpenWeight: false,
      status: config.hasGeminiKey ? 'connected' : 'unconfigured',
      license: 'Proprietary Google API',
      details: config.hasGeminiKey ? 'Gemini API active' : 'No GEMINI_API_KEY supplied'
    };
  }

  return {
    provider: 'offline-engine',
    model: 'Gemma-Compatible Guarded Engine',
    isOpenWeight: true,
    status: 'connected',
    license: 'Apache-2.0',
    details: 'Air-gapped deterministic safe engine active (no external API calls)'
  };
}

/**
 * Execute unified model inference with open-weight priority
 */
export async function executeInference(options: GenerateOptions): Promise<ModelResponse> {
  const config = getProviderConfiguration();
  const startTime = Date.now();

  // 1. Try Ollama (Local Open-Weight: Gemma 2)
  if (config.provider === 'ollama') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt: `${options.systemInstruction ? `[SYSTEM: ${options.systemInstruction}]\n\n` : ''}${options.prompt}`,
          stream: false,
          format: options.jsonMode ? 'json' : undefined,
          options: {
            temperature: options.temperature ?? 0.2
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Ollama responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        text: data.response || '',
        provider: 'ollama',
        model: config.model,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      clearTimeout(timeout);
      console.warn(`[ModelService] Ollama inference failed (${err?.message}).`);
      throw err;
    }
  }

  // 2. Try Open-Weight OpenAI-compatible endpoint (Groq, vLLM, HuggingFace, etc.)
  if (config.provider === 'open-weight') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (config.openWeightApiKey) {
        headers['Authorization'] = `Bearer ${config.openWeightApiKey}`;
      }

      const messages: any[] = [];
      if (options.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: options.prompt });

      const bodyPayload: any = {
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.2
      };

      if (options.jsonMode) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const url = config.openWeightApiUrl.endsWith('/chat/completions')
        ? config.openWeightApiUrl
        : `${config.openWeightApiUrl.replace(/\/+$/, '')}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Open-weight endpoint HTTP ${res.status}: ${errorText.slice(0, 100)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        text: content,
        provider: 'open-weight',
        model: config.model,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      clearTimeout(timeout);
      console.warn(`[ModelService] Open-weight endpoint inference failed (${err?.message}).`);
      throw err;
    }
  }

  // 3. Try Gemini if configured as provider
  if (config.provider === 'gemini' && config.hasGeminiKey) {
    const apiKey = process.env.GEMINI_API_KEY!;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3.8-flash',
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.jsonMode ? 'application/json' : undefined
      }
    });

    return {
      text: response.text || '',
      provider: 'gemini',
      model: config.model,
      durationMs: Date.now() - startTime
    };
  }

  throw new Error('No live model provider is currently reachable. Switching to deterministic engine.');
}
