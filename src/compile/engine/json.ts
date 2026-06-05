/**
 * Tolerant JSON extraction from a model response (PURE — no model, AXIOM A3).
 *
 * Models routinely wrap a JSON object/array in ```code fences``` or add a trailing
 * sentence ("…}. Let me know if you'd like another."). A strict `JSON.parse` of the whole
 * string then throws on the trailing prose ("Unexpected non-whitespace character after
 * JSON"), which crashed the compile. `extractJson` returns the first BALANCED top-level
 * `{…}` or `[…]` span — scanning with string/escape awareness so braces inside string
 * values don't fool it — so the caller parses only that. Returns null when none is found.
 */
export function extractJson(raw: string): string | null {
  // Peel a leading ```json / ``` fence and a trailing ``` if present.
  const s = raw
    .trim()
    .replace(/^\s*```(?:json)?\s*\n?/i, "")
    .replace(/\n?\s*```\s*$/i, "")
    .trim();
  const start = s.search(/[[{]/);
  if (start < 0) return null;
  const open = s[start]!;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null; // unbalanced — no complete JSON value
}

/** Parse the first balanced JSON value from a model response; null on any failure. */
export function parseJsonLoose(raw: string): unknown {
  const json = extractJson(raw);
  if (json === null) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
