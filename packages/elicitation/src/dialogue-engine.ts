import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { ElicitationStore } from "./store.js";
import type { GapAnalyzer } from "./gap-analyzer.js";
import type {
  DraftIntentGraph,
  Gap,
  ElicitationTurn,
  ClarificationRequestRecord,
  ClarificationAnswerRecord,
  AdaProposal,
  ProposalDispositionType,
  DraftTargetField,
  LLMProposalOutput,
  LLMRequestOutput,
} from "./types.js";

const FIELD_LABELS: Record<DraftTargetField, string> = {
  goals: "goals (what the system should accomplish)",
  constraints: "constraints (what the system must/must not do)",
  unknowns: "open unknowns (things that need to be decided)",
  challenges: "challenges (risks or obstacles)",
};

const IMPACT_FOR_SEVERITY: Record<
  string,
  "blocking" | "scoping" | "implementation"
> = {
  blocking: "blocking",
  high: "scoping",
  low: "implementation",
};

// ─── LLM calling helpers ───

function extractJSON(text: string): string | null {
  const fenced = text.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) {
    const c = fenced[1].trim();
    if (c.startsWith("{")) return c;
  }
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e > s) return text.slice(s, e + 1);
  return null;
}

async function callAPIText(prompt: string): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) return "";
  const client = new Anthropic({ apiKey });
  let text = "";
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  stream.on("text", (t) => {
    text += t;
  });
  await stream.finalMessage();
  return text;
}

function callCLIText(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ada-eli-"));
    const promptFile = path.join(tmpDir, "prompt.txt");
    fs.writeFileSync(promptFile, prompt, "utf8");

    const input = fs.createReadStream(promptFile);
    const proc = spawn(
      "claude",
      [
        "--print",
        "--output-format",
        "stream-json",
        "--model",
        "claude-sonnet-4-6",
        "--dangerously-skip-permissions",
        "--no-session-persistence",
      ],
      { cwd: tmpDir, stdio: ["pipe", "pipe", "pipe"] },
    );

    let accumulated = "";
    let lineBuffer = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed) as Record<string, unknown>;
          const inner = (event["event"] ?? event) as Record<string, unknown>;
          if (inner["type"] === "content_block_delta") {
            const delta = inner["delta"] as Record<string, unknown> | undefined;
            if (delta?.["type"] === "text_delta") {
              accumulated += String(delta["text"] ?? "");
            }
          }
        } catch {
          accumulated += trimmed + "\n";
        }
      }
    });

    proc.on("close", () => {
      try {
        fs.unlinkSync(promptFile);
        fs.rmdirSync(tmpDir);
      } catch {
        /* cleanup */
      }
      resolve(accumulated);
    });

    proc.on("error", () => {
      try {
        fs.unlinkSync(promptFile);
        fs.rmdirSync(tmpDir);
      } catch {
        /* cleanup */
      }
      resolve(accumulated || "");
    });

    input.pipe(proc.stdin);

    setTimeout(() => {
      proc.kill();
      resolve(accumulated || "");
    }, 60_000);
  });
}

async function callLLM(prompt: string): Promise<string> {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return callAPIText(prompt);
  }
  return callCLIText(prompt);
}

// ─── DialogueEngine ───

export class DialogueEngine {
  constructor(
    private readonly store: ElicitationStore,
    private readonly gapAnalyzer: GapAnalyzer,
  ) {}

  // ─── openTurn ───
  openTurn(sessionId: string, gap: Gap): ElicitationTurn {
    // Idempotency: don't open a second turn for the same gap
    const existing = this.store.getOpenTurnForGap(gap.gapId);
    if (existing) return existing;

    const turnIndex = this.store.nextTurnIndex(sessionId);
    const turn: ElicitationTurn = {
      turnId: randomUUID(),
      sessionId,
      gapId: gap.gapId,
      turnIndex,
      status: "opened",
      clarificationRequestId: null,
      proposalId: null,
      clarificationAnswerId: null,
      openedAt: Date.now(),
      closedAt: null,
    };
    this.store.turns.set(turn.turnId, turn);

    // Mark gap as active
    gap.status = "active";

    return turn;
  }

