#!/usr/bin/env node
/**
 * mu-prime-eval-run — N self-application compiles per arm, aggregating μ AND μ′.
 *
 *   node scripts/mu-prime-eval-run.mjs [N=3] [depth=1] [model=claude-sonnet-4-6]
 *
 * Arm A (baseline)  = intent-only; Arm B (treatment) = same intent + --repo .
 * μ  (holes)         compared lower-is-better  (convergence — the wrong objective)
 * μ′ (grounded)      compared HIGHER-is-better  (excavation quality — the right one)
 * Both graded by the SAME structural measures, same artifact set → no circularity.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { holesOf, mu } from "../dist/governance/mu.js";
import { muPrime, repoArtifacts } from "../dist/governance/muPrime.js";
import { compareArms } from "../dist/governance/muEval.js";
import { ingestRepo } from "../dist/compile/engine/ingest.js";

const N = Number(process.argv[2] ?? 3);
const DEPTH = String(process.argv[3] ?? "1");
const MODEL = String(process.argv[4] ?? "claude-sonnet-4-6");
const INTENT =
  "Ada — a local, sovereign semantic compiler that turns a non-expert's ambiguous intent into a governed world model (graph + wiki + node capsules + unknown-unknowns) and Claude Code context, landing intent in front of an agentic loop with an expert's depth and a compiler's density; the human keeps intent and validation, Ada automates the expensive middle; determinism spine separates exploratory graph from deterministic checks; excavation over generation with provenance.";

const ARTS = repoArtifacts(ingestRepo(process.cwd())); // same artifact set for both arms (fair)

const measure = (slug) => {
  const g = JSON.parse(readFileSync(`.ada/packs/${slug}/graph.json`, "utf8"));
  const pack = { graph: { nodes: g.nodes } };
  return { mu: mu(holesOf(pack)), muPrime: muPrime(pack, ARTS) };
};

const run = (slug, repo) => {
  const args = ["dist/cli.js", "compile", "--engine", INTENT, `--depth=${DEPTH}`, `--model=${MODEL}`, `--slug=${slug}`];
  if (repo) args.push("--repo", ".");
  execFileSync("node", args, { stdio: "ignore", maxBuffer: 64 * 1024 * 1024 });
  return measure(slug);
};

const base = { mu: [], muPrime: [] };
const repo = { mu: [], muPrime: [] };
const slugs = [];
for (let i = 0; i < N; i++) {
  const bs = `mupeval-base-${i}`, rs = `mupeval-repo-${i}`;
  slugs.push(bs, rs);
  process.stderr.write(`base ${i + 1}/${N} ... `);
  const b = run(bs, false); base.mu.push(b.mu); base.muPrime.push(b.muPrime);
  process.stderr.write(`μ=${b.mu} μ′=${b.muPrime}\nrepo ${i + 1}/${N} ... `);
  const r = run(rs, true); repo.mu.push(r.mu); repo.muPrime.push(r.muPrime);
  process.stderr.write(`μ=${r.mu} μ′=${r.muPrime}\n`);
}

console.log(JSON.stringify({
  N, depth: DEPTH, model: MODEL, artifacts: ARTS.size,
  mu:      { base: base.mu,      repo: repo.mu,      cmp: compareArms(base.mu, repo.mu, "lower") },
  muPrime: { base: base.muPrime, repo: repo.muPrime, cmp: compareArms(base.muPrime, repo.muPrime, "higher") },
}, null, 2));

for (const s of slugs) {
  try { rmSync(`.ada/packs/${s}`, { recursive: true, force: true }); } catch { /* untracked */ }
}
