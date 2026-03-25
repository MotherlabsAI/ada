# DIRECTION.md — Ada Architectural Direction

**Authority:** research-adjusted architectural direction derived from arXiv literature (Jan–Mar 2026) and product synthesis session 2026-03-24.
**Derives from:** BRAND.md (identity), ARCHITECTURE.md (current internals), STATE.md (honest gap audit), docs/research/ corpus
**Supersedes:** any prior claim that unconstrained recursive agent swarms are Ada's target architecture
**Audience:** anyone building Ada or making architectural decisions about its future

---

## The Direction In One Sentence

Ada is a semantic operating system that compiles human intent into governed world-state machines for Claude Code and bounded child agents, enabling non-coders to build long-horizon AI systems that are inspectable, verifiable, and safely improvable.

---

## What Changed and Why

The original Ada vision was correct at its core: intent formalization before building starts, world model as governing artifact, three-tier context architecture. The research (Jan–Mar 2026) validates all of it.

What the research does NOT support:

- Unconstrained recursive agent swarms that self-improve in the wild
- Multi-agent process verification alone making deep autonomy trustworthy
- 3D semantic control surfaces improving outcomes by themselves
- Swarms always outperforming fewer, more structured agents

What the research strongly supports:

- World models as the central layer for expensive or long-horizon domains
- Bounded hierarchy (macro/micro decomposition) over flat prompting for long-horizon tasks
- Verification as ensemble infrastructure, not a single LLM check
- Recursion compiled into contracts with inherited permissions and stop conditions
- Self-improvement as offline skill distillation with promotion gates, not live self-rewriting

The direction shifts Ada from **compiler only** to **compiler + governed runtime**. The compilation pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV) remains unchanged and correct. What extends is the execution layer: Ada governs what happens after ACCEPT, not just what gets written before it.

---

## The Product Gap That Drives This

Building complex things — agent swarms running on multiple machines, long-horizon autonomous missions — should feel as simple as describing what you want. It currently does not.

The problem is not that Ada is wrong. It is that Ada is currently a compiler whose output sits waiting for a human to execute it. The user still manages individual Claude Code sessions, coordinates outputs, and handles complexity manually. For simple projects that is acceptable. For agent swarms it is not.

The extension: Ada takes the execution step. Ada compiles intent, then governs execution — spawning bounded agents, maintaining runtime state, routing work, surfacing results. The user operates at the semantic level (intent, direction, approval). Everything below that is Ada.

---

## Architectural Extension — Six Layers

These extend the existing pipeline. They do not replace it.

### Layer 1 — World-State Runtime

**What it is:** A versioned, action-conditioned model of execution state — separate from the compiled world model, which is a snapshot of intent.

**What it contains:**

- Current environment facts (what has been built, what exists)
- Predicted next states and their uncertainty
- Cost-of-acting estimates (token budget, compute, time)
- Rollback checkpoints at each significant state transition
- Session log of all tool calls and their outcomes

**Why it matters:** The compiled world model freezes at ACCEPT and goes stale the moment Claude Code writes the first file. The runtime state tracks what is actually true as execution proceeds. Without it, Ada cannot govern execution — only inform it.

**Research basis:** World Models as an Intermediary between Agents and the Real World (2602.00785), Reinforcement World Model Learning for LLM-based Agents (2602.05842), Agent World Model (2602.10090)

---

### Layer 2 — Hierarchical Execution

**What it is:** An explicit split between macro planning and micro execution.

**Structure:**

- **Macro planner** — decomposes the compiled blueprint into bounded execution units, governs sequencing, decides when to escalate
- **Micro executor** — bounded task execution per component or workflow, operates within a delegation contract
- **Local repair** — handles failures at the micro level without escalating to macro unless stop conditions are met
- **Independent verifier** — evaluates outcomes, separated from executor so self-reporting cannot mask failure

**Why it matters:** Flat execution (one agent plans, acts, and reflects indefinitely) fails on long-horizon tasks. Ada's compiled pipeline already embodies hierarchy. Execution must match.

**Research basis:** HiMAC: Hierarchical Macro-Micro Learning for Long-Horizon LLM Agents (2603.00977), DeepPlanning: Benchmarking Long-Horizon Agentic Planning (2601.18137), LUMINA (2601.16649)

---

### Layer 3 — Delegation Contracts

**What it is:** Typed contracts that bound what child agents can do. Ada compiles these alongside CLAUDE.md — they are the governing artifact for any spawned agent.

**Contract fields:**

- Inherited permissions (what the parent allows the child)
- Scope (bounded context, file boundaries, domain)
- Stop conditions (when to halt and report up)
- Reporting cadence (what evidence to return and when)
- Required evidence (what the child must prove before its output is accepted)
- Max recursion depth (how many levels of child spawning are permitted)

**Why it matters:** Unconstrained agent spawning is how complexity becomes unmanageable. Contracts make recursion structured. The user never manages individual agents — Ada does, through contracts.

**Research basis:** Verified Multi-Agent Orchestration (2603.11445), Towards Adaptive, Scalable, and Robust Coordination of LLM Agents (2602.08009)

---

### Layer 4 — Verification Stack