  // ─── generateClarificationRequest ───
  // Uses LLM to generate a targeted question about the gap.
  async generateClarificationRequest(
    gap: Gap,
    draft: DraftIntentGraph,
  ): Promise<ClarificationRequestRecord> {
    const fieldLabel = FIELD_LABELS[gap.targetField];
    const impact = IMPACT_FOR_SEVERITY[gap.severity] ?? "scoping";

    let conflictContext = "";
    if (gap.gapKind === "contradictory" && gap.conflictingFieldA) {
      conflictContext = `\nConflicting values:\n- Goal: "${gap.conflictingFieldA}"\n- Constraint: "${gap.conflictingFieldB ?? ""}"\n`;
    }

    const prompt = `You are Ada, a semantic intent elicitation assistant. A user has described their project intent and you have identified a gap.

Raw intent: "${draft.rawIntent}"
Gap field: ${fieldLabel}
Gap kind: ${gap.gapKind}
Gap severity: ${gap.severity}${conflictContext}
Existing goals: ${draft.goals.map((g) => g.description).join("; ") || "none"}
Existing constraints: ${draft.constraints.map((c) => c.description).join("; ") || "none"}

Generate a clear, specific question to ask the user to resolve this gap. The question should:
- Be direct and understandable to a non-technical user
- Explain why this information matters
- Reference their raw intent when helpful
- NOT ask about technical implementation choices (libraries, frameworks, etc.)
${gap.gapKind === "contradictory" ? "- Ask the user to resolve the contradiction between the two conflicting values above" : ""}
${gap.gapKind === "missing" ? "- Offer a concrete example or suggestion if helpful" : ""}

Respond ONLY with a JSON object:
{
  "question": "...",
  "impact": "blocking" | "scoping" | "implementation",
  "suggestedDefault": "..." | null
}`;

    let parsed: LLMRequestOutput | null = null;

    try {
      const raw = await callLLM(prompt);
      const jsonStr = extractJSON(raw);
      if (jsonStr) {
        const obj = JSON.parse(jsonStr) as Record<string, unknown>;
        const q = String(obj["question"] ?? "").trim();
        const imp = String(obj["impact"] ?? impact);
        const sd =
          obj["suggestedDefault"] != null
            ? String(obj["suggestedDefault"])
            : null;

        if (q.length > 5) {
          parsed = {
            question: q,
            impact: (["blocking", "scoping", "implementation"].includes(imp)
              ? imp
              : impact) as "blocking" | "scoping" | "implementation",
            suggestedDefault: sd,
          };
        }
      }
    } catch {
      /* fall through to default */
    }

    if (!parsed) {
      parsed = this._defaultRequest(gap, draft, impact);
    }

    const record: ClarificationRequestRecord = {
      clarificationRequestId: randomUUID(),
      unknownId: gap.gapId,
      gapId: gap.gapId,
      question: parsed.question,
      impact: parsed.impact,
      suggestedDefault: parsed.suggestedDefault,
      createdAt: Date.now(),
    };

    this.store.clarificationRequests.set(record.clarificationRequestId, record);
    return record;
  }

  // ─── generateAdaProposal ───
  // Uses LLM to propose a concrete value for an ambiguous gap field.
  // Caller must have already called openTurn for this gap so a turn record exists.
  async generateAdaProposal(
    gap: Gap,
    draft: DraftIntentGraph,
  ): Promise<AdaProposal | null> {
    const fieldLabel = FIELD_LABELS[gap.targetField];

    const prompt = `You are Ada, a semantic intent elicitation assistant. Based on the user's raw intent, propose a specific, concrete value for a ${gap.targetField} field.

Raw intent: "${draft.rawIntent}"
Field to fill: ${fieldLabel}
Existing goals: ${draft.goals.map((g) => g.description).join("; ") || "none"}
Existing constraints: ${draft.constraints.map((c) => c.description).join("; ") || "none"}

Propose a single, clear, concrete value for the ${gap.targetField} field that:
- Directly follows from the raw intent
- Is specific enough to be actionable
- Avoids technical implementation details

Respond ONLY with a JSON object:
{
  "proposedText": "...",
  "rationale": "..."
}`;

    let parsed: LLMProposalOutput | null = null;

    try {
      const raw = await callLLM(prompt);
      const jsonStr = extractJSON(raw);
      if (jsonStr) {
        const obj = JSON.parse(jsonStr) as Record<string, unknown>;
        const pt = String(obj["proposedText"] ?? "").trim();
        const rt = String(obj["rationale"] ?? "").trim();
        if (pt.length > 5 && rt.length > 5) {
          parsed = { proposedText: pt, rationale: rt };
        }
      }
    } catch {
      /* fall through */
    }

    if (!parsed) {
      parsed = this._defaultProposal(gap, draft);
    }

    // Need turnId — this should always be set by caller
    const turn = this.store.getOpenTurnForGap(gap.gapId);
    if (!turn) return null;

    const proposal: AdaProposal = {
      proposalId: randomUUID(),
      gapId: gap.gapId,
      turnId: turn.turnId,
      proposedText: parsed.proposedText,
      rationale: parsed.rationale,
      targetField: gap.targetField,
      disposition: "pending",
      modifiedText: null,
      createdAt: Date.now(),
    };

    this.store.proposals.set(proposal.proposalId, proposal);
    return proposal;
  }

