/**
 * Deterministic predicates for the engineered node L2C.001 — Nouns → Entities.
 * Pure functions (AXIOM A3: C is a runnable pass/fail predicate, no model). These are
 * the source of truth; the emitter ships byte-equivalent zero-dep `.mjs` copies into
 * the pack so `node verify-l2c-001.mjs` runs the same logic any executor can run.
 */

export interface EntityCandidate {
  id: string;
  canonicalName: string;
  classification: string;
  definition?: string;
}

export interface AmbiguousNoun {
  term: string;
}

export interface ResidueEntry {
  term: string;
}

const PRIMARY = new Set([
  "primary_domain_entity",
  "primary_workflow_entity",
  "financial_entity",
  "actor_entity",
]);

/** schema.no_duplicate_entity_names — duplicate canonical names (case-insensitive). */
export function findDuplicateCanonicalNames(
  entities: EntityCandidate[],
): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const e of entities) {
    const norm = e.canonicalName.trim().toLowerCase();
    if (seen.has(norm)) dupes.add(e.canonicalName);
    seen.add(norm);
  }
  return [...dupes];
}

/** schema.primary_entities_have_definitions — primary entities need a non-empty definition. */
export function findUndefinedPrimaryEntities(
  entities: EntityCandidate[],
): string[] {
  return entities
    .filter(
      (e) =>
        PRIMARY.has(e.classification) && !(e.definition && e.definition.trim()),
    )
    .map((e) => e.canonicalName);
}

/** residue.ambiguous_nouns_preserved — every ambiguous noun must appear in residue. */
export function findLostAmbiguousNouns(
  ambiguous: AmbiguousNoun[],
  residue: ResidueEntry[],
): string[] {
  const kept = new Set(residue.map((r) => r.term.trim().toLowerCase()));
  return ambiguous
    .map((n) => n.term.trim())
    .filter((t) => !kept.has(t.toLowerCase()));
}
