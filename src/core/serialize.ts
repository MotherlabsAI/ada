/**
 * Serialization. JSON is the source of truth; YAML is a config-readable mirror
 * (DECISION D4). The YAML emitter handles only JSON-shaped data: scalars, arrays,
 * and plain objects. No anchors, tags, or special types — by design.
 */

export function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function isPlainObject(v: unknown): v is { [k: string]: Json } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function scalar(v: null | boolean | number | string): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  // Always double-quote strings: valid YAML and avoids ambiguity. Escape backslash
  // first, then quotes and the control chars that would otherwise corrupt the line.
  return `"${v
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`;
}

function emit(value: Json, indent: number, lines: string[]): void {
  const pad = "  ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${pad}[]`);
      return;
    }
    for (const item of value) {
      if (isPlainObject(item) || Array.isArray(item)) {
        lines.push(`${pad}-`);
        emit(item as Json, indent + 1, lines);
      } else {
        lines.push(`${pad}- ${scalar(item)}`);
      }
    }
    return;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      lines.push(`${pad}{}`);
      return;
    }
    for (const key of keys) {
      const v = value[key]!;
      if (Array.isArray(v) || isPlainObject(v)) {
        const empty =
          (Array.isArray(v) && v.length === 0) ||
          (isPlainObject(v) && Object.keys(v).length === 0);
        if (empty) {
          lines.push(`${pad}${key}: ${Array.isArray(v) ? "[]" : "{}"}`);
        } else {
          lines.push(`${pad}${key}:`);
          emit(v, indent + 1, lines);
        }
      } else {
        lines.push(`${pad}${key}: ${scalar(v)}`);
      }
    }
    return;
  }

  lines.push(`${pad}${scalar(value)}`);
}

export function toYaml(value: unknown): string {
  const lines: string[] = [];
  emit(value as Json, 0, lines);
  return lines.join("\n") + "\n";
}
