import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { spawn as cpSpawn } from "child_process";
import { MotherCompiler } from "@ada/compiler";
import type {
  CompilerStageCode,
  PipelineState,
  IterationRecord,
  ClarificationRequest,
  ClarificationAnswer,
  PriorBlueprintContext,
} from "@ada/compiler";
import { writeConfigGraph } from "@ada/config-writer";
import { writeWorldModel } from "../world-model.js";
import { AdaStorage } from "@ada/storage";
import { createCompileRenderer, STAGE_ORDER } from "../ui/terminal.js";
import type { CompileRenderer } from "../ui/terminal.js";
import type { ArtifactEntry } from "../ui/artifact-list.js";
import { glyphs } from "../ui/design-system.js";
import {
  classifyDepth,
  createElicitationSessionManager,
} from "@ada/elicitation";

export interface InitOptions {
  readonly noExecute?: boolean;
  readonly amend?: boolean;
  /** When true, Ada is compiling itself — CTX scans Ada's own packages intentionally. */
  readonly selfCompile?: boolean;
  /**
   * Redirect compilation output to this directory instead of cwd.
   * Used by self-compile to avoid stomping the project's own CLAUDE.md,
   * settings.json, and hooks/ when Ada compiles herself.
   * Example: --out .ada/self/latest
   */
  readonly outDir?: string;
}

// ─── Stage summary derivation ─────────────────────────────────────────────────

function deriveSummary(stage: CompilerStageCode, ps: PipelineState): string {
  switch (stage) {
    case "CTX":
      return "codebase analyzed";
    case "INT": {
      const a = ps.intent;
      return a
        ? `${a.goals.length} goals, ${a.unknowns.length} unknowns`
        : "parsed";
    }
    case "PER": {
      const a = ps.persona;
      return a
        ? `domain: ${a.domain} / ${a.excludedConcerns.length} excl`
        : "profiled";
    }
    case "ENT": {
      const a = ps.entity;
      if (!a) return "extracted";
      const inv = a.entities.reduce((s, e) => s + e.invariants.length, 0);
      return `${a.entities.length} entities, ${inv} invariants`;
    }
    case "PRO": {
      const a = ps.process;
      if (!a) return "sequenced";
      const edge = a.workflows.reduce(
        (s, w) =>
          s + w.steps.reduce((ss, st) => ss + st.failureModes.length, 0),
        0,
      );
      return `${a.workflows.length} workflows, ${edge} edge cases`;
    }
    case "SYN": {
      const a = ps.synthesis;
      return a
        ? `${a.architecture.components.length} components, ${a.openQuestions.length} open`
        : "composed";
    }
    case "VER": {
      const a = ps.verify;
      return a
        ? `coverage:${a.coverageScore.toFixed(2)} coherence:${a.coherenceScore.toFixed(2)}`
        : "audited";
    }
    case "GOV": {
      const a = ps.governor;
      return a
        ? `${a.decision} confidence:${a.confidence.toFixed(2)}`
        : "decided";
    }
    case "BLD": {
      const a = ps.synthesis;
      return a?.build
        ? `${a.build.fileTree.filter((n) => n.type === "file").length} files, ${a.build.stack}`
        : "contracted";
    }
  }
}

const STAGE_ARTIFACTS: Record<CompilerStageCode, keyof PipelineState> = {
  CTX: "gates",
  INT: "intent",
  PER: "persona",
  ENT: "entity",
  PRO: "process",
  SYN: "synthesis",
  VER: "verify",
  GOV: "governor",
  BLD: "synthesis", // BLD attaches to synthesis (blueprint.build)
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Post-compile summary ─────────────────────────────────────────────────────
// Displays a plain-language summary of what was compiled. No user input.
// Runs after renderer.unmount(), before Q&A session.

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = indent;
  for (const word of words) {
    if (current === indent) {
      current += word;
    } else if (current.length + 1 + word.length > width) {
      lines.push(current);
      current = indent + word;
    } else {
      current += " " + word;
    }
  }
  if (current !== indent) lines.push(current);
  return lines.join("\n");
}

// ─── Plain-text renderer for non-TTY environments ────────────────────────────
// Used when stdin is not a TTY (CI, piped, subprocess). Ink requires raw mode
// which is unavailable in these environments.

