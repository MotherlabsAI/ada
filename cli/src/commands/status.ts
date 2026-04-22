import * as fs from "fs";
import * as path from "path";
import { glyphs } from "../ui/design-system.js";

export async function statusCommand(
  flags: Set<string> = new Set(),
): Promise<void> {
  const cwd = process.cwd();
  const statePath = path.join(cwd, ".ada", "state.json");

  if (!fs.existsSync(statePath)) {
    console.error(
      "no compiled blueprint in this directory — run `ada init \"<intent>\"` first",
    );
    process.exit(1);
  }

  const json = flags.has("--json");

  let raw: string;
  try {
    raw = fs.readFileSync(statePath, "utf8");
  } catch (err) {
    console.error(
      `Error: failed to read .ada/state.json — ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }

  let state: unknown;
  try {
    state = JSON.parse(raw);
  } catch (err) {
    console.error(
      `Error: .ada/state.json is not valid JSON — ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
    return;
  }

  if (json) {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  const s =
    state !== null && typeof state === "object"
      ? (state as Record<string, unknown>)
      : {};

  const runId = typeof s.runId === "string" ? s.runId : "(unknown)";
  const timestamp = typeof s.timestamp === "string" ? s.timestamp : "(unknown)";

  const governorDecision =
    s.governorDecision !== null && typeof s.governorDecision === "object"
      ? (s.governorDecision as Record<string, unknown>)
      : {};
  const decision =
    typeof governorDecision.decision === "string"
      ? governorDecision.decision
      : "(unknown)";
  const gatePassRateRaw = governorDecision.gatePassRate;
  const gatePassRate =
    typeof gatePassRateRaw === "number"
      ? `${(gatePassRateRaw * 100).toFixed(1)}%`
      : "(unknown)";

  const blueprint =
    s.blueprint !== null && typeof s.blueprint === "object"
      ? (s.blueprint as Record<string, unknown>)
      : {};
  const summaryRaw =
    typeof blueprint.summary === "string" ? blueprint.summary : "";
  const summaryFirstLine =
    summaryRaw.split(/\r?\n/)[0]?.trim() || "(no summary)";

  const architecture =
    blueprint.architecture !== null && typeof blueprint.architecture === "object"
      ? (blueprint.architecture as Record<string, unknown>)
      : {};
  const components = Array.isArray(architecture.components)
    ? architecture.components
    : [];
  const componentCount = components.length;

  const pipelineState =
    s.pipelineState !== null && typeof s.pipelineState === "object"
      ? (s.pipelineState as Record<string, unknown>)
      : {};
  const entityBlock =
    pipelineState.entity !== null && typeof pipelineState.entity === "object"
      ? (pipelineState.entity as Record<string, unknown>)
      : {};
  const entities = Array.isArray(entityBlock.entities)
    ? entityBlock.entities
    : [];
  const entityCount = entities.length;

  const c = glyphs.chevron;
  console.log("");
  console.log(`  ${c} run        ${runId}`);
  console.log(`  ${c} decision   ${decision}`);
  console.log(`  ${c} timestamp  ${timestamp}`);
  console.log(`  ${c} summary    ${summaryFirstLine}`);
  console.log(`  ${c} components ${componentCount}`);
  console.log(`  ${c} entities   ${entityCount}`);
  console.log(`  ${c} gate pass  ${gatePassRate}`);
  console.log("");
}
