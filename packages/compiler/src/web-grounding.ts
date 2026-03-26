import Anthropic from "@anthropic-ai/sdk";

/**
 * Web grounding for the INT stage.
 *
 * When ADA_WEB_ACCESS=true and ANTHROPIC_API_KEY is set, this fetches domain
 * knowledge relevant to the user's intent using Claude's built-in web search.
 * The result is injected into the enrichedIntent before the INT stage runs,
 * so the Intent agent has current, grounded domain context.
 *
 * Returns empty string if web access is disabled, unavailable, or errors.
 */
export async function groundIntent(rawIntent: string): Promise<string> {
  if (process.env["ADA_WEB_ACCESS"] !== "true") return "";
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) return "";

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `Given this software intent: "${rawIntent.slice(0, 400)}"

Search for and briefly summarize:
1. What domain is this in? What are the current standard tools/libraries?
2. Are there any important recent changes (API changes, deprecations, new versions)?
3. What are the key domain-specific concepts a developer would need to know?

Be concise — 3-5 sentences total. Focus on what's non-obvious or recently changed.`,
        },
      ],
    });

    // Extract text content from the response
    const textBlocks = response.content.filter((b) => b.type === "text");
    const text = textBlocks
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
    if (!text) return "";

    return `\n\n--- WEB GROUNDING (current domain context) ---\n${text}\n--- END WEB GROUNDING ---`;
  } catch {
    // Never crash the pipeline — web grounding is best-effort
    return "";
  }
}