**What it is:** A heterogeneous set of verifiers, not a single LLM judge.

**Five verifier types:**

- **Structural verifier** — plans and dependency graphs (are the pieces consistent?)
- **Execution verifier** — tool outcomes (did the tools do what was intended?)
- **Policy verifier** — allowedness (does this action violate a compiled constraint?)
- **Outcome verifier** — task completion (does the result satisfy the acceptance criteria?)
- **Provenance verifier** — trace completeness (can every output be traced to a compiled intent?)

**Why it matters:** Current `ada verify` scores are misleadingly high because invariant coverage uses token presence, not semantic enforcement. A multi-layer heterogeneous stack catches different failure classes. No single layer can catch everything; each layer covers the blindspots of the others.

**Research basis:** MAS-ProVe: Understanding Process Verification of Multi-Agent Systems (2602.03053), GNNVerifier: Graph-based Verifier for LLM Task Planning (2603.14730), Verified Multi-Agent Orchestration (2603.11445)

---

### Layer 5 — Safe Self-Improvement

**What it is:** An offline loop where agents propose skill improvements, which are benchmarked in isolation and promoted through a governance gate.

**Mechanism:**

- Session logs capture patterns in what worked and what failed
- Skill extraction identifies reusable patterns across sessions
- Improvement proposals go into a queue (`.ada/amendments/`)
- Benchmarked experiment branches test proposed improvements in isolation
- Promotion gates require governance approval before any skill or workflow is updated
- Immutable governance core: agents improve workflows and extracted skills — they never rewrite their own constitution (compiled intent, invariants, delegation policy)

**What this is NOT:** live self-rewriting, autonomous self-authorization, unrestricted recursive improvement.

**Why it matters:** Ada gets better at helping you build. But it does so through controlled iteration, not open-ended mutation. The research supports skill distillation; it does not support unconstrained self-improvement.

**Research basis:** SkillRL: Evolving Agents via Recursive Skill-Augmented Reinforcement Learning (2602.08234), AgentArk: Distilling Multi-Agent Intelligence (2602.03955)

---

## What Does Not Change

- The 8-stage compilation pipeline (CTX→INT→PER→ENT→PRO→SYN→VER→GOV)
- The three-tier context architecture (CLAUDE.md / agents / hooks)
- The postcode provenance model (git-backed, content-addressed)
- The "before building starts" position
- The governor gate (ACCEPT / ITERATE / REJECT)
- Ada as the step before Claude Code, not a replacement for it

These are validated by independent research and survive the architectural extension.

---

## What Does Not Work and Should Not Be Built

- General claim that recursive AI swarms can safely self-improve in the wild with minimal supervision — not yet supported
- Multi-agent process verification alone being sufficient for deep autonomy — research shows instability
- 3D semantic spatial graphs improving operator comprehension — no evidence yet; use 2D graph + replay + provenance first
- Swarms always better than fewer structured agents — research contradicts this

---

## The Correct Framing for Non-Technical Users

Building complex things with Ada should feel like building a calculator.

You describe what you want. Ada formalizes it, governs execution, routes work to bounded agents, and surfaces results. You operate at the level of intent and approval. The orchestration is invisible.

This is not a claim about unlimited autonomy. It is a claim about removing the cognitive load of managing AI execution complexity from the user — and placing it in a governed, inspectable, traceable system.

---

## Key Sources (Jan–Mar 2026)

| Paper                                              | arXiv      | What it validates                                                      |
| -------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Agent World Model: Infinity Synthetic Environments | 2602.10090 | World models as central layer for long-horizon agents                  |
| Reinforcement World Model Learning for LLM Agents  | 2602.05842 | Versioned action-conditioned state modeling                            |
| World Models as Intermediary                       | 2602.00785 | World model between agent and execution environment                    |
| SkillRL                                            | 2602.08234 | Skill distillation as safe self-improvement pattern                    |
| MAS-ProVe                                          | 2602.03053 | Multi-agent verification instability; need for ensemble approach       |
| Verified Multi-Agent Orchestration                 | 2603.11445 | Typed contracts and formal delegation                                  |
| GNNVerifier                                        | 2603.14730 | Graph-based structural verification for task planning                  |
| HiMAC                                              | 2603.00977 | Hierarchical macro-micro execution for long-horizon tasks              |
| DeepPlanning                                       | 2601.18137 | Benchmarking long-horizon agentic planning with verifiable constraints |
| LUMINA                                             | 2601.16649 | Long-horizon multi-turn agent understanding                            |
| Adaptive Coordination                              | 2602.08009 | Orchestration quality and communication patterns                       |
| AgentArk                                           | 2602.03955 | Multi-agent intelligence distillation into structured agents           |

---

## Key Invariants

- The world-state runtime tracks execution reality; the compiled world model tracks compiled intent. They are separate and must not be conflated.
- Delegation contracts are non-optional for any child agent. No unconstrained spawning.
- Self-improvement is always offline, benchmarked, and human-approved. Never live and self-authorizing.
- The governance core (compiled intent, invariants, delegation policy) is immutable. Agents improve around it, not through it.
- Ada's value is not generation — it is governance. Generation is commoditized; governance is the durable differentiator.
