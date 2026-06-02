# Excavation Quality — the meaning-verification loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ada compile` produce reliably _impressive_ node capsules by adding a deterministic meaning-quality gate (the checkable sliver of "is this node good"), backing the model critic with it, and proving the gate discriminates via a calibration eval — so "first node must impress" stops being a vibe.

**Architecture:** A pure deterministic rubric (`rubric.ts`) scores _structural quality proxies_ of a `NodeSpec` (specificity tokens, intent-trace, compiles-to concreteness, checkability honesty, banned-generic-phrase lint, residue surfaced) and returns a verdict (`impress | pass | reject`). A calibration set of hand-labeled exemplars proves the rubric separates good from generic. `assemblePack` gates on it. The deep "is this a genuine insight" judgment stays where it belongs: the model critic (C2) pre-filtered by the rubric, and Alex's taste gate (C0–C1). This is Ada's own loop pointed at its own output: _the deterministic sliver of meaning-quality is C; the rest is judgment._ (See `docs/POSITIONING.md`.)

**Tech Stack:** TypeScript (ESM, Node 22), zero new runtime deps, `node:test` + `node:assert` for tests.

---

### Task 0: Test harness (node:test, zero-dep)

**Files:**

- Modify: `package.json` (scripts)
- Create: `src/compile/rubric.test.ts` (placeholder that runs)

- [ ] **Step 1: Add the test script**

In `package.json` `scripts`, add:

```json
"test": "tsc -p tsconfig.json && node --test \"dist/**/*.test.js\""
```

- [ ] **Step 2: Write a trivial passing test to prove the harness runs**

Create `src/compile/rubric.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("harness runs", () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 3: Run it**

Run: `pnpm test`
Expected: build succeeds, `node --test` reports `tests 1 / pass 1`.

- [ ] **Step 4: Commit**

```bash
git add package.json src/compile/rubric.test.ts
git commit -m "test: add zero-dep node:test harness"
```

---

### Task 1: Banned-phrase + specificity proxies (pure helpers)

**Files:**

- Create: `src/compile/quality-signals.ts`
- Test: `src/compile/quality-signals.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hasBannedGenericPhrase, specificityScore } from "./quality-signals.js";

test("flags generic filler phrases", () => {
  assert.equal(
    hasBannedGenericPhrase("Quality you can trust, leveraging best practices."),
    true,
  );
  assert.equal(
    hasBannedGenericPhrase(
      "Salience is a zero-sum budget allocated in the first 200ms.",
    ),
    false,
  );
});

