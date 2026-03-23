# Ada: Research Context and Positioning

## Abstract

Ada is a semantic compiler that translates human intent into governed execution blueprints through a 7-stage agent pipeline with entropy-tracking provenance gates. This document positions Ada within the March 2026 research landscape, where the academic community has independently arrived at the same problem formulation Ada was built to solve.

## 1. The Intent Gap

The gap between informal human intent and correct software is the central unsolved problem in AI-assisted development. On March 21, 2026, this was formally recognized as a "Grand Challenge" in [arxiv 2603.17150]:

> "Intent formalization — the translation of informal user intent into a set of checkable formal specifications — is the key challenge that will determine whether AI makes software more reliable or merely more abundant."

Ada is the first implemented system that addresses this challenge through multi-agent semantic decomposition with automated governance.

### 1.1 The Scale of the Problem

| Finding                                                            | Source               | Date           |
| ------------------------------------------------------------------ | -------------------- | -------------- |
| 87% of AI-generated PRs contain vulnerabilities                    | DryRun Security      | March 13, 2026 |
| 50% of test-passing AI PRs rejected by maintainers                 | METR                 | March 10, 2026 |
| Developers 19% slower with AI tools (while perceiving 20% speedup) | METR                 | July 2025      |
| 85% per-step accuracy → 20% success across 10 steps                | Towards Data Science | 2025           |
| 95% of enterprise AI agent projects fail                           | Directual            | 2025           |
| Claude Sonnet half-life: 59 minutes (4-hour task = 6.25% success)  | Oxford / METR        | 2025           |

### 1.2 Why Generation Speed Is Not the Solution

The [Prompts Blend Requirements and Solutions] paper (arxiv 2603.16348) found that 53.3% of developer prompts simultaneously contain requirements, architectural decisions, and implementation details. Developers do not separate intent from implementation when prompting AI. Faster generation amplifies this confusion — it does not resolve it.

## 2. Ada's Architecture as Response

Ada decomposes the blended input through 7 sequential agents, each with a single lens:

```
INT (excavate) → PER (situate) → ENT (crystallize) → PRO (choreograph)
    → SYN (compose) → VER (challenge) → GOV (govern)
```

### 2.1 Blind Agent Isolation

Each agent sees only its own lens. This prevents **coordination drift** — the tendency of multi-agent systems to develop consensus errors over extended interactions [arxiv 2601.04170]. The [Agent Drift] paper taxonomizes three failure modes:

1. **Semantic drift** — intent deviation
2. **Coordination drift** — multi-agent consensus degradation
3. **Behavioral drift** — unintended strategy emergence

Ada's blind architecture eliminates (2) by construction and constrains (1) through schema validation at every stage boundary.

### 2.2 Entropy Gates as Behavioral Contracts

Between each stage, Ada computes an entropy estimate and evaluates a provenance gate. This maps to the **Agent Behavioral Contracts** framework [arxiv 2602.22302]:

| ABC Component     | Ada Implementation                                  |
| ----------------- | --------------------------------------------------- |
| Preconditions (P) | Input schema from previous stage                    |
| Invariants (I)    | Zod schema validation, entropy monotonicity         |
| Governance (G)    | Governor agent with ACCEPT/REJECT/ITERATE authority |
| Recovery (R)      | ITERATE loop with additive corrections              |

