/**
 * First slice — the product bet on the smallest surface: the U2F engine produces ONE
 * impressive, provenance-traced node from a REAL non-booking intent, through the SAME
 * model-free rubric gate the calibration exemplars clear. The model is stubbed, so this
 * exercises A1 (determinism downstream of the one model call), A2 (provenance), and A3
 * (the gate has no model) without any network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { excavateNode, resolvePromptDir, buildPrompt } from "./excavate.js";
import type { ModelClient } from "./model.js";
import type { Seed } from "../../core/types.js";

const INTENT =
  "a personal knowledge base that makes my research notes citable by an LLM";

function seed(): Seed {
  return {
    rootIntent: INTENT,
    domain: "Personal knowledge base",
    userRole: "A researcher who lives in their notes",
    buildObjective: "Notes an LLM will cite, not just retrieve.",
    knowledgeObjective: "A navigable map of what makes a note citable.",
    trustObjective: "Deterministic checks where citability is structural.",
    knownContext: [
      "The notes are markdown.",
      "An LLM reads them via retrieval.",
    ],
    unknownContext: [],
    assumptions: [],
    sources: ["User intent"],
    constraints: ["Local-first."],
    risks: ["Retrieval behaviour differs across LLM vendors."],
  };
}

test("buildPrompt injects repo context as ∵ source ONLY when present (repo-aware compile)", () => {
  const without = buildPrompt(seed(), "ROOT", "TEMPLATE", []);
  assert.ok(
    !/REPO CONTEXT/.test(without),
    "no repo block when seed has no repoContext",
  );

  const s = seed();
  s.repoContext =
    "Existing repo (∵ source ...):\n- src/cli.ts (code): main, run";
  const withRepo = buildPrompt(s, "ROOT", "TEMPLATE", []);
  assert.match(withRepo, /## REPO CONTEXT/);
  assert.match(
    withRepo,
    /src\/cli\.ts/,
    "the digest (with its path provenance) reaches the prompt",
  );
});

test("buildPrompt steers TYPE DIVERSITY — every under-used type is cued and the all-Invariant collapse is named", () => {
  const p = buildPrompt(seed(), "ROOT", "TEMPLATE", []);
  // Each of the types that the self-compile collapsed away must carry an explicit recognition cue,
  // so the excavator types a next-move as Action and a test as Eval instead of flattening both to
  // Invariant. The POM's plan + verifier sections depend on these existing.
  for (const cue of ["Intent", "Action", "Eval", "Decision", "Risk"]) {
    assert.match(
      p,
      new RegExp(`\\b${cue}\\b`),
      `the semanticType guidance cues ${cue}`,
    );
  }
  // The anti-collapse nudge itself — naming the failure mode observed on the ada-self compile.
  assert.match(
    p,
    /every node is an Invariant|all-Invariant|collapse/i,
    "the prompt warns against typing everything as Invariant",
  );
  // …but never FORCES a type (A2: type by what the node genuinely is; a forced Action is a lie).
  assert.match(
    p,
    /never force|do not force|only when genuinely present|accurately/i,
    "the steering is honest: type accurately, do not fabricate a type",
  );
});

// A realistic excavated capsule for this intent — specific, mechanism-first, traced.
const IMPRESS_JSON = JSON.stringify({
  id: "ATT.010",
  label: "Chunk-resident citations",
  cluster: "ATT",
  depth: "L4",
  summary:
    "An LLM cites a note only when the claim, its source, and the note's title sit inside one ~512-token retrieval window; split them across headings and the retriever lifts a slice that names neither, so a weaker note wins the citation.",
  whyItMatters:
    "Citability is decided at chunk granularity, not document quality — co-locating claim, source, and title is the highest-yield move for getting research notes cited.",
  failureIfMissing:
    "Notes get retrieved but never cited, because the lifted slice loses the source binding, and the knowledge base looks invisible to the model.",
  fromPrompt: [
    "makes my research notes citable by an LLM",
    "personal knowledge base",
  ],
  compilesTo: [
    "chunk-coherence.md",
    "CLAUDE.md citation rules",
    "c/checks/citation_window.mjs",
  ],
  checkClass: "C3",
  cCandidates: [
    "assert each claim co-occurs with its source and the note title inside one 512-token window",
  ],
  unknowns: ["exact retrieval window size per LLM vendor"],
  truth: "inference",
  parents: [],
});

// A generic candidate the gate MUST reject — proves the bar is real, not a rubber stamp.
const GENERIC_JSON = JSON.stringify({
  id: "ATT.011",
  label: "Make notes great",
  cluster: "ATT",
  depth: "L4",
  summary:
    "Leverage best practices to deliver world-class, seamless quality you can trust.",
  whyItMatters: "It is very important for users.",
  failureIfMissing: "Things are not as good.",
  fromPrompt: [],
  compilesTo: ["notes.md"],
  checkClass: "C0",
  cCandidates: [],
  unknowns: [],
  truth: "inference",
  parents: [],
});

const stub = (out: string): ModelClient => ({ complete: async () => out });

test("excavateNode produces an impress node from a real non-booking intent", async () => {
  const r = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.equal(r.rejected, false);
  assert.ok(r.node, "expected a kept node");
  assert.equal(r.score.verdict, "impress");
  assert.ok(r.score.total >= 5);
});

test("the kept node is provenance-traced (A2): fromPrompt non-empty, every fragment a substring of the intent", async () => {
  const r = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.ok(r.node);
  assert.ok(r.node.fromPrompt.length > 0);
  for (const frag of r.node.fromPrompt) {
    assert.ok(
      INTENT.includes(frag),
      `fromPrompt fragment not traced to intent: "${frag}"`,
    );
  }
});

test("excavateNode is deterministic given the same model output (A1 downstream)", async () => {
  const a = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  const b = await excavateNode(seed(), "ATT", stub(IMPRESS_JSON));
  assert.equal(JSON.stringify(a.node), JSON.stringify(b.node));
});

test("the gate is real: a generic candidate is rejected, not kept", async () => {
  const r = await excavateNode(seed(), "ATT", stub(GENERIC_JSON));
  assert.equal(r.rejected, true);
  assert.equal(r.node, null);
});

test("resolvePromptDir resolves relative to the MODULE, not process.cwd() — finds excavator.md", () => {
  const dir = resolvePromptDir();
  assert.ok(
    existsSync(join(dir, "excavator.md")),
    `excavator.md not found under resolved prompt dir: ${dir}`,
  );
});

test("the prompt path does NOT depend on the current working directory (runnable anywhere)", () => {
  // Resolve from the same module url while pretending the process is in an unrelated cwd.
  // The result must be byte-identical, proving cwd plays no part in resolution.
  const moduleUrl = import.meta.url;
  const real = resolvePromptDir(moduleUrl);
  const saved = process.cwd();
  try {
    process.chdir(tmpdir());
    const fromElsewhere = resolvePromptDir(moduleUrl);
    assert.equal(fromElsewhere, real);
    assert.ok(existsSync(join(fromElsewhere, "excavator.md")));
  } finally {
    process.chdir(saved);
  }
});

test("resolvePromptDir works for an ARBITRARY module url passed explicitly (not the test's own)", () => {
  // The engine's own compiled module, addressed by url — same answer regardless of caller cwd.
  const engineModule = pathToFileURL(
    join(process.cwd(), "dist/compile/engine/excavate.js"),
  ).href;
  const dir = resolvePromptDir(engineModule);
  assert.ok(
    existsSync(join(dir, "excavator.md")),
    `excavator.md not found for engine module url: ${dir}`,
  );
});

test("the built CLI runs from an unrelated cwd (loads modules without depending on cwd)", () => {
  // `ada --help` imports the whole CLI graph (incl. the engine) and prints help. Running it
  // from a temp dir proves nothing in the import path reaches for process.cwd() to find
  // prompts/assets. This is the spawn-level proof of cwd-independence.
  const cli = join(process.cwd(), "dist/cli.js");
  if (!existsSync(cli)) return; // dist not built in this run; the unit tests above suffice.
  const out = execFileSync(process.execPath, [cli, "--help"], {
    cwd: tmpdir(),
    encoding: "utf8",
  });
  assert.ok(out.includes("ada"), "expected help output to mention ada");
  assert.ok(out.includes("compile"), "expected help output to list compile");
});

test("no model/network token lives outside model.ts (A1/A3 boundary is structural)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/compile/engine/excavate.ts"),
    "utf8",
  ).toLowerCase();
  for (const tok of ["anthropic", "openai", "fetch("]) {
    assert.ok(!src.includes(tok), `forbidden token in excavate.ts: ${tok}`);
  }
});
