#!/usr/bin/env node

// Command modules are loaded lazily — only the branch the user actually hit
// pays its import cost. Keeps `ada --help`, `ada config`, `ada verify` etc.
// well under the full ~150 ms cold-start penalty of eager-loading the
// 7-stage compiler, Anthropic SDK, Ink, SQLite native bindings, and MCP
// transport every time.

import { installSignalHandlers } from "./signal.js";

installSignalHandlers();

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--")));

function printHelp(): void {
  console.log(`
  ◈ ada — semantic compiler for Claude Code
  by Motherlabs

  Commands:
    ada compile "<intent>"   Compile intent → blueprint JSON (stdout)
                             --output <file>   Write blueprint to file
                             --strict          Exit 3 on governance violations
    ada init "<intent>"      Compile intent → config graph → spawn Claude Code
                             --no-execute      Write config only, skip Claude spawn
                             --amend           Preserve existing CLAUDE.md +
                                               .claude/agents/ + hooks; only
                                               write net-new files. Safe for
                                               re-running in an ada-aware repo.
    ada config set-key       Persist API key for a provider
                             --provider <name> --key <value>
                             --provider <name> --env <VAR>
                             --no-verify       Skip liveness check
    ada run                  Spawn Claude Code with governor watching
    ada resume <id>          Resume from checkpoint
    ada verify               Verify codebase against compiled blueprint
                             --comment     Output as GitHub PR comment markdown
                             --json        Output raw JSON report
    ada mcp                  Start MCP spec authority server (stdio)

    ada status               Show the current project's compile status
    ada history              List past compilation runs across all projects
    ada list                 List every project compiled on this machine
    ada explain [stage]      Explain what each pipeline stage produced
    ada export               Export the current blueprint as markdown/JSON
                             --output <file>   Write to file
                             --format markdown|json
    ada doctor               Diagnose environment health (node, keys, deps)
    ada which                Print paths ada reads/writes in this context
    ada clean                Remove ada-generated artifacts from the CWD
                             --force / -y      Skip confirmation
                             --dry-run         List what would be removed
    ada session list         List .ada/ sessions under CWD (recursive)
    ada session show [id]    Show a specific session by runId (or CWD default)
    ada cost                 Show LLM token usage + estimated USD spend
                             --run <id>        Filter to one run
                             --json            Raw JSON output

    ada --version            Print version and exit
`);
}

async function main(): Promise<void> {
  switch (command) {
    case "init": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      const intent = positional.join(" ");
      if (!intent) {
        console.error(
          'Usage: ada init "your intent here" [--no-execute] [--amend]',
        );
        process.exit(1);
      }
      const { initCommand } = await import("./commands/init.js");
      await initCommand(intent, {
        noExecute: flags.has("--no-execute"),
        amend: flags.has("--amend"),
      });
      break;
    }
    case "compile": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      const intent = positional.join(" ");
      if (!intent) {
        console.error(
          'Usage: ada compile "<natural language intent>" [--output <file>] [--strict]',
        );
        process.exit(1);
      }
      const outputIdx = args.indexOf("--output");
      const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : undefined;
      const { compileCommand } = await import("./commands/compile.js");
      await compileCommand(intent, {
        ...(outputFile !== undefined ? { output: outputFile } : {}),
        strict: flags.has("--strict"),
      });
      break;
    }
    case "config": {
      const { configCommand } = await import("./commands/config.js");
      await configCommand(args.slice(1));
      break;
    }
    case "run": {
      const { runCommand } = await import("./commands/run.js");
      await runCommand();
      break;
    }
    case "resume": {
      const sessionId = args[1];
      if (!sessionId) {
        console.error("Usage: ada resume <session_id>");
        process.exit(1);
      }
      const { resumeCommand } = await import("./commands/resume.js");
      await resumeCommand(sessionId);
      break;
    }
    case "verify": {
      const { verifyCommand } = await import("./commands/verify.js");
      await verifyCommand(flags);
      break;
    }
    case "mcp": {
      const { mcpCommand } = await import("./commands/mcp.js");
      await mcpCommand();
      break;
    }
    case "status": {
      const { statusCommand } = await import("./commands/status.js");
      await statusCommand(flags);
      break;
    }
    case "history": {
      const { historyCommand } = await import("./commands/history.js");
      await historyCommand(args.slice(1));
      break;
    }
    case "list": {
      const { listCommand } = await import("./commands/list.js");
      await listCommand(flags);
      break;
    }
    case "explain": {
      const { explainCommand } = await import("./commands/explain.js");
      await explainCommand(args.slice(1));
      break;
    }
    case "export": {
      const { exportCommand } = await import("./commands/export.js");
      await exportCommand(args.slice(1));
      break;
    }
    case "doctor": {
      const { doctorCommand } = await import("./commands/doctor.js");
      await doctorCommand();
      break;
    }
    case "which": {
      const { whichCommand } = await import("./commands/which.js");
      await whichCommand();
      break;
    }
    case "clean": {
      const { cleanCommand } = await import("./commands/clean.js");
      await cleanCommand(flags);
      break;
    }
    case "session": {
      const { sessionCommand } = await import("./commands/session.js");
      await sessionCommand(args.slice(1));
      break;
    }
    case "cost": {
      const { costCommand } = await import("./commands/cost.js");
      await costCommand(args.slice(1));
      break;
    }
    case "--version":
    case "-v":
      console.log("ada 0.1.0");
      break;
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "ada --help" for usage');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
