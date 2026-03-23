# Ada Glass Box Build

## Agent instructions for the animated reasoning UI

### Read fully. Build exactly. Do not approximate.

---

## What you are building

Ada's compile UI — the experience a user sees when they run `ada init "..."`.
This is every user's first experience with Ada. It must feel alive.

The user runs one command. They watch Ada understand their idea in real time.
Not a progress bar. Not a loading screen. Ada thinking — visibly.

The benchmark is Claude Code's terminal experience. Same quality.
Different identity. Slate blue to Claude's terra cotta.

---

## The two moments that define the product

**Moment 1:** Ada surfaces something the user didn't say.
A line appears with ∴ in accent blue:

```
∴ you didn't say ITERATE — but a compiler without
  retry is just a validator. adding as derived.
```

The user thinks: "how did it know that?"

**Moment 2:** ❯ ACCEPT renders in sage green.

```
❯  ACCEPT  confidence: 0.91
```

The thesis proven. The compiler compiled itself.

Everything else serves those two moments.

---

## Architecture

### Streaming pipeline

```
agent prompt (reasoning-first, then JSON)
    ↓
Anthropic API with stream: true
    ↓
tokens arrive one by one
    ↓
reasoning text renders live with color rules + animations
    ↓
JSON block detected → parse silently
    ↓
crystallization animation (◇ → ◈ → ◆)
    ↓
artifact renderer shows structured summary
    ↓
next stage begins
```

### What changes

````
CHANGE 1: Agent prompts
  OLD: "Return ONLY JSON in a ```json fence"
  NEW: "Explain your reasoning first. Mark insights with ◈.
        Mark derived requirements with ∴. Mark risks with ✗.
        Then output JSON in a ```json fence."

CHANGE 2: Stage panel renderer
  OLD: shows spinner + "Building vocabulary..." until complete
  NEW: streams reasoning text live, then transitions to artifact

CHANGE 3: Animation system
  OLD: diamond breathe spinner only
  NEW: full animation vocabulary mapped to semantic meaning
````

---

## Prompt structure (all 7 agents)

Every agent prompt follows this pattern:

````
[grounding — what lens this agent uses]

[upstream context — compacted, not raw JSON]

[task — what to produce]

First, explain your reasoning in plain language.
Write as if you're thinking out loud about the user's intent.
Be specific. Reference their actual words.

Mark key insights with ◈
Mark things you derived that weren't stated with ∴
Mark risks or gaps with ✗
Mark things you're confident about with ✓

Then output the structured result in a ```json fence.

The reasoning is for the user to read. The JSON is for the system.
````

### Per-stage reasoning guidance

**INT — excavate**

```
Read the intent word by word.
For each fragment, say what it tells you:
  "7-agent pipeline" — this is a constraint, not a goal. the count is structural.
  "provenance gates" — they care about trust. someone's been burned by hallucination.
Surface what wasn't said. What did they assume? What did they omit?
End with: what's still unclear? what would you ask if you could?
```

**PER — situate**

```
Name the domain. Not generic — specific.
Define the vocabulary: what words mean something different in this world?
  "compile" ≠ gcc. means: intent → constrained spec.
Who is the user? What do they know? What are they afraid of?
What does this world EXCLUDE? Close every door that isn't a feature.
```

**ENT — crystallize**

```
For each entity you find, explain WHY it must exist.
  "Pipeline must exist because the 7 stages need a container with lifecycle."
Show the invariants as predicates and explain what they protect.
  pipeline.entropy > 0 — "entropy can't be negative, that's not meaningful"
Draw the connections between entities.
```

**PRO — choreograph**

```
Walk through each workflow step by step.
Show the Hoare triple and explain what breaks if the postcondition fails.
  {intent !== null} parse(intent) {goals.length > 0}
  "if this postcondition fails, the entire pipeline has nothing to work with"
Find edge cases. What happens on failure? What's the recovery path?
```

**SYN — compose**

```
Derive each component from upstream. Trace it.
  "PaymentService exists because Entity found Payment and Process found createPayment workflow"
When Entity and Process disagree, name the conflict and resolve it.
Show the dependency direction.
```

**VER — challenge**

```
Try to break it. For each goal, ask: how could this Blueprint fail?
  G1: "is there a component that addresses this? does it have a postcondition?"
  ✓ covered — or ✗ gap found.
Be adversarial. When in doubt, FAIL.
```

**GOV — govern**

```
Check each criterion. Show your work.
  coverage 0.85 ≥ 0.85 ✓
  coherence 0.78 < 0.90 ✗ — needs improvement
State your decision and why.
If ITERATE: name the exact fix. One bounded context. Testable.
```

---

## Animation vocabulary

Every animation maps to a semantic meaning. No decoration.

### Spinners (mapped to activity type)

