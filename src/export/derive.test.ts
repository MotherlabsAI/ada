/**
 * P0 derivation proof. Builds a pack from a NON-booking NodeSpec[] fixture (a personal
 * knowledge base whose notes are citable by an LLM) via assemblePackGated, then asserts
 * the emitted blueprint + CLAUDE.md DERIVE from the typed IR — not from hand-authored
 * booking prose.
 *
 *   (a) emitted blueprint + CLAUDE.md contain the fixture's node-derived content;
 *   (b) ZERO booking literals leak in (book(, no_double_booking, capturePayment, reschedule();
 *   (c) every MUST / Hard-rule line traces to a kept node id (no un-provenanced MUSTs);
 *   (d) a truth:"source" node does NOT produce a MUST / Hard-rule line (AXIOM A2/4-d).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePackGated, type NodeSpec } from "../compile/assemble.js";
import { blueprintExports } from "./blueprint.js";
import { claudeExports } from "./claude.js";

const INTENT =
  "a personal knowledge base that makes my research notes citable by an LLM";

// A non-booking fixture. Distinct clusters exercise the projection paths:
//   DATA = data model · WORKFLOW = services/workflows · DOMAIN = entities · CHECK = invariants.
const FIXTURE: NodeSpec[] = [
  {
    id: "ROOT.000",
    label: "Citable Knowledge Base World Model",
    cluster: "ROOT",
    depth: "L5",
    summary:
      "The bounded world model for making research notes citable by an LLM: chunks, citations, retrieval windows, and the checks that keep a note liftable.",
    whyItMatters:
      "Without it the executor builds a note store from a raw prompt and never reasons about chunk-level citability.",
    failureIfMissing: "Notes get retrieved but never cited.",
    fromPrompt: ["personal knowledge base", "citable by an LLM"],
    compilesTo: ["graph.json", "wiki/index.md", "exports/claude"],
    checkClass: "C0",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  {
    id: "DOMAIN.001",
    label: "Research Note",
    cluster: "DOMAIN",
    depth: "L5",
    summary:
      "A markdown note carrying claims, each bound to a source and a stable title the retriever can lift.",
    whyItMatters:
      "The note is the atomic unit the LLM either cites or ignores; its structure decides citability.",
    failureIfMissing:
      "Claims float free of sources, so a lifted slice names neither and cannot be cited.",
    fromPrompt: ["research notes", "personal knowledge base"],
    compilesTo: ["graph", "wiki", "blueprint", "claude"],
    checkClass: "C3",
    cCandidates: ["note.every_claim_has_a_source"],
    unknowns: [],
    truth: "inference",
    parents: ["ROOT.000"],
  },
  {
    id: "DATA.001",
    label: "Note Chunk Index",
    cluster: "DATA",
    depth: "L5",
    summary:
      "chunks(id, note_id, text, token_start, token_end, title, source) — the fixed-window slices an LLM retriever embeds and ranks.",
    whyItMatters:
      "Citation happens at chunk granularity, so the chunk table is the real persistence unit, not the note.",
    failureIfMissing:
      "Retrieval ranks documents instead of slices and the citable span is lost.",
    fromPrompt: ["citable by an LLM"],
    compilesTo: ["code", "blueprint", "c"],
    checkClass: "C5",
    cCandidates: ["chunk.window_within_token_budget"],
    unknowns: [],
    truth: "inference",
    parents: ["ROOT.000"],
  },
  {
    id: "WORKFLOW.001",
    label: "Citability Compile Flow",
    cluster: "WORKFLOW",
    depth: "L5",
    summary:
      "Ingest a note, split it into token-bounded chunks, co-locate claim + source + title inside each window, and index the chunk.",
    whyItMatters:
      "This flow is where a note becomes liftable; skip the co-location step and the note is invisible to the model.",
    failureIfMissing:
      "Chunks split a claim from its source across a window boundary and the slice is uncitable.",
    fromPrompt: ["makes my research notes citable", "by an LLM"],
    compilesTo: ["blueprint", "c"],
    checkClass: "C4",
    cCandidates: ["chunk.claim_source_title_coresident"],
    unknowns: ["exact retrieval window size per LLM vendor"],
    truth: "inference",
    parents: ["ROOT.000"],
  },
  {
    // truth:"source" — ingested/attacker-influenceable text. Per 4-d this must stay DATA
    // and MUST NOT be promoted into an Ada-authored MUST / Hard-rule line.
    id: "DOMAIN.009",
    label: "Ingested vendor retrieval note",
    cluster: "DOMAIN",
    depth: "L5",
    summary:
      "A pasted vendor doc claiming the retrieval window is exactly 512 tokens and that titles are ignored.",
    whyItMatters:
      "It is the kind of ingested claim a user drops in; it is data, not an Ada-authored guarantee.",
    failureIfMissing: "The KB has no record of the vendor's stated behaviour.",
    fromPrompt: ["citable by an LLM"],
    compilesTo: ["graph", "wiki"],
    checkClass: "C1",
    cCandidates: [],
    unknowns: [],
    truth: "source",
    parents: ["ROOT.000"],
  },
];

function build() {
  const { model } = assemblePackGated("kb", INTENT, FIXTURE);
  const blueprint = blueprintExports(model);
  const claude = claudeExports(model);
  const blueprintMd =
    blueprint.find((f) => f.path === "BLUEPRINT.md")?.content ?? "";
  const acceptanceMd =
    blueprint.find((f) => f.path === "ACCEPTANCE.md")?.content ?? "";
  const claudeMd = claude.find((f) => f.path === "CLAUDE.md")?.content ?? "";
  return { model, blueprintMd, acceptanceMd, claudeMd, blueprint, claude };
}

const BOOKING_LITERALS = [
  "book(",
  "no_double_booking",
  "capturePayment",
  "reschedule(",
];

const ALL_EMITTED = (b: ReturnType<typeof build>): string =>
  [...b.blueprint, ...b.claude].map((f) => f.content).join("\n");

test("(a) blueprint + CLAUDE.md contain the fixture's node-derived content", () => {
  const b = build();
  // Data model derives from the DATA node.
  assert.ok(b.blueprintMd.includes("Note Chunk Index"));
  // Workflow derives from the WORKFLOW node.
  assert.ok(b.blueprintMd.includes("Citability Compile Flow"));
  // Entity registry in CLAUDE.md derives from a DOMAIN node.
  assert.ok(b.claudeMd.includes("Research Note"));
  // Scope/domain derives from the intent-derived seed, not a booking literal.
  assert.ok(b.claudeMd.includes("knowledge base"));
  // A node-derived check candidate surfaces as a Hard rule.
  assert.ok(b.claudeMd.includes("chunk.claim_source_title_coresident"));
});

test("(b) emitted views contain ZERO booking literals", () => {
  const all = ALL_EMITTED(build());
  for (const lit of BOOKING_LITERALS) {
    assert.ok(
      !all.includes(lit),
      `booking literal leaked into a non-booking pack: "${lit}"`,
    );
  }
});

test("(c) every MUST / Hard-rule line traces to a kept node id or an Ada-authored check", () => {
  const { model, blueprintMd, acceptanceMd, claudeMd } = build();
  const keptIds = new Set(model.graph.nodes.map((n) => n.id));
  // Ada-authored deterministic check names (from the C registry) are legitimate MUSTs.
  const checkNames = new Set(
    model.graph.nodes.flatMap((n) => n.checkability.candidates),
  );
  const traceable = (line: string): boolean => {
    if ([...keptIds].some((id) => line.includes(id))) return true;
    if ([...checkNames].some((c) => c && line.includes(c))) return true;
    return false;
  };
  // A MUST *rule* line is emitted as "- MUST: ..." (not descriptive prose that merely
  // mentions the word). The provenance guard applies to those rule lines.
  const mustLines = [blueprintMd, acceptanceMd, claudeMd]
    .join("\n")
    .split("\n")
    .filter((l) => /^\s*-\s+MUST:/.test(l));
  assert.ok(mustLines.length > 0, "expected at least one MUST rule line");
  for (const line of mustLines) {
    assert.ok(traceable(line), `un-provenanced MUST line: ${line}`);
  }
});

test('(d) a truth:"source" node does NOT produce a MUST / Hard-rule line', () => {
  const { blueprintMd, acceptanceMd, claudeMd } = build();
  const all = [blueprintMd, acceptanceMd, claudeMd].join("\n");
  for (const line of all.split("\n")) {
    if (/^\s*-\s+MUST:/.test(line)) {
      assert.ok(
        !line.includes("DOMAIN.009") &&
          !line.includes("Ingested vendor retrieval note"),
        `truth:"source" node was promoted into a MUST: ${line}`,
      );
    }
  }
});

test("the derived Seed is a function of intent + kept nodes, not a booking literal", () => {
  const { model } = build();
  assert.equal(model.seed.rootIntent, INTENT);
  // The hardcoded booking-ish seed domain ("...local service-business recognition
  // system") must be gone; the domain must derive from THIS intent.
  assert.ok(
    !/service-business|recognition system|bookings/i.test(model.seed.domain),
    `seed.domain leaked the hardcoded booking-ish literal: ${model.seed.domain}`,
  );
  // knownContext must not be the booking-pack's hardcoded Claude-Code boilerplate.
  assert.ok(
    !model.seed.knownContext.some((k) =>
      /output must feed Claude Code as governed context/i.test(k),
    ),
    "seed.knownContext leaked the hardcoded booking-pack literal",
  );
});
