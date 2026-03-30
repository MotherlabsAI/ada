#!/usr/bin/env node

// ─── Load persisted API key before any imports read process.env ──────────────
// ada config set-key saves to ~/.ada/config.json. Load it here so the
// compiler's lazy apiKey reads pick it up at call time.
import * as fs_boot from "fs";
import * as path_boot from "path";
import * as os_boot from "os";
{
  if (!process.env["ANTHROPIC_API_KEY"]) {
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
        // corrupt config — ignore, let compile fail with clear error
      }
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
import { configCommand } from "./commands/config.js";
import { hookCommand } from "./commands/hook.js";
import {
  reviewSkillsCommand,
  rollbackSkillCommand,
} from "./commands/review-skills.js";
import { reviewAmendmentsCommand } from "./commands/review-amendments.js";
import { headlessCommand } from "./commands/headless.js";

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

  Option 1 — set it in your shell:
    export ANTHROPIC_API_KEY=sk-ant-...

  Option 2 — save it once with ada:
    ada config set-key

  Get a key at https://console.anthropic.com
`);
    process.exit(1);
  }
}

async function runCompile(intentFromArgs: string): Promise<void> {
  checkApiKey();
  let intent = intentFromArgs;
  if (!intent) {
    intent = await promptForIntent();
    process.stdout.write("\n");
  }
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
    case "compile-headless": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      await headlessCommand(positional);
      break;
    }
    case "mcp":
      await mcpCommand();
      break;
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
    ada verify               Verify codebase against compiled blueprint
    ada hook install         Install pre-push hook — ada verify runs before every push
    ada hook uninstall       Remove the hook
    ada config set-key       Persist Anthropic API key
    ada resume <id>          Resume from a checkpoint
    ada review-amendments    Review and apply blueprint amendment queue
    ada review-skills        Review and approve extracted skill candidates
    ada rollback-skill <n>   Remove a promoted skill

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
