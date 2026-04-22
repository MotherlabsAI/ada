import * as fs from "fs";
import * as path from "path";
import { glyphs } from "../ui/design-system.js";

type Format = "markdown" | "json";

interface ParsedArgs {
  output: string | null;
  format: Format;
}

function parseArgs(argv: string[]): ParsedArgs {
  let output: string | null = null;
  let format: Format = "markdown";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--output" || arg === "-o") {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error("--output requires a file path argument");
      }
      output = next;
      i++;
    } else if (arg === "--format" || arg === "-f") {
      const next = argv[i + 1];
      if (next === undefined) {
        throw new Error("--format requires a value (markdown or json)");
      }
      if (next !== "markdown" && next !== "json") {
        throw new Error(
          `--format must be "markdown" or "json" (got "${next}")`,
        );
      }
      format = next;
      i++;
    }
  }

  return { output, format };
}

function firstLine(text: unknown, fallback: string): string {
  if (typeof text !== "string" || text.trim().length === 0) return fallback;
  const line = text.split(/\r?\n/)[0] ?? "";
  return line.trim().length > 0 ? line.trim() : fallback;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  return str.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function renderMarkdown(state: Record<string, unknown>): string {
  const blueprint = asRecord(state.blueprint);
  const governorDecision = asRecord(state.governorDecision);
  const summary = firstLine(blueprint.summary, "(no summary)");
  const lines: string[] = [];

  lines.push(`# Blueprint: ${summary}`);
  lines.push("");

  // Decision
  lines.push("## Decision");
  lines.push("");
  const decision = governorDecision.decision ?? "(unknown)";
  const confidenceRaw = governorDecision.confidence;
  const confidence =
    typeof confidenceRaw === "number" ? confidenceRaw.toFixed(2) : "n/a";
  lines.push(`- **Decision:** ${String(decision)}`);
  lines.push(`- **Confidence:** ${confidence}`);
  const rejectionReasons = asArray(governorDecision.rejectionReasons);
  if (rejectionReasons.length > 0) {
    lines.push("- **Rejection reasons:**");
    for (const reason of rejectionReasons) {
      const r = asRecord(reason);
      const msg =
        typeof r.reason === "string"
          ? r.reason
          : typeof r.description === "string"
            ? r.description
            : typeof reason === "string"
              ? reason
              : JSON.stringify(reason);
      lines.push(`  - ${msg}`);
    }
  }
  lines.push("");

  // Architecture
  lines.push("## Architecture");
  lines.push("");
  const architecture = asRecord(blueprint.architecture);
  const pattern =
    typeof architecture.pattern === "string"
      ? architecture.pattern
      : "(unspecified)";
  const rationale =
    typeof architecture.rationale === "string"
      ? architecture.rationale
      : "(no rationale)";
  lines.push(`- **Pattern:** ${pattern}`);
  lines.push(`- **Rationale:** ${rationale}`);
  lines.push("");

  const components = asArray(architecture.components);
  if (components.length > 0) {
    lines.push("| Name | Bounded Context | Responsibility |");
    lines.push("| --- | --- | --- |");
    for (const comp of components) {
      const c = asRecord(comp);
      lines.push(
        `| ${escapeCell(c.name)} | ${escapeCell(c.boundedContext)} | ${escapeCell(
          c.responsibility,
        )} |`,
      );
    }
  } else {
    lines.push("_No components recorded._");
  }
  lines.push("");

  // Entities
  lines.push("## Entities");
  lines.push("");
  const dataModel = asRecord(blueprint.dataModel);
  const entities = asArray(dataModel.entities);
  if (entities.length > 0) {
    lines.push("| Name | Context | Invariants count |");
    lines.push("| --- | --- | --- |");
    for (const ent of entities) {
      const e = asRecord(ent);
      const invariantsCount = asArray(e.invariants).length;
      lines.push(
        `| ${escapeCell(e.name)} | ${escapeCell(
          e.boundedContext ?? e.context,
        )} | ${invariantsCount} |`,
      );
    }
  } else {
    lines.push("_No entities recorded._");
  }
  lines.push("");

  // Workflows
  lines.push("## Workflows");
  lines.push("");
  const processModel = asRecord(blueprint.processModel);
  const workflows = asArray(processModel.workflows);
  if (workflows.length > 0) {
    for (const wf of workflows) {
      const w = asRecord(wf);
      const name = typeof w.name === "string" ? w.name : "(unnamed)";
      const stepCount = asArray(w.steps).length;
      lines.push(`- **${name}** — ${stepCount} step${stepCount === 1 ? "" : "s"}`);
    }
  } else {
    lines.push("_No workflows recorded._");
  }
  lines.push("");

  // Run
  lines.push("## Run");
  lines.push("");
  const run = asRecord(state.run);
  const runId =
    typeof run.runId === "string"
      ? run.runId
      : typeof state.runId === "string"
        ? state.runId
        : "(unknown)";
  const timestamp =
    typeof run.timestamp === "string"
      ? run.timestamp
      : typeof run.completedAt === "string"
        ? run.completedAt
        : typeof run.startedAt === "string"
          ? run.startedAt
          : typeof state.timestamp === "string"
            ? state.timestamp
            : "(unknown)";
  const iterationsRaw =
    run.totalIterations ??
    run.iterations ??
    state.totalIterations ??
    state.iterationCount;
  const totalIterations =
    typeof iterationsRaw === "number"
      ? iterationsRaw
      : Array.isArray(iterationsRaw)
        ? iterationsRaw.length
        : "(unknown)";
  lines.push(`- **runId:** ${runId}`);
  lines.push(`- **timestamp:** ${timestamp}`);
  lines.push(`- **total iterations:** ${totalIterations}`);
  lines.push("");

  return lines.join("\n");
}

export async function exportCommand(argv: string[]): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(
      "Error: no .ada/state.json found — run 'ada init' first to compile a blueprint",
    );
    process.exit(1);
  }

  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
    return;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(statePath, "utf8");
  } catch (err) {
    console.error(
      `Error: failed to read ${statePath}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    process.exit(1);
    return;
  }

  let state: Record<string, unknown>;
  try {
    state = asRecord(JSON.parse(raw));
  } catch (err) {
    console.error(
      `Error: failed to parse ${statePath}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    process.exit(1);
    return;
  }

  const output =
    args.format === "json"
      ? JSON.stringify(state, null, 2)
      : renderMarkdown(state);

  if (args.output) {
    try {
      const outPath = path.isAbsolute(args.output)
        ? args.output
        : path.join(cwd, args.output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, output, "utf8");
      console.error(`  ${glyphs.chevron} wrote ${outPath}`);
    } catch (err) {
      console.error(
        `Error: failed to write ${args.output}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      process.exit(1);
      return;
    }
  } else {
    process.stdout.write(output);
    if (!output.endsWith("\n")) process.stdout.write("\n");
  }
}