function createPlainTextRenderer(): CompileRenderer {
  const total = STAGE_ORDER.length;
  const stageIndex = new Map<CompilerStageCode, number>(
    STAGE_ORDER.map((s, i) => [s, i + 1] as [CompilerStageCode, number]),
  );

  return {
    onStageStart(stage) {
      const n = stageIndex.get(stage) ?? "?";
      process.stdout.write(`[${n}/${total}] ${stage} ...\n`);
    },
    onStageToken(_stage, _token) {
      // suppress token stream in headless mode
    },
    onStageCrystallize(_stage, _entropy, _elapsed) {
      // no-op
    },
    onStageComplete(stage, summary, _entropy, _elapsed, _artifact) {
      const n = stageIndex.get(stage) ?? "?";
      process.stdout.write(`[${n}/${total}] ${stage} ✓  ${summary}\n`);
    },
    onGovernorDecision(decision, gates) {
      process.stdout.write(
        `GOV: ${decision.decision}  confidence: ${(decision.confidence * 100).toFixed(0)}%  gates: ${gates.passed}/${gates.total}\n`,
      );
    },
    onIteration(count) {
      process.stdout.write(`--- iteration ${count} ---\n`);
    },
    onArtifactsWritten(artifacts) {
      process.stdout.write(`\nartifacts written:\n`);
      for (const a of artifacts) {
        if (a.written) {
          process.stdout.write(
            `  ${a.path}${a.detail ? `  (${a.detail})` : ""}\n`,
          );
        }
      }
      process.stdout.write("\n");
    },
    unmount() {
      // no-op
    },
  };
}

async function runCompileSummary(
  result: import("@ada/compiler").CompileResult,
  rawIntent: string,
): Promise<void> {
  const { blueprint, pipelineState, governorDecision } = result;
  const ig = pipelineState.intent;
  const persona = pipelineState.persona;
  const entity = pipelineState.entity;
  const verify = pipelineState.verify;

  const cols = Math.min(process.stdout.columns ?? 80, 72);
  const bar = "─".repeat(cols - 2);
  const sep = glyphs.identity.core; // ◈ — Ada's structural mark

  console.log(`\n  ${bar}\n`);

  // ── What you described ────────────────────────────────────────────────────
  console.log(`  ${sep}  what you described\n`);
  const intentPreview =
    rawIntent.length > 280 ? rawIntent.slice(0, 280) + "…" : rawIntent;
  console.log(wrapText(intentPreview, cols, "    "));
  console.log("");

  // ── What I understood ────────────────────────────────────────────────────
  if (ig && ig.goals.length > 0) {
    console.log(`  ${sep}  what I understood\n`);
    for (const goal of ig.goals) {
      console.log(
        wrapText(
          `${glyphs.identity.filled}  ${goal.description}`,
          cols - 4,
          "    ",
        ),
      );
    }
    console.log("");
  }

  // ── What gets built ───────────────────────────────────────────────────────
  console.log(`  ${sep}  what gets built\n`);
  console.log(`    ${blueprint.architecture.pattern}\n`);
  for (const comp of blueprint.architecture.components) {
    console.log(
      wrapText(
        `${glyphs.pipeline.separator}  ${comp.name}  —  ${comp.responsibility}`,
        cols - 4,
        "    ",
      ),
    );
  }
  console.log("");

  // ── What I excluded ───────────────────────────────────────────────────────
  const excluded = persona?.excludedConcerns ?? [];
  const deferredUnknowns =
    ig?.unknowns.filter((u) => u.impact !== "blocking") ?? [];
  if (excluded.length > 0 || deferredUnknowns.length > 0) {
    console.log(`  ${sep}  what I excluded\n`);
    for (const concern of excluded) {
      console.log(
        wrapText(`${glyphs.identity.open}  ${concern}`, cols - 4, "    "),
      );
    }
    for (const u of deferredUnknowns.slice(0, 3)) {
      console.log(
        wrapText(`${glyphs.identity.open}  ${u.description}`, cols - 4, "    "),
      );
    }
    console.log("");
  }

  // ── Rules enforced on every tool call ────────────────────────────────────
  if (entity && entity.entities.length > 0) {
    const totalRules = entity.entities.reduce(
      (s, e) => s + e.invariants.length,
      0,
    );
    if (totalRules > 0) {
      console.log(`  ${sep}  rules enforced on every tool call\n`);
      let shown = 0;
      outer: for (const ent of entity.entities) {
        for (const inv of ent.invariants) {
          if (shown >= 6) break outer;
          console.log(
            wrapText(
              `${glyphs.pipeline.separator}  ${ent.name}: ${inv.description}`,
              cols - 4,
              "    ",
            ),
          );
          shown++;
        }
      }
      if (totalRules > shown) {
        console.log(`\n    … and ${totalRules - shown} more`);
      }
      console.log("");
    }
  }

  // ── Verification findings — ALL drifts + ALL gaps ────────────────────────
  const allDrifts = verify?.drifts ?? [];
  const gaps = verify?.gaps ?? [];
  if (allDrifts.length > 0 || gaps.length > 0) {
    console.log(`  ${sep}  gaps found during verification\n`);
    for (const drift of allDrifts) {
      console.log(
        wrapText(
          `${glyphs.identity.open}  [${drift.severity}] ${drift.location} — expected "${drift.original}", got "${drift.actual}"`,
          cols - 4,
          "    ",
        ),
      );
    }
    for (const gap of gaps) {
      console.log(
        wrapText(`${glyphs.identity.open}  ${gap}`, cols - 4, "    "),
      );
    }
    console.log("");
  }

  // ── Governor violations — all ──────────────────────────────────────────────
  const violations = governorDecision.violations ?? [];
  if (violations.length > 0) {
    console.log(`  ${sep}  policy violations noted\n`);
    for (const v of violations) {
      console.log(
        wrapText(
          `${glyphs.identity.open}  [${v.severity}] ${v.ruleViolated} — ${v.description}`,
          cols - 4,
          "    ",
        ),
      );
    }
    console.log("");
  }

  // ── Open questions ─────────────────────────────────────────────────────────
  const openQuestions = blueprint.openQuestions ?? [];
  if (openQuestions.length > 0) {
    console.log(`  ${sep}  open questions\n`);
    for (const q of openQuestions) {
      console.log(wrapText(`${glyphs.identity.open}  ${q}`, cols - 4, "    "));
    }
    console.log("");
  }

  // ── Conflicts resolved ─────────────────────────────────────────────────────
  const resolvedConflicts = blueprint.resolvedConflicts ?? [];
  if (resolvedConflicts.length > 0) {
    console.log(`  ${sep}  conflicts resolved\n`);
    for (const c of resolvedConflicts) {
      console.log(
        wrapText(
          `${glyphs.identity.filled}  ${c.entity} ↔ ${c.process} — ${c.resolution}`,
          cols - 4,
          "    ",
        ),
      );
    }
    console.log("");
  }

  // ── Stats footer ──────────────────────────────────────────────────────────
  const compCount = blueprint.architecture.components.length;
  const entityCount = entity?.entities.length ?? 0;
  const ruleCount =
    entity?.entities.reduce((s, e) => s + e.invariants.length, 0) ?? 0;
  const conf = (governorDecision.confidence * 100).toFixed(0);

  console.log(`  ${bar}`);
  console.log(
    `  confidence ${conf}%  ${glyphs.pipeline.separator}  ${compCount} components  ${glyphs.pipeline.separator}  ${entityCount} entities  ${glyphs.pipeline.separator}  ${ruleCount} rules`,
  );
  console.log(`  ${bar}\n`);
}

