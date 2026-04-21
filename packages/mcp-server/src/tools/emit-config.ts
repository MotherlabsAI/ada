import * as fs from "fs";
import * as path from "path";
import type { Blueprint, GovernorDecision } from "@ada/compiler";
import { writeConfigGraph } from "@ada/config-writer";

/**
 * ada.emit_config — regenerate Claude Code governance artifacts from the
 * current substrate without re-running the compilation pipeline.
 *
 * Input: { kind: "claude-code" }  (other kinds reserved for later projections)
 *
 * Reads blueprint + governorDecision from .ada/state.json. Calls
 * writeConfigGraph to emit CLAUDE.md, agent files, skills, hooks, settings,
 * .mcp.json, delegation contracts, and world-model.
 *
 * The substrate is the source of truth. Edit state.json (or amend via
 * ada.propose_amendment + ada compile --amend), then call this to refresh
 * the on-disk configuration.
 */

export interface EmitConfigArgs {
  readonly kind: string;
}

const SUPPORTED_KINDS = ["claude-code"] as const;

interface StateFile {
  readonly blueprint?: Blueprint;
  readonly governorDecision?: GovernorDecision;
}

function resolveProjectDir(): string {
  const explicit = process.env["ADA_PROJECT_DIR"];
  if (explicit) return explicit;
  const statePath = process.env["ADA_STATE_PATH"];
  if (statePath) return path.dirname(statePath);
  const claudeProjectDir = process.env["CLAUDE_PROJECT_DIR"];
  if (claudeProjectDir) return claudeProjectDir;
  return process.cwd();
}

function resolveStatePath(projectDir: string): string {
  return (
    process.env["ADA_STATE_PATH"] ?? path.join(projectDir, ".ada", "state.json")
  );
}

export function emitConfig(args: EmitConfigArgs): {
  content: string;
  isError: boolean;
} {
  const kind = (args.kind ?? "").toLowerCase().trim();
  if (!SUPPORTED_KINDS.includes(kind as (typeof SUPPORTED_KINDS)[number])) {
    return {
      content: `Unsupported projection kind: "${kind}". Supported: ${SUPPORTED_KINDS.join(", ")}.`,
      isError: true,
    };
  }

  const projectDir = resolveProjectDir();
  const statePath = resolveStatePath(projectDir);

  let state: StateFile;
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    state = JSON.parse(raw) as StateFile;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: `Cannot read state file at ${statePath}: ${msg}`,
      isError: true,
    };
  }

  if (!state.blueprint) {
    return {
      content: `No blueprint in state file. Run 'ada compile <intent>' first.`,
      isError: true,
    };
  }

  if (!state.governorDecision) {
    return {
      content: `No governorDecision in state file. Blueprint exists but was not governor-evaluated.`,
      isError: true,
    };
  }

  try {
    const result = writeConfigGraph(
      state.blueprint,
      state.governorDecision,
      projectDir,
      { partial: state.governorDecision.decision !== "ACCEPT" },
    );

    const emittedFiles: string[] = [
      result.claudeMd,
      ...(result.buildMd ? [result.buildMd] : []),
      ...result.agents,
      ...result.skills,
      ...result.hooks,
      ...result.contracts,
      result.worldModelJson,
      result.worldModelMd,
    ];

    const summary = {
      kind,
      projectDir,
      postcode: result.postcode,
      emittedFileCount: emittedFiles.length,
      emittedFiles,
    };

    return {
      content: JSON.stringify(summary, null, 2),
      isError: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: `Projection failed: ${msg}`,
      isError: true,
    };
  }
}