```typescript
// SEARCHING — scanning text, looking for patterns
brailleOrbit: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏  (80ms uniform)
use: while INT scans intent, while PER identifies domain

// FORMING — building something up, adding density
brailleGrow: ⡀⡄⡆⡇⣇⣧⣷⣿  (60ms uniform)
use: while ENT crystallizes entities, while SYN composes

// DECIDING — weighing, evaluating
diamondBreathe: ◇◈◆♦◈◇  (200/130/100/100/130/200ms eased)
use: while GOV evaluates, during crystallization moment

// MEASURING — checking, probing
pulseDot: ⋅∙●∙  (200/150/200/150ms)
use: while VER checks each goal, while gates evaluate

// GATE CHECK — at provenance boundaries
pulseCircle: ◌○⊙●⊙○  (180/120/100/100/120/180ms eased)
use: between stages, during gate evaluation
```

### Progressive elements

```
ENTITY APPEARING:
  brailleGrow ⡀⡄⡆⡇⣇⣧⣷⣿ → entity name snaps in
  then predicates type out below with ├── connector
  count ticks up in header

GOAL APPEARING:
  pulseDot ⋅∙●∙ → G1 snaps in with description
  type tag (stated/derived/implied) in dim

INSIGHT LINE (∴):
  brief accent flash (100ms) then text appears
  slightly brighter than surrounding text

RISK LINE (✗):
  failure color flash (100ms) then text appears

PASS (✓):
  snap in — no animation needed. certainty is instant.

COVERAGE BAR:
  fills left to right over 300ms
  ░░░░░░░░░░ → ████████░░
  color: verified if ≥ threshold, failure if below

ENTROPY SPARKLINE (header):
  updates per stage
  each bar appears/updates with 100ms transition
  color shifts: failure > 0.7, warning > 0.4, verified ≤ 0.4
```

### Stage transitions

```
STAGE COMPLETE:
  1. reasoning text stops streaming
  2. brief pause (200ms)
  3. crystallization: ◇ → ◈ → ◆ (300ms)
  4. entropy number ticks down (100ms)
  5. sparkline updates (100ms)
  6. reasoning dims to tertiary
  7. artifact summary renders (progressive, not instant)
  8. next stage header appears
  9. new reasoning begins streaming

ITERATION START:
  all stages clear
  progress bar resets: ◈◇◇◇◇◇◇
  entropy bar resets: ░░░░░░░
  "iteration 2/3" appears
  brief pause (300ms)
  INT begins again
```

---

## Component architecture

```
cli/src/ui/
  design-system.ts       ← palette, glyphs, all spinners, timing (EXISTS)
  hooks.ts               ← all animation hooks (REWRITE)

  reasoning-stream.tsx   ← NEW: renders streaming text with color rules
  entity-tree.tsx        ← NEW: progressive entity rendering with ├── connectors
  workflow-diagram.tsx   ← NEW: hoare triple rendering with arrows
  coverage-bars.tsx      ← NEW: animated fill bars for VER scores
  crystallization.tsx    ← NEW: ◇→◈→◆ transition animation

  stage-panel.tsx        ← REWRITE: 3-phase with animations
  stage-artifact.tsx     ← REWRITE: progressive rendering, not instant
  entropy-bar.tsx        ← REWRITE: per-stage updates with color transitions
  progress-bar.tsx       ← EXISTS: diamond progress bar

  terminal.tsx           ← REWRITE: orchestrate full animated flow
```

### hooks.ts additions

```typescript
// Existing
useDiamondBreathe()     — eased diamond spinner
useVerbRotation(stage)  — 2800ms verb rotation
useBrailleOrbit()       — 80ms uniform scanning spinner
usePulseCircle()        — eased gate check spinner
useElapsed()            — elapsed timer

// New
useBrailleGrow()        — 60ms filling animation
usePulseDot()           — probing animation
useTypewriter(text, speed) — progressive text reveal
useCountUp(target, duration) — number ticking up
useProgressFill(value, duration) — bar filling animation
useCrystallize()        — ◇→◈→◆ transition (300ms)
useColorFlash(color, duration) — brief color pulse
```

### reasoning-stream.tsx

````
Streams reasoning text token by token.
Applies color rules:
  ◈ prefix → accent.primary (insight)
  ∴ prefix → accent.pale (derived)
  ✗ prefix → semantic.failure (risk)
  ✓ prefix → semantic.verified (confirmed)
  predicates (contains > < >= ===) → accent.primary
  quoted text → text.primary
  default → text.secondary

Auto-scrolls. Max 18 visible lines.
Older lines scroll up and dim to tertiary.