// ─── Git hook: close the feedback loop ────────────────────────────────────────
// After ACCEPT, write .git/hooks/post-commit so every commit triggers ada verify.
// If a hook already exists, append only if our marker isn't already present.

function writeGitHook(projectDir: string): void {
  const gitDir = path.join(projectDir, ".git");
  if (!fs.existsSync(gitDir)) return; // not a git repo — skip silently

  const hooksDir = path.join(gitDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });

  const hookPath = path.join(hooksDir, "post-commit");
  const marker = "# ada-verify";
  const hookBlock = `\n${marker}\nada verify\n`;

  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (existing.includes(marker)) return; // already installed
    fs.appendFileSync(hookPath, hookBlock, "utf8");
  } else {
    fs.writeFileSync(hookPath, `#!/bin/sh${hookBlock}`, "utf8");
  }

  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    /* chmod may fail on some systems — hook still runs if shell executes it */
  }
}

// ─── Elicitation pre-phase ────────────────────────────────────────────────────
// Runs before compilation. Classifier determines 0–5 questions to ask.
// Returns enriched intent string (original + Q&A context appended).
// If 0 questions: returns rawIntent unchanged.

async function runElicitationPrePhase(rawIntent: string): Promise<string> {
  // Skip elicitation in non-interactive environments (piped stdin, CI, etc.)
  if (!process.stdin.isTTY) return rawIntent;

  const plan = classifyDepth(rawIntent);

  if (plan.terminationReason === "ready") {
    return rawIntent; // nothing to ask
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt: string, fallback = ""): Promise<string> =>
    new Promise((resolve) => {
      rl.once("close", () => resolve(fallback));
      rl.question(prompt, (ans) => resolve(ans.trim()));
    });

  const n = plan.questionCount;
  console.log(
    `\n  ${glyphs.identity.open} ${n} quick question${n > 1 ? "s" : ""} before I compile.\n`,
  );

  const manager = createElicitationSessionManager();
  const startResult = await manager.startSession(rawIntent);

  // Fast path in session: classifier already ran, 0-question path
  if (startResult.handoff || !startResult.turn) {
    rl.close();
    return rawIntent;
  }

  const context: { label: string; value: string }[] = [];
  let sessionId = startResult.session.sessionId;
  let currentTurnId = startResult.turn.turnId;
  let clarificationRequest = startResult.clarificationRequest;
  let proposal = startResult.proposal;

  while (clarificationRequest || proposal) {
    if (proposal) {
      // Ada proposes — user confirms, edits, or rejects
      console.log(`  ${glyphs.chevron} ${proposal.rationale}`);
      console.log(`\n     proposal: ${proposal.proposedText}`);
      const answer = await ask(
        `\n  > (enter to accept, type to edit, 'no' to reject) `,
        "",
      );
      console.log("");

      let disposition: "accepted" | "modified" | "rejected";
      let modifiedText: string | undefined;

      if (
        !answer ||
        answer.toLowerCase() === "yes" ||
        answer.toLowerCase() === "y"
      ) {
        disposition = "accepted";
      } else if (
        answer.toLowerCase() === "no" ||
        answer.toLowerCase() === "n"
      ) {
        disposition = "rejected";
      } else {
        disposition = "modified";
        modifiedText = answer;
      }

      const appliedText =
        disposition === "modified"
          ? modifiedText!
          : disposition === "accepted"
            ? proposal.proposedText
            : null;

      if (appliedText) {
        context.push({ label: proposal.targetField, value: appliedText });
      }

      const result = await manager.submitProposalDisposition(
        sessionId,
        proposal.proposalId,
        disposition,
        modifiedText,
      );

      if (result.handoff || !result.nextTurn) break;

      currentTurnId = result.nextTurn.turnId;
      clarificationRequest = result.clarificationRequest ?? null;
      proposal = result.proposal ?? null;
    } else if (clarificationRequest) {
      // Fallback: direct question (only when proposal generation fails)
      console.log(`  ${glyphs.chevron} ${clarificationRequest.question}`);
      if (clarificationRequest.suggestedDefault) {
        console.log(`     Default: ${clarificationRequest.suggestedDefault}`);
      }

      const answer = await ask(`\n  > `);
      console.log("");

      const finalAnswer = answer || clarificationRequest.suggestedDefault || "";
      if (!finalAnswer) break;

      context.push({
        label: clarificationRequest.question,
        value: finalAnswer,
      });

      const result = await manager.submitAnswer(
        sessionId,
        currentTurnId,
        finalAnswer,
      );

      if (result.handoff || !result.nextTurn) break;

      currentTurnId = result.nextTurn.turnId;
      clarificationRequest = result.clarificationRequest ?? null;
      proposal = result.proposal ?? null;
    }
  }

  rl.close();

  if (context.length === 0) return rawIntent;

  // Build enriched intent — appended context for INT stage extraction
  const lines = [rawIntent, ""];
  for (const { label, value } of context) {
    lines.push(`Additional context — ${label}`);
    lines.push(value);
    lines.push("");
  }
  return lines.join("\n").trim();
}