test("specificity rewards numbers, named mechanisms, concrete nouns", () => {
  const high = specificityScore(
    "In the first 2.6s the pre-attentive system allocates a fixed pool by luminance and motion.",
  );
  const low = specificityScore(
    "This is important for users and helps them a lot.",
  );
  assert.ok(high > low);
  assert.ok(high >= 2);
  assert.equal(low <= 1, true);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test`
Expected: FAIL — module not found / functions undefined.

- [ ] **Step 3: Implement**

Create `src/compile/quality-signals.ts`:

```ts
/** Deterministic structural proxies for node-capsule quality (AXIOM A3: C, not model). */

const BANNED = [
  /\bquality you can trust\b/i,
  /\bbest practices\b/i,
  /\bleverage(s|d|ing)?\b/i,
  /\bworld[- ]class\b/i,
  /\bseamless(ly)?\b/i,
  /\bcutting[- ]edge\b/i,
  /\bgame[- ]chang/i,
  /\bsynerg/i,
  /\bhelps? (users|them|you) a lot\b/i,
  /\bis (very )?important\b/i,
];

export function hasBannedGenericPhrase(text: string): boolean {
  return BANNED.some((re) => re.test(text));
}

/** Counts concrete specificity signals: numbers/units, named mechanisms, proper-ish nouns. */
export function specificityScore(text: string): number {
  let score = 0;
  if (/\d/.test(text)) score += 1; // any number
  if (/\d+\s?(ms|s|px|%|min|hr|x)\b/i.test(text)) score += 1; // number with a unit
  if (
    /[A-Z][a-z]+(?:'s)?\b.*\b(theory|effect|law|pattern|gap|budget|system)\b/i.test(
      text,
    )
  )
    score += 1; // named mechanism
  const commas = (text.match(/,/g) ?? []).length; // clause density ~ concreteness
  if (commas >= 2) score += 1;
  return score;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/compile/quality-signals.ts src/compile/quality-signals.test.ts
git commit -m "feat(quality): deterministic banned-phrase + specificity proxies"
```

---

### Task 2: `scoreNode` rubric + verdict

**Files:**

- Create: `src/compile/rubric.ts`
- Test: `src/compile/rubric.test.ts` (replace the placeholder)

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreNode } from "./rubric.js";
import type { NodeSpec } from "./assemble.js";

const good: NodeSpec = {
  id: "ATT.005",
  label: "Relevance Detection",
  cluster: "ATT",
  depth: "L4",
  summary:
    "A sub-second relevance gate fires before a word is read; the same service+place+intent tokens a human uses also bind Google's local pack and ChatGPT's entity matcher — one headline satisfies three judges.",
  whyItMatters:
    "It is the gate before salience; echoing query language is the cheapest highest-yield headline decision.",
  failureIfMissing:
    "Brand slogan with no service/place tokens; visitor cannot confirm fit in <1s and bounces.",
  fromPrompt: [
    "ranks in Google",
    "recognized by ChatGPT",
    "converts attention into bookings",
  ],
  compilesTo: [
    "H1 template",
    "LocalBusiness.areaServed schema",
    "CLAUDE.md headline rule",
  ],
  checkClass: "C2",
  cCandidates: ["H1 contains a service term AND a place term"],
  unknowns: ["exact searcher vocabulary for this trade/region"],
  truth: "inference",
  parents: ["ATT.004"],
};

const generic: NodeSpec = {
  ...good,
  id: "ATT.999",
  label: "Engagement",
  summary:
    "Engagement is very important and helps users a lot by leveraging best practices.",
  whyItMatters: "It matters.",
  failureIfMissing: "Bad things happen.",
  fromPrompt: [],
  compilesTo: [],
  cCandidates: [],
  unknowns: [],
};

test("an excellent node scores impress", () => {
  assert.equal(scoreNode(good).verdict, "impress");
});

test("a generic node is rejected", () => {
  assert.equal(scoreNode(generic).verdict, "reject");
});

test("claiming C5 with no candidates flags checkability dishonesty", () => {
  const lie = { ...good, checkClass: "C5" as const, cCandidates: [] };
  assert.equal(scoreNode(lie).dimensions.checkabilityHonest, false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test`
Expected: FAIL — `scoreNode` undefined.

- [ ] **Step 3: Implement**

Create `src/compile/rubric.ts`:

```ts
import type { NodeSpec } from "./assemble.js";
import { hasBannedGenericPhrase, specificityScore } from "./quality-signals.js";

export interface RubricScore {
  dimensions: {
    notGeneric: boolean; // no banned filler
    specific: boolean; // specificity proxies present
    intentTraced: boolean; // fromPrompt non-empty
    compilesToConcrete: boolean; // >=2 concrete artifacts
    checkabilityHonest: boolean; // C3-5 => has candidates; C0-2 => fine
    residueSurfaced: boolean; // unknowns present OR truth=source legitimately
  };
  total: number; // 0..6
  verdict: "impress" | "pass" | "reject";
}

function isCheckable(c: NodeSpec["checkClass"]): boolean {
  return c === "C3" || c === "C4" || c === "C5";
}

export function scoreNode(n: NodeSpec): RubricScore {
  const text = `${n.summary} ${n.whyItMatters} ${n.failureIfMissing}`;
  const dimensions = {
    notGeneric: !hasBannedGenericPhrase(text),
    specific: specificityScore(n.summary) >= 2,
    intentTraced: n.fromPrompt.length > 0,
    compilesToConcrete: n.compilesTo.length >= 2,
    checkabilityHonest: isCheckable(n.checkClass)
      ? n.cCandidates.length > 0
      : true,
    residueSurfaced: n.unknowns.length > 0 || n.truth === "source",
  };
  const total = Object.values(dimensions).filter(Boolean).length;
  // Hard rejects: generic filler or no intent trace can never "impress".
  const verdict: RubricScore["verdict"] =
    !dimensions.notGeneric || !dimensions.intentTraced || total <= 3
      ? "reject"
      : total >= 5 && dimensions.specific
        ? "impress"
        : "pass";
  return { dimensions, total, verdict };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test`
Expected: PASS (all 3 + earlier tests).

- [ ] **Step 5: Commit**

```bash
git add src/compile/rubric.ts src/compile/rubric.test.ts
git commit -m "feat(quality): deterministic node rubric + verdict"
```

---

### Task 3: Calibration eval — prove the rubric discriminates

**Files:**

- Create: `src/compile/calibration.ts` (exemplars)
- Test: `src/compile/calibration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { IMPRESSIVE_EXEMPLARS, GENERIC_EXEMPLARS } from "./calibration.js";
import { scoreNode } from "./rubric.js";

test("rubric marks every impressive exemplar pass-or-impress", () => {
  for (const ex of IMPRESSIVE_EXEMPLARS) {
    assert.notEqual(scoreNode(ex).verdict, "reject", `false-reject: ${ex.id}`);
  }
});

test("rubric rejects every generic exemplar", () => {
  for (const ex of GENERIC_EXEMPLARS) {
    assert.equal(scoreNode(ex).verdict, "reject", `false-accept: ${ex.id}`);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/compile/calibration.ts` with **≥5 impressive exemplars** (lift the real ones from `.ada/packs/service-business-recognition/` — ATT.004, ATT.005, COPY.055, SEO.124, UNK.001) and **≥5 generic exemplars** (deliberately vague rewrites of the same labels). Each is a full `NodeSpec`. Example shape:

```ts
import type { NodeSpec } from "./assemble.js";

export const IMPRESSIVE_EXEMPLARS: NodeSpec[] = [
  /* paste ATT.005 etc. verbatim from the compiled pack's graph.json nodes */
];

export const GENERIC_EXEMPLARS: NodeSpec[] = [
  {
    id: "GEN.1",
    label: "Attention",
    cluster: "ATT",
    depth: "L3",
    summary:
      "Attention is important and you should capture it using best practices.",
    whyItMatters: "It matters a lot.",
    failureIfMissing: "Users leave.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  /* ...4 more */
];
```

- [ ] **Step 4: Run; tune `rubric.ts` thresholds until calibration passes**

Run: `pnpm test`
Expected: PASS. If a real exemplar false-rejects, the rubric is too strict — adjust thresholds in `rubric.ts` and re-run. The calibration set is the rubric's regression suite.

- [ ] **Step 5: Commit**

```bash
git add src/compile/calibration.ts src/compile/calibration.test.ts src/compile/rubric.ts
git commit -m "feat(quality): calibration eval proves rubric discriminates"
```

---

### Task 4: Gate `assemblePack` on the rubric

**Files:**

- Modify: `src/compile/assemble.ts` (add gating + record quality)
- Test: `src/compile/assemble.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePack } from "./assemble.js";
import { GENERIC_EXEMPLARS, IMPRESSIVE_EXEMPLARS } from "./calibration.js";

test("rejected nodes are dropped from the pack and counted", () => {
  const specs = [...IMPRESSIVE_EXEMPLARS, ...GENERIC_EXEMPLARS];
  const { model, rejected } = assemblePackGated("t", "intent", specs);
  assert.equal(rejected.length, GENERIC_EXEMPLARS.length);
  // ROOT.000 + kept specs
  assert.equal(model.graph.nodes.length, IMPRESSIVE_EXEMPLARS.length + 1);
});
```

(Rename: export `assemblePackGated(slug, intent, specs)` returning `{ model, kept, rejected }`; keep `assemblePack` as a thin wrapper returning `model` for back-compat.)

- [ ] **Step 2: Run to verify failure** → FAIL (no `assemblePackGated`).

- [ ] **Step 3: Implement** — in `assemble.ts`, before mapping specs to capsules, run `scoreNode` on each; drop `verdict === "reject"`; stamp the surviving capsule's `quality.genericnessScore`/`actionEnablementScore` from the rubric. Export `assemblePackGated`.

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/compile/assemble.ts src/compile/assemble.test.ts
git commit -m "feat(compile): gate pack assembly on the quality rubric"
```

---

### Task 5: Version the excavator prompts + critic-uses-rubric (integration)

**Files:**

- Create: `src/compile/prompts/excavator.md`, `src/compile/prompts/anti-generic-critic.md`
- Modify: the compile workflow script to read these + call the rubric as a pre-filter before the model critic
- Create: `docs/compile-pipeline.md` (the operator runbook)

- [ ] **Step 1:** Extract the excavator + critic prompts (currently inline in the workflow) into versioned markdown files. The critic prompt MUST instruct: "a node that the deterministic rubric already rejects is auto-killed; your job is to catch the subtler generic-but-well-formed nodes the rubric passes." This makes the model critic do _only_ what the rubric can't (the C2 layer above C3).

- [ ] **Step 2:** Document the full pipeline in `docs/compile-pipeline.md`: SEED → cluster excavation (workforce) → rubric gate (deterministic) → model critic (C2) → assemble → write. State explicitly that excavation itself is non-deterministic (AXIOM A1) and the rubric is the checkable sliver.

- [ ] **Step 3:** Acceptance (manual, the honest gate): recompile the showcase intent, run `node --test`, confirm calibration still green, then **Alex opens the first node** — the human C0–C1 gate the rubric cannot replace.

- [ ] **Step 4: Commit**

```bash
git add src/compile/prompts docs/compile-pipeline.md
git commit -m "feat(compile): versioned excavator/critic prompts + rubric pre-filter"
```

---

## Self-Review

- **Spec coverage:** "first node must impress" → rubric (T2) + calibration (T3) + human gate (T5). "23/23 too-soft critic" → rubric pre-filter + critic scoped to subtler cases (T5). "C is tests-for-meaning" → rubric IS the deterministic sliver, model+human carry the rest (architecture). ✓
- **Placeholder scan:** T3/T5 reference "paste verbatim from compiled pack" — that is a concrete instruction (the nodes exist on disk), not a TODO. Acceptable. ✓
- **Type consistency:** `NodeSpec` reused from `assemble.ts` throughout; `RubricScore.verdict` values consistent (`impress|pass|reject`); `assemblePackGated` signature stable across T4/T5. ✓