The ABC paper found contracted agents detect 5.2-6.8 soft violations per session that uncontracted baselines miss entirely (p < 0.0001, Cohen's d = 6.7-33.8).

### 2.3 Entropy Trajectory Monotonicity

The [Entropy Trajectory Shape] paper (arxiv 2603.18940) establishes that:

> "Whether entropy decreases at every step matters more than how much it decreases total" (ρ = -0.06 correlation with total reduction)

Monotone chains achieve 68.8% accuracy vs 46.8% for non-monotone (p = 0.0005). Each violation of monotonicity halves accuracy: 0 violations = 68.8%, 1 = 50.8%, 2 = 28.6%.

Ada's provenance gates track entropy between stages with a gate-pass threshold (< 0.7) and blocking-challenge detection. The monotonicity finding suggests upgrading to full trajectory checking.

## 3. Competitive Landscape

### 3.1 GitHub Spec Kit (September 2025)

4-phase workflow (Specify → Plan → Tasks → Implement) with human checkpoints. No automated governance, no entropy tracking, no provenance, no verification agent. The [Intent Formalization] paper explicitly notes Spec Kit "structures AI coding around NL requirements but leaves specifications informal and uncheckable."

### 3.2 Intent-Driven Development Movement

OpenSpec and intent-driven.dev promote spec-driven development. Specifications remain natural language documents, not compiled artifacts. No automated verification. The Oflight Guide (2026) notes 45% vulnerability rates and prescribes human review.

### 3.3 VibeContract (March 2026)

[arxiv 2603.15691] proposes embedding Design-by-Contract into AI code generation. Ada's entity invariants are the blueprint-level equivalent — constraints defined before code exists. VibeContract is a vision paper with one ATM example; Ada is an implemented system with 17,000+ lines across 7 packages.

### 3.4 Agent Behavioral Contracts (February 2026)

The ABC framework [arxiv 2602.22302] provides the theoretical foundation. Ada predates it as an implementation. ABC is a framework for individual agent contracts; Ada applies the pattern as a pipeline-level compilation architecture.

## 4. Theoretical Foundations

### 4.1 Information-Theoretic Basis

Ada's core operation is entropy reduction: H(Y|x,C) → 0 as constraints C increase.

The [Reasoning as Compression] paper (arxiv 2603.08462) formalizes this through the Conditional Information Bottleneck: reasoning traces should contain only information not already available from the prompt. This maps to Ada's stage design — each stage adds only the information its lens can see.

The [Unreasonable Effectiveness of Entropy Minimization] paper (arxiv 2505.15134) shows entropy minimization alone, without labeled data, improves reasoning. Ada's pipeline achieves this through sequential constraint accumulation.

### 4.2 Loosely-Structured Software

The [LSS] paper (arxiv 2603.15690) introduces the Three-Layer Framework:

- **View** (Context Engineering) — context pollution vs starvation
- **Structure** (Self-Organization) — binding entropy management
- **Evolution** (Drift Management) — long-term self-modification drift

Ada's provenance postcodes implement what LSS calls "binding provenance" — traceable supply chains across artifacts and agents.

### 4.3 Institutional Governance

The [Institutional AI] paper (arxiv 2601.11369) demonstrates governance graphs reduce severe violations from 50% to 5.6% in multi-agent systems (Cohen's d = 1.28). The key insight: "declarative prohibitions do not bind under optimisation pressure" — only enforceable consequences work. Ada's Governor enforces through REJECT authority, not through prompting.

## 5. What Ada Does Not Yet Do

Positioned against the Intent Formalization grand challenge, Ada's current gaps:

1. **Formal checkable specifications** — Ada produces typed JSON blueprints, not Dafny/F\*/Verus proofs
2. **Soundness/completeness metrics** — Ada has coverage/coherence scores but not formal soundness measures
3. **Native structured output** — Ada uses Zod validation + retry rather than Anthropic's GA `output_config.format` constrained decoding
4. **Entropy monotonicity** — Ada checks threshold, not full trajectory monotonicity
5. **Rich quantified logic** — Entity invariants are predicate strings, not executable logic

Each of these is an upgrade path, not a design limitation.

## 6. The Self-Compile Proof

`ada compile "build ada"` → Governor ACCEPT

If the compiler can compile its own specification and the Governor accepts the blueprint, the architecture validates its own thesis. This is the standard test: every compiler worth anything can compile itself.

## References

- [2603.17150] Intent Formalization: A Grand Challenge for Reliable Coding in the Age of AI Agents (March 2026)
- [2603.18940] Entropy Trajectory Shape Predicts LLM Reasoning Reliability (March 2026)
- [2603.08462] Reasoning as Compression: Unifying Budget Forcing via the Conditional Information Bottleneck (March 2026)
- [2603.15690] Loosely-Structured Software: Engineering Context, Structure, and Evolution Entropy (March 2026)
- [2603.15691] VibeContract: The Missing Quality Assurance Piece in Vibe Coding (March 2026)
- [2603.16348] Prompts Blend Requirements and Solutions (March 2026)
- [2602.22302] Agent Behavioral Contracts (February 2026)
- [2602.22642] Compress the Easy, Explore the Hard: Difficulty-Aware Entropy Regularization (February 2026)
- [2601.04170] Agent Drift: Quantifying Behavioral Degradation in Multi-Agent LLM Systems (January 2026)
- [2601.11369] Institutional AI: Governing LLM Collusion via Public Governance Graphs (January 2026)
- [2601.19747] Veri-Sure: Contract-Aware Multi-Agent Framework with Formal Verification (January 2026)
- [2505.15134] The Unreasonable Effectiveness of Entropy Minimization in LLM Reasoning (May 2025)
- [2507.15330] QSAF: A Novel Mitigation Framework for Cognitive Degradation in Agentic AI (July 2025)
- METR. Many SWE-bench-Passing PRs Would Not Be Merged into Main. March 10, 2026.
- METR. Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity. July 2025.
- DryRun Security. AI coding agents keep repeating decade-old security mistakes. March 13, 2026.
- Anthropic. Eval awareness in Claude Opus 4.6 BrowseComp performance. March 2026.
