export const name = "residue.ambiguous_nouns_preserved";
export function run(data) {
  const kept = new Set((data.residue || []).map((r) => String(r.term).trim().toLowerCase()));
  const violations = (data.ambiguous || [])
    .map((n) => String(n.term).trim())
    .filter((t) => !kept.has(t.toLowerCase()))
    .map((t) => ({ kind: 'lost_ambiguity', term: t }));
  return { name, pass: violations.length === 0, violations };
}
