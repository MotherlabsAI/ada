#!/usr/bin/env node
/**
 * ada-bootstrap — turn Claude Code into the Ada semantic-compiler control panel.
 *
 * Idempotent. Builds the engine if its dist is missing, ensures the global `ada` wrapper is on
 * PATH, installs the `/ada` control-panel command(s) into ~/.claude/commands/ so EVERY Claude Code
 * session becomes an Ada cockpit, then SELF-VERIFIES and prints a provenance-bearing manifest.
 *
 * Validity envelope (the bootstrap obeys the same law it installs): bounded · structured ·
 * verifiable (the self-check) · portable (global install) · versioned (VERSION) · provenance
 * (git sha) · agent-operable · human-readable · residue-preserving (it reports what it could NOT do).
 *
 * Engine global, packs local: the wrapper points at THIS repo's dist/cli.js; packs are written to
 * whatever cwd the panel runs in. Run:  node scripts/ada-bootstrap.mjs   (or: ada-bootstrap, once installed)
 */
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.0";
const REPO = dirname(dirname(fileURLToPath(import.meta.url))); // scripts/.. = repo root
const HOME = homedir();
const CLI = join(REPO, "dist", "cli.js");
const WRAPPER = join(HOME, ".local", "bin", "ada");
const GLOBAL_CMDS = join(HOME, ".claude", "commands");
const SRC_CMDS = join(REPO, ".claude", "commands");
const PANEL_COMMANDS = ["ada.md"]; // the control panel entry; austere — one command is the cockpit

const log = (m) => process.stdout.write(m + "\n");
const residue = []; // a hole beats a lie: collect what we could not guarantee
const did = [];

function gitSha() {
  try {
    return execFileSync("git", ["-C", REPO, "rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

// 1 — engine present (build only if its dist is missing; building is slow, so never gratuitous).
function ensureEngine() {
  if (existsSync(CLI)) {
    did.push(`engine: dist present (${CLI})`);
    return;
  }
  log("engine dist missing — building (pnpm build)…");
  try {
    execFileSync("pnpm", ["build"], { cwd: REPO, stdio: "inherit" });
    did.push("engine: built dist via pnpm build");
  } catch {
    residue.push(
      "engine build FAILED — run `pnpm build` in the repo, then re-run bootstrap",
    );
  }
}

// 2 — global `ada` wrapper on PATH, pointing at this repo's engine.
function ensureWrapper() {
  if (existsSync(WRAPPER)) {
    did.push(`wrapper: present (${WRAPPER})`);
  } else {
    mkdirSync(dirname(WRAPPER), { recursive: true });
    writeFileSync(WRAPPER, `#!/bin/sh\nexec node "${CLI}" "$@"\n`);
    chmodSync(WRAPPER, 0o755);
    did.push(`wrapper: created ${WRAPPER} -> ${CLI}`);
  }
  const path = process.env.PATH || "";
  if (!path.split(":").includes(dirname(WRAPPER))) {
    residue.push(
      `~/.local/bin is not on PATH — add it (export PATH="$HOME/.local/bin:$PATH"); the /ada command falls back to \`node ${CLI}\` regardless`,
    );
  }
}

// 3 — install the control-panel command(s) globally: any Claude Code session gets /ada.
function installCommands() {
  mkdirSync(GLOBAL_CMDS, { recursive: true });
  for (const name of PANEL_COMMANDS) {
    const src = join(SRC_CMDS, name);
    if (!existsSync(src)) {
      residue.push(`command source missing: ${src} (skipped)`);
      continue;
    }
    copyFileSync(src, join(GLOBAL_CMDS, name));
    did.push(`command: installed /${name.replace(/\.md$/, "")} -> ${GLOBAL_CMDS}/${name}`);
  }
}

// 4 — self-verify: the engine answers, and the panel command is installed. Fail loud, not silent.
function verify() {
  const checks = [];
  try {
    const help = execFileSync("node", [CLI, "--help"], { encoding: "utf8" });
    checks.push([
      "engine responds",
      /semantic context compiler/i.test(help),
    ]);
  } catch {
    checks.push(["engine responds", false]);
  }
  checks.push([
    "/ada installed globally",
    existsSync(join(GLOBAL_CMDS, "ada.md")),
  ]);
  checks.push([
    "global commands dir non-empty",
    existsSync(GLOBAL_CMDS) && readdirSync(GLOBAL_CMDS).length > 0,
  ]);
  return checks;
}

// — run —
log(`\nada-bootstrap ${VERSION} · engine@${gitSha()} · repo ${REPO}\n`);
ensureEngine();
ensureWrapper();
installCommands();

log("INSTALLED:");
for (const d of did) log(`  ✓ ${d}`);

const checks = verify();
log("\nVERIFY:");
let ok = true;
for (const [name, pass] of checks) {
  log(`  ${pass ? "✓" : "✗"} ${name}`);
  ok = ok && pass;
}

if (residue.length) {
  log("\nRESIDUE (open — a hole beats a lie):");
  for (const r of residue) log(`  ◑ ${r}`);
}

log(
  `\n${ok ? "READY" : "INCOMPLETE"} — Claude Code is ${ok ? "now" : "not yet"} an Ada control panel. Use \`/ada\` (bare = status).`,
);
process.exit(ok ? 0 : 1);
