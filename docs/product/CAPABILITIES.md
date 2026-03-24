# Ada — Capabilities

**Authority:** describes Ada's current product state.
All claims are verifiable from the codebase or explicitly tagged.
Status tags: `[LIVE]` `[BUILDING]` `[VISION]`

Do not imply a BUILDING or VISION feature is LIVE.

---

## What Ada Does

Input: natural language intent — at whatever level the user operates.
Output: `CLAUDE.md`, agent definitions, pre-tool hooks.
Position: before building starts. That is Ada's categorical role.

---

## Live `[LIVE]`

### Elicitation

Structured dialogue that surfaces and resolves ambiguity in user intent
before compilation begins.

- Identifies blocking unknowns in the stated intent
- Asks the minimum necessary questions — semantic, not technical
- Questions are about what the thing should do and be, not how to build it
- User answers in plain language at whatever abstraction level they operate
- No framework, library, or implementation questions

### Compilation pipeline

Multi-stage processing of elicited intent into structured context files.

Stages: `CTX → INT → PER → ENT → PRO → SYN → VER → GOV`

Each stage reduces ambiguity. Each stage produces an artifact.
Stages do not proceed until the prior stage's output is coherent.

### Output: `CLAUDE.md`

The primary persistent context file Claude Code reads every session.

- Contains: what the project is, what it is not, constraints that apply
- Injected into Claude Code's context automatically before the first message
- Produced from elicited intent — not written by the user
- Plain language — user can read and verify it matches their original intent

### Output: `agents/`

Specialized agent definition files scoped to bounded contexts within the project.
Each agent knows its domain and its constraints.
Prevents cross-domain contamination during Claude Code sessions.

### Output: `hooks/`

Pre-tool guard scripts that run before Claude Code takes actions.
Enforce constraints from the original intent at the boundary where decisions are made.
Approximately 250 hooks per compilation covering entity invariants.

### Governor gate

Quality gate that evaluates compilations before handoff to Claude Code.

- Rejects compilations below coherence threshold
- Iterates — if rejected, Ada revises and resubmits
- Ensures output is internally consistent before Claude Code sees it
- The gate is the reason Ada's output is structured, not approximate

### Provenance

Every artifact is addressable and traceable to the original intent.
Each stage output has a provenance address.
Any artifact can be verified against the original intent at any point.

---

## In Development `[BUILDING]`

### World model / artifact store

Persistent, navigable store of all compiled artifacts.
Goal: every stage artifact queryable after compilation ends.
Example: "what did Ada decide about the payment flow?" returns an
authoritative answer from the compiled artifact, not from memory.

### Drift detection

Detection of changes that contradict the original compiled intent.
Trigger: a proposed code change or a new session instruction.
Output: flagged contradiction with reference to the original decision.

### Impact analysis

Given a change to X: what else in the compiled model is affected?
Prerequisite: world model must be live first.

---

## Vision `[VISION]`

### Ongoing authority

Ada watches commits and flags semantic drift from compiled intent.
Ada as semantic guardian for the lifetime of the project, not just the start.

### Natural language queries against compiled context

"What did we decide about X?" returns answer from the provenance-addressed artifact.
Not a summary from memory. An answer from the artifact.

### Intent version history

How intent evolved from first description through all iterations.
Navigable. Reversible. Auditable.

---

## Important Missing for Adoption

Not yet built. Material for the widest possible user base.

**1. Readable post-compilation summary**
Plain-language output after compilation that the user verifies against
their original intent before handing off to Claude Code.
Currently implicit. Must be explicit.
This is the verification step that makes Ada trustworthy to non-developers.

**2. One-command install**
`npm install -g @motherlabs/ada` or `brew install ada`.
Simpler install = faster spread. Every friction point in setup kills adoption.

**3. Windows support**
63% of vibe coders are non-developers. Many are on Windows.
CLI-only on macOS/Linux limits the primary audience.

**4. Recoverable error experience**
When something goes wrong, the error must not require understanding Ada's
internals to recover from. Plain language. Clear next action. No stack traces
surfaced to the user unless they ask.
