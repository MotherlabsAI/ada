#!/usr/bin/env bash
# ─── Ada Convergence Sequence ─────────────────────────────────────────────────
# Runs Ada against herself 3x with the maximal self-description intent.
# Saves each blueprint, then diffs them to find the stable core.
#
# Usage: ./scripts/converge.sh

set -euo pipefail

# ── Require API key ──────────────────────────────────────────────────────────
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "  ✗ ANTHROPIC_API_KEY is not set." >&2
  echo "  Export it before running: export ANTHROPIC_API_KEY=sk-ant-..." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INTENT_FILE="$REPO_ROOT/scripts/convergence-intent.txt"
OUT_DIR="$REPO_ROOT/.ada/convergence"
INTENT=$(cat "$INTENT_FILE")

mkdir -p "$OUT_DIR"

echo "◈ ada convergence sequence" >&2
echo "  intent length: ${#INTENT} chars" >&2
echo "  output dir: $OUT_DIR" >&2
echo "" >&2

for i in 1 2 3; do
  echo "━━━ Run $i/3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

  node "$REPO_ROOT/run-headless.mjs" "$INTENT" "$REPO_ROOT" 2>&1

  # Copy state snapshot
  cp "$REPO_ROOT/.ada/state.json" "$OUT_DIR/run-$i.json"
  echo "  ◈ snapshot saved: $OUT_DIR/run-$i.json" >&2
  echo "" >&2

  # Brief pause between runs
  sleep 2
done

echo "━━━ Convergence Analysis ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "" >&2

# Compare bounded contexts and components across all 3 runs
python3 - <<'PYEOF'
import json, sys

runs = []
for i in range(1, 4):
    with open(f".ada/convergence/run-{i}.json") as f:
        d = json.load(f)
    bp = d.get("blueprint", {})
    audit = bp.get("audit", {})
    arch = bp.get("architecture", {})
    dm = bp.get("dataModel", {})

    components = [c["name"] for c in arch.get("components", [])]
    contexts = [c["boundedContext"] for c in arch.get("components", [])]
    entities = []
    for bc in dm.get("boundedContexts", []):
        entities.extend(bc.get("entities", []))

    runs.append({
        "run": i,
        "decision": audit.get("governorDecision"),
        "confidence": audit.get("confidence"),
        "coverage": audit.get("coverageScore"),
        "coherence": audit.get("coherenceScore"),
        "components": components,
        "contexts": list(set(contexts)),
        "entities": entities,
        "blueprint_postcode": d.get("blueprint", {}).get("id", "?"),
        "pattern": arch.get("pattern", "?"),
    })

print("SCORES")
print(f"{'Run':<6} {'Decision':<10} {'Confidence':<12} {'Coverage':<10} {'Coherence':<10} {'Components'}")
for r in runs:
    print(f"  {r['run']:<4} {r['decision']:<10} {r['confidence']:<12} {r['coverage']:<10} {r['coherence']:<10} {len(r['components'])}")

print()
print("ARCHITECTURE PATTERN")
for r in runs:
    print(f"  Run {r['run']}: {r['pattern']}")

print()
print("COMPONENTS")
all_components = [set(r["components"]) for r in runs]
stable_components = all_components[0] & all_components[1] & all_components[2]
variant_components = (all_components[0] | all_components[1] | all_components[2]) - stable_components

print(f"  Stable (all 3 runs): {len(stable_components)}")
for c in sorted(stable_components):
    print(f"    ✓ {c}")
if variant_components:
    print(f"  Variant (not in all runs): {len(variant_components)}")
    for c in sorted(variant_components):
        present_in = [r["run"] for r in runs if c in r["components"]]
        print(f"    ~ {c}  (runs {present_in})")

print()
print("BOUNDED CONTEXTS")
all_contexts = [set(r["contexts"]) for r in runs]
stable_contexts = all_contexts[0] & all_contexts[1] & all_contexts[2]
variant_contexts = (all_contexts[0] | all_contexts[1] | all_contexts[2]) - stable_contexts

print(f"  Stable (all 3 runs): {len(stable_contexts)}")
for c in sorted(stable_contexts):
    print(f"    ✓ {c}")
if variant_contexts:
    print(f"  Variant: {len(variant_contexts)}")
    for c in sorted(variant_contexts):
        print(f"    ~ {c}")

print()
print("ENTITIES")
all_entities = [set(r["entities"]) for r in runs]
stable_entities = all_entities[0] & all_entities[1] & all_entities[2]
variant_entities = (all_entities[0] | all_entities[1] | all_entities[2]) - stable_entities
print(f"  Stable entities (all 3): {len(stable_entities)}")
for e in sorted(stable_entities):
    print(f"    ✓ {e}")
if variant_entities:
    print(f"  Variant entities: {len(variant_entities)}")
    for e in sorted(variant_entities):
        print(f"    ~ {e}")

print()
stable_ratio = len(stable_components) / max(len(all_components[0] | all_components[1] | all_components[2]), 1)
print(f"CONVERGENCE SCORE: {stable_ratio:.0%} of components stable across all 3 runs")
print(f"(100% = Ada fully converged on herself | 0% = complete variance)")

PYEOF