// ─── Init command ─────────────────────────────────────────────────────────────

function loadPriorBlueprint(cwd: string): PriorBlueprintContext | undefined {
  const statePath = path.join(cwd, ".ada", "state.json");
  if (!fs.existsSync(statePath)) return undefined;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<
      string,
      unknown
    >;
    const bp = state["blueprint"] as Record<string, unknown> | undefined;
    const ps = state["pipelineState"] as Record<string, unknown> | undefined;
    if (!bp || !ps) return undefined;

    const arch = bp["architecture"] as Record<string, unknown> | undefined;
    const ig = ps["intent"] as Record<string, unknown> | undefined;
    const persona = ps["persona"] as Record<string, unknown> | undefined;

    return {
      summary: typeof bp["summary"] === "string" ? bp["summary"] : "",
      architecturePattern:
        typeof arch?.["pattern"] === "string" ? arch["pattern"] : "",
      components: Array.isArray(arch?.["components"])
        ? (arch["components"] as Array<Record<string, unknown>>).map((c) => ({
            name: String(c["name"] ?? ""),
            responsibility: String(c["responsibility"] ?? ""),
            boundedContext: String(c["boundedContext"] ?? ""),
          }))
        : [],
      goals: Array.isArray(ig?.["goals"])
        ? (ig["goals"] as Array<Record<string, unknown>>).map((g) => ({
            id: String(g["id"] ?? ""),
            description: String(g["description"] ?? ""),
          }))
        : [],
      constraints: Array.isArray(ig?.["constraints"])
        ? (ig["constraints"] as Array<Record<string, unknown>>).map((c) => ({
            id: String(c["id"] ?? ""),
            description: String(c["description"] ?? ""),
          }))
        : [],
      excludedConcerns: Array.isArray(persona?.["excludedConcerns"])
        ? (persona["excludedConcerns"] as unknown[]).map(String)
        : [],
    };
  } catch {
    return undefined;
  }
}

