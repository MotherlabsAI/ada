import * as fs from "fs";
import * as path from "path";
import { evaluateSemanticGate } from "@ada/governor";
import type { Blueprint } from "@ada/compiler";

interface GateCommandArgs {
  readonly tool?: string;
  readonly file?: string;
  readonly content?: string;
  readonly command?: string;
  readonly rationale?: string;
  readonly contentFile?: string;
}

function parseArgs(argv: readonly string[]): GateCommandArgs {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    const key = a.slice(2);
    if (next !== undefined && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = "";
    }
  }
  return {
    ...(out["tool"] !== undefined ? { tool: out["tool"] } : {}),
    ...(out["file"] !== undefined ? { file: out["file"] } : {}),
    ...(out["content"] !== undefined ? { content: out["content"] } : {}),
    ...(out["command"] !== undefined ? { command: out["command"] } : {}),
    ...(out["rationale"] !== undefined ? { rationale: out["rationale"] } : {}),
    ...(out["content-file"] !== undefined
      ? { contentFile: out["content-file"] }
      : {}),
  };
}

function usage(): void {
  console.log(
    `Usage: ada gate --tool <Write|Edit|MultiEdit|Bash> [options]

Options:
  --file <path>          Target file path (for Write/Edit/MultiEdit)
  --content <string>     Proposed content
  --content-file <path>  Read proposed content from a file
  --command <string>     Shell command (for Bash)
  --rationale <string>   Optional: agent's stated reason

Reads the compiled Blueprint from .ada/state.json. Runs the semantic gate
with Opus 4.7 and prints the verdict. Requires ANTHROPIC_API_KEY.

Examples:
  ada gate --tool Write --file src/pay.ts --content 'const p = { amount: -50 }'
  ada gate --tool Bash --command 'rm -rf /important'`,
  );
}

function loadLocalBlueprint(): Blueprint | null {
  const statePath =
    process.env["ADA_STATE_PATH"] ??
    path.join(process.cwd(), ".ada", "state.json");
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as { blueprint?: Blueprint };
    return parsed.blueprint ?? null;
  } catch {
    return null;
  }
}

export async function gateCommand(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);

  if (!args.tool) {
    usage();
    return 1;
  }

  const blueprint = loadLocalBlueprint();
  if (!blueprint) {
    console.error(
      "No compiled blueprint found. Run `ada compile <intent>` first.",
    );
    return 1;
  }

  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error(
      "ANTHROPIC_API_KEY not set. The gate needs an API key to reason semantically.",
    );
    return 1;
  }

  let content = args.content;
  if (!content && args.contentFile) {
    try {
      content = fs.readFileSync(args.contentFile, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Cannot read --content-file: ${msg}`);
      return 1;
    }
  }

  console.log(
    `  ◈ evaluating gate against ${blueprint.dataModel.entities.length} entities, ${blueprint.processModel.workflows.length} workflows...`,
  );
  const started = Date.now();

  const result = await evaluateSemanticGate(blueprint, {
    toolName: args.tool,
    ...(args.file !== undefined ? { filePath: args.file } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(args.command !== undefined ? { command: args.command } : {}),
    ...(args.rationale !== undefined ? { rationale: args.rationale } : {}),
  });

  const elapsed = Date.now() - started;

  console.log("");
  console.log(`  verdict:   ${result.verdict}`);
  console.log(`  source:    ${result.source}`);
  console.log(`  latency:   ${elapsed}ms`);
  if (result.violated.length > 0) {
    console.log(`  violated:`);
    for (const v of result.violated) console.log(`    - ${v}`);
  }
  console.log(`  reasoning: ${result.reasoning}`);
  if (result.suggested) {
    console.log(`  suggested: ${result.suggested}`);
  }
  console.log("");

  if (result.verdict === "BLOCK") return 2;
  if (result.verdict === "AMEND_FIRST") return 1;
  return 0;
}
