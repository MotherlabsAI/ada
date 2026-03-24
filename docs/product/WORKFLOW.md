# Ada — Personal Workflow

**Authority:** describes how Ada is actually used by its creator.
Real workflow. Not a marketing narrative.
Applies to: /lab page, video demo framing, usage examples.

---

## The Division of Labor

### What goes to Ada first

Complex work where the context is too large or multi-domain to hold
precisely in a single prompt:

- New project from scratch — full intent elicitation and compilation
- Major architectural decision — compile before Claude Code acts on it
- Any work where re-explaining the architecture would take significant time
- Multi-domain systems where relationships between components matter

Ada compiles the context. Claude Code receives it. No re-explaining per session.

### What goes directly to Claude

Work where personal taste, attention, and creative engagement are the point:

- UI and design decisions — where aesthetic judgment is the output
- Writing — where voice and precision are the work
- Exploratory conversations — where the value is in the reasoning, not the artifact
- Specific technical decisions where direct engagement matters more than delegation

**The rule:** if the task benefits from structure and delegation → Ada first.
If the task benefits from direct attention and judgment → Claude directly.

---

## Why Not Claude Opus 4.6 for Ada's Compilation

This is a deliberate architectural choice. Not a cost-cutting measure.

**Ada's task is structured and constrained:**

- Follow a defined elicitation protocol
- Ask from a known set of question types
- Produce formatted output files — `CLAUDE.md`, agents, hooks
- The task requires reliability and precision, not creative depth

**Opus 4.6's value is in execution:**

- Reasoning about code during implementation
- Debugging complex, multi-file systems
- Making hundreds of micro-decisions inside a defined structure
- The task requires depth, creativity, and reasoning under uncertainty

**The efficiency argument:**
Ada on a faster model completes compilation faster at lower cost.
Claude Code on Opus 4.6 has full context budget available for execution.
Total output is better than using Opus for both tasks.
Matched model to matched task = better system performance overall.

**The analogy:**
A master craftsman filling out a form versus building what the form specifies.
The form needs to be correct, not inspired.
Save the craftsman for the craft.

---

## The Verification Step

After Ada compiles and before Claude Code builds:

Read the `CLAUDE.md`. Does it match what you originally meant?

This is not a technical check. It is a semantic one.
The `CLAUDE.md` is written in plain language. You can read it without knowing code.
If it matches your intent: proceed.
If it doesn't: run Ada again with the correction.

This is the only verification that matters for intent-to-output alignment.
No test suite checks whether the output matches what you had in your head.
Only you can check that. Ada makes that check possible by producing
something readable to verify against.

---

## The Session Pattern

```
1. New project or major change → run ada compile
2. Answer Ada's questions in plain language
3. Read the CLAUDE.md output — verify it matches original intent
4. Open Claude Code — context is already loaded
5. Claude Code builds — no re-explaining the architecture
6. Creative or judgment work → engage Claude directly, same session or new
```

The architecture decisions are in the artifacts.
The creative decisions are in the conversation.
They do not mix.
