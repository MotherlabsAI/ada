import type { Blueprint } from "@ada/compiler";
import * as fs from "fs";
import * as path from "path";

// ── Layer 1: World Model Index ─────────────────────────────────────────────
// A < 200-line markdown file always present at .ada/world-model-index.md.
// Contains pointers, not content. Mirrors Claude Code's MEMORY.md pattern.

export function generateWorldModelIndex(blueprint: Blueprint): string {
  const timestamp = new Date().toISOString();
  const projectName = blueprint.summary.split(".")[0]?.trim() ?? "Ada Project";

  const lines: string[] = [];
  lines.push(`# World Model — ${projectName}`);
  lines.push(`Generated: ${timestamp}`);
  lines.push(`Blueprint: .ada/state.json | IR chain: .ada/ir-chain.json`);
  lines.push("");

  // Bounded Contexts section
  lines.push("## Bounded Contexts");
  const contexts = blueprint.dataModel.boundedContexts;
  if (contexts.length > 0) {
    for (const ctx of contexts) {
      lines.push(
        `- ${ctx.name} — ${ctx.rootEntity} — .ada/topics/${ctx.name}.json`,
      );
    }
  } else {
    lines.push("- (no bounded contexts in blueprint)");
  }
  lines.push("");

  // Active Invariants section — up to 10 most critical
  lines.push("## Active Invariants");
  const allInvariants: string[] = [];
  for (const ctx of contexts) {
    for (const inv of ctx.invariants) {
      allInvariants.push(inv.predicate);
    }
  }
  // Also pull entity-level invariants
  for (const entity of blueprint.dataModel.entities) {
    for (const inv of entity.invariants) {
      allInvariants.push(inv.predicate);
    }
  }
  const topInvariants = allInvariants.slice(0, 10);
  if (topInvariants.length > 0) {
    for (const pred of topInvariants) {
      lines.push(`- ${pred}`);
    }
  } else {
    lines.push("- (no invariants defined)");
  }
  lines.push("");

  // Session State section — placeholder; updated by mergeSessionDelta
  lines.push("## Session State");
  lines.push("- Last session: .ada/sessions/(none yet)");
  lines.push("- Drift alerts: .ada/drift-alerts.jsonl");
  lines.push("- Confidence: (no session completed yet)");
  lines.push("");

  // Open Questions section
  lines.push("## Open Questions");
  const questions = blueprint.openQuestions;
  if (questions.length > 0) {
    for (const q of questions) {
      lines.push(`- ${q}`);
    }
  } else {
    lines.push("- (no open questions)");
  }

  return lines.join("\n") + "\n";
}

