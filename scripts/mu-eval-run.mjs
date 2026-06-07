#!/usr/bin/env node
/**
 * mu-eval-run — run N self-application compiles per arm and aggregate μ (muEval.ts).
 *
 *   node scripts/mu-eval-run.mjs [N=3] [depth=1] [model=claude-sonnet-4-6]
 *
 * Arm A (baseline)  = intent-only compile.
 * Arm B (treatment) = same intent + --repo . (repo-aware).
 * Both arms graded by the SAME structural μ (open holes) → no pack-scope circularity.
 * Prints the comparison JSON; cleans up its throwaway packs.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { holesOf, mu } from "../dist/governance/mu.js";
import { compareArms } from "../dist/governance/muEval.js";

const N = Number(process.argv[2] ?? 3);
const DEPTH = String(process.argv[3] ?? "1");
const MODEL = String(process.argv[4] ?? "claude-sonnet-4-6");
const INTENT =
  "Ada — a local, sovereign semantic compiler that turns a non-expert's ambiguous intent into a governed world model (graph + wiki + node capsules + unknown-unknowns) and Claude Code context, landing intent in front of an agentic loop with an expert's depth and a compiler's density; the human keeps intent and validation, Ada automates the expensive middle; determinism spine separates exploratory graph from deterministic checks; excavation over generation with provenance.";

const muOfPack = (slug) => {
  const g = JSON.parse(readFileSync(`.ada/packs/${slug}/graph.json`, "utf8"));
  return mu(holesOf({ graph: { nodes: g.nodes } }));
};

const runCompile = (slug, repo) => {
  const args = ["dist/cli.js", "compile", "--engine", INTENT, `--depth=${DEPTH}`, `--model=${MODEL}`, `--slug=${slug}`];
  if (repo) args.push("--repo", ".");
  execFileSync("node", args, { stdio: "ignore", maxBuffer: 64 * 1024 * 1024 });
  return muOfPack(slug);
};

const base = [];
const repo = [];
const slugs = [];
for (let i = 0; i < N; i++) {
  const bs = `mueval-base-${i}`, rs = `mueval-repo-${i}`;
  slugs.push(bs, rs);
  process.stderr.write(`base ${i + 1}/${N} ... `);
  base.push(runCompile(bs, false));
  process.stderr.write(`μ=${base[i]}\nrepo ${i + 1}/${N} ... `);
  repo.push(runCompile(rs, true));
  process.stderr.write(`μ=${repo[i]}\n`);
}

console.log(JSON.stringify({ N, depth: DEPTH, model: MODEL, base, repo, comparison: compareArms(base, repo) }, null, 2));

for (const s of slugs) {
  try {
    rmSync(`.ada/packs/${s}`, { recursive: true, force: true });
  } catch {
    /* untracked throwaway — ignore */
  }
}
