#!/usr/bin/env node

// ─── Load API key before any imports read process.env ────────────────────────
// Priority: ANTHROPIC_API_KEY env → ~/.ada/config.json → Claude Code keychain
import * as fs_boot from "fs";
import * as path_boot from "path";
import * as os_boot from "os";
import { execFileSync as execFileSync_boot } from "child_process";
{
  if (!process.env["ANTHROPIC_API_KEY"]) {
    // 1. ~/.ada/config.json (explicit override)
    const cfgPath = path_boot.join(os_boot.homedir(), ".ada", "config.json");
    if (fs_boot.existsSync(cfgPath)) {
      try {
        const cfg = JSON.parse(fs_boot.readFileSync(cfgPath, "utf8")) as {
          providers?: Record<string, { keyValue: string }>;
        };
        const anthropicKey = cfg.providers?.["anthropic"]?.keyValue;
        if (anthropicKey) {
          process.env["ANTHROPIC_API_KEY"] = anthropicKey;
        }
      } catch {
        // corrupt config — ignore
      }
    }
  }

  if (!process.env["ANTHROPIC_API_KEY"]) {
    // 2. Claude Code keychain (macOS) — use existing session, no setup needed
    try {
      const raw = execFileSync_boot(
        "security",
        ["find-generic-password", "-s", "Claude Code-credentials", "-g", "-w"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim();
      const creds = JSON.parse(raw) as {
        claudeAiOauth?: { accessToken: string; expiresAt: number };
      };
      const oauth = creds?.claudeAiOauth;
      if (oauth?.accessToken && Date.now() < oauth.expiresAt) {
        process.env["ANTHROPIC_API_KEY"] = oauth.accessToken;
      }
    } catch {
      // not macOS, no Claude Code install, or keychain denied — skip
    }
  }
}

import React from "react";
import { render } from "ink";
import { WelcomeScreen } from "./ui/welcome.js";
import { initCommand } from "./commands/init.js";
import { runCommand } from "./commands/run.js";
import { resumeCommand } from "./commands/resume.js";
import { verifyCommand } from "./commands/verify.js";
import { scanCommand } from "./commands/scan.js";
import { mcpCommand } from "./commands/mcp.js";
import { gateCommand } from "./commands/gate.js";
import { thinkCommand } from "./commands/think.js";
import { configCommand } from "./commands/config.js";
import { hookCommand } from "./commands/hook.js";
import {
  reviewSkillsCommand,
  rollbackSkillCommand,
} from "./commands/review-skills.js";
import { reviewAmendmentsCommand } from "./commands/review-amendments.js";
import { headlessCommand } from "./commands/headless.js";
import { orchestrateCommand } from "./commands/orchestrate.js";
import { selfLoopCommand } from "./commands/self-loop.js";
import { governCommand } from "./commands/govern.js";
import { convergeCommand } from "./commands/converge.js";

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--")));

/** Extract --out <dir> value from args, returns undefined if not present */
function extractOutDir(): string | undefined {
  const idx = args.indexOf("--out");
  const val = args[idx + 1];
  return idx !== -1 && val && !val.startsWith("--") ? val : undefined;
}

// ─── Interactive welcome screen ────────────────────────────────────────────────
// When `ada` or `ada compile` is invoked without an intent argument,
// renders the Ink welcome screen and waits for user to type + submit intent.

async function promptForIntent(): Promise<string> {
  let resolveIntent!: (s: string) => void;
  const intentPromise = new Promise<string>((resolve) => {
    resolveIntent = resolve;
  });
  const { waitUntilExit } = render(
    React.createElement(WelcomeScreen, { onSubmit: resolveIntent }),
  );
  await waitUntilExit();
  return intentPromise;
}

function checkApiKey(): void {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error(`
  ◈ ada needs an Anthropic API key to compile.

  Option 1 — use your existing Claude Code session (macOS):
    Just install Claude Code and log in once. Ada reads your session automatically.

  Option 2 — set it in your shell:
    export ANTHROPIC_API_KEY=sk-ant-...

  Option 3 — save it once with ada:
    ada config set-key
`);
    process.exit(1);
  }
}

async function runCompile(intentFromArgs: string): Promise<void> {
  let intent = intentFromArgs;
  if (!intent) {
    intent = await promptForIntent();
    process.stdout.write("\n");
  }
  checkApiKey();
  if (!intent) {
    console.error("  no intent provided — exiting.");
    process.exit(1);
  }
  const outDir = extractOutDir();
  await initCommand(intent, {
    noExecute: flags.has("--no-execute"),
    amend: flags.has("--amend"),
    selfCompile: flags.has("--self"),
    ...(outDir !== undefined ? { outDir } : {}),
  });
}

async function main(): Promise<void> {
  switch (command) {
    // Primary user-facing command
    case "compile": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      await runCompile(positional.join(" ").trim());
      break;
    }
    case "config":
      await configCommand(args.slice(1));
      break;
    case "run":
      await runCommand();
      break;
    case "resume": {
      const sessionId = args[1];
      if (!sessionId) {
        console.error("Usage: ada resume <session_id>");
        process.exit(1);
      }
      await resumeCommand(sessionId);
      break;
    }
    case "verify":
      await verifyCommand(flags);
      break;
    case "hook":
      hookCommand(args.slice(1));
      break;
    case "review-amendments":
      await reviewAmendmentsCommand();
      break;
    case "review-skills":
      await reviewSkillsCommand();
      break;
    case "rollback-skill": {
      const skillName = args
        .slice(1)
        .filter((a) => !a.startsWith("--"))
        .join(" ")
        .trim();
      if (!skillName) {
        console.error("Usage: ada rollback-skill <name>");
        process.exit(1);
      }
      rollbackSkillCommand(skillName);
      break;
    }
    case "scan":
      await scanCommand();
      break;
    case "self-loop": {
      await selfLoopCommand(args.slice(1));
      break;
    }
    case "compile-headless": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      await headlessCommand(positional);
      break;
    }
    case "mcp":
      await mcpCommand();
      break;
    case "gate": {
      const rest = args.slice(1);
      const code = await gateCommand(rest);
      process.exit(code);
    }
    case "think": {
      const rest = args.slice(1);
      const code = await thinkCommand(rest);
      process.exit(code);
    }
    case "govern": {
      await governCommand(args.slice(1));
      break;
    }
    case "converge": {
      await convergeCommand(args.slice(1));
      break;
    }
    case "orchestrate": {
      const maxParallelArg = args.find((a) => a.startsWith("--max-parallel="));
      const subGoalArg = args.find((a) => a.startsWith("--sub-goal="));
      await orchestrateCommand(process.cwd(), {
        dryRun: flags.has("--dry-run"),
        ...(maxParallelArg !== undefined && {
          maxParallel: parseInt(maxParallelArg.split("=")[1] ?? "1", 10),
        }),
        ...(subGoalArg !== undefined && {
          subGoal: subGoalArg.split("=").slice(1).join("="),
        }),
      });
      break;
    }
    case "--help":
    case "-h":
      console.log(`
  \u25C8 ada  \u00B7  semantic compiler by Motherlabs

  Usage:
    ada                      Open interactively — Ada prompts for intent
    ada compile              Open interactively — Ada prompts for intent
    ada compile "<intent>"   Compile with intent inline
                             --no-execute   Write config only, skip Claude spawn
                             --amend        Extend existing blueprint (reads .ada/state.json)

  Commands:
    ada scan                 Show what Ada sees in this codebase before compiling
    ada run                  Launch Claude Code with governor watching for drift
    ada govern               Persistent session log governor — watches .ada/session-log.jsonl
                             --log <path>   Custom log path (default .ada/session-log.jsonl)
                             --poll N       Poll interval ms (default 5000)
                             --batch N      Entries per drift check (default 8)
    ada verify               Verify codebase against compiled blueprint
    ada hook install         Install pre-push hook — ada verify runs before every push
    ada hook uninstall       Remove the hook
    ada config set-key       Persist Anthropic API key
    ada resume <id>          Resume from a checkpoint
    ada review-amendments    Review and apply blueprint amendment queue
    ada review-skills        Review and approve extracted skill candidates
    ada rollback-skill <n>   Remove a promoted skill
    ada orchestrate          Execute blueprint subGoals in dependency order
                             --dry-run          Print execution plan only
                             --max-parallel=N   Run N subGoals concurrently (default 1)
                             --sub-goal=<name>  Run only the named subGoal
    ada converge             Unattended RSI loop — execute → observe → recompile → repeat
                             --max-sessions N        Max execution sessions (default 5)
                             --confidence N          Target confidence 0–1 (default 0.85)
                             --session-timeout N     Per-session timeout ms (default 3600000)
                             --total-timeout N       Total run timeout ms (default 28800000 = 8hr)
                             --verbose               Show all governor signals
                             --dry-run               Print plan and exit
    ada self-loop            Sandboxed self-compilation convergence loop
                             --max-iter N            Max iterations (default 10)
                             --iter-timeout N        Per-iteration timeout ms (default 600000)
                             --total-timeout N       Total run timeout ms (default 7200000)
                             --confidence-target N   Confidence floor 0.0–1.0 (default 0.90)
                             --stable-iters N        Stop on N stable open-q fingerprints (default 2)
                             --verbose               Echo all headless stderr
                             --dry-run               Print first intent and exit

  Setup:
    ada config set-key           (prompts for your Anthropic key)
`);
      break;
    // Bare `ada` — interactive compile mode
    case undefined:
      await runCompile("");
      break;
    default:
      console.error(`  unknown command: ${command}`);
      console.error('  run "ada --help" for usage');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