export async function initCommand(
  intent: string,
  options: InitOptions = {},
): Promise<void> {
  const runId = `ML-${Math.floor(Date.now() / 1000)}`;
  const compiler = new MotherCompiler();
  const maxIterations = parseInt(process.env["ADA_MAX_ITERATIONS"] ?? "3", 10);

  // ─── Amend mode: load prior blueprint as frozen context ──────────────────
  const priorBlueprint = options.amend
    ? loadPriorBlueprint(process.cwd())
    : undefined;
  if (options.amend && !priorBlueprint) {
    console.error(
      "  --amend: no compiled blueprint found — run 'ada compile' first",
    );
    process.exit(1);
  }
  if (priorBlueprint) {
    console.error(
      `\n  amending blueprint  ${glyphs.pipeline.separator}  ${priorBlueprint.components.length} existing components\n`,
    );
  }

  // ─── Amend mode: inject approved amendments into intent ──────────────────
  let enrichableIntent = intent;
  if (options.amend) {
    const amendDir = path.join(process.cwd(), ".ada", "amendments");
    try {
      const approvedAmendments = fs
        .readdirSync(amendDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => {
          try {
            return JSON.parse(
              fs.readFileSync(path.join(amendDir, f), "utf8"),
            ) as {
              stage: string;
              field: string;
              proposed: string;
              rationale: string;
              status: string;
            };
          } catch {
            return null;
          }
        })
        .filter(
          (a): a is NonNullable<typeof a> =>
            a !== null && a.status === "approved",
        );

      if (approvedAmendments.length > 0) {
        const amendmentText = approvedAmendments
          .map(
            (a) =>
              `[${a.stage}.${a.field}] ${a.proposed}\nRationale: ${a.rationale}`,
          )
          .join("\n\n");
        enrichableIntent =
          `${intent}\n\nApproved amendments to incorporate:\n\n${amendmentText}`.trim();
        console.error(
          `  incorporating ${approvedAmendments.length} approved amendment(s)\n`,
        );
      }
    } catch {
      // no amendments dir — fine
    }

    // ─── Amend mode: inject feedback records (.ada/feedback/) ──────────────
    const feedbackDir = path.join(process.cwd(), ".ada", "feedback");
    try {
      const feedbackRecords = fs
        .readdirSync(feedbackDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => {
          try {
            return JSON.parse(
              fs.readFileSync(path.join(feedbackDir, f), "utf8"),
            ) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Record<string, unknown>[];

      if (feedbackRecords.length > 0) {
        const feedbackText = feedbackRecords
          .map((r) => {
            if (r["type"] === "implementation_decision") {
              return `[decision:${r["componentName"]}] ${r["decision"]}\nRationale: ${r["rationale"]}`;
            }
            if (r["type"] === "gap") {
              return `[gap] ${r["description"]}`;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n\n");

        if (feedbackText) {
          enrichableIntent =
            `${enrichableIntent}\n\nImplementation feedback to incorporate:\n\n${feedbackText}`.trim();
          console.error(
            `  incorporating ${feedbackRecords.length} feedback record(s)\n`,
          );
        }
      }
    } catch {
      // no feedback dir — fine
    }
  }

  // ─── Elicitation pre-phase ───────────────────────────────────────────────
  // Ask 0–5 axiom-aligned questions before compiling. Classifier decides.
  // Returns enriched intent if questions were asked, otherwise original.
  // IMPORTANT: renderer is created AFTER elicitation completes so that
  // readline and Ink never compete for the terminal at the same time.
  const enrichedIntent = await runElicitationPrePhase(enrichableIntent);

  // Choose renderer based on TTY availability
  // Non-TTY (CI, piped, subprocess): plain-text progress to stdout
  // TTY (interactive terminal): Ink UI with animations
  let renderer: CompileRenderer;
  if (process.stdin.isTTY) {
    process.stdout.write("\x1B[2J\x1B[H");
    renderer = createCompileRenderer(runId);
  } else {
    renderer = createPlainTextRenderer();
  }
  let currentIntent = enrichedIntent;
  let iterationCount = 0;
  let finalResult: import("@ada/compiler").CompileResult | null = null;
  const iterationHistory: IterationRecord[] = [];

  // ─── Clarification callback ───
  const handleClarification = async (
    requests: readonly ClarificationRequest[],
  ): Promise<readonly ClarificationAnswer[]> => {
    // Skip in non-interactive environments — use suggested defaults
    if (!process.stdin.isTTY) {
      return requests
        .filter((r) => r.suggestedDefault)
        .map((r) => ({ unknownId: r.unknownId, answer: r.suggestedDefault! }));
    }
    renderer.unmount();
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answers: ClarificationAnswer[] = [];

    console.log(
      `\n  ${glyphs.chevron} ${requests.length} blocking unknown(s) need clarification:\n`,
    );
    for (const req of requests) {
      const answer = await new Promise<string>((resolve) => {
        // Resolve with default if stdin closes before user answers (non-interactive)
        rl.once("close", () => resolve(req.suggestedDefault ?? ""));
        rl.question(`  ${glyphs.identity.open} ${req.question}\n  > `, (ans) =>
          resolve(ans.trim()),
        );
      });
      if (answer) {
        answers.push({ unknownId: req.unknownId, answer });
      }
    }
    try {
      rl.close();
    } catch {
      /* already closed */
    }
    console.log("");
    return answers;
  };

  while (iterationCount < maxIterations) {
    iterationCount++;
    if (iterationCount > 1) {
      renderer.onIteration(iterationCount);
    }

    // Track per-stage times and entropies during live streaming
    const stageTimes = new Map<CompilerStageCode, number>();
    const stageEntropies = new Map<CompilerStageCode, number>();
    let stageStart = Date.now();

    const result = await compiler.compile(currentIntent, {
      priorBlueprint,
      selfCompile: options.selfCompile,
      onClarificationNeeded:
        iterationCount === 1 ? handleClarification : undefined,
      onStageStart(stage) {
        stageStart = Date.now();
        renderer.onStageStart(stage);
      },
      onStageToken(event) {
        renderer.onStageToken(event.stage, event.token);
      },
      onStageComplete(event) {
        // Record time and entropy — don't call renderer yet
        // Crystallization + artifacts will play post-compile
        const elapsed = Date.now() - stageStart;
        stageTimes.set(event.stage, elapsed);
        stageEntropies.set(event.stage, event.entropyEstimate);
      },
    });

    // ── Post-compile: animated crystallize → artifact cascade ──────────────
    // Each stage crystallizes (350ms) then reveals its artifact (brief pause)
    const ps = result.pipelineState;

    for (const stage of STAGE_ORDER) {
      const entropy = stageEntropies.get(stage) ?? 0.5;
      const elapsed = stageTimes.get(stage) ?? 0;

      // Phase 2: crystallizing
      renderer.onStageCrystallize(stage, entropy, elapsed);
      await sleep(350);

      // Phase 3: artifact
      const summary = deriveSummary(stage, ps);
      const artifact = ps[STAGE_ARTIFACTS[stage]];
      renderer.onStageComplete(stage, summary, entropy, elapsed, artifact);
      await sleep(80);
    }

    // ── Governor decision ──────────────────────────────────────────────────
    const decision = result.governorDecision;
    const gateValues = Object.values(ps.gates);
    const passedCount = gateValues.filter((g) => g.passed).length;
    renderer.onGovernorDecision(decision, {
      passed: passedCount,
      total: gateValues.length,
    });

    // Track iteration for fallback
    iterationHistory.push({
      iterationNumber: iterationCount,
      governorDecision: decision,
      coverageScore: decision.coverageScore,
      coherenceScore: decision.coherenceScore,
      gatePassRate: decision.gatePassRate,
      blueprint: result.blueprint,
    });

    if (decision.decision === "ACCEPT") {
      finalResult = result;
      break;
    }
    if (decision.decision === "REJECT") {
      finalResult = result;
      break;
    }

    // ITERATE — augment intent with correction
    if (decision.nextAction) {
      const action =
        typeof decision.nextAction === "string"
          ? decision.nextAction.slice(0, 500)
          : JSON.stringify(decision.nextAction).slice(0, 500);
      currentIntent = `${intent}\n\nCORRECTION: ${action}`;
    }
    finalResult = result;
  }

  if (!finalResult) {
    renderer.unmount();
    console.error("  no result produced");
    process.exit(1);
    return;
  }

  const decision = finalResult.governorDecision;

  // ─── Fallback path: max iterations exceeded without ACCEPT ───
  if (decision.decision !== "ACCEPT" && iterationHistory.length > 0) {
    // Find best iteration by composite score
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < iterationHistory.length; i++) {
      const rec = iterationHistory[i]!;
      const score =
        (rec.coverageScore + rec.coherenceScore + rec.gatePassRate) / 3;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const bestIteration = iterationHistory[bestIdx]!;
    const uncertaintyMarkers = (
      bestIteration.governorDecision.violations ?? []
    ).map((v) => ({
      stageCode: v.stageCode,
      description: v.description,
      confidence: bestScore,
    }));

    // Add a general marker if no violations available
    if (uncertaintyMarkers.length === 0) {
      uncertaintyMarkers.push({
        stageCode: "GOV" as const,
        description: `Max iterations (${maxIterations}) exceeded. Best composite score: ${bestScore.toFixed(2)}`,
        confidence: bestScore,
      });
    }

    const fallback = {
      partialBlueprint: bestIteration.blueprint,
      uncertaintyMarkers,
      iterationHistory,
      bestIterationIndex: bestIdx,
    };

    const warnings = [
      `Compilation did not reach ACCEPT after ${iterationHistory.length} iteration(s).`,
      `Best iteration: #${bestIdx + 1} (score: ${bestScore.toFixed(2)})`,
      ...uncertaintyMarkers.map((m) => `[${m.stageCode}] ${m.description}`),
    ];

    const fallbackOptions: import("@ada/config-writer").WriteConfigOptions = {
      partial: true,
      warnings,
      ...(finalResult.pipelineState.persona
        ? { domainContext: finalResult.pipelineState.persona }
        : {}),
    };
    const configGraph = writeConfigGraph(
      bestIteration.blueprint,
      bestIteration.governorDecision,
      process.cwd(),
      fallbackOptions,
    );

    const artifactEntries: ArtifactEntry[] = [
      { path: "CLAUDE.md", written: true, detail: "partial" },
      {
        path: ".claude/agents/",
        written: configGraph.agents.length > 0,
        detail: `${configGraph.agents.length} agents`,
      },
      {
        path: "hooks/pre-tool/",
        written: configGraph.hooks.length > 0,
        detail: `${configGraph.hooks.length} scripts`,
      },
      {
        path: ".claude/skills/",
        written: configGraph.skills.length > 0,
        detail:
          configGraph.skills.length > 0
            ? `${configGraph.skills.length} files`
            : undefined,
      },
      { path: ".claude/settings.json", written: true },
    ];
    renderer.onArtifactsWritten(artifactEntries);

    // Persist state with fallback
    const targetDir = options?.outDir
      ? path.resolve(options.outDir)
      : process.cwd();
    if (options?.outDir) fs.mkdirSync(targetDir, { recursive: true });
    const stateDir = path.join(targetDir, ".ada");
    fs.mkdirSync(stateDir, { recursive: true });
    const checkpoint = {
      blueprint: bestIteration.blueprint,
      governorDecision: bestIteration.governorDecision,
      pipelineState: finalResult.pipelineState,
      compilationRun: finalResult.compilationRun,
      fallback,
      runId,
      timestamp: Date.now(),
    };
    fs.writeFileSync(
      path.join(stateDir, "state.json"),
      JSON.stringify(checkpoint, null, 2),
      "utf8",
    );

    await sleep(2000);
    renderer.unmount();
    console.log(
      `\n  ${glyphs.chevron} partial blueprint written (fallback). Review CLAUDE.md warnings.\n`,
    );
    return;
  }

  if (decision.decision !== "ACCEPT") {
    await sleep(3000);
    renderer.unmount();
    process.exit(1);
    return;
  }

  const targetDir = options?.outDir
    ? path.resolve(options.outDir)
    : process.cwd();
  if (options?.outDir) fs.mkdirSync(targetDir, { recursive: true });
  const acceptOptions: import("@ada/config-writer").WriteConfigOptions =
    finalResult.pipelineState.persona
      ? { domainContext: finalResult.pipelineState.persona }
      : {};
  const configGraph = writeConfigGraph(
    finalResult.blueprint,
    decision,
    targetDir,
    acceptOptions,
  );

  writeWorldModel(finalResult, runId, targetDir);
  writeGitHook(targetDir);

  // Register run in global project history
  try {
    const storage = new AdaStorage();
    storage.recordRun({
      runId,
      projectPath: targetDir,
      compiledAt: finalResult.compilationRun.completedAt,
      decision: decision.decision,
      blueprintPostcode: finalResult.blueprint.postcode.raw,
      governorPostcode: decision.postcode.raw,
      intent: intent,
      durationMs: finalResult.compilationRun.totalDurationMs,
    });
  } catch {
    /* never crash the init flow for storage errors */
  }

  const artifactEntries: ArtifactEntry[] = [
    { path: "CLAUDE.md", written: true },
    {
      path: ".claude/agents/",
      written: configGraph.agents.length > 0,
      detail: `${configGraph.agents.length} agents`,
    },
    {
      path: "hooks/pre-tool/",
      written: configGraph.hooks.length > 0,
      detail: `${configGraph.hooks.length} scripts`,
    },
    {
      path: ".claude/skills/",
      written: configGraph.skills.length > 0,
      detail:
        configGraph.skills.length > 0
          ? `${configGraph.skills.length} files`
          : undefined,
    },
    { path: ".claude/settings.json", written: true },
    {
      path: ".git/hooks/post-commit",
      written: fs.existsSync(path.join(targetDir, ".git")),
      detail: "ada verify on commit",
    },
  ];
  renderer.onArtifactsWritten(artifactEntries);

  // ── Persist state checkpoint ────────────────────────────────────────────────
  const stateDir = path.join(targetDir, ".ada");
  fs.mkdirSync(stateDir, { recursive: true });
  const checkpoint = {
    blueprint: finalResult.blueprint,
    governorDecision: decision,
    pipelineState: finalResult.pipelineState,
    compilationRun: finalResult.compilationRun,
    runId,
    timestamp: Date.now(),
  };
  fs.writeFileSync(
    path.join(stateDir, "state.json"),
    JSON.stringify(checkpoint, null, 2),
    "utf8",
  );

  await sleep(2000);
  renderer.unmount();

  // ── Readable post-compile summary ──────────────────────────────────────────
  await runCompileSummary(finalResult, intent);

  // ── Auto-spawn Claude Code ─────────────────────────────────────────────────
  if (options.noExecute) {
    console.log(
      `\n  ${glyphs.chevron} config written. --no-execute: skipping Claude spawn.\n`,
    );
    return;
  }

  const initialPrompt =
    "Read CLAUDE.md fully. Read all agent files in .claude/agents/. Call ada.advance_execution(agentId) to get your first task brief. Follow the build order. Begin building now.";

  // Resolve the full path to claude at spawn time so the new terminal
  // window finds it regardless of its default PATH.
  let claudePath = "claude";
  try {
    const { execSync } = await import("child_process");
    claudePath = execSync(
      process.platform === "win32" ? "where claude" : "which claude",
      {
        encoding: "utf8",
      },
    ).trim();
  } catch {
    // not found on PATH — fallback, will error in the new terminal
  }

  // Write a launch script. Explicitly unset ANTHROPIC_API_KEY so Claude Code
  // uses its own OAuth credentials, not Ada's API key from this shell.
  const { default: os } = await import("os");
  const scriptLines = [
    "#!/bin/bash",
    `cd '${targetDir.replace(/'/g, "'\\''")}'`,
    `export ADA_PROJECT_DIR='${targetDir.replace(/'/g, "'\\''")}'`,
    `unset ANTHROPIC_API_KEY`,
    `exec '${claudePath.replace(/'/g, "'\\''")}' --permission-mode auto '${initialPrompt.replace(/'/g, "'\\''")}'`,
    "",
  ];
  const scriptPath = path.join(os.tmpdir(), `ada-spawn-${Date.now()}.sh`);
  fs.writeFileSync(scriptPath, scriptLines.join("\n"), { mode: 0o755 });

  console.log(`\n  ${glyphs.chevron} spawning claude in new terminal...\n`);

  if (process.platform === "darwin") {
    cpSpawn(
      "osascript",
      [
        "-e",
        `tell application "Terminal" to do script "bash '${scriptPath}'"`,
        "-e",
        `tell application "Terminal" to activate`,
      ],
      { detached: true, stdio: "ignore" },
    ).unref();
    return;
  }

  if (process.platform === "win32") {
    const batPath = scriptPath.replace(/\.sh$/, ".bat");
    fs.writeFileSync(
      batPath,
      [
        `@echo off`,
        `cd /d "${targetDir}"`,
        `set ADA_PROJECT_DIR=${targetDir}`,
        `set ANTHROPIC_API_KEY=`,
        `"${claudePath}" --permission-mode auto "${initialPrompt}"`,
      ].join("\r\n"),
    );
    cpSpawn("cmd", ["/c", "start", "cmd", "/k", batPath], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  // Linux — try common terminal emulators
  for (const [bin, args] of [
    ["gnome-terminal", ["--", "bash", scriptPath]],
    ["konsole", ["-e", "bash", scriptPath]],
    ["xterm", ["-e", `bash '${scriptPath}'`]],
    ["x-terminal-emulator", ["-e", `bash '${scriptPath}'`]],
  ] as [string, string[]][]) {
    try {
      cpSpawn(bin, args, { detached: true, stdio: "ignore" }).unref();
      return;
    } catch {
      // try next
    }
  }

  // No terminal emulator — fall back to same-window handoff
  const { ANTHROPIC_API_KEY: _, ...envWithoutKey } = process.env;
  cpSpawn(claudePath, ["--permission-mode", "auto", initialPrompt], {
    cwd: targetDir,
    stdio: "inherit",
    env: { ...envWithoutKey, ADA_PROJECT_DIR: targetDir },
  }).on("exit", (code) => process.exit(code ?? 0));
}
