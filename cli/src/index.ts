#!/usr/bin/env node

import { initCommand } from "./commands/init.js";
import { compileCommand } from "./commands/compile.js";
import { runCommand } from "./commands/run.js";
import { resumeCommand } from "./commands/resume.js";
import { verifyCommand } from "./commands/verify.js";
import { mcpCommand } from "./commands/mcp.js";
import { configCommand } from "./commands/config.js";

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--")));

async function main(): Promise<void> {
  switch (command) {
    case "init": {
      const positional = args.slice(1).filter((a) => !a.startsWith("--"));
      const intent = positional.join(" ");
      if (!intent) {
        console.error('Usage: ada init "your intent here" [--no-execute]');
        process.exit(1);
      }
      await initCommand(intent, { noExecute: flags.has("--no-execute") });
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
      await compileCommand(intent, {
        ...(outputFile !== undefined ? { output: outputFile } : {}),
        strict: flags.has("--strict"),
      });
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
      await verifyCommand();
      break;
    case "mcp":
      await mcpCommand();
      break;
    case "--help":
    case "-h":
    case undefined:
      console.log(`
  \u25C8 ada — semantic compiler for Claude Code
  by Motherlabs

  Commands:
    ada compile "<intent>"   Compile intent → blueprint JSON (stdout)
                             --output <file>   Write blueprint to file
                             --strict          Exit 3 on governance violations
    ada init "<intent>"      Compile intent → config graph → spawn Claude Code
                             --no-execute      Write config only, skip Claude spawn
    ada config set-key       Persist API key for a provider
                             --provider <name> --key <value>
                             --provider <name> --env <VAR>
                             --no-verify       Skip liveness check
    ada run                  Spawn Claude Code with governor watching
    ada resume <id>          Resume from checkpoint
    ada verify               Run Verify agent on current Blueprint
    ada mcp                  Start MCP spec authority server (stdio)
`);
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
