# Ada Glass Box UI

## Complete architectural spec for the streaming reasoning UI

---

## 1. THE THREE PHASES

Every stage has three phases. This is the semantic structure.

```
PHASE 1 — REASONING (streaming tokens)
  Ada's live thinking. Token by token from claude CLI.
  The user reads along. This is the engagement.
  Duration: 1-4 minutes per stage.
  Rendering: text appears character by character.
  Verbs rotate alongside. Diamond breathes.

PHASE 2 — CRYSTALLIZATION (transition moment)
  The JSON artifact parses. The diamond fills.
  ◇ → ◈ → ◆
  Entropy sparkline updates.
  Entity/invariant/workflow counts tick up.
  Duration: ~500ms visual transition.

PHASE 3 — ARTIFACT (structured summary)
  What Ada concluded. Formatted for the user.
  ASCII diagrams. Ontology trees. Workflow sequences.
  This STAYS on screen as context for the next stage.
  Scrollable. The user can review while next stage runs.
```

---

## 2. STREAMING ARCHITECTURE

```
┌──────────────────────────────────────────────────────┐
│  base.ts  callClaude()                               │
│                                                      │
│  CURRENT:                                            │
│    spawn claude --print → collect full response       │
│    → extract JSON → validate → return                │
│                                                      │
│  NEW:                                                │
│    spawn claude --print --output-format stream-json   │
│    → stream tokens to onToken callback               │
│    → accumulate full text in parallel                 │
│    → on stream end: extract JSON → validate → return │
│                                                      │
│  The change is in callClaude() only.                 │
│  Everything else stays the same.                     │
└──────────────────────────────────────────────────────┘

Stream-json event types from claude CLI:
  message_start        → stage beginning
  content_block_start  → content starting
  content_block_delta  → TOKENS (type: "text_delta", text: "...")
  content_block_stop   → content done
  message_stop         → stage complete
```

### New base.ts interface

```typescript
export interface AgentCallbacks {
  readonly onToken?: (token: string) => void;      // live reasoning
  readonly onComplete?: (fullText: string) => void; // reasoning done
}

// callClaude signature changes:
private callClaude(prompt: string, callbacks?: AgentCallbacks): Promise<string>

// run() signature changes:
async run(input: TInput, callbacks?: AgentCallbacks): Promise<AgentResult<TOutput>>
```

### New engine.ts flow

```typescript
// Each stage call becomes:
const intentResult = await this.intentAgent.run(intent, {
  onToken(token) {
    onStageToken?.({ stage: "INT", token }); // new callback
  },
  onComplete(fullText) {
    // reasoning phase done, crystallization begins
  },
});
```

### New CompileOptions

```typescript
export interface CompileOptions {
  readonly onStageStart?: (stage: CompilerStageCode) => void;
  readonly onStageToken?: (event: {
    stage: CompilerStageCode;
    token: string;
  }) => void;
  readonly onStageComplete?: (event: StageCompleteEvent) => void;
}
```

---

## 3. UI COMPONENT ARCHITECTURE

```
cli/src/ui/
  design-system.ts       ← unchanged (palette, glyphs, spinners, timing)
  hooks.ts               ← unchanged (useDiamondBreathe, useVerbRotation)

  stage-reasoning.tsx    ← NEW: streams reasoning text with auto-scroll
  stage-artifact.tsx     ← NEW: renders structured artifact per stage type
  stage-panel.tsx        ← NEW: wraps reasoning + crystallization + artifact
  entropy-bar.tsx        ← NEW: sparkline that updates per stage

  governor-panel.tsx     ← updated: shows reasoning during GOV stage
  artifact-list.tsx      ← unchanged
  progress-bar.tsx       ← unchanged

  terminal.tsx           ← rewritten: orchestrates 3-phase flow
```

### stage-reasoning.tsx

```
Streams tokens as they arrive.
Handles line wrapping at terminal width.
Auto-scrolls to bottom.
Max visible lines: ~15 (scrollable).
Colors:
  ◈ prefix on key insights: accent.primary
  ∴ therefore lines: accent.pale
  ∵ because lines: text.secondary
  quoted text: text.primary
  meta text: text.tertiary
```

### stage-artifact.tsx

```
Renders the structured artifact AFTER crystallization.
Different layout per stage type:

  INT → goal/constraint/unknown table with classification tags
  PER → vocabulary translation table + exclusion set
  ENT → ontology tree with predicates + bounded context diagram
  PRO → workflow sequence with Hoare triples + state machine
  SYN → component dependency graph + conflict resolution
  VER → coverage/coherence bars + gap list + drift report
  GOV → gate table + verdict + next action
```

### stage-panel.tsx

