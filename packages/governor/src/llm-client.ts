import Anthropic from "@anthropic-ai/sdk";
import { GOVERNANCE_MODEL, type ModelId } from "@ada/compiler";

/**
 * llm-client — Anthropic SDK wrapper for the runtime governor.
 *
 * Fail-open: every callable returns null if the API key is missing or the
 * call fails. Callers must handle null by falling back to the existing
 * heuristic drift path. The governor never crashes on a missing key.
 */

export function getApiKey(): string | null {
  const key = process.env["ANTHROPIC_API_KEY"];
  return key && key.trim().length > 0 ? key : null;
}

export function createClient(): Anthropic | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    return new Anthropic({ apiKey });
  } catch {
    return null;
  }
}

export interface ExtendedThinkingCall {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly thinkingBudget?: number;
  readonly maxTokens?: number;
  readonly model?: ModelId;
  readonly timeoutMs?: number;
}

export interface ExtendedThinkingResult {
  readonly text: string;
  readonly json: unknown | null;
  readonly model: string;
  readonly stopReason: string | null;
}

/**
 * Single entry point for governance LLM calls. Uses extended thinking by
 * default. Returns null on any failure (missing key, network, timeout).
 */
export async function callWithExtendedThinking(
  call: ExtendedThinkingCall,
): Promise<ExtendedThinkingResult | null> {
  const client = createClient();
  if (!client) return null;

  const model: ModelId = call.model ?? (GOVERNANCE_MODEL as ModelId);
  const thinkingBudget = call.thinkingBudget ?? 6000;
  const maxTokens = call.maxTokens ?? 16384;
  const timeoutMs = call.timeoutMs ?? 30_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.messages.create(
      {
        model,
        max_tokens: maxTokens,
        system: call.systemPrompt,
        thinking: { type: "enabled", budget_tokens: thinkingBudget },
        // Temperature must be 1 when extended thinking is enabled.
        temperature: 1,
        messages: [{ role: "user", content: call.userPrompt }],
      },
      { signal: controller.signal },
    );

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? String(b.text) : ""))
      .join("\n")
      .trim();

    return {
      text,
      json: tryParseJson(text),
      model: String(response.model ?? model),
      stopReason: response.stop_reason ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pulls a JSON object out of a response. Handles:
 *   - raw JSON as the whole text
 *   - ```json fenced blocks
 *   - first { ... } block in the text
 */
function tryParseJson(text: string): unknown | null {
  if (!text) return null;

  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }

  const fenced = /```(?:json)?\s*\n([\s\S]*?)\n\s*```/u.exec(text);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  const openIdx = text.indexOf("{");
  const closeIdx = text.lastIndexOf("}");
  if (openIdx !== -1 && closeIdx > openIdx) {
    const candidate = text.slice(openIdx, closeIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  return null;
}