When JSON block starts (``` detected):
  stop rendering text
  show crystallization animation
  parse JSON silently
````

### entity-tree.tsx

```
Renders entities progressively:

  ◈ Pipeline (substance)                    ← name in accent
  ├── status: string                         ← property in secondary
  ├── entropy > 0 && entropy <= 1.0          ← invariant in accent
  └── currentStage: StageCode               ← last property

  ◈ Blueprint (substance)
  ├── summary !== ""
  └── components.length > 0

Each entity appears one by one (100ms delay between).
Properties cascade below (50ms delay each).
Tree connectors ├── └── draw as properties appear.
```

### workflow-diagram.tsx

```
Renders workflows with Hoare triples:

  compile-intent
  trigger: user submits intent

  {intent !== null}
    → IntentAgent.run(intent)
  {goals.length > 0}
    → PersonaAgent.run(intentGraph)
  {domain !== "unknown"}

Steps cascade (100ms each).
Arrows → appear with brief accent pulse.
Hoare triples in secondary, actions in primary.
```

### coverage-bars.tsx

```
Animated fill bars for VER:

  coverage   0.85  ████████░░  ✓
  coherence  0.78  ███████░░░  ✗

Bars fill left to right (300ms).
Color: verified if ≥ threshold, failure if below.
✓/✗ snaps in after bar completes.
```

---

## Wire into commands

### init.ts changes

```typescript
// The compiler now calls onStageToken for every token
// The renderer passes tokens to reasoning-stream
// When stage completes, crystallization plays, artifact renders

const result = await compiler.compile(intent, {
  onStageStart(stage) {
    renderer.onStageStart(stage);
    // spinner starts (brailleOrbit for INT/PER, brailleGrow for ENT/SYN)
  },
  onStageToken(event) {
    renderer.onStageToken(event.stage, event.token);
    // token appears in reasoning stream
    // ◈/∴/✗/✓ lines get color treatment
  },
  onStageComplete(event) {
    renderer.onStageComplete(stage, summary, entropy, elapsed, artifact);
    // crystallization plays
    // artifact renders progressively
    // entropy bar updates
  },
});
```

---

## Color palette (exact values from design-system.ts)

```
accent.primary   #8ba4c4   ◈ insights, active borders, identity
accent.dim       #6b8aad   unfocused borders
accent.pale      #afc3d9   ∴ derived lines, spinner verb text

text.primary     #e8e6df   body text, values, quoted text
text.secondary   #9c9a92   labels, metadata, default reasoning
text.tertiary    #5e5d58   dimmed, completed stage summaries
text.dim         #3d3d3a   borders, grid lines
text.ghost       #2a2a2e   empty sparkline bars

semantic.verified    #7ab87a   ✓ pass, ACCEPT, coverage ≥ threshold
semantic.failure     #c45c4a   ✗ fail, REJECT, risks
semantic.warning     #d4c07a   entropy > 0.4, ITERATE, caution
semantic.provenance  #a8d4e6   audit trail, postcodes
semantic.info        #7a9cc4   neutral information
```

---

## Rules (enforced, not suggested)

```
Every animation maps to a runtime state. No decoration.
Ease-out ONLY. No ease-in. No linear.
No emoji. Unicode symbols only.
No pure white (#e8e6df not #ffffff).
No pure black (#0d0d0d not #000000).
No background color on text.
Sentence case or UPPERCASE. Never Title Case.
Timestamps: HH:MM:SS 24hr.
Truncate with … — never wrap.
Maximum 18 visible lines in reasoning stream.
Nothing appears instantly — everything has a micro-transition (50-100ms).
```

---

## Acceptance criteria

```
□ Reasoning text streams live — token by token, not all at once
□ ◈ insight lines flash accent.primary on appearance
□ ∴ derived lines render in accent.pale
□ ✗ risk lines render in semantic.failure
□ Entities appear one by one with tree connectors
□ Entity count ticks up in real time
□ Workflow steps cascade with arrow animations
□ Coverage bars fill left to right (300ms)
□ Diamond progress bar updates as stages complete
□ Entropy sparkline shows color-coded per-stage values
□ Crystallization animation plays between stages (◇→◈→◆ 300ms)
□ Completed stages dim to tertiary
□ brailleOrbit for scanning stages (INT, PER)
□ brailleGrow for building stages (ENT, SYN)
□ pulseDot for checking stages (VER)
□ diamondBreathe for deciding stages (GOV)
□ ACCEPT renders in semantic.verified with heavy border
□ REJECT renders in semantic.failure with ∵ reason lines
□ ITERATE renders in semantic.warning with ∴ nextAction
□ JSON output is never shown to the user — only reasoning + artifact
□ pnpm build → zero TypeScript errors
□ No emoji anywhere
□ Colors match palette exactly
```

---

## What this agent does NOT do

```
Does not modify the compiler pipeline (engine.ts, gate.ts, schemas.ts)
Does not change agent schemas or types
Does not modify the provenance, config-writer, governor, orchestrator packages
Does not add dependencies beyond what's already in cli/package.json

Only modifies:
  cli/src/ui/**          — all UI components
  cli/src/commands/init.ts — wire renderer to compiler callbacks
  packages/compiler/src/agents/*.ts — prompt text only (not logic)
```

---

## The soul of it

The user typed one sentence. Ada shows them what that sentence contains.
Not metrics. Not schemas. Their idea, understood and reflected back,
deeper than they articulated it.

The animations are Ada's heartbeat. The reasoning is Ada's voice.
The artifacts are Ada's conclusions. Together they make the user
feel understood — not impressed by technology.

Build it so the user eats popcorn for 5 minutes and at the end
understands their own idea better than when they started.