```
The container for one stage. Manages the 3-phase transition.

Props:
  stage: CompilerStageCode
  phase: "reasoning" | "crystallizing" | "artifact"
  reasoningTokens: string        // accumulated reasoning text
  artifact: unknown              // parsed artifact (after crystallization)
  entropy: number                // current entropy after this stage
  previousEntropy: number        // entropy before this stage
  elapsedMs: number

Layout:
  ┌─ STAGE · verb · "question" ─────────────────────┐
  │                                                   │
  │  [reasoning stream OR artifact, based on phase]   │
  │                                                   │
  │  entropy  0.72 → 0.58  ▇▅░░░░░░        1m 48s   │
  └───────────────────────────────────────────────────┘
```

### entropy-bar.tsx

```
Visual sparkline showing entropy reduction across stages.
Updates after each stage crystallizes.

  ▇▅▃▃▂▂▁░
  INT PER ENT PRO SYN VER GOV
```

---

## 4. STAGE HEADERS

Each stage has a name, verb, and question.

```typescript
const STAGE_META = {
  INT: { name: "INTENT", verb: "excavate", question: "what do you want?" },
  PER: { name: "PERSONA", verb: "situate", question: "in what world?" },
  ENT: { name: "ENTITY", verb: "crystallize", question: "what things exist?" },
  PRO: { name: "PROCESS", verb: "choreograph", question: "what happens?" },
  SYN: { name: "SYNTHESIS", verb: "compose", question: "how do they fit?" },
  VER: { name: "VERIFY", verb: "challenge", question: "is that right?" },
  GOV: {
    name: "GOVERNOR",
    verb: "govern",
    question: "does this meet the bar?",
  },
};
```

Stage header format:

```
  ENTITY · crystallize · "what things exist?"
```

---

## 5. REASONING FORMATTING RULES

The raw LLM text streams. We apply formatting rules:

```
RULE 1: Lines starting with a quoted word get accent.primary
        "Pipeline — this is a substance..."

RULE 2: Lines with ∴ or "therefore" get accent.pale
        ∴ adding ITERATE as implied requirement

RULE 3: Lines with ∵ or "because" get text.secondary
        ∵ the user has been burned by AI hallucinating

RULE 4: Lines with ✗ get semantic.failure
        ✗ not a chatbot

RULE 5: Lines with ✓ get semantic.verified
        ✓ covered

RULE 6: Predicate lines (containing > < >= <= !== === ∈) get accent.primary
        pipeline.entropy > 0 && entropy <= 1.0

RULE 7: Everything else gets text.primary

RULE 8: Never wrap mid-word. Break at terminal width.

RULE 9: Maximum 20 visible lines. Scroll older lines up.
```

---

## 6. ARTIFACT RENDERERS

### INT artifact renderer

```
GOALS  {n}
G1  {description}              {type: stated|derived|implied}
G2  ...

CONSTRAINTS  {n}
C1  {description}              {source: explicit|derived|domain}

UNKNOWNS  {n}
U1  {description}              {impact: blocking|scoping|impl}
```

### PER artifact renderer

```
world: {domain}

VOCABULARY
{userTerm}    ≠ {commonMeaning}
              = {canonicalMeaning}

EXCLUDES
✗ {excluded1}  ✗ {excluded2}  ✗ {excluded3}

STAKEHOLDER
role: {role}
fears: {fearSet}
assumes: {blindSpots}
```

### ENT artifact renderer

```
{EntityName} ({category})
├── {property.name}: {property.type}
├── {invariant.predicate}
└── {invariant.predicate}

{EntityName} ({category})
└── ...

BOUNDED CONTEXTS
{context1} ──→ {context2} ──→ {context3}

{n} entities · {n} invariants · {n} contexts
```

### PRO artifact renderer

```
{workflow.name}
trigger: {trigger}

{precondition}
  → {action}
{postcondition}
  → {action}
{postcondition}

STATE: {entity}
{state1} ──{trigger}──→ {state2} ──{trigger}──→ ...

{n} workflows · {n} edge cases
```

### SYN artifact renderer

```
pattern: {pattern}
∵ {rationale}

{context1}
├── {component}    {responsibility}
├── {component}    {responsibility}
└── {component}    {responsibility}

{context2}
└── {component}    {responsibility}

dependencies: {context1} → {context2} → {context3}

conflicts resolved: {n}
open questions: {n}
```

### VER artifact renderer

```
coverage   {score}  {bar}  {≥0.85 ✓|✗}
coherence  {score}  {bar}  {≥0.90 ✓|✗}

GAPS
· {gap description}

DRIFTS  {critical} critical · {major} major · {minor} minor
```

### GOV artifact renderer

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  {ACCEPT|REJECT|ITERATE}  confidence: {n}         ┃
┃                                                    ┃
┃  coverage    {score}  {✓|✗}                        ┃
┃  coherence   {score}  {✓|✗}                        ┃
┃  gates       {n}/{n}  {✓|✗}                        ┃
┃  provenance  {intact|broken}  {✓|✗}               ┃
┃                                                    ┃
┃  {∴ nextAction  OR  ∵ rejectionReason}             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 7. FULL SCREEN FLOW

