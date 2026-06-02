export const name = "schema.no_duplicate_entity_names";
export function run(data) {
  const seen = new Set(); const dup = new Set();
  for (const e of data.entities || []) {
    const n = String(e.canonicalName).trim().toLowerCase();
    if (seen.has(n)) dup.add(e.canonicalName);
    seen.add(n);
  }
  const violations = [...dup].map((x) => ({ kind: 'duplicate_entity', canonicalName: x }));
  return { name, pass: violations.length === 0, violations };
}