  // ─── linkRequestToTurn ───
  // Must be called after generateClarificationRequest to bind the request to the turn
  linkRequestToTurn(
    turnId: string,
    clarificationRequestId: string,
  ): ElicitationTurn {
    const turn = this.store.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    turn.clarificationRequestId = clarificationRequestId;
    turn.status = "awaiting_answer";
    return turn;
  }

  // ─── linkProposalToTurn ───
  linkProposalToTurn(turnId: string, proposalId: string): ElicitationTurn {
    const turn = this.store.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    turn.proposalId = proposalId;
    turn.status = "awaiting_answer";
    return turn;
  }

  // ─── receiveClarificationAnswer ───
  receiveClarificationAnswer(
    turnId: string,
    answer: string,
  ): ClarificationAnswerRecord {
    const turn = this.store.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    if (turn.status === "closed" || turn.status === "expired") {
      throw new Error(
        `Stale turn reference: turn ${turnId} is already ${turn.status}`,
      );
    }
    if (!answer.trim()) {
      throw new Error("Answer must be non-empty");
    }

    const request = turn.clarificationRequestId
      ? this.store.clarificationRequests.get(turn.clarificationRequestId)
      : undefined;

    const record: ClarificationAnswerRecord = {
      clarificationAnswerId: randomUUID(),
      unknownId: turn.gapId, // same gapId as the unknownId
      turnId,
      answer: answer.trim(),
      receivedAt: Date.now(),
    };

    this.store.clarificationAnswers.set(record.clarificationAnswerId, record);
    turn.clarificationAnswerId = record.clarificationAnswerId;
    turn.status = "answered";

    // Suppress unused variable warning
    void request;

    return record;
  }

  // ─── processProposalDisposition ───
  processProposalDisposition(
    proposalId: string,
    disposition: ProposalDispositionType,
    modifiedText?: string,
  ): AdaProposal {
    const proposal = this.store.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal not found: ${proposalId}`);

    if (disposition === "modified" && (!modifiedText || !modifiedText.trim())) {
      throw new Error("A modified disposition requires non-empty modifiedText");
    }

    proposal.disposition = disposition;
    proposal.modifiedText =
      disposition === "modified" ? (modifiedText ?? null) : null;

    // Update linked turn status
    const turn = this.store.turns.get(proposal.turnId);
    if (turn) {
      turn.status = "answered";
    }

    return proposal;
  }

  // ─── closeTurn ───
  closeTurn(turnId: string): ElicitationTurn {
    const turn = this.store.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    turn.status = "closed";
    turn.closedAt = Date.now();
    return turn;
  }

  // ─── expireTurn ───
  expireTurn(turnId: string): ElicitationTurn {
    const turn = this.store.turns.get(turnId);
    if (!turn) throw new Error(`Turn not found: ${turnId}`);
    turn.status = "expired";
    turn.closedAt = Date.now();
    return turn;
  }

  // ─── defaults ───

  private _defaultRequest(
    gap: Gap,
    draft: DraftIntentGraph,
    impact: "blocking" | "scoping" | "implementation",
  ): LLMRequestOutput {
    const fieldLabels: Record<DraftTargetField, string> = {
      goals: "goals",
      constraints: "constraints",
      unknowns: "open questions",
      challenges: "challenges or risks",
    };

    let question: string;
    let suggestedDefault: string | null = null;

    if (gap.gapKind === "contradictory") {
      question =
        `Your intent mentions "${gap.conflictingFieldA}" but also has a constraint about "${gap.conflictingFieldB}". ` +
        `These seem to conflict — which should take priority, or can you clarify how they should work together?`;
    } else if (gap.gapKind === "missing") {
      question =
        `Based on your intent "${draft.rawIntent.slice(0, 100)}", what ${fieldLabels[gap.targetField]} ` +
        `should this system have? Please describe what it should ${gap.targetField === "goals" ? "accomplish" : gap.targetField === "constraints" ? "never do or always require" : "handle"}.`;
      if (gap.targetField === "goals") {
        suggestedDefault = `A system that ${draft.rawIntent.slice(0, 80)}`;
      }
    } else {
      question =
        `Can you confirm or refine the ${fieldLabels[gap.targetField]} for your project? ` +
        `Current extracted value is based on: "${draft.rawIntent.slice(0, 80)}".`;
    }

    return { question, impact, suggestedDefault };
  }

  private _defaultProposal(
    gap: Gap,
    draft: DraftIntentGraph,
  ): LLMProposalOutput {
    const rawShort = draft.rawIntent.slice(0, 100);

    const proposedText =
      gap.targetField === "goals"
        ? `Enable users to ${rawShort}`
        : gap.targetField === "constraints"
          ? `The system must operate securely and within defined boundaries`
          : `Further clarification needed for ${gap.targetField}`;

    const rationale = `Derived directly from raw intent: "${rawShort}"`;

    return { proposedText, rationale };
  }
}