```
Stage active:
  ╔═══════════════════════════════════════════════════╗
  ║  ◈ Ada            ◆◆◈◇◇◇◇   entropy ▇▅▃░░░░░   ║
  ╠═══════════════════════════════════════════════════╣
  ║                                                   ║
  ║  ENTITY · crystallize · "what things exist?"      ║
  ║                                                   ║
  ║  "Pipeline — this is a substance. it exists       ║
  ║   independently. it has a lifecycle: idle,        ║
  ║   compiling, iterating, complete."                ║
  ║                                                   ║
  ║  ◈ "Artifact — substance. every stage produces    ║
  ║     one. the address format is frozen."           ║
  ║                                                   ║
  ║  ◈ "ProvenanceGate — this is a relation. it       ║
  ║     connects two artifacts across a boundary."    ║
  ║                                                   ║
  ║  ∴ entropy must decrease at every gate.           ║
  ║    if it doesn't, the stage added ambiguity.      ║
  ║    that's a bug, not a feature.                   ║
  ║                                                   ║
  ║  ◈ Extracting structure…                 2m 12s  ║
  ║                                                   ║
  ║  ┄┄┄┄┄┄┄┄┄┄┄ previous stages ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ║
  ║  INT  ✓  8 goals, 5 constraints    0.72   1m 14s ║
  ║  PER  ✓  domain: semantic comp     0.58   2m 01s ║
  ╚═══════════════════════════════════════════════════╝

After crystallization — artifact replaces reasoning:
  ╔═══════════════════════════════════════════════════╗
  ║  ◈ Ada            ◆◆◆◇◇◇◇   entropy ▇▅▃░░░░░   ║
  ╠═══════════════════════════════════════════════════╣
  ║                                                   ║
  ║  ENTITY · crystallize · "what things exist?"      ║
  ║                                                   ║
  ║  Pipeline (substance)                             ║
  ║  ├── status ∈ {idle,compiling,...}                ║
  ║  ├── entropy > 0 && entropy <= 1.0               ║
  ║  │                                                ║
  ║  ├── Stage (substance)                            ║
  ║  │   └── Artifact (substance)                     ║
  ║  │       └── postcode ~ ML.{S}.{h}/v{n}          ║
  ║  │                                                ║
  ║  └── ProvenanceGate (relation)                    ║
  ║      └── entropy < 0.7 → PASS                    ║
  ║                                                   ║
  ║  17 entities · 51 invariants · 3 contexts         ║
  ║  entropy  0.58 → 0.41  ▇▅▃░░░░░         2m 12s  ║
  ║                                                   ║
  ║  ┄┄┄┄┄┄┄┄┄┄┄ previous stages ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ║
  ║  INT  ✓  8 goals, 5 constraints    0.72   1m 14s ║
  ║  PER  ✓  domain: semantic comp     0.58   2m 01s ║
  ║                                                   ║
  ║  ◈ Choreographing workflows…     PRO next        ║
  ╚═══════════════════════════════════════════════════╝
```

---

## 8. IMPLEMENTATION ORDER

```
STEP 1: Modify base.ts callClaude() to stream tokens
        Add onToken callback to AgentResult pipeline
        Keep existing parse logic unchanged

STEP 2: Modify engine.ts to pass token callbacks through
        Add onStageToken to CompileOptions

STEP 3: Build stage-reasoning.tsx
        Streaming text renderer with formatting rules
        Auto-scroll, max 20 visible lines

STEP 4: Build stage-artifact.tsx
        7 artifact renderers (one per stage type)
        ASCII diagrams, ontology trees, workflow sequences

STEP 5: Build stage-panel.tsx
        3-phase container: reasoning → crystallizing → artifact
        Manages transitions between phases

STEP 6: Build entropy-bar.tsx
        Sparkline across all stages

STEP 7: Rewrite terminal.tsx
        Full screen layout with active stage panel
        Previous stages collapsed to summary lines
        Entropy bar in header

STEP 8: Wire into init.ts
        Pass onStageToken through to renderer
        Iteration support with UI reset

STEP 9: Polish
        Scroll behavior
        Terminal resize handling
        Color accuracy verification
```

---

## 9. WHAT DOES NOT CHANGE

```
design-system.ts     ← palette, glyphs, spinners — all stay
hooks.ts             ← useDiamondBreathe, useVerbRotation — all stay
base.ts              ← parse logic stays, only callClaude changes
engine.ts            ← pipeline sequence stays, only callbacks change
schemas.ts           ← all forgiving schemas stay
gate.ts              ← entropy logic stays
all package code     ← provenance, config-writer, governor, etc.
```

The glass box is a UI change + a streaming change in callClaude.
The compiler pipeline is unchanged.