export function mergeSessionDelta(adaDir: string): void {
  const indexPath = path.join(adaDir, "world-model-index.md");
  const deltaPath = path.join(adaDir, "world-model-delta.json");

  // Skip silently if index doesn't exist — will be created at next compile
  if (!fs.existsSync(indexPath)) return;
  // Skip silently if delta doesn't exist
  if (!fs.existsSync(deltaPath)) return;

  let delta: {
    sessionEnd?: number;
    driftCount?: number;
    finalConfidence?: number;
    durationMs?: number;
  };
  try {
    delta = JSON.parse(fs.readFileSync(deltaPath, "utf8")) as typeof delta;
  } catch {
    return;
  }

  let content: string;
  try {
    content = fs.readFileSync(indexPath, "utf8");
  } catch {
    return;
  }

  // Find the latest archived session log
  const sessionsDir = path.join(adaDir, "sessions");
  let latestSession = "(none yet)";
  if (fs.existsSync(sessionsDir)) {
    const files = fs
      .readdirSync(sessionsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();
    if (files.length > 0) {
      latestSession = `.ada/sessions/${files[0]}`;
    }
  }

  const confidence =
    delta.finalConfidence != null
      ? `${Math.round(delta.finalConfidence * 100)}%`
      : "(unknown)";

  const newSessionBlock = [
    "## Session State",
    `- Last session: ${latestSession}`,
    "- Drift alerts: .ada/drift-alerts.jsonl",
    `- Confidence: ${confidence}`,
    "",
  ].join("\n");

  // Replace the existing ## Session State block
  const sessionBlockPattern = /## Session State\n(?:- [^\n]*\n)*\n?/;

  const updated = sessionBlockPattern.test(content)
    ? content.replace(sessionBlockPattern, newSessionBlock)
    : content + "\n" + newSessionBlock;

  try {
    fs.writeFileSync(indexPath, updated, "utf8");
  } catch {
    // Best-effort — never crash on persistence failure
  }
}

export function writeWorldModelIndex(
  adaDir: string,
  blueprint: Blueprint,
): void {
  const indexPath = path.join(adaDir, "world-model-index.md");
  const content = generateWorldModelIndex(blueprint);
  try {
    fs.writeFileSync(indexPath, content, "utf8");
  } catch {
    // Best-effort
  }
}

// ── Layer 2: Topic Files ───────────────────────────────────────────────────
// One JSON file per bounded context at .ada/topics/{contextName}.json.
// Contains the full entity definitions for that context.

export interface TopicFile {
  readonly contextName: string;
  readonly rootEntity: string;
  readonly entities: readonly {
    readonly name: string;
    readonly category: string;
    readonly properties: readonly {
      name: string;
      type: string;
      required: boolean;
    }[];
    readonly invariants: readonly string[];
  }[];
  readonly generatedAt: number;
}

export function generateTopicFiles(
  blueprint: Blueprint,
): Map<string, TopicFile> {
  const result = new Map<string, TopicFile>();
  const { boundedContexts, entities } = blueprint.dataModel;

  // Build a lookup map for entities by name
  const entityByName = new Map(entities.map((e) => [e.name, e]));

  for (const ctx of boundedContexts) {
    const ctxEntities = ctx.entities
      .map((name) => entityByName.get(name))
      .filter((e): e is NonNullable<typeof e> => e != null)
      .map((e) => ({
        name: e.name,
        category: e.category,
        properties: e.properties.map((p) => ({
          name: p.name,
          type: p.type,
          required: p.required,
        })),
        invariants: e.invariants.map((inv) => inv.predicate),
      }));

    const topicFile: TopicFile = {
      contextName: ctx.name,
      rootEntity: ctx.rootEntity,
      entities: ctxEntities,
      generatedAt: Date.now(),
    };

    result.set(ctx.name, topicFile);
  }

  return result;
}

export function writeTopicFiles(adaDir: string, blueprint: Blueprint): void {
  const topicsDir = path.join(adaDir, "topics");
  if (!fs.existsSync(topicsDir)) {
    fs.mkdirSync(topicsDir, { recursive: true });
  }

  const topicFiles = generateTopicFiles(blueprint);
  for (const [contextName, topicFile] of topicFiles) {
    const filePath = path.join(topicsDir, `${contextName}.json`);
    try {
      fs.writeFileSync(
        filePath,
        JSON.stringify(topicFile, null, 2) + "\n",
        "utf8",
      );
    } catch {
      // Best-effort
    }
  }
}

// ── Layer 3: Session Archive ───────────────────────────────────────────────

export function archiveSessionLog(adaDir: string): string | null {
  const sessionLogPath = path.join(adaDir, "session-log.jsonl");

  // If file doesn't exist, nothing to archive
  if (!fs.existsSync(sessionLogPath)) return null;

  let content: string;
  try {
    content = fs.readFileSync(sessionLogPath, "utf8");
  } catch {
    return null;
  }

  // If empty, skip archive
  if (content.trim().length === 0) {
    try {
      fs.unlinkSync(sessionLogPath);
    } catch {
      // best-effort
    }
    return null;
  }

  // Ensure sessions directory exists
  const sessionsDir = path.join(adaDir, "sessions");
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const archiveName = `${Date.now()}.jsonl`;
  const archivePath = path.join(sessionsDir, archiveName);

  try {
    fs.renameSync(sessionLogPath, archivePath);
    return archivePath;
  } catch {
    // rename can fail cross-device; fall back to copy+delete
    try {
      fs.writeFileSync(archivePath, content, "utf8");
      fs.unlinkSync(sessionLogPath);
      return archivePath;
    } catch {
      return null;
    }
  }
}
